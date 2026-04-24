import { Injectable, Logger } from '@nestjs/common';
import { eq, sql } from '@taskflow/database';

import { ORPCError } from '@taskflow/orpc';
import { users } from '@taskflow/database';
import { createAnonClient } from '@taskflow/supabase';

import type { IAuthService } from '@taskflow/orpc';
import type {
	AuthSession,
	ChangePasswordInput,
	ExchangeOAuthSessionInput,
	ForgotPasswordInput,
	GetOAuthUrlInput,
	LoginInput,
	MessageOutput,
	RefreshTokenInput,
	RegisterInput,
	ResendConfirmationInput,
	ResetPasswordInput,
} from '@taskflow/validation';

import { EnvService } from '@backend/modules/config/env.service';
import { DatabaseService } from '@backend/modules/database/database.service';
import { SupabaseService } from '@backend/modules/supabase/supabase.service';

@Injectable()
export class AuthService implements IAuthService {
	private readonly logger = new Logger(AuthService.name);

	constructor(
		private readonly env: EnvService,
		private readonly supabase: SupabaseService,
		private readonly database: DatabaseService
	) {}

	async register(input: RegisterInput): Promise<{ message: string }> {
		const { fullName, email, password } = input;

		// 1. Create auth user — email not confirmed yet.
		const { data, error } = await this.supabase.admin.auth.admin.createUser({
			email,
			password,
			email_confirm: false,
			user_metadata: { fullName },
		});

		if (error) {
			switch (error.code) {
				case 'email_exists':
				case 'user_already_exists':
					throw new ORPCError('CONFLICT', { message: 'An account with this email already exists' });
				case 'weak_password':
					throw new ORPCError('BAD_REQUEST', { message: 'Password is too weak — use at least 8 characters' });
				case 'email_address_invalid':
					throw new ORPCError('BAD_REQUEST', { message: 'Invalid email address' });
				case 'over_request_rate_limit':
				case 'over_email_send_rate_limit':
					throw new ORPCError('TOO_MANY_REQUESTS', { message: 'Too many requests, please try again later' });
				default:
					this.logger.error(`[register] createUser failed [${error.code}]`, error);
					throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create account' });
			}
		}

		const userId = data.user.id;

		// 2. Insert user profile — roll back the auth user if this fails.
		try {
			await this.database.db.insert(users).values({ id: userId, fullName });
		} catch (err) {
			this.logger.error(`[register] db insert failed for auth user ${userId}`, err);

			try {
				await this.supabase.admin.auth.admin.deleteUser(userId);
			} catch (rollbackErr) {
				this.logger.error(
					`[register] rollback deleteUser failed for ${userId} — manual cleanup required`,
					rollbackErr
				);
			}

			throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create user profile' });
		}

		// 3. Send verification email via Supabase's built-in email service.
		const tempClient = createAnonClient({
			url: this.env.supabaseUrl,
			key: this.env.supabasePublishableKey,
		});

		const { error: resendError } = await tempClient.auth.resend({
			type: 'signup',
			email,
		});

		if (resendError) {
			this.logger.error(`[register] failed to send verification email`, resendError);
		}

		return { message: 'Check your email to confirm your account' };
	}

	async login(input: LoginInput): Promise<AuthSession> {
		const { data, error } = await this.supabase.admin.auth.signInWithPassword({
			email: input.email,
			password: input.password,
		});

		if (error) {
			if (error.code === 'email_not_confirmed') {
				throw new ORPCError('FORBIDDEN', { message: 'Please verify your email before logging in' });
			}
			throw new ORPCError('UNAUTHORIZED', { message: 'Invalid email or password' });
		}

		const { session, user } = data;

		// local safety net — catches cases where Supabase email confirmation enforcement is disabled.
		if (!user.email_confirmed_at) {
			throw new ORPCError('FORBIDDEN', { message: 'Please verify your email before logging in' });
		}

		const [profile] = await this.database.db
			.select({ fullName: users.fullName })
			.from(users)
			.where(eq(users.id, user.id))
			.limit(1);

		if (!profile) {
			this.logger.error(`login: no users row for auth user ${user.id}`);
			throw new ORPCError('NOT_FOUND', { message: 'User profile not found' });
		}

		return {
			accessToken: session.access_token,
			refreshToken: session.refresh_token,
			expiresIn: session.expires_in,
			expiresAt: session.expires_at!,
			user: {
				id: user.id,
				email: user.email!,
				fullName: profile.fullName,
				emailVerified: !!user.email_confirmed_at,
			},
		};
	}

	async logout(token: string): Promise<MessageOutput> {
		// admin.signOut takes the user's JWT, not their UUID
		const { error } = await this.supabase.admin.auth.admin.signOut(token);

		if (error) {
			this.logger.error('logout signOut failed', error);
			throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to log out' });
		}

		return { message: 'Logged out successfully' };
	}

	async refreshToken(input: RefreshTokenInput): Promise<AuthSession> {
		// use a temp anon client so the service-role admin client state is not touched
		const tempClient = createAnonClient({
			url: this.env.supabaseUrl,
			key: this.env.supabasePublishableKey,
		});

		const { data, error } = await tempClient.auth.refreshSession({
			refresh_token: input.refreshToken,
		});

		if (error || !data.session || !data.user) {
			throw new ORPCError('UNAUTHORIZED', { message: 'Invalid or expired refresh token' });
		}

		const { session, user } = data;

		const [profile] = await this.database.db
			.select({ fullName: users.fullName })
			.from(users)
			.where(eq(users.id, user.id))
			.limit(1);

		if (!profile) {
			this.logger.error(`refreshToken: no users row for auth user ${user.id}`);
			throw new ORPCError('NOT_FOUND', { message: 'User profile not found' });
		}

		return {
			accessToken: session.access_token,
			refreshToken: session.refresh_token,
			expiresIn: session.expires_in,
			expiresAt: session.expires_at!,
			user: {
				id: user.id,
				email: user.email!,
				fullName: profile.fullName,
				emailVerified: !!user.email_confirmed_at,
			},
		};
	}

	async forgotPassword(input: ForgotPasswordInput): Promise<MessageOutput> {
		const tempClient = createAnonClient({
			url: this.env.supabaseUrl,
			key: this.env.supabasePublishableKey,
		});

		// resetPasswordForEmail triggers Supabase's built-in password reset email.
		const { error } = await tempClient.auth.resetPasswordForEmail(input.email);

		if (error) {
			if (error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit') {
				throw new ORPCError('TOO_MANY_REQUESTS', { message: 'Too many requests, please try again later' });
			}
			this.logger.error('[forgot-password] resetPasswordForEmail failed', error);
		}

		// always return success — never reveal whether the email exists.
		return { message: 'If an account with that email exists, a password reset link has been sent' };
	}

	async resendConfirmation(input: ResendConfirmationInput): Promise<MessageOutput> {
		// step 1: bail out if already verified — no need to send another email.
		const [row] = await this.database.db.execute<{ email_confirmed_at: string | null }>(
			sql`SELECT email_confirmed_at FROM auth.users WHERE email = ${input.email} LIMIT 1`
		);

		if (row?.email_confirmed_at) {
			return { message: 'Email already verified' };
		}

		// step 2: resend via Supabase's built-in email service.
		const tempClient = createAnonClient({
			url: this.env.supabaseUrl,
			key: this.env.supabasePublishableKey,
		});

		const { error } = await tempClient.auth.resend({
			type: 'signup',
			email: input.email,
		});

		if (error) {
			if (error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit') {
				throw new ORPCError('TOO_MANY_REQUESTS', { message: 'Too many requests, please try again later' });
			}
			this.logger.error('[resend-confirmation] resend failed', error);
			throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to resend confirmation' });
		}

		return { message: 'Confirmation email sent successfully' };
	}

	async resetPassword(userId: string, input: ResetPasswordInput): Promise<MessageOutput> {
		const { error } = await this.supabase.admin.auth.admin.updateUserById(userId, {
			password: input.password,
		});

		if (error) {
			this.logger.error(`resetPassword: failed for user ${userId}`, error);
			throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to reset password' });
		}

		return { message: 'Password reset successfully' };
	}

	getOAuthUrl(input: GetOAuthUrlInput): { url: string } {
		const url = new URL(`${this.env.supabaseUrl}/auth/v1/authorize`);
		url.searchParams.set('provider', input.provider);
		url.searchParams.set('redirect_to', input.redirectTo);
		return { url: url.toString() };
	}

	async exchangeOAuthSession(input: ExchangeOAuthSessionInput): Promise<AuthSession> {
		const tempClient = createAnonClient({
			url: this.env.supabaseUrl,
			key: this.env.supabasePublishableKey,
		});

		const { data, error } = await tempClient.auth.setSession({
			access_token: input.accessToken,
			refresh_token: input.refreshToken,
		});

		if (error || !data.session || !data.user) {
			throw new ORPCError('UNAUTHORIZED', { message: 'Invalid or expired OAuth session' });
		}

		const { session, user } = data;

		// Auto-provision a DB profile on first Google sign-in
		let [profile] = await this.database.db
			.select({ fullName: users.fullName })
			.from(users)
			.where(eq(users.id, user.id))
			.limit(1);

		if (!profile) {
			const fullName =
				(user.user_metadata?.full_name as string | undefined) ??
				(user.user_metadata?.name as string | undefined) ??
				user.email?.split('@')[0] ??
				'Unknown';

			await this.database.db.insert(users).values({
				id: user.id,
				fullName,
			});

			profile = { fullName };
		}

		return {
			accessToken: session.access_token,
			refreshToken: session.refresh_token,
			expiresIn: session.expires_in,
			expiresAt: session.expires_at!,
			user: {
				id: user.id,
				email: user.email!,
				fullName: profile.fullName,
				emailVerified: !!user.email_confirmed_at,
			},
		};
	}

	async changePassword(userId: string, token: string, input: ChangePasswordInput): Promise<{ message: string }> {
		// 1. Verify current password by signing in
		const { data: userData } = await this.supabase.admin.auth.admin.getUserById(userId);

		if (!userData.user?.email) {
			throw new ORPCError('NOT_FOUND', { message: 'User not found' });
		}

		const tempClient = createAnonClient({
			url: this.env.supabaseUrl,
			key: this.env.supabasePublishableKey,
		});

		const { error: verifyError } = await tempClient.auth.signInWithPassword({
			email: userData.user.email,
			password: input.currentPassword,
		});

		await tempClient.auth.signOut();

		if (verifyError) {
			throw new ORPCError('UNAUTHORIZED', { message: 'Current password is incorrect' });
		}

		// 2. Update to the new password
		const { error: updateError } = await this.supabase.admin.auth.admin.updateUserById(userId, {
			password: input.newPassword,
		});

		if (updateError) {
			this.logger.error(`changePassword: failed to update password for user ${userId}`, updateError);
			throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to change password' });
		}

		// 3. Invalidate all existing sessions so only the new password works
		await this.supabase.admin.auth.admin.signOut(token);

		return { message: 'Password changed successfully. Please log in again.' };
	}
}

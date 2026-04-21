import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { ORPCError } from '@taskflow/orpc';
import { users } from '@taskflow/database';
import { createAnonClient } from '@taskflow/supabase';

import type { IAuthService } from '@taskflow/orpc';
import type { AuthSession, LoginInput, RefreshTokenInput, RegisterInput } from '@taskflow/validation';

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

	async register(input: RegisterInput): Promise<AuthSession> {
		const { fullName, email, password } = input;

		// 1. Create user in Supabase (auto-confirm email for simplicity)
		const { data, error } = await this.supabase.admin.auth.admin.createUser({
			email,
			password,
			email_confirm: true,
			user_metadata: { fullName },
		});

		if (error) {
			switch (error.code) {
				case 'email_exists':
				case 'user_already_exists':
					throw new ORPCError('CONFLICT', { message: 'An account with this email already exists' });
				case 'weak_password':
					throw new ORPCError('BAD_REQUEST', {
						message: 'Password is too weak — use at least 8 characters',
					});
				case 'email_address_invalid':
					throw new ORPCError('BAD_REQUEST', { message: 'Invalid email address' });
				default:
					this.logger.error(`register createUser failed [${error.code}]`, error);
					throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create account' });
			}
		}

		// 2. Insert user profile in DB
		try {
			await this.database.db.insert(users).values({
				id: data.user.id,
				email,
				fullName,
			});
		} catch (err) {
			this.logger.error(`register: failed to create users row for auth user ${data.user.id}`, err);

			// Rollback: delete the Supabase auth user so the state stays consistent
			try {
				await this.supabase.admin.auth.admin.deleteUser(data.user.id);
			} catch (rollbackErr) {
				this.logger.error(
					`register: rollback deleteUser failed for ${data.user.id} — manual cleanup required`,
					rollbackErr
				);
			}

			throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create user profile' });
		}

		// 3. Sign in to get session tokens
		const { data: sessionData, error: sessionError } = await this.supabase.admin.auth.signInWithPassword({
			email,
			password,
		});

		if (sessionError || !sessionData.session) {
			this.logger.error('register: signInWithPassword failed after user creation', sessionError);
			throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Account created but sign-in failed' });
		}

		const { session } = sessionData;

		return {
			accessToken: session.access_token,
			refreshToken: session.refresh_token,
			expiresIn: session.expires_in,
			expiresAt: session.expires_at!,
			user: {
				id: data.user.id,
				email,
				fullName,
			},
		};
	}

	async login(input: LoginInput): Promise<AuthSession> {
		const { data, error } = await this.supabase.admin.auth.signInWithPassword({
			email: input.email,
			password: input.password,
		});

		if (error) {
			throw new ORPCError('UNAUTHORIZED', { message: 'Invalid email or password' });
		}

		const { session, user } = data;

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
			},
		};
	}

	async logout(token: string): Promise<{ message: string }> {
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
			},
		};
	}
}

import { Injectable, Logger } from '@nestjs/common';
import { eq } from '@taskflow/database';

import { ORPCError } from '@taskflow/orpc';
import { users } from '@taskflow/database';
import { createAnonClient } from '@taskflow/supabase';
import type { IUsersService } from '@taskflow/orpc';
import type { ChangePasswordInput, UpdateUserInput, UserOutput } from '@taskflow/validation';

import { EnvService } from '@backend/modules/config/env.service';
import { DatabaseService } from '@backend/modules/database/database.service';
import { SupabaseService } from '@backend/modules/supabase/supabase.service';

@Injectable()
export class UsersService implements IUsersService {
	private readonly logger = new Logger(UsersService.name);

	constructor(
		private readonly env: EnvService,
		private readonly database: DatabaseService,
		private readonly supabase: SupabaseService
	) {}

	async me(userId: string): Promise<UserOutput> {
		const [dbUser, { data: authData }] = await Promise.all([
			this.database.db.select().from(users).where(eq(users.id, userId)).limit(1).then((r) => r[0]),
			this.supabase.admin.auth.admin.getUserById(userId),
		]);

		if (!dbUser) {
			throw new ORPCError('NOT_FOUND', { message: 'User not found' });
		}

		return {
			...dbUser,
			emailVerified: !!authData.user?.email_confirmed_at,
			email: authData.user?.email || '',
		};
	}

	async updateMe(userId: string, input: UpdateUserInput): Promise<{ message: string }> {
		const [updated] = await this.database.db
			.update(users)
			.set({ fullName: input.fullName })
			.where(eq(users.id, userId))
			.returning();

		if (!updated) {
			throw new ORPCError('NOT_FOUND', { message: 'User not found' });
		}

		return { message: 'Profile updated successfully' };
	}

	async deleteAccount(userId: string): Promise<{ message: string }> {
		const { error } = await this.supabase.admin.auth.admin.deleteUser(userId);

		if (error) {
			this.logger.error(`deleteAccount: failed to delete Supabase auth user ${userId}`, error);
			throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to delete account' });
		}

		await this.database.db.delete(users).where(eq(users.id, userId));

		return { message: 'Account deleted successfully' };
	}

	async changePassword(userId: string, token: string, input: ChangePasswordInput): Promise<{ message: string }> {
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

		const { error: updateError } = await this.supabase.admin.auth.admin.updateUserById(userId, {
			password: input.newPassword,
		});

		if (updateError) {
			this.logger.error(`changePassword: failed to update password for user ${userId}`, updateError);
			throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to change password' });
		}

		await this.supabase.admin.auth.admin.signOut(token);

		return { message: 'Password changed successfully. Please log in again.' };
	}
}

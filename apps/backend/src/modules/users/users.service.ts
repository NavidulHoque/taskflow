import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { ORPCError } from '@taskflow/orpc';
import { users } from '@taskflow/database';
import type { IUsersService } from '@taskflow/orpc';
import type { UpdateUserInput, UserOutput } from '@taskflow/validation';

import { DatabaseService } from '@backend/modules/database/database.service';
import { SupabaseService } from '@backend/modules/supabase/supabase.service';

@Injectable()
export class UsersService implements IUsersService {
	private readonly logger = new Logger(UsersService.name);

	constructor(
		private readonly database: DatabaseService,
		private readonly supabase: SupabaseService
	) {}

	async me(userId: string): Promise<UserOutput> {
		const [user] = await this.database.db
			.select()
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (!user) {
			throw new ORPCError('NOT_FOUND', { message: 'User not found' });
		}

		return user;
	}

	async updateMe(userId: string, input: UpdateUserInput): Promise<UserOutput> {
		const { error } = await this.supabase.admin.auth.admin.updateUserById(userId, {
			user_metadata: { fullName: input.fullName },
		});

		if (error) {
			this.logger.error(`updateMe: failed to update Supabase metadata for ${userId}`, error);
			throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to update profile' });
		}

		const [updated] = await this.database.db
			.update(users)
			.set({ fullName: input.fullName })
			.where(eq(users.id, userId))
			.returning();

		if (!updated) {
			throw new ORPCError('NOT_FOUND', { message: 'User not found' });
		}

		return updated;
	}
}

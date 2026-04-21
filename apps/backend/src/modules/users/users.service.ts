import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { ORPCError } from '@taskflow/orpc';
import { users } from '@taskflow/database';
import type { IUsersService } from '@taskflow/orpc';
import type { UserOutput } from '@taskflow/validation';

import { DatabaseService } from '@backend/modules/database/database.service';

@Injectable()
export class UsersService implements IUsersService {
	constructor(private readonly database: DatabaseService) {}

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
}

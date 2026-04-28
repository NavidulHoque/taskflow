import { Injectable, Logger } from '@nestjs/common';
import { eq } from '@taskflow/database';
import type { FastifyRequest } from 'fastify';

import { users } from '@taskflow/database';
import type { Context } from '@taskflow/orpc';

import { AuthService } from '@backend/modules/auth/auth.service';
import { DatabaseService } from '@backend/modules/database/database.service';
import { ProjectsService } from '@backend/modules/projects/projects.service';
import { StorageService } from '@backend/modules/storage/storage.service';
import { SupabaseService } from '@backend/modules/supabase/supabase.service';
import { TasksService } from '@backend/modules/tasks/tasks.service';
import { UsersService } from '@backend/modules/users/users.service';

@Injectable()
export class OrpcService {
	private readonly logger = new Logger(OrpcService.name);

	constructor(
		private readonly authService: AuthService,
		private readonly supabase: SupabaseService,
		private readonly database: DatabaseService,
		private readonly usersService: UsersService,
		private readonly projectsService: ProjectsService,
		private readonly tasksService: TasksService,
		private readonly storageService: StorageService
	) {}

	async createContext(req: FastifyRequest): Promise<Context> {
		const services = {
			auth: this.authService,
			users: this.usersService,
			projects: this.projectsService,
			tasks: this.tasksService,
			storage: this.storageService,
		};

		const authHeader = req.headers.authorization;
		const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

		if (!token) return { services };

		const {
			data: { user },
			error,
		} = await this.supabase.admin.auth.getUser(token);

		if (error || !user) {
			this.logger.warn('createContext: failed to resolve user from token', error?.message);
			return { services };
		}

		const [profile] = await this.database.db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.id, user.id))
			.limit(1);

		if (!profile) {
			this.logger.warn(`createContext: auth user ${user.id} has no matching profile row`);
			return { services };
		}

		return { services, userId: user.id, userToken: token };
	}
}

import { ORPCError, os } from '@orpc/server';

import type { IAuthService } from './services/auth.interface';
import type { IProjectsService } from './services/projects.interface';
import type { IStorageService } from './services/storage.interface';
import type { ITasksService } from './services/tasks.interface';
import type { IUsersService } from './services/users.interface';

export type Context = {
	services: {
		auth: IAuthService;
		users: IUsersService;
		projects: IProjectsService;
		tasks: ITasksService;
		storage: IStorageService;
	};
	userId?: string;
	userToken?: string;
};

export const base = os.$context<Context>();

export const publicProcedure = base;

export const protectedProcedure = base.use(({ context, next }) => {
	if (!context.userId) {
		throw new ORPCError('UNAUTHORIZED');
	}
	return next({ context: { ...context, userId: context.userId } });
});

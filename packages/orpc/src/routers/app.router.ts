import { authRouter } from './auth.router';
import { projectsRouter } from './projects.router';
import { tasksRouter } from './tasks.router';
import { uploadsRouter } from './uploads.router';
import { usersRouter } from './users.router';

export const appRouter = {
	auth: authRouter,
	users: usersRouter,
	projects: projectsRouter,
	tasks: tasksRouter,
	uploads: uploadsRouter,
};

export type AppRouter = typeof appRouter;

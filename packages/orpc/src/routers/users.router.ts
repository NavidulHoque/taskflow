import { updateUserSchema, userOutputSchema } from '@taskflow/validation';

import { protectedProcedure } from '../init';

export const usersRouter = {
	me: protectedProcedure
		.route({
			method: 'GET',
			path: '/users/me',
			summary: 'Get the current user profile',
			tags: ['users'],
		})
		.output(userOutputSchema)
		.handler(({ context }) => context.services.users.me(context.userId)),

	updateMe: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/users/me',
			summary: 'Update the current user profile',
			tags: ['users'],
		})
		.input(updateUserSchema)
		.output(userOutputSchema)
		.handler(({ context, input }) => context.services.users.updateMe(context.userId, input)),
};

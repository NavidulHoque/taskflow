import { userOutputSchema } from '@taskflow/validation';

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
};

import { changePasswordSchema, messageOutputSchema, updateUserSchema, userOutputSchema } from '@taskflow/validation';

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
		.output(messageOutputSchema)
		.handler(({ context, input }) => context.services.users.updateMe(context.userId, input)),

	deleteAccount: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/users/me',
			summary: 'Delete the current user account',
			tags: ['users'],
		})
		.output(messageOutputSchema)
		.handler(({ context }) => context.services.users.deleteAccount(context.userId)),

	changePassword: protectedProcedure
		.route({
			method: 'POST',
			path: '/users/me/change-password',
			summary: 'Change password for the current user',
			tags: ['users'],
		})
		.input(changePasswordSchema)
		.output(messageOutputSchema)
		.handler(({ context, input }) =>
			context.services.users.changePassword(context.userId, context.userToken!, input)
		),
};

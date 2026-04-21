import {
	authSessionSchema,
	loginSchema,
	messageOutputSchema,
	refreshTokenSchema,
	registerSchema,
} from '@taskflow/validation';

import { protectedProcedure, publicProcedure } from '../init';

export const authRouter = {
	register: publicProcedure
		.route({
			method: 'POST',
			path: '/auth/register',
			summary: 'Register a new user',
			successStatus: 201,
			tags: ['auth'],
		})
		.input(registerSchema)
		.output(authSessionSchema)
		.handler(({ context, input }) => context.services.auth.register(input)),

	login: publicProcedure
		.route({
			method: 'POST',
			path: '/auth/login',
			summary: 'Login with email and password',
			tags: ['auth'],
		})
		.input(loginSchema)
		.output(authSessionSchema)
		.handler(({ context, input }) => context.services.auth.login(input)),

	logout: protectedProcedure
		.route({
			method: 'POST',
			path: '/auth/logout',
			summary: 'Logout the current user',
			tags: ['auth'],
		})
		.output(messageOutputSchema)
		// userToken is the raw JWT from the Authorization header — admin.signOut requires the JWT, not the user UUID
		.handler(({ context }) => context.services.auth.logout(context.userToken!)),

	refreshToken: publicProcedure
		.route({
			method: 'POST',
			path: '/auth/refresh-token',
			summary: 'Refresh the access token using a refresh token',
			tags: ['auth'],
		})
		.input(refreshTokenSchema)
		.output(authSessionSchema)
		.handler(({ context, input }) => context.services.auth.refreshToken(input)),
};

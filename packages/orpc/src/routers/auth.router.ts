import {
	authSessionSchema,
	exchangeOAuthSessionSchema,
	forgotPasswordSchema,
	getOAuthUrlSchema,
	loginSchema,
	messageOutputSchema,
	oAuthUrlOutputSchema,
	refreshTokenSchema,
	registerSchema,
	resendConfirmationSchema,
	resetPasswordSchema,
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
		.output(messageOutputSchema)
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

	forgotPassword: publicProcedure
		.route({
			method: 'POST',
			path: '/auth/forgot-password',
			summary: 'Send a password reset email',
			tags: ['auth'],
		})
		.input(forgotPasswordSchema)
		.output(messageOutputSchema)
		.handler(({ context, input }) => context.services.auth.forgotPassword(input)),

	resetPassword: protectedProcedure
		.route({
			method: 'POST',
			path: '/auth/reset-password',
			summary: 'Reset password using a recovery token',
			tags: ['auth'],
		})
		.input(resetPasswordSchema)
		.output(messageOutputSchema)
		.handler(({ context, input }) => context.services.auth.resetPassword(context.userId, input)),

	resendConfirmation: publicProcedure
		.route({
			method: 'POST',
			path: '/auth/resend-confirmation',
			summary: 'Resend the email verification link',
			tags: ['auth'],
		})
		.input(resendConfirmationSchema)
		.output(messageOutputSchema)
		.handler(({ context, input }) => context.services.auth.resendConfirmation(input)),

	getOAuthUrl: publicProcedure
		.route({
			method: 'GET',
			path: '/auth/oauth/url',
			summary: 'Get the OAuth authorization URL for a provider',
			tags: ['auth'],
		})
		.input(getOAuthUrlSchema)
		.output(oAuthUrlOutputSchema)
		.handler(({ context, input }) => context.services.auth.getOAuthUrl(input)),

	exchangeOAuthSession: publicProcedure
		.route({
			method: 'POST',
			path: '/auth/oauth/exchange',
			summary: 'Exchange OAuth tokens for a session after provider redirect',
			tags: ['auth'],
		})
		.input(exchangeOAuthSessionSchema)
		.output(authSessionSchema)
		.handler(({ context, input }) => context.services.auth.exchangeOAuthSession(input)),
};

import { z } from 'zod';

export const registerSchema = z.object({
	fullName: z.string().min(1),
	email: z.email(),
	password: z.string().min(8),
});

export const loginSchema = z.object({
	email: z.email(),
	password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
	refreshToken: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
	email: z.email(),
});

export const resetPasswordSchema = z.object({
	password: z.string().min(8),
});

export const changePasswordSchema = z.object({
	currentPassword: z.string().min(1),
	newPassword: z.string().min(8),
});

export const updateUserSchema = z.object({
	fullName: z.string().min(1).max(255),
});

export const getOAuthUrlSchema = z.object({
	provider: z.enum(['google']),
	redirectTo: z.string().url(),
});

export const exchangeOAuthSessionSchema = z.object({
	accessToken: z.string().min(1),
	refreshToken: z.string().min(1),
});

export const resendConfirmationSchema = z.object({
	email: z.email(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetOAuthUrlInput = z.infer<typeof getOAuthUrlSchema>;
export type ExchangeOAuthSessionInput = z.infer<typeof exchangeOAuthSessionSchema>;
export type ResendConfirmationInput = z.infer<typeof resendConfirmationSchema>;

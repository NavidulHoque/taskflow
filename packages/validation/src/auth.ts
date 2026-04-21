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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

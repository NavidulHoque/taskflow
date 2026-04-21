import { z } from 'zod';

// ─── Common ───────────────────────────────────────────────────────────────────

export const messageOutputSchema = z.object({
	message: z.string(),
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authUserSchema = z.object({
	id: z.string(),
	email: z.string(),
	fullName: z.string(),
});

export const authSessionSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
	expiresIn: z.number(),
	expiresAt: z.number(),
	user: authUserSchema,
});

// ─── Users ────────────────────────────────────────────────────────────────────

export const userOutputSchema = z.object({
	id: z.string(),
	email: z.string(),
	fullName: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// ─── Projects ─────────────────────────────────────────────────────────────────

export const projectOutputSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	userId: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const taskOutputSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	status: z.enum(['todo', 'in_progress', 'done']),
	projectId: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// ─── Health ───────────────────────────────────────────────────────────────────

export const healthOutputSchema = z.object({
	status: z.literal('ok'),
	timestamp: z.string(),
	uptime: z.string(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type MessageOutput = z.infer<typeof messageOutputSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type UserOutput = z.infer<typeof userOutputSchema>;
export type ProjectOutput = z.infer<typeof projectOutputSchema>;
export type TaskOutput = z.infer<typeof taskOutputSchema>;
export type HealthOutput = z.infer<typeof healthOutputSchema>;

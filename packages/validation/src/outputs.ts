import { z } from 'zod';

// ─── Common ───────────────────────────────────────────────────────────────────

export const messageOutputSchema = z.object({
	message: z.string(),
});

export const paginatedOutputSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
	z.object({
		data: z.array(itemSchema),
		total: z.number(),
		page: z.number(),
		limit: z.number(),
		hasPreviousPage: z.boolean(),
		hasNextPage: z.boolean(),
	});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authUserSchema = z.object({
	id: z.string(),
	email: z.string(),
	fullName: z.string(),
	emailVerified: z.boolean(),
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
	emailVerified: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// ─── Projects ─────────────────────────────────────────────────────────────────

export const projectOutputSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	userId: z.string(),
	archivedAt: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date()
});

export const paginatedProjectsOutputSchema = paginatedOutputSchema(
  projectOutputSchema
);

export const projectStatsOutputSchema = z.object({
	total: z.number(),
	byStatus: z.object({
		todo: z.number(),
		in_progress: z.number(),
		done: z.number(),
	}),
	byPriority: z.object({
		low: z.number(),
		medium: z.number(),
		high: z.number(),
	}),
});

export const projectWithStatsOutputSchema = projectOutputSchema.extend({
	stats: projectStatsOutputSchema,
});

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const taskOutputSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	status: z.enum(['todo', 'in_progress', 'done']),
	priority: z.enum(['low', 'medium', 'high']),
	dueDate: z.date().nullable(),
	completedAt: z.date().nullable(),
	projectId: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const paginatedTasksOutputSchema = z.object({
	data: z.array(taskOutputSchema),
	total: z.number(),
	limit: z.number(),
	offset: z.number(),
});

export const bulkActionOutputSchema = z.object({
	message: z.string(),
	count: z.number(),
});

// ─── OAuth ────────────────────────────────────────────────────────────────────

export const oAuthUrlOutputSchema = z.object({
	url: z.string(),
});

// ─── Health ───────────────────────────────────────────────────────────────────

export const healthOutputSchema = z.object({
	status: z.literal('ok'),
	timestamp: z.string(),
	uptime: z.string(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type MessageOutput = z.infer<typeof messageOutputSchema>;
export type BulkActionOutput = z.infer<typeof bulkActionOutputSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type UserOutput = z.infer<typeof userOutputSchema>;
export type ProjectOutput = z.infer<typeof projectOutputSchema>;
export type ProjectWithStatsOutput = z.infer<typeof projectWithStatsOutputSchema>;
export type PaginatedProjectsOutput = z.infer<typeof paginatedProjectsOutputSchema>;
export type ProjectStatsOutput = z.infer<typeof projectStatsOutputSchema>;
export type TaskOutput = z.infer<typeof taskOutputSchema>;
export type PaginatedTasksOutput = z.infer<typeof paginatedTasksOutputSchema>;
export type OAuthUrlOutput = z.infer<typeof oAuthUrlOutputSchema>;
export type HealthOutput = z.infer<typeof healthOutputSchema>;

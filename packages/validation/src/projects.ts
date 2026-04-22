import { z } from 'zod';

export const createProjectSchema = z.object({
	title: z.string().min(1).max(255),
	description: z.string().optional(),
});

export const updateProjectSchema = z.object({
	title: z.string().min(1).max(255).optional(),
	description: z.string().optional(),
});

export const listProjectsQuerySchema = z.object({
	archived: z.coerce.boolean().optional(),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	offset: z.coerce.number().int().min(0).default(0),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

import { z } from 'zod';

export const createProjectSchema = z.object({
	title: z.string().min(1).max(255),
	description: z.string().optional(),
});

export const updateProjectSchema = z.object({
	title: z.string().min(1).max(255).optional(),
	description: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

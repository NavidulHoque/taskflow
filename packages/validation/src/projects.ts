import { z } from 'zod';
import { paginationSchema } from './pagination';

export const createProjectSchema = z.object({
	title: z.string().min(1).max(255),
	description: z.string().optional(),
});

export const getProjectsSchema = paginationSchema.extend({
  archived: z.coerce.boolean().optional(),
});

export const getProjectByIdSchema = z.object({
	id: z.string().uuid(),
});

export const updateProjectSchema = getProjectByIdSchema.extend({
	title: z.string().min(1).max(255).optional(),
	description: z.string().optional(),
});

export const deleteProjectSchema = getProjectByIdSchema.extend({})

export const archiveProjectSchema = getProjectByIdSchema.extend({})

export const unarchiveProjectSchema = getProjectByIdSchema.extend({})

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type GetProjectsInput = z.infer<typeof getProjectsSchema>;
export type GetProjectByIdInput = z.infer<typeof getProjectByIdSchema>;
export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;
export type ArchiveProjectInput = z.infer<typeof archiveProjectSchema>;
export type UnarchiveProjectInput = z.infer<typeof unarchiveProjectSchema>;
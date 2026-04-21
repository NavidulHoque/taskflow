import { z } from 'zod';

export const taskStatusSchema = z.enum(['todo', 'in_progress', 'done']);

export const createTaskSchema = z.object({
	title: z.string().min(1).max(255),
	description: z.string().optional(),
	status: taskStatusSchema.default('todo'),
});

export const updateTaskSchema = z.object({
	title: z.string().min(1).max(255).optional(),
	description: z.string().optional(),
	status: taskStatusSchema.optional(),
});

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

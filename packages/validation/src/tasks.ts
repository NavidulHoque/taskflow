import { z } from 'zod';

import { TaskPriority, TaskStatus } from '@taskflow/shared';

export const taskStatusSchema = z.enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE]);
export const taskPrioritySchema = z.enum([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH]);

export const createTaskSchema = z.object({
	title: z.string().min(1).max(255),
	description: z.string().optional(),
	status: taskStatusSchema.default('todo'),
	priority: taskPrioritySchema.default('medium'),
	dueDate: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
	title: z.string().min(1).max(255).optional(),
	description: z.string().optional(),
	status: taskStatusSchema.optional(),
	priority: taskPrioritySchema.optional(),
	dueDate: z.string().datetime().nullable().optional(),
});

export const listTasksQuerySchema = z.object({
	status: taskStatusSchema.optional(),
	priority: taskPrioritySchema.optional(),
	search: z.string().max(255).optional(),
	overdue: z.coerce.boolean().optional(),
	sortBy: z.enum(['created_at', 'due_date', 'priority']).default('created_at'),
	order: z.enum(['asc', 'desc']).default('desc'),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	offset: z.coerce.number().int().min(0).default(0),
});

export const paginationSchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(20),
	offset: z.coerce.number().int().min(0).default(0),
});

export const bulkTaskIdsSchema = z.object({
	taskIds: z.array(z.string().uuid()).min(1).max(100),
});

export const bulkUpdateStatusSchema = bulkTaskIdsSchema.extend({
	status: taskStatusSchema,
});

export const bulkUpdatePrioritySchema = bulkTaskIdsSchema.extend({
	priority: taskPrioritySchema,
});

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type BulkTaskIdsInput = z.infer<typeof bulkTaskIdsSchema>;
export type BulkUpdateStatusInput = z.infer<typeof bulkUpdateStatusSchema>;
export type BulkUpdatePriorityInput = z.infer<typeof bulkUpdatePrioritySchema>;

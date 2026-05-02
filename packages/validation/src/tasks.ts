import { z } from 'zod';

import { TaskPriority, TaskStatus } from '@taskflow/shared';
import { paginationSchema } from './pagination';

export const taskStatusSchema = z.enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE]);
export const taskPrioritySchema = z.enum([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH]);

export const taskIdSchema = z.object({
	taskId: z.string().uuid()
})

export const createTaskSchema = z.object({
	title: z.string().min(1).max(255),
	description: z.string().optional(),
	priority: taskPrioritySchema.default('medium'),
	dueDate: z
		.string()
		.regex(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(\d{4})$/, {
			message:
				"Invalid date format. Expected format is DD-MM-YYYY (e.g., 12-05-2025). Day must be 01-31, month must be 01-12, and year must be four digits.",
		})
		.optional(),
	projectId: z.string().uuid()
});

export const updateTaskSchema = taskIdSchema.extend({
	title: z.string().min(1).max(255).optional(),
	description: z.string().optional(),
	status: taskStatusSchema.optional(),
	priority: taskPrioritySchema.optional(),
	dueDate: z.string().datetime().nullable().optional(),
});

export const listTasksQuerySchema = paginationSchema.extend({
	projectId: z.string().uuid(),
	status: taskStatusSchema.optional(),
	priority: taskPrioritySchema.optional(),
	search: z.string().max(255).optional(),
	overdue: z.coerce.boolean().optional(),
	sortBy: z.enum(['created_at', 'due_date', 'priority']).default('created_at'),
	order: z.enum(['asc', 'desc']).default('desc')
});

export const deleteTaskSchema = taskIdSchema

export const bulkTaskIdsSchema = z.object({
	taskIds: z.array(z.string().uuid()).min(1).max(100),
});

export const bulkUpdateStatusSchema = bulkTaskIdsSchema.extend({
	projectId: z.string().uuid(),
	status: taskStatusSchema,
});

export const bulkUpdatePrioritySchema = bulkTaskIdsSchema.extend({
	projectId: z.string().uuid(),
	priority: taskPrioritySchema,
});

export const bulkDeleteSchema = bulkTaskIdsSchema.extend({
	projectId: z.string().uuid(),
});

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type BulkTaskIdsInput = z.infer<typeof bulkTaskIdsSchema>;
export type BulkUpdateStatusInput = z.infer<typeof bulkUpdateStatusSchema>;
export type BulkUpdatePriorityInput = z.infer<typeof bulkUpdatePrioritySchema>;
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;

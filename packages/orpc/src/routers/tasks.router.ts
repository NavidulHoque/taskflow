import { z } from 'zod';
import {
	bulkTaskIdsSchema,
	bulkUpdatePrioritySchema,
	bulkUpdateStatusSchema,
	createTaskSchema,
	listTasksQuerySchema,
	messageOutputSchema,
	bulkActionOutputSchema,
	paginatedTasksOutputSchema,
	taskOutputSchema,
	taskStatusSchema,
	updateTaskSchema,
} from '@taskflow/validation';

import { protectedProcedure } from '../init';

export const tasksRouter = {
	create: protectedProcedure
		.route({
			method: 'POST',
			path: '/projects/{projectId}/tasks',
			summary: 'Create a new task in a project',
			successStatus: 201,
			tags: ['tasks'],
		})
		.input(createTaskSchema.extend({ projectId: z.string().uuid() }))
		.output(taskOutputSchema)
		.handler(({ context, input }) => {
			const { projectId, ...data } = input;
			return context.services.tasks.create(context.userId, projectId, data);
		}),

	listByProject: protectedProcedure
		.route({
			method: 'GET',
			path: '/projects/{projectId}/tasks',
			summary: 'Get tasks for a project with search, filtering, sorting, and pagination',
			tags: ['tasks'],
		})
		.input(listTasksQuerySchema.extend({ projectId: z.string().uuid() }))
		.output(paginatedTasksOutputSchema)
		.handler(({ context, input }) => {
			const { projectId, ...query } = input;
			return context.services.tasks.listByProject(context.userId, projectId, query);
		}),

	update: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/tasks/{id}',
			summary: 'Update a task title, description, status, priority, or due date',
			tags: ['tasks'],
		})
		.input(updateTaskSchema.extend({ id: z.string().uuid() }))
		.output(taskOutputSchema)
		.handler(({ context, input }) => {
			const { id, ...data } = input;
			return context.services.tasks.update(context.userId, id, data);
		}),

	updateStatus: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/tasks/{id}/status',
			summary: 'Update a task status',
			tags: ['tasks'],
		})
		.input(z.object({ id: z.string().uuid(), status: taskStatusSchema }))
		.output(taskOutputSchema)
		.handler(({ context, input }) =>
			context.services.tasks.updateStatus(context.userId, input.id, input.status)
		),

	delete: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/tasks/{id}',
			summary: 'Delete a task',
			tags: ['tasks'],
		})
		.input(z.object({ id: z.string().uuid() }))
		.output(messageOutputSchema)
		.handler(({ context, input }) => context.services.tasks.delete(context.userId, input.id)),

	bulkUpdateStatus: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/projects/{projectId}/tasks/bulk-status',
			summary: 'Update the status of multiple tasks at once',
			tags: ['tasks'],
		})
		.input(bulkUpdateStatusSchema.extend({ projectId: z.string().uuid() }))
		.output(bulkActionOutputSchema)
		.handler(({ context, input }) => {
			const { projectId, ...data } = input;
			return context.services.tasks.bulkUpdateStatus(context.userId, projectId, data);
		}),

	bulkUpdatePriority: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/projects/{projectId}/tasks/bulk-priority',
			summary: 'Update the priority of multiple tasks at once',
			tags: ['tasks'],
		})
		.input(bulkUpdatePrioritySchema.extend({ projectId: z.string().uuid() }))
		.output(bulkActionOutputSchema)
		.handler(({ context, input }) => {
			const { projectId, ...data } = input;
			return context.services.tasks.bulkUpdatePriority(context.userId, projectId, data);
		}),

	bulkDelete: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/projects/{projectId}/tasks/bulk',
			summary: 'Delete multiple tasks at once',
			tags: ['tasks'],
		})
		.input(bulkTaskIdsSchema.extend({ projectId: z.string().uuid() }))
		.output(bulkActionOutputSchema)
		.handler(({ context, input }) =>
			context.services.tasks.bulkDelete(context.userId, input.projectId, input.taskIds)
		),
};

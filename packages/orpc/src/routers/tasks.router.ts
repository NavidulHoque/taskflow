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
	deleteTaskSchema,
	bulkDeleteSchema,
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
		.input(createTaskSchema)
		.output(taskOutputSchema)
		.handler(({ context, input }) => {
			return context.services.tasks.create(context.userId, input);
		}),

	listByProject: protectedProcedure
		.route({
			method: 'GET',
			path: '/projects/{projectId}/tasks',
			summary: 'Get tasks for a project with search, filtering, sorting, and pagination',
			tags: ['tasks'],
		})
		.input(listTasksQuerySchema)
		.output(paginatedTasksOutputSchema)
		.handler(({ context, input }) => {
			return context.services.tasks.listByProject(context.userId, input);
		}),

	update: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/tasks/{id}',
			summary: 'Update a task title, description, status, priority, or due date',
			tags: ['tasks'],
		})
		.input(updateTaskSchema)
		.output(taskOutputSchema)
		.handler(({ context, input }) => {
			return context.services.tasks.update(context.userId, input);
		}),

	delete: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/tasks/{id}',
			summary: 'Delete a task',
			tags: ['tasks'],
		})
		.input(deleteTaskSchema)
		.output(messageOutputSchema)
		.handler(({ context, input }) => context.services.tasks.delete(context.userId, input.taskId)),

	bulkUpdateStatus: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/projects/{projectId}/tasks/bulk-status',
			summary: 'Update the status of multiple tasks at once',
			tags: ['tasks'],
		})
		.input(bulkUpdateStatusSchema)
		.output(bulkActionOutputSchema)
		.handler(({ context, input }) => {
			return context.services.tasks.bulkUpdateStatus(context.userId, input);
		}),

	bulkUpdatePriority: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/projects/{projectId}/tasks/bulk-priority',
			summary: 'Update the priority of multiple tasks at once',
			tags: ['tasks'],
		})
		.input(bulkUpdatePrioritySchema)
		.output(bulkActionOutputSchema)
		.handler(({ context, input }) => {
			return context.services.tasks.bulkUpdatePriority(context.userId, input);
		}),

	bulkDelete: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/projects/{projectId}/tasks/bulk',
			summary: 'Delete multiple tasks at once',
			tags: ['tasks'],
		})
		.input(bulkDeleteSchema)
		.output(bulkActionOutputSchema)
		.handler(({ context, input }) =>
			context.services.tasks.bulkDelete(context.userId, input)
		),
};

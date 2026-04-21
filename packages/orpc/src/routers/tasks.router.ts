import { z } from 'zod';
import {
	createTaskSchema,
	messageOutputSchema,
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
			summary: 'Get all tasks for a project',
			tags: ['tasks'],
		})
		.input(z.object({ projectId: z.string().uuid() }))
		.output(z.array(taskOutputSchema))
		.handler(({ context, input }) =>
			context.services.tasks.listByProject(context.userId, input.projectId)
		),

	update: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/tasks/{id}',
			summary: 'Update a task title, description, or status',
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
};

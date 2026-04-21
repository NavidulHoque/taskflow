import { z } from 'zod';
import {
	createProjectSchema,
	messageOutputSchema,
	projectOutputSchema,
	updateProjectSchema,
} from '@taskflow/validation';

import { protectedProcedure } from '../init';

export const projectsRouter = {
	create: protectedProcedure
		.route({
			method: 'POST',
			path: '/projects',
			summary: 'Create a new project',
			successStatus: 201,
			tags: ['projects'],
		})
		.input(createProjectSchema)
		.output(projectOutputSchema)
		.handler(({ context, input }) => context.services.projects.create(context.userId, input)),

	list: protectedProcedure
		.route({
			method: 'GET',
			path: '/projects',
			summary: 'List all projects for the current user',
			tags: ['projects'],
		})
		.output(z.array(projectOutputSchema))
		.handler(({ context }) => context.services.projects.list(context.userId)),

	getById: protectedProcedure
		.route({
			method: 'GET',
			path: '/projects/{id}',
			summary: 'Get a project by ID',
			tags: ['projects'],
		})
		.input(z.object({ id: z.string().uuid() }))
		.output(projectOutputSchema)
		.handler(({ context, input }) => context.services.projects.getById(context.userId, input.id)),

	update: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/projects/{id}',
			summary: 'Update a project',
			tags: ['projects'],
		})
		.input(updateProjectSchema.extend({ id: z.string().uuid() }))
		.output(projectOutputSchema)
		.handler(({ context, input }) => {
			const { id, ...data } = input;
			return context.services.projects.update(context.userId, id, data);
		}),

	delete: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/projects/{id}',
			summary: 'Delete a project and all its tasks',
			tags: ['projects'],
		})
		.input(z.object({ id: z.string().uuid() }))
		.output(messageOutputSchema)
		.handler(({ context, input }) => context.services.projects.delete(context.userId, input.id)),
};

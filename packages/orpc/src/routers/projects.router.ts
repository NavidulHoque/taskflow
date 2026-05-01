import { z } from 'zod';
import {
	archiveProjectSchema,
	createProjectSchema,
	deleteProjectSchema,
	getProjectByIdSchema,
	getProjectsSchema,
	messageOutputSchema,
	paginatedProjectsOutputSchema,
	projectOutputSchema,
	projectStatsOutputSchema,
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
		.handler(({ context, input }) => context.services.projects.createProject(context.userId, input)),

	get: protectedProcedure
		.route({
			method: 'GET',
			path: '/projects',
			summary: 'List projects with optional archived filter and pagination',
			tags: ['projects'],
		})
		.input(getProjectsSchema)
		.output(paginatedProjectsOutputSchema)
		.handler(({ context, input }) => context.services.projects.getAllProjects(context.userId, input)),

	getById: protectedProcedure
		.route({
			method: 'GET',
			path: '/projects/{id}',
			summary: 'Get a project by ID including task count stats grouped by status and priority',
			tags: ['projects'],
		})
		.input(getProjectByIdSchema)
		.output(projectOutputSchema)
		.handler(({ context, input }) => context.services.projects.getProjectById(context.userId, input.id)),

	update: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/projects/{id}',
			summary: 'Update a project',
			tags: ['projects'],
		})
		.input(updateProjectSchema)
		.output(projectOutputSchema)
		.handler(({ context, input }) => {
			return context.services.projects.updateProject(context.userId, input);
		}),

	delete: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/projects/{id}',
			summary: 'Delete a project and all its tasks',
			tags: ['projects'],
		})
		.input(deleteProjectSchema)
		.output(messageOutputSchema)
		.handler(({ context, input }) => context.services.projects.deleteProject(context.userId, input.id)),

	archive: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/projects/{id}/archive',
			summary: 'Archive a project',
			tags: ['projects'],
		})
		.input(archiveProjectSchema)
		.output(projectOutputSchema)
		.handler(({ context, input }) => context.services.projects.archiveProject(context.userId, input.id)),

	unarchive: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/projects/{id}/unarchive',
			summary: 'Unarchive a project',
			tags: ['projects'],
		})
		.input(z.object({ id: z.string().uuid() }))
		.output(projectOutputSchema)
		.handler(({ context, input }) => context.services.projects.unarchiveProject(context.userId, input.id))
};

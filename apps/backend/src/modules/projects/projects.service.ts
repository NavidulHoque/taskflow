import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { ORPCError } from '@taskflow/orpc';
import { projects } from '@taskflow/database';
import type { IProjectsService } from '@taskflow/orpc';
import type { CreateProjectInput, ProjectOutput, UpdateProjectInput } from '@taskflow/validation';

import { DatabaseService } from '@backend/modules/database/database.service';

@Injectable()
export class ProjectsService implements IProjectsService {
	constructor(private readonly database: DatabaseService) {}

	async create(userId: string, input: CreateProjectInput): Promise<ProjectOutput> {
		const [project] = await this.database.db
			.insert(projects)
			.values({ ...input, userId })
			.returning();

		return project;
	}

	async list(userId: string): Promise<ProjectOutput[]> {
		return this.database.db.select().from(projects).where(eq(projects.userId, userId));
	}

	async getById(userId: string, projectId: string): Promise<ProjectOutput> {
		const [project] = await this.database.db
			.select()
			.from(projects)
			.where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
			.limit(1);

		if (!project) {
			throw new ORPCError('NOT_FOUND', { message: 'Project not found' });
		}

		return project;
	}

	async update(userId: string, projectId: string, input: UpdateProjectInput): Promise<ProjectOutput> {
		const [existing] = await this.database.db
			.select({ id: projects.id })
			.from(projects)
			.where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
			.limit(1);

		if (!existing) {
			throw new ORPCError('NOT_FOUND', { message: 'Project not found' });
		}

		const [updated] = await this.database.db
			.update(projects)
			.set(input)
			.where(eq(projects.id, projectId))
			.returning();

		return updated;
	}

	async delete(userId: string, projectId: string): Promise<{ message: string }> {
		const [existing] = await this.database.db
			.select({ id: projects.id })
			.from(projects)
			.where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
			.limit(1);

		if (!existing) {
			throw new ORPCError('NOT_FOUND', { message: 'Project not found' });
		}

		// tasks are deleted automatically via ON DELETE CASCADE
		await this.database.db.delete(projects).where(eq(projects.id, projectId));

		return { message: 'Project deleted successfully' };
	}
}

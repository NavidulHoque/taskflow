import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, isNull, isNotNull } from '@taskflow/database';

import { ORPCError } from '@taskflow/orpc';
import { projects, tasks } from '@taskflow/database';
import type { IProjectsService } from '@taskflow/orpc';
import type {
	CreateProjectInput,
	GetProjectsInput,
	MessageOutput,
	PaginatedProjectsOutput,
	ProjectOutput,
	ProjectStatsOutput,
	ProjectWithStatsOutput,
	UpdateProjectInput,
} from '@taskflow/validation';

import { DatabaseService } from '@backend/modules/database/database.service';
import { convertToPaginatedOutput } from '@backend/libs/functions/convert-to-paginated-output';

@Injectable()
export class ProjectsService implements IProjectsService {
	constructor(private readonly database: DatabaseService) { }

	async createProject(userId: string, input: CreateProjectInput): Promise<ProjectOutput> {
		const [project] = await this.database.db
			.insert(projects)
			.values({ ...input, userId })
			.returning();

		return project;
	}

	async getAllProjects(userId: string, query: GetProjectsInput): Promise<PaginatedProjectsOutput> {
		const archivedFilter =
			query.archived === true ? isNotNull(projects.archivedAt) : isNull(projects.archivedAt);

		const whereClause = and(eq(projects.userId, userId), archivedFilter);

		const [countResult, data] = await Promise.all([
			this.database.db
				.select({ value: count() })
				.from(projects)
				.where(whereClause),

			this.database.db
				.select()
				.from(projects)
				.where(whereClause)
				.orderBy(desc(projects.createdAt))
				.limit(query.limit)
				.offset((query.page - 1) * query.limit),
		]);

		const [{ value: total }] = countResult;

		return convertToPaginatedOutput(data, total, query.page, query.limit);
	}

	async getProjectById(userId: string, projectId: string): Promise<ProjectWithStatsOutput> {
		const [project] = await this.database.db
			.select()
			.from(projects)
			.where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
			.limit(1);

		if (!project) {
			throw new ORPCError('NOT_FOUND', { message: 'Project not found' });
		}

		const rows = await this.database.db
			.select({ status: tasks.status, priority: tasks.priority, value: count() })
			.from(tasks)
			.where(eq(tasks.projectId, projectId))
			.groupBy(tasks.status, tasks.priority);

		const stats = {
			total: 0,
			byStatus: { todo: 0, in_progress: 0, done: 0 },
			byPriority: { low: 0, medium: 0, high: 0 },
		};

		for (const row of rows) {
			const c = Number(row.value);
			stats.total += c;
			stats.byStatus[row.status as keyof typeof stats.byStatus] += c;
			stats.byPriority[row.priority as keyof typeof stats.byPriority] += c;
		}

		return { ...project, stats };
	}

	async updateProject(userId: string, input: UpdateProjectInput): Promise<ProjectOutput> {
		const { id: projectId, ...data } = input;

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
			.set(data)
			.where(eq(projects.id, projectId))
			.returning();

		return updated;
	}

	async deleteProject(userId: string, projectId: string): Promise<MessageOutput> {
		const [existing] = await this.database.db
			.select({ id: projects.id })
			.from(projects)
			.where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
			.limit(1);

		if (!existing) {
			throw new ORPCError('NOT_FOUND', { message: 'Project not found' });
		}

		await this.database.db.delete(projects).where(eq(projects.id, projectId));

		return { message: 'Project deleted successfully' };
	}

	async archiveProject(userId: string, projectId: string): Promise<ProjectOutput> {
		const [existing] = await this.database.db
			.select({ id: projects.id, archivedAt: projects.archivedAt })
			.from(projects)
			.where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
			.limit(1);

		if (!existing) {
			throw new ORPCError('NOT_FOUND', { message: 'Project not found' });
		}

		if (existing.archivedAt) {
			throw new ORPCError('BAD_REQUEST', { message: 'Project is already archived' });
		}

		const [updated] = await this.database.db
			.update(projects)
			.set({ archivedAt: new Date() })
			.where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
			.returning();

		return updated;
	}

	async unarchiveProject(userId: string, projectId: string): Promise<ProjectOutput> {
		const [existing] = await this.database.db
			.select({ id: projects.id, archivedAt: projects.archivedAt })
			.from(projects)
			.where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
			.limit(1);

		if (!existing) {
			throw new ORPCError('NOT_FOUND', { message: 'Project not found' });
		}

		if (!existing.archivedAt) {
			throw new ORPCError('BAD_REQUEST', { message: 'Project is not archived' });
		}

		const [updated] = await this.database.db
			.update(projects)
			.set({ archivedAt: null })
			.where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
			.returning();

		return updated;
	}
}

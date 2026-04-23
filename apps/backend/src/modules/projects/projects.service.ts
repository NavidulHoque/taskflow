import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, isNull, isNotNull } from '@taskflow/database';

import { ORPCError } from '@taskflow/orpc';
import { projects, tasks } from '@taskflow/database';
import type { IProjectsService } from '@taskflow/orpc';
import type {
	CreateProjectInput,
	ListProjectsQuery,
	PaginatedProjectsOutput,
	ProjectOutput,
	ProjectStatsOutput,
	UpdateProjectInput,
} from '@taskflow/validation';

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

	async list(userId: string, query: ListProjectsQuery): Promise<PaginatedProjectsOutput> {
		const archivedFilter =
			query.archived === true ? isNotNull(projects.archivedAt) : isNull(projects.archivedAt);

		const whereClause = and(eq(projects.userId, userId), archivedFilter);

		const [{ value: total }] = await this.database.db
			.select({ value: count() })
			.from(projects)
			.where(whereClause);

		const data = await this.database.db
			.select()
			.from(projects)
			.where(whereClause)
			.orderBy(desc(projects.createdAt))
			.limit(query.limit)
			.offset(query.offset);

		return { data, total: Number(total), limit: query.limit, offset: query.offset };
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

		await this.database.db.delete(projects).where(eq(projects.id, projectId));

		return { message: 'Project deleted successfully' };
	}

	async archive(userId: string, projectId: string): Promise<ProjectOutput> {
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
			.where(eq(projects.id, projectId))
			.returning();

		return updated;
	}

	async unarchive(userId: string, projectId: string): Promise<ProjectOutput> {
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
			.where(eq(projects.id, projectId))
			.returning();

		return updated;
	}

	async getStats(userId: string, projectId: string): Promise<ProjectStatsOutput> {
		const [project] = await this.database.db
			.select({ id: projects.id })
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

		const stats: ProjectStatsOutput = {
			total: 0,
			byStatus: { todo: 0, in_progress: 0, done: 0 },
			byPriority: { low: 0, medium: 0, high: 0 },
		};

		for (const row of rows) {
			const c = Number(row.value);
			stats.total += c;
			stats.byStatus[row.status] += c;
			stats.byPriority[row.priority] += c;
		}

		return stats;
	}
}

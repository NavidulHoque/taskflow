import { Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, inArray, isNotNull, lt, ne, sql } from '@taskflow/database';

import { ORPCError } from '@taskflow/orpc';
import { projects, tasks } from '@taskflow/database';
import type { ITasksService } from '@taskflow/orpc';
import type {
	BulkActionOutput,
	BulkUpdatePriorityInput,
	BulkUpdateStatusInput,
	CreateTaskInput,
	ListTasksQuery,
	PaginatedTasksOutput,
	TaskOutput,
	TaskStatus,
	UpdateTaskInput,
} from '@taskflow/validation';

import { DatabaseService } from '@backend/modules/database/database.service';

@Injectable()
export class TasksService implements ITasksService {
	constructor(private readonly database: DatabaseService) {}

	async create(userId: string, projectId: string, input: CreateTaskInput): Promise<TaskOutput> {
		const [project] = await this.database.db
			.select({ id: projects.id })
			.from(projects)
			.where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
			.limit(1);

		if (!project) {
			throw new ORPCError('NOT_FOUND', { message: 'Project not found' });
		}

		const { dueDate, ...rest } = input;
		const [task] = await this.database.db
			.insert(tasks)
			.values({ ...rest, projectId, dueDate: dueDate ? new Date(dueDate) : null })
			.returning();

		return task;
	}

	async listByProject(
		userId: string,
		projectId: string,
		query: ListTasksQuery
	): Promise<PaginatedTasksOutput> {
		const [project] = await this.database.db
			.select({ id: projects.id })
			.from(projects)
			.where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
			.limit(1);

		if (!project) {
			throw new ORPCError('NOT_FOUND', { message: 'Project not found' });
		}

		const conditions = [eq(tasks.projectId, projectId)];
		if (query.status) conditions.push(eq(tasks.status, query.status));
		if (query.priority) conditions.push(eq(tasks.priority, query.priority));
		if (query.search) conditions.push(ilike(tasks.title, `%${query.search}%`));
		if (query.overdue) {
			conditions.push(isNotNull(tasks.dueDate));
			conditions.push(lt(tasks.dueDate, new Date()));
			conditions.push(ne(tasks.status, 'done'));
		}

		const whereClause = and(...conditions);

		const [{ value: total }] = await this.database.db
			.select({ value: count() })
			.from(tasks)
			.where(whereClause);

		const data = await this.database.db
			.select()
			.from(tasks)
			.where(whereClause)
			.orderBy(buildOrderClause(query))
			.limit(query.limit)
			.offset(query.offset);

		return { data, total: Number(total), limit: query.limit, offset: query.offset };
	}

	async update(userId: string, taskId: string, input: UpdateTaskInput): Promise<TaskOutput> {
		await this.assertTaskOwnership(userId, taskId);

		const { dueDate, status, ...rest } = input;
		const updateData: Record<string, unknown> = { ...rest };

		if (dueDate !== undefined) {
			updateData.dueDate = dueDate ? new Date(dueDate) : null;
		}
		if (status !== undefined) {
			updateData.status = status;
			updateData.completedAt = status === 'done' ? new Date() : null;
		}

		const [updated] = await this.database.db
			.update(tasks)
			.set(updateData)
			.where(eq(tasks.id, taskId))
			.returning();

		return updated;
	}

	async updateStatus(userId: string, taskId: string, status: TaskStatus): Promise<TaskOutput> {
		return this.update(userId, taskId, { status });
	}

	async delete(userId: string, taskId: string): Promise<{ message: string }> {
		await this.assertTaskOwnership(userId, taskId);

		await this.database.db.delete(tasks).where(eq(tasks.id, taskId));

		return { message: 'Task deleted successfully' };
	}

	async bulkUpdateStatus(
		userId: string,
		projectId: string,
		input: BulkUpdateStatusInput
	): Promise<BulkActionOutput> {
		await this.assertProjectOwnership(userId, projectId);

		const completedAt = input.status === 'done' ? new Date() : null;

		const updated = await this.database.db
			.update(tasks)
			.set({ status: input.status, completedAt })
			.where(and(eq(tasks.projectId, projectId), inArray(tasks.id, input.taskIds)))
			.returning({ id: tasks.id });

		return { message: 'Tasks updated successfully', count: updated.length };
	}

	async bulkUpdatePriority(
		userId: string,
		projectId: string,
		input: BulkUpdatePriorityInput
	): Promise<BulkActionOutput> {
		await this.assertProjectOwnership(userId, projectId);

		const updated = await this.database.db
			.update(tasks)
			.set({ priority: input.priority })
			.where(and(eq(tasks.projectId, projectId), inArray(tasks.id, input.taskIds)))
			.returning({ id: tasks.id });

		return { message: 'Tasks updated successfully', count: updated.length };
	}

	async bulkDelete(
		userId: string,
		projectId: string,
		taskIds: string[]
	): Promise<BulkActionOutput> {
		await this.assertProjectOwnership(userId, projectId);

		const deleted = await this.database.db
			.delete(tasks)
			.where(and(eq(tasks.projectId, projectId), inArray(tasks.id, taskIds)))
			.returning({ id: tasks.id });

		return { message: 'Tasks deleted successfully', count: deleted.length };
	}

	private async assertProjectOwnership(userId: string, projectId: string): Promise<void> {
		const [project] = await this.database.db
			.select({ id: projects.id })
			.from(projects)
			.where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
			.limit(1);

		if (!project) {
			throw new ORPCError('NOT_FOUND', { message: 'Project not found' });
		}
	}

	private async assertTaskOwnership(userId: string, taskId: string): Promise<void> {
		const [task] = await this.database.db
			.select({ id: tasks.id, projectId: tasks.projectId })
			.from(tasks)
			.where(eq(tasks.id, taskId))
			.limit(1);

		if (!task) {
			throw new ORPCError('NOT_FOUND', { message: 'Task not found' });
		}

		const [project] = await this.database.db
			.select({ id: projects.id })
			.from(projects)
			.where(and(eq(projects.id, task.projectId), eq(projects.userId, userId)))
			.limit(1);

		if (!project) {
			throw new ORPCError('FORBIDDEN', { message: 'You do not have access to this task' });
		}
	}
}

function buildOrderClause(query: ListTasksQuery) {
	const orderFn = query.order === 'asc' ? asc : desc;

	if (query.sortBy === 'priority') {
		return orderFn(
			sql`CASE ${tasks.priority} WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END`
		);
	}
	if (query.sortBy === 'due_date') {
		return orderFn(tasks.dueDate);
	}
	return orderFn(tasks.createdAt);
}

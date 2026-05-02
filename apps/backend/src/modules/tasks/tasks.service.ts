import { Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, inArray, isNotNull, lt, ne, sql } from '@taskflow/database';

import { ORPCError } from '@taskflow/orpc';
import { projects, tasks } from '@taskflow/database';
import type { ITasksService } from '@taskflow/orpc';
import type {
	BulkActionOutput,
	BulkDeleteInput,
	BulkUpdatePriorityInput,
	BulkUpdateStatusInput,
	CreateTaskInput,
	ListTasksQuery,
	MessageOutput,
	PaginatedTasksOutput,
	TaskOutput,
	UpdateTaskInput,
} from '@taskflow/validation';

import { DatabaseService } from '@backend/modules/database/database.service';
import { convertToPaginatedOutput } from '@backend/libs/functions/convert-to-paginated-output';

@Injectable()
export class TasksService implements ITasksService {
	constructor(private readonly database: DatabaseService) { }

	async create(userId: string, input: CreateTaskInput): Promise<TaskOutput> {
		const [project] = await this.database.db
			.select({ id: projects.id })
			.from(projects)
			.where(and(eq(projects.id, input.projectId), eq(projects.userId, userId)))
			.limit(1);

		if (!project) {
			throw new ORPCError('NOT_FOUND', { message: 'Project not found' });
		}

		const { dueDate, ...rest } = input;
		const [task] = await this.database.db
			.insert(tasks)
			.values({ ...rest, projectId: input.projectId, dueDate: dueDate ? new Date(dueDate) : null })
			.returning();

		return task;
	}

	async listByProject(
		userId: string,
		query: ListTasksQuery
	): Promise<PaginatedTasksOutput> {
		const [project] = await this.database.db
			.select({ id: projects.id })
			.from(projects)
			.where(and(eq(projects.id, query.projectId), eq(projects.userId, userId)))
			.limit(1);

		if (!project) {
			throw new ORPCError('NOT_FOUND', { message: 'Project not found' });
		}

		const conditions = [eq(tasks.projectId, query.projectId)];
		if (query.status) conditions.push(eq(tasks.status, query.status));
		if (query.priority) conditions.push(eq(tasks.priority, query.priority));
		if (query.search) conditions.push(ilike(tasks.title, `%${query.search}%`));
		if (query.overdue) {
			conditions.push(isNotNull(tasks.dueDate));
			conditions.push(lt(tasks.dueDate, new Date()));
			conditions.push(ne(tasks.status, 'done'));
		}

		const whereClause = and(...conditions);

		const [countResult, data] = await Promise.all([
			this.database.db
				.select({ value: count() })
				.from(tasks)
				.where(whereClause),

			this.database.db
				.select()
				.from(tasks)
				.where(whereClause)
				.orderBy(buildOrderClause(query))
				.limit(query.limit)
				.offset((query.page - 1) * query.limit),
		]);

		const [{ value: total }] = countResult;

		return convertToPaginatedOutput(data, total, query.page, query.limit);
	}

	async update(userId: string, input: UpdateTaskInput): Promise<TaskOutput> {
		await this.assertTaskOwnership(userId, input.taskId);

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
			.where(eq(tasks.id, input.taskId))
			.returning();

		return updated;
	}

	async delete(userId: string, taskId: string): Promise<MessageOutput> {
		await this.assertTaskOwnership(userId, taskId);

		await this.database.db.delete(tasks).where(eq(tasks.id, taskId));

		return { message: 'Task deleted successfully' };
	}

	async bulkUpdateStatus(
		userId: string,
		input: BulkUpdateStatusInput
	): Promise<BulkActionOutput> {
		await this.assertProjectOwnership(userId, input.projectId);

		const completedAt = input.status === 'done' ? new Date() : null;

		const updated = await this.database.db
			.update(tasks)
			.set({ status: input.status, completedAt })
			.where(and(eq(tasks.projectId, input.projectId), inArray(tasks.id, input.taskIds)))
			.returning({ id: tasks.id });

		return { message: 'Tasks updated successfully', count: updated.length };
	}

	async bulkUpdatePriority(
		userId: string,
		input: BulkUpdatePriorityInput
	): Promise<BulkActionOutput> {
		await this.assertProjectOwnership(userId, input.projectId);

		const updated = await this.database.db
			.update(tasks)
			.set({ priority: input.priority })
			.where(and(eq(tasks.projectId, input.projectId), inArray(tasks.id, input.taskIds)))
			.returning({ id: tasks.id });

		return { message: 'Tasks updated successfully', count: updated.length };
	}

	async bulkDelete(
		userId: string,
		input: BulkDeleteInput
	): Promise<BulkActionOutput> {
		await this.assertProjectOwnership(userId, input.projectId);

		const deleted = await this.database.db
			.delete(tasks)
			.where(and(eq(tasks.projectId, input.projectId), inArray(tasks.id, input.taskIds)))
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

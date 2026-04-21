import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { ORPCError } from '@taskflow/orpc';
import { projects, tasks } from '@taskflow/database';
import type { ITasksService } from '@taskflow/orpc';
import type { CreateTaskInput, TaskOutput, TaskStatus, UpdateTaskInput } from '@taskflow/validation';

import { DatabaseService } from '@backend/modules/database/database.service';

@Injectable()
export class TasksService implements ITasksService {
	constructor(private readonly database: DatabaseService) {}

	async create(userId: string, projectId: string, input: CreateTaskInput): Promise<TaskOutput> {
		// verify project belongs to the user before allowing task creation
		const [project] = await this.database.db
			.select({ id: projects.id })
			.from(projects)
			.where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
			.limit(1);

		if (!project) {
			throw new ORPCError('NOT_FOUND', { message: 'Project not found' });
		}

		const [task] = await this.database.db
			.insert(tasks)
			.values({ ...input, projectId })
			.returning();

		return task;
	}

	async listByProject(userId: string, projectId: string): Promise<TaskOutput[]> {
		// verify project belongs to the user before listing tasks
		const [project] = await this.database.db
			.select({ id: projects.id })
			.from(projects)
			.where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
			.limit(1);

		if (!project) {
			throw new ORPCError('NOT_FOUND', { message: 'Project not found' });
		}

		return this.database.db.select().from(tasks).where(eq(tasks.projectId, projectId));
	}

	async update(userId: string, taskId: string, input: UpdateTaskInput): Promise<TaskOutput> {
		await this.assertTaskOwnership(userId, taskId);

		const [updated] = await this.database.db
			.update(tasks)
			.set(input)
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

	// verify the task exists and its parent project belongs to the user
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

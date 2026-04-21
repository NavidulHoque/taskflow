import type { CreateTaskInput, TaskOutput, TaskStatus, UpdateTaskInput } from '@taskflow/validation';

export interface ITasksService {
	create(userId: string, projectId: string, input: CreateTaskInput): Promise<TaskOutput>;
	listByProject(userId: string, projectId: string): Promise<TaskOutput[]>;
	update(userId: string, taskId: string, input: UpdateTaskInput): Promise<TaskOutput>;
	updateStatus(userId: string, taskId: string, status: TaskStatus): Promise<TaskOutput>;
	delete(userId: string, taskId: string): Promise<{ message: string }>;
}

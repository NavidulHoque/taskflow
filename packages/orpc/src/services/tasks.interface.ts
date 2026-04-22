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

export interface ITasksService {
	create(userId: string, projectId: string, input: CreateTaskInput): Promise<TaskOutput>;
	listByProject(userId: string, projectId: string, query: ListTasksQuery): Promise<PaginatedTasksOutput>;
	update(userId: string, taskId: string, input: UpdateTaskInput): Promise<TaskOutput>;
	updateStatus(userId: string, taskId: string, status: TaskStatus): Promise<TaskOutput>;
	delete(userId: string, taskId: string): Promise<{ message: string }>;
	bulkUpdateStatus(userId: string, projectId: string, input: BulkUpdateStatusInput): Promise<BulkActionOutput>;
	bulkUpdatePriority(userId: string, projectId: string, input: BulkUpdatePriorityInput): Promise<BulkActionOutput>;
	bulkDelete(userId: string, projectId: string, taskIds: string[]): Promise<BulkActionOutput>;
}

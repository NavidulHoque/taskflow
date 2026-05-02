import type {
	BulkActionOutput,
	BulkDeleteInput,
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
	create(userId: string, input: CreateTaskInput): Promise<TaskOutput>;
	listByProject(userId: string, query: ListTasksQuery): Promise<PaginatedTasksOutput>;
	update(userId: string, input: UpdateTaskInput): Promise<TaskOutput>;
	delete(userId: string, taskId: string): Promise<{ message: string }>;
	bulkUpdateStatus(userId: string, input: BulkUpdateStatusInput): Promise<BulkActionOutput>;
	bulkUpdatePriority(userId: string, input: BulkUpdatePriorityInput): Promise<BulkActionOutput>;
	bulkDelete(userId: string, input: BulkDeleteInput): Promise<BulkActionOutput>;
}

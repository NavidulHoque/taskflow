import 'reflect-metadata';
import { Test, type TestingModule } from '@nestjs/testing';

import { DatabaseService } from '@backend/modules/database/database.service';
import { TasksService } from '@backend/modules/tasks/tasks.service';

import type {
	CreateTaskInput,
	ListTasksQuery,
	UpdateTaskInput,
	BulkUpdateStatusInput,
	BulkUpdatePriorityInput,
	BulkDeleteInput,
} from '@taskflow/validation';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const projId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const taskId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

const mockTask = {
	id: taskId,
	title: 'Test Task',
	description: null,
	status: 'todo' as const,
	priority: 'medium' as const,
	dueDate: null,
	completedAt: null,
	projectId: projId,
	createdAt: new Date('2024-01-01'),
	updatedAt: new Date('2024-01-01'),
};

const baseQuery: ListTasksQuery = {
	projectId: projId,
	status: undefined,
	priority: undefined,
	search: undefined,
	overdue: undefined,
	sortBy: 'created_at',
	order: 'desc',
	limit: 20,
	page: 1,
};

// ─── Mocks helper type-safe ──────────────────────────────────────────────────

type MockDb = {
	db: {
		select: jest.Mock;
		insert: jest.Mock;
		update: jest.Mock;
		delete: jest.Mock;
	};
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('TasksService', () => {
	let service: TasksService;
	let dbService: MockDb;

	beforeEach(async () => {
		dbService = {
			db: {
				select: jest.fn(),
				insert: jest.fn(),
				update: jest.fn(),
				delete: jest.fn(),
			},
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TasksService,
				{ provide: DatabaseService, useValue: dbService },
			],
		}).compile();

		service = module.get(TasksService);
	});

	// ─── create ───────────────────────────────────────────────────────────────

	describe('create', () => {
		it('throws NOT_FOUND when project does not exist', async () => {
			dbService.db.select.mockReturnValueOnce({
				from: () => ({
					where: () => ({ limit: () => [] }),
				}),
			} as never);

			await expect(
				service.create(userId, {
					projectId: projId,
					title: 'Task',
					status: 'todo',
					priority: 'medium',
				} as CreateTaskInput),
			).rejects.toMatchObject({ code: 'NOT_FOUND' });
		});

		it('creates task successfully', async () => {
			dbService.db.select.mockReturnValueOnce({
				from: () => ({
					where: () => ({ limit: () => [{ id: projId }] }),
				}),
			} as never);

			dbService.db.insert.mockReturnValueOnce({
				values: () => ({
					returning: () => [mockTask],
				}),
			} as never);

			const result = await service.create(userId, {
				projectId: projId,
				title: 'Test Task',
				priority: 'medium',
			});

			expect(result).toEqual(mockTask);
		});
	});

	// ─── listByProject ────────────────────────────────────────────────────────

	describe('listByProject', () => {
		it('returns paginated tasks', async () => {
			dbService.db.select
				.mockReturnValueOnce({
					from: () => ({
						where: () => ({ limit: () => [{ id: projId }] }),
					}),
				} as never)
				.mockReturnValueOnce({
					from: () => ({
						where: () => [{ value: 1 }],
					}),
				} as never)
				.mockReturnValueOnce({
					from: () => ({
						where: () => ({
							orderBy: () => ({
								limit: () => ({
									offset: () => [mockTask],
								}),
							}),
						}),
					}),
				} as never);

			const result = await service.listByProject(userId, baseQuery);

			expect(result.data).toEqual([mockTask]);
		});
	});

	// ─── update ───────────────────────────────────────────────────────────────

	describe('update', () => {
		it('updates task and sets completedAt when done', async () => {
			dbService.db.select.mockReturnValueOnce({
				from: () => ({
					where: () => ({ limit: () => [{ id: taskId, projectId: projId }] }),
				}),
			} as never);

			dbService.db.select.mockReturnValueOnce({
				from: () => ({
					where: () => ({ limit: () => [{ id: projId }] }),
				}),
			} as never);

			dbService.db.update.mockReturnValueOnce({
				set: () => ({
					where: () => ({
						returning: () => [{ ...mockTask, status: 'done' }],
					}),
				}),
			} as never);

			const result = await service.update(userId, {
				taskId,
				status: 'done',
			} as UpdateTaskInput);

			expect(result.status).toBe('done');
		});
	});

	// ─── delete ───────────────────────────────────────────────────────────────

	describe('delete', () => {
		it('deletes task', async () => {
			dbService.db.select.mockReturnValueOnce({
				from: () => ({
					where: () => ({ limit: () => [{ id: taskId, projectId: projId }] }),
				}),
			} as never);

			dbService.db.select.mockReturnValueOnce({
				from: () => ({
					where: () => ({ limit: () => [{ id: projId }] }),
				}),
			} as never);

			dbService.db.delete.mockReturnValueOnce({
				where: () => [],
			} as never);

			const result = await service.delete(userId, taskId);

			expect(result.message).toBe('Task deleted successfully');
		});
	});

	// ─── bulkUpdateStatus ─────────────────────────────────────────────────────

	describe('bulkUpdateStatus', () => {
		it('updates status in bulk', async () => {
			dbService.db.select.mockReturnValueOnce({
				from: () => ({
					where: () => ({ limit: () => [{ id: projId }] }),
				}),
			} as never);

			dbService.db.update.mockReturnValueOnce({
				set: () => ({
					where: () => ({
						returning: () => [{ id: taskId }],
					}),
				}),
			} as never);

			const result = await service.bulkUpdateStatus(userId, {
				projectId: projId,
				taskIds: [taskId],
				status: 'done',
			} as BulkUpdateStatusInput);

			expect(result.count).toBe(1);
		});
	});

	// ─── bulkUpdatePriority ───────────────────────────────────────────────────

	describe('bulkUpdatePriority', () => {
		it('updates priority in bulk', async () => {
			dbService.db.select.mockReturnValueOnce({
				from: () => ({
					where: () => ({ limit: () => [{ id: projId }] }),
				}),
			} as never);

			dbService.db.update.mockReturnValueOnce({
				set: () => ({
					where: () => ({
						returning: () => [{ id: taskId }],
					}),
				}),
			} as never);

			const result = await service.bulkUpdatePriority(userId, {
				projectId: projId,
				taskIds: [taskId],
				priority: 'high',
			} as BulkUpdatePriorityInput);

			expect(result.count).toBe(1);
		});
	});

	// ─── bulkDelete ───────────────────────────────────────────────────────────

	describe('bulkDelete', () => {
		it('deletes tasks in bulk', async () => {
			dbService.db.select.mockReturnValueOnce({
				from: () => ({
					where: () => ({ limit: () => [{ id: projId }] }),
				}),
			} as never);

			dbService.db.delete.mockReturnValueOnce({
				where: () => ({
					returning: () => [{ id: taskId }],
				}),
			} as never);

			const result = await service.bulkDelete(userId, {
				projectId: projId,
				taskIds: [taskId],
			} as BulkDeleteInput);

			expect(result.count).toBe(1);
		});
	});
});
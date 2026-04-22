import 'reflect-metadata';
import { Test, type TestingModule } from '@nestjs/testing';

import { DatabaseService } from '@backend/modules/database/database.service';
import { chain } from '@backend/test-utils/helpers';

import { TasksService } from '@backend/modules/tasks/tasks.service';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

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

const baseQuery = {
	status: undefined,
	priority: undefined,
	search: undefined,
	overdue: undefined,
	sortBy: 'created_at' as const,
	order: 'desc' as const,
	limit: 20,
	offset: 0,
};

// Mocks the two selects inside assertTaskOwnership
const ownershipSelectMock = () =>
	jest.fn(() => {})
		.mockImplementationOnce(() => chain([{ id: taskId, projectId: projId }]))
		.mockImplementationOnce(() => chain([{ id: projId }]));

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('TasksService', () => {
	let service: TasksService;
	let dbService: { db: any };

	beforeEach(async () => {
		dbService = { db: {} };

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
		it('throws NOT_FOUND when the project does not exist', async () => {
			dbService.db = { select: jest.fn(() => chain([])) };

			await expect(
				service.create(userId, projId, { title: 'Task', status: 'todo', priority: 'medium' })
			).rejects.toMatchObject({ code: 'NOT_FOUND' });
		});

		it('creates a task and returns it', async () => {
			dbService.db = {
				select: jest.fn(() => chain([{ id: projId }])),
				insert: jest.fn(() => chain([mockTask])),
			};

			const result = await service.create(userId, projId, {
				title: 'Test Task',
				status: 'todo',
				priority: 'medium',
			});

			expect(result).toEqual(mockTask);
		});

		it('converts dueDate string to Date before inserting', async () => {
			const insertChain = chain([{ ...mockTask, dueDate: new Date('2025-12-31') }]);
			dbService.db = {
				select: jest.fn(() => chain([{ id: projId }])),
				insert: jest.fn(() => insertChain),
			};

			await service.create(userId, projId, {
				title: 'Task',
				status: 'todo',
				priority: 'medium',
				dueDate: '2025-12-31T00:00:00.000Z',
			});

			expect(insertChain.values).toHaveBeenCalledWith(
				expect.objectContaining({ dueDate: expect.any(Date) })
			);
		});
	});

	// ─── listByProject ────────────────────────────────────────────────────────

	describe('listByProject', () => {
		it('throws NOT_FOUND when the project does not exist', async () => {
			dbService.db = { select: jest.fn(() => chain([])) };

			await expect(service.listByProject(userId, projId, baseQuery)).rejects.toMatchObject({
				code: 'NOT_FOUND',
			});
		});

		it('returns paginated tasks', async () => {
			dbService.db = {
				select: jest.fn(() => {})
					.mockImplementationOnce(() => chain([{ id: projId }]))
					.mockImplementationOnce(() => chain([{ value: 2 }]))
					.mockImplementationOnce(() => chain([mockTask])),
			};

			const result = await service.listByProject(userId, projId, baseQuery);

			expect(result).toEqual({ data: [mockTask], total: 2, limit: 20, offset: 0 });
		});

		it('applies custom limit and offset', async () => {
			dbService.db = {
				select: jest.fn(() => {})
					.mockImplementationOnce(() => chain([{ id: projId }]))
					.mockImplementationOnce(() => chain([{ value: 10 }]))
					.mockImplementationOnce(() => chain([])),
			};

			const result = await service.listByProject(userId, projId, {
				...baseQuery,
				limit: 5,
				offset: 5,
			});

			expect(result.limit).toBe(5);
			expect(result.offset).toBe(5);
		});
	});

	// ─── update ───────────────────────────────────────────────────────────────

	describe('update', () => {
		it('throws NOT_FOUND when the task does not exist', async () => {
			dbService.db = {
				select: jest.fn(() => {}).mockImplementationOnce(() => chain([])),
			};

			await expect(service.update(userId, taskId, { title: 'New' })).rejects.toMatchObject({
				code: 'NOT_FOUND',
			});
		});

		it('throws FORBIDDEN when the task belongs to another user', async () => {
			dbService.db = {
				select: jest.fn(() => {})
					.mockImplementationOnce(() => chain([{ id: taskId, projectId: projId }]))
					.mockImplementationOnce(() => chain([])), // project not found for this user
			};

			await expect(service.update(userId, taskId, { title: 'X' })).rejects.toMatchObject({
				code: 'FORBIDDEN',
			});
		});

		it('sets completedAt when status changes to done', async () => {
			const updateChain = chain([{ ...mockTask, status: 'done', completedAt: new Date() }]);
			dbService.db = {
				select: ownershipSelectMock(),
				update: jest.fn(() => updateChain),
			};

			await service.update(userId, taskId, { status: 'done' });

			expect(updateChain.set).toHaveBeenCalledWith(
				expect.objectContaining({ status: 'done', completedAt: expect.any(Date) })
			);
		});

		it('clears completedAt when status moves away from done', async () => {
			const updateChain = chain([{ ...mockTask, status: 'todo', completedAt: null }]);
			dbService.db = {
				select: ownershipSelectMock(),
				update: jest.fn(() => updateChain),
			};

			await service.update(userId, taskId, { status: 'todo' });

			expect(updateChain.set).toHaveBeenCalledWith(
				expect.objectContaining({ status: 'todo', completedAt: null })
			);
		});

		it('does not touch completedAt when status is not in the update', async () => {
			const updateChain = chain([{ ...mockTask, title: 'New Title' }]);
			dbService.db = {
				select: ownershipSelectMock(),
				update: jest.fn(() => updateChain),
			};

			await service.update(userId, taskId, { title: 'New Title' });

			const setArg = (updateChain.set as jest.Mock).mock.calls[0]![0] as Record<string, unknown>;
			expect('completedAt' in setArg).toBe(false);
		});
	});

	// ─── updateStatus ─────────────────────────────────────────────────────────

	describe('updateStatus', () => {
		it('delegates to update and sets completedAt for done', async () => {
			const updateChain = chain([{ ...mockTask, status: 'done', completedAt: new Date() }]);
			dbService.db = {
				select: ownershipSelectMock(),
				update: jest.fn(() => updateChain),
			};

			await service.updateStatus(userId, taskId, 'done');

			expect(updateChain.set).toHaveBeenCalledWith(
				expect.objectContaining({ status: 'done', completedAt: expect.any(Date) })
			);
		});
	});

	// ─── delete ───────────────────────────────────────────────────────────────

	describe('delete', () => {
		it('throws NOT_FOUND when the task does not exist', async () => {
			dbService.db = {
				select: jest.fn(() => {}).mockImplementationOnce(() => chain([])),
			};

			await expect(service.delete(userId, taskId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
		});

		it('deletes the task and returns a success message', async () => {
			dbService.db = {
				select: ownershipSelectMock(),
				delete: jest.fn(() => chain(undefined)),
			};

			const result = await service.delete(userId, taskId);

			expect(result.message).toBe('Task deleted successfully');
		});
	});

	// ─── bulkUpdateStatus ─────────────────────────────────────────────────────

	describe('bulkUpdateStatus', () => {
		it('throws NOT_FOUND when project does not exist', async () => {
			dbService.db = { select: jest.fn(() => chain([])) };

			await expect(
				service.bulkUpdateStatus(userId, projId, { taskIds: [taskId], status: 'done' })
			).rejects.toMatchObject({ code: 'NOT_FOUND' });
		});

		it('sets completedAt when bulk-updating to done', async () => {
			const bulkChain = chain([{ id: taskId }]);
			dbService.db = {
				select: jest.fn(() => chain([{ id: projId }])),
				update: jest.fn(() => bulkChain),
			};

			const result = await service.bulkUpdateStatus(userId, projId, {
				taskIds: [taskId],
				status: 'done',
			});

			expect(result.count).toBe(1);
			expect(bulkChain.set).toHaveBeenCalledWith(
				expect.objectContaining({ status: 'done', completedAt: expect.any(Date) })
			);
		});

		it('clears completedAt when bulk-updating to a non-done status', async () => {
			const bulkChain = chain([{ id: taskId }]);
			dbService.db = {
				select: jest.fn(() => chain([{ id: projId }])),
				update: jest.fn(() => bulkChain),
			};

			await service.bulkUpdateStatus(userId, projId, { taskIds: [taskId], status: 'todo' });

			expect(bulkChain.set).toHaveBeenCalledWith(
				expect.objectContaining({ status: 'todo', completedAt: null })
			);
		});
	});

	// ─── bulkUpdatePriority ───────────────────────────────────────────────────

	describe('bulkUpdatePriority', () => {
		it('throws NOT_FOUND when project does not exist', async () => {
			dbService.db = { select: jest.fn(() => chain([])) };

			await expect(
				service.bulkUpdatePriority(userId, projId, { taskIds: [taskId], priority: 'high' })
			).rejects.toMatchObject({ code: 'NOT_FOUND' });
		});

		it('updates priority and returns the count of affected tasks', async () => {
			const bulkChain = chain([{ id: taskId }]);
			dbService.db = {
				select: jest.fn(() => chain([{ id: projId }])),
				update: jest.fn(() => bulkChain),
			};

			const result = await service.bulkUpdatePriority(userId, projId, {
				taskIds: [taskId],
				priority: 'high',
			});

			expect(result.count).toBe(1);
			expect(bulkChain.set).toHaveBeenCalledWith({ priority: 'high' });
		});
	});

	// ─── bulkDelete ───────────────────────────────────────────────────────────

	describe('bulkDelete', () => {
		it('throws NOT_FOUND when project does not exist', async () => {
			dbService.db = { select: jest.fn(() => chain([])) };

			await expect(service.bulkDelete(userId, projId, [taskId])).rejects.toMatchObject({
				code: 'NOT_FOUND',
			});
		});

		it('deletes tasks and returns the count', async () => {
			const deleteChain = chain([{ id: taskId }]);
			dbService.db = {
				select: jest.fn(() => chain([{ id: projId }])),
				delete: jest.fn(() => deleteChain),
			};

			const result = await service.bulkDelete(userId, projId, [taskId]);

			expect(result.count).toBe(1);
			expect(result.message).toBe('Tasks deleted successfully');
		});
	});
});

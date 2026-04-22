import 'reflect-metadata';
import { Test, type TestingModule } from '@nestjs/testing';

import { DatabaseService } from '@backend/modules/database/database.service';
import { chain } from '@backend/test-utils/helpers';

import { ProjectsService } from '@backend/modules/projects/projects.service';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const projId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const mockProject = {
	id: projId,
	title: 'Test Project',
	description: null,
	userId,
	archivedAt: null,
	createdAt: new Date('2024-01-01'),
	updatedAt: new Date('2024-01-01'),
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('ProjectsService', () => {
	let service: ProjectsService;
	let dbService: { db: any };

	beforeEach(async () => {
		dbService = { db: {} };

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProjectsService,
				{ provide: DatabaseService, useValue: dbService },
			],
		}).compile();

		service = module.get(ProjectsService);
	});

	// ─── create ───────────────────────────────────────────────────────────────

	describe('create', () => {
		it('inserts a project and returns it', async () => {
			dbService.db = { insert: jest.fn(() => chain([mockProject])) };

			const result = await service.create(userId, { title: 'Test Project' });

			expect(result).toEqual(mockProject);
		});
	});

	// ─── list ─────────────────────────────────────────────────────────────────

	describe('list', () => {
		it('returns paginated active projects by default', async () => {
			dbService.db = {
				select: jest.fn(() => {})
					.mockImplementationOnce(() => chain([{ value: 1 }]))
					.mockImplementationOnce(() => chain([mockProject])),
			};

			const result = await service.list(userId, { limit: 20, offset: 0 });

			expect(result).toEqual({ data: [mockProject], total: 1, limit: 20, offset: 0 });
		});

		it('returns archived projects when archived is true', async () => {
			const archivedProject = { ...mockProject, archivedAt: new Date() };
			dbService.db = {
				select: jest.fn(() => {})
					.mockImplementationOnce(() => chain([{ value: 1 }]))
					.mockImplementationOnce(() => chain([archivedProject])),
			};

			const result = await service.list(userId, { archived: true, limit: 20, offset: 0 });

			expect(result.data[0]!.archivedAt).not.toBeNull();
		});

		it('respects limit and offset', async () => {
			dbService.db = {
				select: jest.fn(() => {})
					.mockImplementationOnce(() => chain([{ value: 50 }]))
					.mockImplementationOnce(() => chain([mockProject])),
			};

			const result = await service.list(userId, { limit: 10, offset: 20 });

			expect(result.total).toBe(50);
			expect(result.limit).toBe(10);
			expect(result.offset).toBe(20);
		});
	});

	// ─── getById ──────────────────────────────────────────────────────────────

	describe('getById', () => {
		it('throws NOT_FOUND when project does not exist', async () => {
			dbService.db = { select: jest.fn(() => chain([])) };

			await expect(service.getById(userId, projId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
		});

		it('returns the project when found', async () => {
			dbService.db = { select: jest.fn(() => chain([mockProject])) };

			const result = await service.getById(userId, projId);

			expect(result).toEqual(mockProject);
		});
	});

	// ─── update ───────────────────────────────────────────────────────────────

	describe('update', () => {
		it('throws NOT_FOUND when project does not exist', async () => {
			dbService.db = { select: jest.fn(() => chain([])) };

			await expect(service.update(userId, projId, { title: 'New' })).rejects.toMatchObject({
				code: 'NOT_FOUND',
			});
		});

		it('returns the updated project', async () => {
			const updated = { ...mockProject, title: 'Updated' };
			dbService.db = {
				select: jest.fn(() => chain([{ id: projId }])),
				update: jest.fn(() => chain([updated])),
			};

			const result = await service.update(userId, projId, { title: 'Updated' });

			expect(result.title).toBe('Updated');
		});
	});

	// ─── delete ───────────────────────────────────────────────────────────────

	describe('delete', () => {
		it('throws NOT_FOUND when project does not exist', async () => {
			dbService.db = { select: jest.fn(() => chain([])) };

			await expect(service.delete(userId, projId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
		});

		it('deletes the project and returns success message', async () => {
			dbService.db = {
				select: jest.fn(() => chain([{ id: projId }])),
				delete: jest.fn(() => chain(undefined)),
			};

			const result = await service.delete(userId, projId);

			expect(result.message).toBe('Project deleted successfully');
		});
	});

	// ─── archive ──────────────────────────────────────────────────────────────

	describe('archive', () => {
		it('throws NOT_FOUND when project does not exist', async () => {
			dbService.db = { select: jest.fn(() => chain([])) };

			await expect(service.archive(userId, projId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
		});

		it('throws BAD_REQUEST when project is already archived', async () => {
			dbService.db = {
				select: jest.fn(() => chain([{ id: projId, archivedAt: new Date() }])),
			};

			await expect(service.archive(userId, projId)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
		});

		it('archives the project and returns it with archivedAt set', async () => {
			const archived = { ...mockProject, archivedAt: new Date() };
			dbService.db = {
				select: jest.fn(() => chain([{ id: projId, archivedAt: null }])),
				update: jest.fn(() => chain([archived])),
			};

			const result = await service.archive(userId, projId);

			expect(result.archivedAt).not.toBeNull();
		});
	});

	// ─── unarchive ────────────────────────────────────────────────────────────

	describe('unarchive', () => {
		it('throws NOT_FOUND when project does not exist', async () => {
			dbService.db = { select: jest.fn(() => chain([])) };

			await expect(service.unarchive(userId, projId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
		});

		it('throws BAD_REQUEST when project is not archived', async () => {
			dbService.db = {
				select: jest.fn(() => chain([{ id: projId, archivedAt: null }])),
			};

			await expect(service.unarchive(userId, projId)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
		});

		it('clears archivedAt and returns the project', async () => {
			const unarchived = { ...mockProject, archivedAt: null };
			dbService.db = {
				select: jest.fn(() => chain([{ id: projId, archivedAt: new Date() }])),
				update: jest.fn(() => chain([unarchived])),
			};

			const result = await service.unarchive(userId, projId);

			expect(result.archivedAt).toBeNull();
		});
	});

	// ─── getStats ─────────────────────────────────────────────────────────────

	describe('getStats', () => {
		it('throws NOT_FOUND when project does not exist', async () => {
			dbService.db = {
				select: jest.fn(() => {}).mockImplementationOnce(() => chain([])),
			};

			await expect(service.getStats(userId, projId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
		});

		it('aggregates task counts by status and priority', async () => {
			dbService.db = {
				select: jest.fn(() => {})
					.mockImplementationOnce(() => chain([{ id: projId }]))
					.mockImplementationOnce(() =>
						chain([
							{ status: 'todo', priority: 'high', value: 2 },
							{ status: 'done', priority: 'medium', value: 3 },
						])
					),
			};

			const result = await service.getStats(userId, projId);

			expect(result).toEqual({
				total: 5,
				byStatus: { todo: 2, in_progress: 0, done: 3 },
				byPriority: { low: 0, medium: 3, high: 2 },
			});
		});

		it('returns all zeros when project has no tasks', async () => {
			dbService.db = {
				select: jest.fn(() => {})
					.mockImplementationOnce(() => chain([{ id: projId }]))
					.mockImplementationOnce(() => chain([])),
			};

			const result = await service.getStats(userId, projId);

			expect(result.total).toBe(0);
			expect(result.byStatus).toEqual({ todo: 0, in_progress: 0, done: 0 });
			expect(result.byPriority).toEqual({ low: 0, medium: 0, high: 0 });
		});
	});
});

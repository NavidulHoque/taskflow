import 'reflect-metadata';
import { Test, type TestingModule } from '@nestjs/testing';

import { DatabaseService } from '@backend/modules/database/database.service';
import { chain } from '@backend/test-utils/helpers';

import { ProjectsService } from '@backend/modules/projects/projects.service';

// ─── Fixtures ────────────────────────────────────────────────────────────────

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

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('ProjectsService', () => {
	let service: ProjectsService;
	let dbService: { db: Record<string, unknown> };

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

	// ─── createProject ───────────────────────────────────────────────────────

	describe('createProject', () => {
		it('inserts a project and returns it', async () => {
			dbService.db = {
				insert: jest.fn(() => chain([mockProject])),
			};

			const result = await service.createProject(userId, {
				title: 'Test Project',
			});

			expect(result).toEqual(mockProject);
		});
	});

	// ─── getAllProjects ──────────────────────────────────────────────────────

	describe('getAllProjects', () => {
		it('returns paginated active projects by default', async () => {
			dbService.db = {
				select: jest.fn()
					.mockImplementationOnce(() => chain([{ value: 1 }]))
					.mockImplementationOnce(() => chain([mockProject])),
			};

			const result = await service.getAllProjects(userId, {
				limit: 20,
				page: 1,
				archived: false,
			});

			expect(result.data).toEqual([mockProject]);
			expect(result.total).toBe(1);
			expect(result.limit).toBe(20);
			expect(result.page).toBe(1);
		});

		it('returns archived projects when archived is true', async () => {
			const archivedProject = { ...mockProject, archivedAt: new Date() };

			dbService.db = {
				select: jest.fn()
					.mockImplementationOnce(() => chain([{ value: 1 }]))
					.mockImplementationOnce(() => chain([archivedProject])),
			};

			const result = await service.getAllProjects(userId, {
				limit: 20,
				page: 1,
				archived: true,
			});

			expect(result.data[0]!.archivedAt).not.toBeNull();
		});
	});

	// ─── getProjectById (with stats) ─────────────────────────────────────────

	describe('getProjectById', () => {
		it('throws NOT_FOUND when project does not exist', async () => {
			dbService.db = {
				select: jest.fn().mockImplementationOnce(() => chain([])),
			};

			await expect(
				service.getProjectById(userId, projId),
			).rejects.toMatchObject({ code: 'NOT_FOUND' });
		});

		it('returns project with stats when found', async () => {
			dbService.db = {
				select: jest.fn()
					.mockImplementationOnce(() => chain([mockProject]))
					.mockImplementationOnce(() =>
						chain([
							{ status: 'todo', priority: 'high', value: 2 },
							{ status: 'done', priority: 'medium', value: 3 },
						]),
					),
			};

			const result = await service.getProjectById(userId, projId);

			expect(result.id).toBe(projId);
			expect(result.stats.total).toBe(5);
			expect(result.stats.byStatus).toEqual({
				todo: 2,
				in_progress: 0,
				done: 3,
			});
			expect(result.stats.byPriority).toEqual({
				low: 0,
				medium: 3,
				high: 2,
			});
		});
	});

	// ─── updateProject ───────────────────────────────────────────────────────

	describe('updateProject', () => {
		it('throws NOT_FOUND when project does not exist', async () => {
			dbService.db = {
				select: jest.fn(() => chain([])),
			};

			await expect(
				service.updateProject(userId, { id: projId, title: 'New' }),
			).rejects.toMatchObject({ code: 'NOT_FOUND' });
		});

		it('returns updated project', async () => {
			const updated = { ...mockProject, title: 'Updated' };

			dbService.db = {
				select: jest.fn(() => chain([{ id: projId }])),
				update: jest.fn(() => chain([updated])),
			};

			const result = await service.updateProject(userId, {
				id: projId,
				title: 'Updated',
			});

			expect(result.title).toBe('Updated');
		});
	});

	// ─── deleteProject ───────────────────────────────────────────────────────

	describe('deleteProject', () => {
		it('throws NOT_FOUND when project does not exist', async () => {
			dbService.db = {
				select: jest.fn(() => chain([])),
			};

			await expect(
				service.deleteProject(userId, projId),
			).rejects.toMatchObject({ code: 'NOT_FOUND' });
		});

		it('deletes project successfully', async () => {
			dbService.db = {
				select: jest.fn(() => chain([{ id: projId }])),
				delete: jest.fn(() => chain(undefined)),
			};

			const result = await service.deleteProject(userId, projId);

			expect(result.message).toBe('Project deleted successfully');
		});
	});

	// ─── archiveProject ──────────────────────────────────────────────────────

	describe('archiveProject', () => {
		it('throws NOT_FOUND when project does not exist', async () => {
			dbService.db = {
				select: jest.fn(() => chain([])),
			};

			await expect(
				service.archiveProject(userId, projId),
			).rejects.toMatchObject({ code: 'NOT_FOUND' });
		});

		it('throws BAD_REQUEST when already archived', async () => {
			dbService.db = {
				select: jest.fn(() =>
					chain([{ id: projId, archivedAt: new Date() }]),
				),
			};

			await expect(
				service.archiveProject(userId, projId),
			).rejects.toMatchObject({ code: 'BAD_REQUEST' });
		});

		it('archives project successfully', async () => {
			const archived = { ...mockProject, archivedAt: new Date() };

			dbService.db = {
				select: jest.fn(() =>
					chain([{ id: projId, archivedAt: null }]),
				),
				update: jest.fn(() => chain([archived])),
			};

			const result = await service.archiveProject(userId, projId);

			expect(result.archivedAt).not.toBeNull();
		});
	});

	// ─── unarchiveProject ────────────────────────────────────────────────────

	describe('unarchiveProject', () => {
		it('throws NOT_FOUND when project does not exist', async () => {
			dbService.db = {
				select: jest.fn(() => chain([])),
			};

			await expect(
				service.unarchiveProject(userId, projId),
			).rejects.toMatchObject({ code: 'NOT_FOUND' });
		});

		it('throws BAD_REQUEST when not archived', async () => {
			dbService.db = {
				select: jest.fn(() =>
					chain([{ id: projId, archivedAt: null }]),
				),
			};

			await expect(
				service.unarchiveProject(userId, projId),
			).rejects.toMatchObject({ code: 'BAD_REQUEST' });
		});

		it('unarchives project successfully', async () => {
			const unarchived = { ...mockProject, archivedAt: null };

			dbService.db = {
				select: jest.fn(() =>
					chain([{ id: projId, archivedAt: new Date() }]),
				),
				update: jest.fn(() => chain([unarchived])),
			};

			const result = await service.unarchiveProject(userId, projId);

			expect(result.archivedAt).toBeNull();
		});
	});
});
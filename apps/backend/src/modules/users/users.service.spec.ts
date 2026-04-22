import 'reflect-metadata';
import { Test, type TestingModule } from '@nestjs/testing';

import { DatabaseService } from '@backend/modules/database/database.service';
import { SupabaseService } from '@backend/modules/supabase/supabase.service';
import { chain } from '@backend/test-utils/helpers';

import { UsersService } from '@backend/modules/users/users.service';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const mockUser = {
	id: userId,
	email: 'test@example.com',
	fullName: 'Test User',
	createdAt: new Date('2024-01-01'),
	updatedAt: new Date('2024-01-01'),
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('UsersService', () => {
	let service: UsersService;
	let dbService: { db: any };
	let supabaseService: { admin: any };

	beforeEach(async () => {
		dbService = { db: {} };
		supabaseService = {
			admin: {
				auth: {
					admin: {
						updateUserById: jest.fn(() => Promise.resolve({ error: null })) as jest.Mock,
					},
				},
			},
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{ provide: DatabaseService, useValue: dbService },
				{ provide: SupabaseService, useValue: supabaseService },
			],
		}).compile();

		service = module.get(UsersService);
	});

	// ─── me ───────────────────────────────────────────────────────────────────

	describe('me', () => {
		it('returns the user profile', async () => {
			dbService.db = { select: jest.fn(() => chain([mockUser])) };

			const result = await service.me(userId);

			expect(result).toEqual(mockUser);
		});

		it('throws NOT_FOUND when user does not exist', async () => {
			dbService.db = { select: jest.fn(() => chain([])) };

			await expect(service.me(userId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
		});
	});

	// ─── updateMe ─────────────────────────────────────────────────────────────

	describe('updateMe', () => {
		it('updates Supabase metadata and the database row', async () => {
			const updated = { ...mockUser, fullName: 'New Name' };
			dbService.db = { update: jest.fn(() => chain([updated])) };

			const result = await service.updateMe(userId, { fullName: 'New Name' });

			expect(result.fullName).toBe('New Name');
			expect(supabaseService.admin.auth.admin.updateUserById).toHaveBeenCalledWith(
				userId,
				expect.objectContaining({ user_metadata: { fullName: 'New Name' } })
			);
		});

		it('throws INTERNAL_SERVER_ERROR when Supabase update fails', async () => {
			supabaseService.admin.auth.admin.updateUserById.mockImplementation(() =>
				Promise.resolve({ error: { message: 'supabase error' } })
			);

			await expect(service.updateMe(userId, { fullName: 'New Name' })).rejects.toMatchObject({
				code: 'INTERNAL_SERVER_ERROR',
			});
		});

		it('throws NOT_FOUND when user row does not exist in the database', async () => {
			dbService.db = { update: jest.fn(() => chain([])) };

			await expect(service.updateMe(userId, { fullName: 'New Name' })).rejects.toMatchObject({
				code: 'NOT_FOUND',
			});
		});
	});
});

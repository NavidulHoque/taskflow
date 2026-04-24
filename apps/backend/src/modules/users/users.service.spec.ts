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

const mockAuthUser = {
	user: { email: 'test@example.com', email_confirmed_at: '2024-01-01T00:00:00Z' },
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
						getUserById: jest.fn(() => Promise.resolve({ data: mockAuthUser })) as jest.Mock,
						deleteUser: jest.fn(() => Promise.resolve({ error: null })) as jest.Mock,
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
		it('returns the user profile with emailVerified', async () => {
			dbService.db = { select: jest.fn(() => chain([mockUser])) };

			const result = await service.me(userId);

			expect(result).toEqual({ ...mockUser, emailVerified: true });
			expect(supabaseService.admin.auth.admin.getUserById).toHaveBeenCalledWith(userId);
		});

		it('throws NOT_FOUND when user does not exist', async () => {
			dbService.db = { select: jest.fn(() => chain([])) };

			await expect(service.me(userId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
		});
	});

	// ─── updateMe ─────────────────────────────────────────────────────────────

	describe('updateMe', () => {
		it('updates the database row and returns a message', async () => {
			const updated = { ...mockUser, fullName: 'New Name' };
			dbService.db = { update: jest.fn(() => chain([updated])) };

			const result = await service.updateMe(userId, { fullName: 'New Name' });

			expect(result).toEqual({ message: 'Profile updated successfully' });
		});

		it('throws NOT_FOUND when user row does not exist in the database', async () => {
			dbService.db = { update: jest.fn(() => chain([])) };

			await expect(service.updateMe(userId, { fullName: 'New Name' })).rejects.toMatchObject({
				code: 'NOT_FOUND',
			});
		});
	});

	// ─── deleteAccount ────────────────────────────────────────────────────────

	describe('deleteAccount', () => {
		it('deletes the auth user and returns a message', async () => {
			dbService.db = { delete: jest.fn(() => chain([])) };

			const result = await service.deleteAccount(userId);

			expect(result).toEqual({ message: 'Account deleted successfully' });
			expect(supabaseService.admin.auth.admin.deleteUser).toHaveBeenCalledWith(userId);
		});

		it('throws INTERNAL_SERVER_ERROR when Supabase delete fails', async () => {
			supabaseService.admin.auth.admin.deleteUser.mockImplementation(() =>
				Promise.resolve({ error: { message: 'supabase error' } })
			);

			await expect(service.deleteAccount(userId)).rejects.toMatchObject({
				code: 'INTERNAL_SERVER_ERROR',
			});
		});
	});
});

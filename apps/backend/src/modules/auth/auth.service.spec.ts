import 'reflect-metadata';
import { Test, type TestingModule } from '@nestjs/testing';

import { DatabaseService } from '@backend/modules/database/database.service';
import { SupabaseService } from '@backend/modules/supabase/supabase.service';
import { EnvService } from '@backend/modules/config/env.service';
import { chain } from '@backend/test-utils/helpers';

import { AuthService } from '@backend/modules/auth/auth.service';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const email = 'test@example.com';
const password = 'password123';
const fullName = 'Test User';

const mockSession = {
	access_token: 'access-token',
	refresh_token: 'refresh-token',
	expires_in: 3600,
	expires_at: 9_999_999,
};

const mockSupabaseUser = { id: userId, email };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSupabaseMock() {
	return {
		admin: {
			auth: {
				admin: {
					createUser: jest.fn(() =>
						Promise.resolve({ data: { user: mockSupabaseUser }, error: null })
					) as jest.Mock,
					deleteUser: jest.fn(() => Promise.resolve({ error: null })) as jest.Mock,
					signOut: jest.fn(() => Promise.resolve({ error: null })) as jest.Mock,
				},
				signInWithPassword: jest.fn(() =>
					Promise.resolve({
						data: { session: mockSession, user: mockSupabaseUser },
						error: null,
					})
				) as jest.Mock,
			},
		},
	};
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
	let service: AuthService;
	let dbService: { db: any };
	let supabaseMock: ReturnType<typeof buildSupabaseMock>;

	const mockEnv = {
		supabaseUrl: 'https://test.supabase.co',
		supabasePublishableKey: 'test-anon-key',
	};

	beforeEach(async () => {
		dbService = { db: {} };
		supabaseMock = buildSupabaseMock();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: DatabaseService, useValue: dbService },
				{ provide: SupabaseService, useValue: supabaseMock },
				{ provide: EnvService, useValue: mockEnv },
			],
		}).compile();

		service = module.get(AuthService);
	});

	// ─── register ─────────────────────────────────────────────────────────────

	describe('register', () => {
		it('throws CONFLICT when email already exists', async () => {
			supabaseMock.admin.auth.admin.createUser.mockImplementation(() =>
				Promise.resolve({ data: null, error: { code: 'email_exists' } })
			);

			await expect(service.register({ fullName, email, password })).rejects.toMatchObject({
				code: 'CONFLICT',
			});
		});

		it('throws BAD_REQUEST for weak password', async () => {
			supabaseMock.admin.auth.admin.createUser.mockImplementation(() =>
				Promise.resolve({ data: null, error: { code: 'weak_password' } })
			);

			await expect(service.register({ fullName, email, password })).rejects.toMatchObject({
				code: 'BAD_REQUEST',
			});
		});

		it('throws INTERNAL_SERVER_ERROR on unexpected Supabase error', async () => {
			supabaseMock.admin.auth.admin.createUser.mockImplementation(() =>
				Promise.resolve({ data: null, error: { code: 'unexpected_error' } })
			);

			await expect(service.register({ fullName, email, password })).rejects.toMatchObject({
				code: 'INTERNAL_SERVER_ERROR',
			});
		});

		it('rolls back the Supabase user when DB insert fails', async () => {
			dbService.db = {
				insert: jest.fn(() => {
					throw new Error('db insert failed');
				}),
			};

			await expect(service.register({ fullName, email, password })).rejects.toMatchObject({
				code: 'INTERNAL_SERVER_ERROR',
			});

			expect(supabaseMock.admin.auth.admin.deleteUser).toHaveBeenCalledWith(userId);
		});

		it('registers a user and returns a session', async () => {
			dbService.db = { insert: jest.fn(() => chain(undefined)) };

			const result = await service.register({ fullName, email, password });

			expect(result.accessToken).toBe(mockSession.access_token);
			expect(result.user.email).toBe(email);
		});
	});

	// ─── login ────────────────────────────────────────────────────────────────

	describe('login', () => {
		it('throws UNAUTHORIZED when credentials are wrong', async () => {
			supabaseMock.admin.auth.signInWithPassword.mockImplementation(() =>
				Promise.resolve({ data: null, error: { message: 'Invalid credentials' } })
			);

			await expect(service.login({ email, password })).rejects.toMatchObject({
				code: 'UNAUTHORIZED',
			});
		});

		it('throws NOT_FOUND when user profile row is missing', async () => {
			dbService.db = { select: jest.fn(() => chain([])) };

			await expect(service.login({ email, password })).rejects.toMatchObject({
				code: 'NOT_FOUND',
			});
		});

		it('returns a session on successful login', async () => {
			dbService.db = { select: jest.fn(() => chain([{ fullName }])) };

			const result = await service.login({ email, password });

			expect(result.accessToken).toBe(mockSession.access_token);
			expect(result.user.fullName).toBe(fullName);
		});
	});

	// ─── logout ───────────────────────────────────────────────────────────────

	describe('logout', () => {
		it('throws INTERNAL_SERVER_ERROR when Supabase signOut fails', async () => {
			supabaseMock.admin.auth.admin.signOut.mockImplementation(() =>
				Promise.resolve({ error: { message: 'sign out failed' } })
			);

			await expect(service.logout('some-jwt')).rejects.toMatchObject({
				code: 'INTERNAL_SERVER_ERROR',
			});
		});

		it('returns a success message on logout', async () => {
			const result = await service.logout('some-jwt');

			expect(result.message).toBe('Logged out successfully');
		});
	});
});

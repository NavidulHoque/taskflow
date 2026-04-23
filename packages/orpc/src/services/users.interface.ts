import type { UpdateUserInput, UserOutput } from '@taskflow/validation';

export interface IUsersService {
	me(userId: string): Promise<UserOutput>;
	updateMe(userId: string, input: UpdateUserInput): Promise<{ message: string }>;
	deleteAccount(userId: string): Promise<{ message: string }>;
}

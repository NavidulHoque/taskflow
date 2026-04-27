import type { ChangePasswordInput, MessageOutput, UpdateUserInput, UserOutput } from '@taskflow/validation';

export interface IUsersService {
	me(userId: string): Promise<UserOutput>;
	updateMe(userId: string, input: UpdateUserInput): Promise<MessageOutput>;
	deleteAccount(userId: string): Promise<MessageOutput>;
	changePassword(userId: string, token: string, input: ChangePasswordInput): Promise<MessageOutput>;
}

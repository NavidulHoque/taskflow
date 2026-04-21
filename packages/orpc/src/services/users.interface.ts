import type { UserOutput } from '@taskflow/validation';

export interface IUsersService {
	me(userId: string): Promise<UserOutput>;
}

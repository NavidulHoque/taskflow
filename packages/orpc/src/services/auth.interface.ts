import type { LoginInput, RefreshTokenInput, RegisterInput } from '@taskflow/validation';
import type { AuthSession } from '@taskflow/validation';

export interface IAuthService {
	register(input: RegisterInput): Promise<AuthSession>;
	login(input: LoginInput): Promise<AuthSession>;
	logout(token: string): Promise<{ message: string }>;
	refreshToken(input: RefreshTokenInput): Promise<AuthSession>;
}

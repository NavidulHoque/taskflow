import type {
	ChangePasswordInput,
	ExchangeOAuthSessionInput,
	ForgotPasswordInput,
	GetOAuthUrlInput,
	LoginInput,
	RefreshTokenInput,
	RegisterInput,
	ResetPasswordInput,
} from '@taskflow/validation';
import type { AuthSession } from '@taskflow/validation';

export interface IAuthService {
	register(input: RegisterInput): Promise<AuthSession>;
	login(input: LoginInput): Promise<AuthSession>;
	logout(token: string): Promise<{ message: string }>;
	refreshToken(input: RefreshTokenInput): Promise<AuthSession>;
	forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }>;
	resetPassword(userId: string, input: ResetPasswordInput): Promise<{ message: string }>;
	changePassword(userId: string, token: string, input: ChangePasswordInput): Promise<{ message: string }>;
	getOAuthUrl(input: GetOAuthUrlInput): { url: string };
	exchangeOAuthSession(input: ExchangeOAuthSessionInput): Promise<AuthSession>;
}

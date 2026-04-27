import type {
	ExchangeOAuthSessionInput,
	ForgotPasswordInput,
	GetOAuthUrlInput,
	LoginInput,
	MessageOutput,
	RefreshTokenInput,
	RegisterInput,
	ResendConfirmationInput,
	ResetPasswordInput,
} from '@taskflow/validation';
import type { AuthSession } from '@taskflow/validation';

export interface IAuthService {
	register(input: RegisterInput): Promise<MessageOutput>;
	login(input: LoginInput): Promise<AuthSession>;
	logout(token: string): Promise<MessageOutput>;
	refreshToken(input: RefreshTokenInput): Promise<AuthSession>;
	forgotPassword(input: ForgotPasswordInput): Promise<MessageOutput>;
	resetPassword(userId: string, input: ResetPasswordInput): Promise<MessageOutput>;
	resendConfirmation(input: ResendConfirmationInput): Promise<MessageOutput>;
	getOAuthUrl(input: GetOAuthUrlInput): { url: string };
	exchangeOAuthSession(input: ExchangeOAuthSessionInput): Promise<AuthSession>;
}

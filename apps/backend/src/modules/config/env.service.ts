import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Env } from '@backend/modules/config/env.schema';

@Injectable()
export class EnvService {
	constructor(private readonly config: ConfigService<Env, true>) {}

	get<T extends keyof Env>(key: T): Env[T] {
		return this.config.get(key, { infer: true });
	}

	get port(): number {
		return this.get('PORT');
	}

	get nodeEnv(): string {
		return this.get('NODE_ENV');
	}

	get isDevelopment(): boolean {
		return this.nodeEnv === 'development';
	}

	get isProduction(): boolean {
		return this.nodeEnv === 'production';
	}

	get supabaseUrl(): string {
		return this.get('SUPABASE_URL');
	}

	get supabasePublishableKey(): string {
		return this.get('SUPABASE_PUBLISHABLE_KEY');
	}

	get supabaseSecretKey(): string {
		return this.get('SUPABASE_SECRET_KEY');
	}

	get databaseUrl(): string {
		return this.get('DATABASE_URL');
	}

	get corsOrigin(): string | undefined {
		return this.get('CORS_ORIGIN');
	}
}

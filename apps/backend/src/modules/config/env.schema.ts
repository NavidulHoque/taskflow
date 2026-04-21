import { z } from 'zod';

export const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.coerce.number().default(3000),
	SUPABASE_URL: z.url(),
	SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
	SUPABASE_SECRET_KEY: z.string().min(1),
	DATABASE_URL: z.string().min(1),
	// CORS — comma-separated allowed origins; defaults to * in dev, blocked in prod
	CORS_ORIGIN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

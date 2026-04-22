import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { OpenAPIHandler } from '@orpc/openapi/fastify';
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

import { appRouter } from '@taskflow/orpc';
import { version } from '../../../package.json';

import { AppModule } from '@backend/app.module';
import { EnvService } from '@backend/modules/config/env.service';
import { buildFastifyAdapter } from '@backend/modules/config/fastify.adapter';
import { OrpcService } from '@backend/orpc/orpc.service';

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(AppModule, buildFastifyAdapter());
	const fastify = app.getHttpAdapter().getInstance() as unknown as FastifyInstance;

	// oRPC needs to handle body parsing itself for all content types.
	// NOTE: This wildcard parser overrides Fastify's built-in JSON parser for all routes.
	// All API traffic is routed through /api/* and handled by oRPC, which does its own parsing.
	fastify.addContentTypeParser('*', (_request, _payload, done) => done(null, undefined));

	// Security headers — CSP is disabled to allow the oRPC docs UI to load its assets
	await fastify.register(fastifyHelmet, { contentSecurityPolicy: false });

	// Rate limiting — 100 requests per IP per minute across all routes
	await fastify.register(fastifyRateLimit, {
		max: 100,
		timeWindow: '1 minute',
		errorResponseBuilder: (_req, context) => ({
			message: `Rate limit exceeded — retry after ${context.after}`,
		}),
	});

	// Initialise the app so DI is ready before registering the route handler
	await app.init();
	const orpcService = app.get(OrpcService);

	const openApiHandler = new OpenAPIHandler(appRouter, {
		plugins: [
			new OpenAPIReferencePlugin({
				docsPath: '/docs',
				specPath: '/spec.json',
				schemaConverters: [new ZodToJsonSchemaConverter()],
				specGenerateOptions: {
					info: {
						title: 'TaskFlow Lite API',
						version,
					},
					servers: [{ url: '/api' }],
					security: [{ bearerAuth: [] }],
					components: {
						securitySchemes: {
							bearerAuth: { type: 'http', scheme: 'bearer' },
						},
					},
				},
			}),
		],
	});

	// All API routes — serves REST endpoints, /api/docs, and /api/spec.json
	fastify.all('/api/*', async (req, reply) => {
		try {
			const { matched } = await openApiHandler.handle(req, reply, {
				prefix: '/api',
				context: await orpcService.createContext(req),
			});

			if (!matched) reply.status(404).send({ message: 'Not found' });
		} catch {
			reply.status(500).send({ message: 'Internal server error' });
		}
	});

	// Restrict CORS: use CORS_ORIGIN env var if set, allow * in dev, block all in prod
	const corsOrigin = process.env.CORS_ORIGIN ?? (process.env.NODE_ENV !== 'production' ? '*' : false);
	app.enableCors({ origin: corsOrigin });
	app.enableShutdownHooks();

	const envService = app.get(EnvService);
	await app.listen(envService.port, '0.0.0.0');
}

bootstrap();

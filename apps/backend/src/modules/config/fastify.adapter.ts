import { FastifyAdapter } from '@nestjs/platform-fastify';

export function buildFastifyAdapter(): FastifyAdapter {
	const isDev = process.env.NODE_ENV !== 'production';

	return new FastifyAdapter({
		logger: {
			transport: isDev
				? { target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname' } }
				: undefined,
		},
	});
}

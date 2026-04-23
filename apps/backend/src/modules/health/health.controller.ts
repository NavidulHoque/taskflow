import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
	@Get()
	check() {
		const uptimeSeconds = process.uptime();
		const days = Math.floor(uptimeSeconds / 86400);
		const hours = Math.floor((uptimeSeconds % 86400) / 3600);
		const minutes = Math.floor((uptimeSeconds % 3600) / 60);
		const seconds = Math.floor(uptimeSeconds % 60);

		const pad = (n: number) => String(n).padStart(2, '0');

		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
			uptime: `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
		};
	}
}

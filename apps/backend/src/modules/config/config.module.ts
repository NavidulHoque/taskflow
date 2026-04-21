import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { envSchema } from '@backend/modules/config/env.schema';
import { EnvService } from '@backend/modules/config/env.service';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validate: (config) => envSchema.parse(config),
		}),
	],
	providers: [EnvService],
	exports: [EnvService],
})
export class AppConfigModule {}

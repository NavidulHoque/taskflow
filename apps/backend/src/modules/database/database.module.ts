import { Module } from '@nestjs/common';

import { AppConfigModule } from '@backend/modules/config/config.module';
import { DatabaseService } from '@backend/modules/database/database.service';

@Module({
	imports: [AppConfigModule],
	providers: [DatabaseService],
	exports: [DatabaseService],
})
export class DatabaseModule {}

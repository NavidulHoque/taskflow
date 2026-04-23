import { Module } from '@nestjs/common';

import { AppConfigModule } from '@backend/modules/config/config.module';
import { DatabaseModule } from '@backend/modules/database/database.module';
import { HealthModule } from '@backend/modules/health/health.module';
import { SupabaseModule } from '@backend/modules/supabase/supabase.module';
import { OrpcModule } from '@backend/orpc/orpc.module';

@Module({
	imports: [AppConfigModule, SupabaseModule, DatabaseModule, OrpcModule, HealthModule],
})
export class AppModule {}

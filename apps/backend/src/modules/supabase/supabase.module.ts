import { Module } from '@nestjs/common';

import { AppConfigModule } from '@backend/modules/config/config.module';
import { SupabaseService } from '@backend/modules/supabase/supabase.service';

@Module({
	imports: [AppConfigModule],
	providers: [SupabaseService],
	exports: [SupabaseService],
})
export class SupabaseModule {}

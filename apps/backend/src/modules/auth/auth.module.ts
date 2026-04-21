import { Module } from '@nestjs/common';

import { AppConfigModule } from '@backend/modules/config/config.module';
import { DatabaseModule } from '@backend/modules/database/database.module';
import { SupabaseModule } from '@backend/modules/supabase/supabase.module';
import { AuthService } from '@backend/modules/auth/auth.service';

@Module({
	imports: [AppConfigModule, SupabaseModule, DatabaseModule],
	providers: [AuthService],
	exports: [AuthService],
})
export class AuthModule {}

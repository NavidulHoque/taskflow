import { Module } from '@nestjs/common';

import { AppConfigModule } from '@backend/modules/config/config.module';
import { DatabaseModule } from '@backend/modules/database/database.module';
import { SupabaseModule } from '@backend/modules/supabase/supabase.module';
import { UsersService } from '@backend/modules/users/users.service';

@Module({
	imports: [AppConfigModule, DatabaseModule, SupabaseModule],
	providers: [UsersService],
	exports: [UsersService],
})
export class UsersModule {}

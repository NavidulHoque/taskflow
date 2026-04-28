import { Module } from '@nestjs/common';

import { DatabaseModule } from '@backend/modules/database/database.module';
import { SupabaseModule } from '@backend/modules/supabase/supabase.module';

import { StorageService } from './storage.service';

@Module({
	imports: [DatabaseModule, SupabaseModule],
	providers: [StorageService],
	exports: [StorageService],
})
export class StorageModule {}

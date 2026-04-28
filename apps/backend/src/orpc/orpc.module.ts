import { Module } from '@nestjs/common';

import { AuthModule } from '@backend/modules/auth/auth.module';
import { DatabaseModule } from '@backend/modules/database/database.module';
import { ProjectsModule } from '@backend/modules/projects/projects.module';
import { StorageModule } from '@backend/modules/storage/storage.module';
import { SupabaseModule } from '@backend/modules/supabase/supabase.module';
import { TasksModule } from '@backend/modules/tasks/tasks.module';
import { UsersModule } from '@backend/modules/users/users.module';
import { OrpcService } from '@backend/orpc/orpc.service';

@Module({
	imports: [SupabaseModule, DatabaseModule, AuthModule, UsersModule, ProjectsModule, TasksModule, StorageModule],
	providers: [OrpcService],
	exports: [OrpcService],
})
export class OrpcModule {}

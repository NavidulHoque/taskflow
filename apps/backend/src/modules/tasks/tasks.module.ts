import { Module } from '@nestjs/common';

import { DatabaseModule } from '@backend/modules/database/database.module';
import { TasksService } from '@backend/modules/tasks/tasks.service';

@Module({
	imports: [DatabaseModule],
	providers: [TasksService],
	exports: [TasksService],
})
export class TasksModule {}

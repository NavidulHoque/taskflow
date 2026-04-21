import { Module } from '@nestjs/common';

import { DatabaseModule } from '@backend/modules/database/database.module';
import { ProjectsService } from '@backend/modules/projects/projects.service';

@Module({
	imports: [DatabaseModule],
	providers: [ProjectsService],
	exports: [ProjectsService],
})
export class ProjectsModule {}

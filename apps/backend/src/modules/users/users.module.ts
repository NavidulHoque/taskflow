import { Module } from '@nestjs/common';

import { DatabaseModule } from '@backend/modules/database/database.module';
import { UsersService } from '@backend/modules/users/users.service';

@Module({
	imports: [DatabaseModule],
	providers: [UsersService],
	exports: [UsersService],
})
export class UsersModule {}

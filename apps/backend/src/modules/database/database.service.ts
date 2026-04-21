import { Injectable, OnModuleDestroy } from '@nestjs/common';

import { type Database, type DatabaseSql, createDatabase } from '@taskflow/database';

import { EnvService } from '@backend/modules/config/env.service';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
	readonly db: Database;
	private readonly sql: DatabaseSql;

	constructor(private readonly env: EnvService) {
		const { db, sql } = createDatabase(this.env.databaseUrl);
		this.db = db;
		this.sql = sql;
	}

	async onModuleDestroy(): Promise<void> {
		await this.sql.end();
	}
}

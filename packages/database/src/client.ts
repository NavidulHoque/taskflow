import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

export const createDatabase = (connectionString: string) => {
	const sql = postgres(connectionString, { max: 20 });
	const db = drizzle(sql, { schema });
	return { db, sql };
};

export type Database = ReturnType<typeof createDatabase>['db'];
export type DatabaseSql = ReturnType<typeof createDatabase>['sql'];

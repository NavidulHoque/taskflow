import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import postgres from 'postgres';

async function main() {
	const DATABASE_URL = process.env.DATABASE_URL;

	if (!DATABASE_URL) {
		console.error('DATABASE_URL is not set');
		process.exit(1);
	}

	const sql = postgres(DATABASE_URL, { onnotice: () => {} });

	// ── drop all public tables (order respects FK dependencies) ─────────────
	console.log('Dropping all tables...\n');

	await sql.unsafe(`
		drop table if exists "tasks" cascade;
		drop table if exists "projects" cascade;
		drop table if exists "users" cascade;
	`);

	// ── drop custom enums ────────────────────────────────────────────────────
	await sql.unsafe(`
		drop type if exists "task_status" cascade;
		drop type if exists "task_priority" cascade;
	`);

	// ── drop migration tracking schema ───────────────────────────────────────
	await sql`drop schema if exists drizzle cascade`;

	console.log('All tables dropped.\n');

	// ── recreate tracking table ──────────────────────────────────────────────
	await sql`create schema if not exists drizzle`;
	await sql`
		create table drizzle.__drizzle_migrations (
			id serial primary key,
			hash text not null,
			created_at bigint,
			name text
		)
	`;

	// ── apply all migrations ─────────────────────────────────────────────────
	const migrationsDir = join(process.cwd(), 'drizzle');

	const migrationFiles = readdirSync(migrationsDir)
		.filter((f) => f.endsWith('.sql'))
		.sort()
		.map((file) => {
			const content = readFileSync(join(migrationsDir, file), 'utf-8');
			const hash = createHash('sha256').update(content).digest('hex');
			return { file: file.replace('.sql', ''), content, hash };
		});

	console.log('Applying migrations:\n');

	for (const { file, content, hash } of migrationFiles) {
		process.stdout.write(`  👉  ${file}  `);
		await sql.begin(async (tx) => {
			await tx.unsafe(content);
			await tx`
				insert into drizzle.__drizzle_migrations (hash, created_at, name)
				values (${hash}, ${Date.now()}, ${file})
			`;
		});
		console.log('✅');
	}

	console.log('\nDatabase reset complete.');

	await sql.end();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

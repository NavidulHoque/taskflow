import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import Table from 'cli-table3';
import postgres from 'postgres';

async function main() {
	const DATABASE_URL = process.env.DATABASE_URL;

	if (!DATABASE_URL) {
		console.error('DATABASE_URL is not set');
		process.exit(1);
	}

	const sql = postgres(DATABASE_URL);

	const migrationsDir = join(process.cwd(), 'drizzle');

	const migrationFiles = readdirSync(migrationsDir)
		.filter((f) => f.endsWith('.sql'))
		.sort()
		.map((file) => {
			const content = readFileSync(join(migrationsDir, file), 'utf-8');
			const hash = createHash('sha256').update(content).digest('hex');
			return { file: file.replace('.sql', ''), hash };
		});

	const appliedRows = await sql<{ hash: string; name: string | null }[]>`
		select hash, name from drizzle.__drizzle_migrations order by created_at asc
	`.catch(() => [] as { hash: string; name: string | null }[]);

	const appliedHashes = new Set(appliedRows.map((r) => r.hash));

	const migrationColWidth = Math.max(...migrationFiles.map(({ file }) => file.length));

	const table = new Table({
		head: ['#', 'Migration', 'Status'],
		colAligns: ['center', 'left', 'center'],
		colWidths: [4, migrationColWidth + 2, 8],
	});

	for (const [i, { file, hash }] of migrationFiles.entries()) {
		const applied = appliedHashes.has(hash);
		table.push([i + 1, file, applied ? '✅' : '❌']);
	}

	console.log('\n' + table.toString() + '\n');

	await sql.end();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

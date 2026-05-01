import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users';
import { tasks } from './tasks';

export const uploads = pgTable(
	'uploads',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		uploadedBy: uuid('uploaded_by')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
		bucket: text('bucket').notNull(),
		filePath: text('file_path').notNull(),
		mimeType: text('mime_type').notNull(),
		fileSize: integer('file_size'),
		// values: pending | confirmed | orphaned
		status: text('status').notNull().default('pending'),
		confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index('uploads_uploaded_by_idx').on(table.uploadedBy),
		index('uploads_task_id_idx').on(table.taskId),
	]
);

export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;

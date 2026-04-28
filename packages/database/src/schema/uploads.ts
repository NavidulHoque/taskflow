import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users';

export const uploads = pgTable(
	'uploads',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		uploadedBy: uuid('uploaded_by')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		bucket: text('bucket').notNull(),
		filePath: text('file_path').notNull(),
		mimeType: text('mime_type').notNull(),
		fileSize: integer('file_size'),
		// values: pending | confirmed | orphaned
		status: text('status').notNull().default('pending'),
		confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index('uploads_uploaded_by_idx').on(table.uploadedBy)]
);

export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;

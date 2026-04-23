import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { projects } from './projects';

export const tasks = pgTable('tasks', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	description: text('description'),
	status: text('status').notNull().default('todo'),
	priority: text('priority').notNull().default('medium'),
	dueDate: timestamp('due_date', { withTimezone: true }),
	completedAt: timestamp('completed_at', { withTimezone: true }),
	projectId: uuid('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdateFn(() => new Date()),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

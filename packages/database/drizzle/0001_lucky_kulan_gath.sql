ALTER TABLE "uploads" ADD COLUMN "task_id" uuid;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "uploads_task_id_idx" ON "uploads" USING btree ("task_id");
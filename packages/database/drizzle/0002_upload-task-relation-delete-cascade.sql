ALTER TABLE "uploads" DROP CONSTRAINT "uploads_task_id_tasks_id_fk";
--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
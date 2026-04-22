-- Add task_priority enum
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');

-- Add priority and due_date columns to tasks
ALTER TABLE "tasks"
  ADD COLUMN "priority" "task_priority" NOT NULL DEFAULT 'medium',
  ADD COLUMN "due_date" timestamp with time zone;

-- Add completed_at to tasks (auto-set when status becomes done)
ALTER TABLE "tasks"
  ADD COLUMN "completed_at" timestamp with time zone;

-- Add archived_at to projects (soft-archive instead of hard delete)
ALTER TABLE "projects"
  ADD COLUMN "archived_at" timestamp with time zone;

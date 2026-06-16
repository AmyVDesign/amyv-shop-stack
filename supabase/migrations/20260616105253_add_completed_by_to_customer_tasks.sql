-- Add completed_by to customer_tasks so the audit log captures who marked each task done.
-- Backfill existing done rows from created_by so historical tasks are not blank.

ALTER TABLE customer_tasks ADD COLUMN IF NOT EXISTS completed_by text;

COMMENT ON COLUMN customer_tasks.completed_by IS 'Email of the user who marked the task done.';

UPDATE customer_tasks
SET completed_by = created_by
WHERE status = 'done'
  AND created_by IS NOT NULL
  AND completed_by IS NULL;

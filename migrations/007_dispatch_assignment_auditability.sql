ALTER TABLE dispatch_assignments
    ADD COLUMN IF NOT EXISTS assigned_by_user_id uuid REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS reassigned_by_user_id uuid REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS reassigned_at timestamptz;

UPDATE dispatch_assignments
SET assigned_by_user_id = coalesce(assigned_by_user_id, created_by)
WHERE assigned_by_user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_assigned_by_user_id
    ON dispatch_assignments(assigned_by_user_id)
    WHERE assigned_by_user_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_reassigned_by_user_id
    ON dispatch_assignments(reassigned_by_user_id)
    WHERE reassigned_by_user_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_reassigned_at
    ON dispatch_assignments(reassigned_at DESC)
    WHERE reassigned_at IS NOT NULL AND deleted_at IS NULL;

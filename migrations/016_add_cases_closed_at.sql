ALTER TABLE cases
ADD COLUMN closed_at timestamptz;

CREATE INDEX idx_cases_closed_at
    ON cases(closed_at DESC)
    WHERE closed_at IS NOT NULL AND deleted_at IS NULL;

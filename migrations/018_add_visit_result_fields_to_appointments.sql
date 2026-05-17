ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS visit_sequence integer,
    ADD COLUMN IF NOT EXISTS visit_result text,
    ADD COLUMN IF NOT EXISTS incomplete_reason text,
    ADD COLUMN IF NOT EXISTS next_action text,
    ADD COLUMN IF NOT EXISTS actual_arrival_at timestamptz,
    ADD COLUMN IF NOT EXISTS actual_finished_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_appointments_case_visit_sequence
    ON appointments(case_id, visit_sequence)
    WHERE deleted_at IS NULL
      AND visit_sequence IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_visit_result
    ON appointments(visit_result)
    WHERE deleted_at IS NULL
      AND visit_result IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_next_action
    ON appointments(next_action)
    WHERE deleted_at IS NULL
      AND next_action IS NOT NULL;

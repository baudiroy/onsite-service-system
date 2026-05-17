ALTER TABLE field_service_reports
    ADD COLUMN IF NOT EXISTS final_appointment_id uuid REFERENCES appointments(id);

CREATE INDEX IF NOT EXISTS idx_field_service_reports_final_appointment_id
    ON field_service_reports(final_appointment_id)
    WHERE final_appointment_id IS NOT NULL
      AND deleted_at IS NULL;

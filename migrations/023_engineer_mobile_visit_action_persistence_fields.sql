-- MIGRATION DRAFT ONLY FOR TASK1838.
-- THIS FILE IS NOT APPLIED IN TASK1838.
-- NO DB EXECUTION IS AUTHORIZED BY TASK1838.
-- NO PSQL IS AUTHORIZED BY TASK1838.
-- NO npm run db:migrate IS AUTHORIZED BY TASK1838.
-- NO SQL DRY-RUN IS AUTHORIZED BY TASK1838.
-- APPLY OR DRY-RUN REQUIRES A SEPARATE EXPLICIT DISPOSABLE DB APPROVAL TASK.
-- ENGINEER MOBILE VISIT ACTION PERSISTENCE FIELDS ONLY.
-- THIS DRAFT DOES NOT CREATE OR MODIFY FIELD SERVICE REPORTS.
-- THIS DRAFT DOES NOT CREATE COMPLETION REPORTS OR CUSTOMER-VISIBLE PUBLICATION DATA.
-- THIS DRAFT DOES NOT MUTATE THE SYSTEM-OWNED FINAL APPOINTMENT SELECTION.

-- Allowed mobile_visit_status values:
-- traveling, arrived, working, work_finished, visit_result_recorded.
-- Allowed visit_result values:
-- resolved, follow_up_required, parts_required, cannot_repair,
-- customer_unavailable, cancelled_on_site.
-- Existing schema note:
-- appointments already carries case relationship and scheduling fields.
-- This draft avoids adding generic identity or assignment columns that may
-- belong to existing dispatch, organization-scope, or assignment conventions.

ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS mobile_visit_status text,
    ADD COLUMN IF NOT EXISTS visit_result text,
    ADD COLUMN IF NOT EXISTS mobile_visit_status_updated_at timestamptz,
    ADD COLUMN IF NOT EXISTS mobile_visit_status_updated_by uuid REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS work_started_at timestamptz,
    ADD COLUMN IF NOT EXISTS work_finished_at timestamptz,
    ADD COLUMN IF NOT EXISTS arrived_at timestamptz,
    ADD COLUMN IF NOT EXISTS travel_started_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_appointments_mobile_visit_status
    ON appointments(mobile_visit_status)
    WHERE deleted_at IS NULL
      AND mobile_visit_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_case_mobile_visit_status
    ON appointments(case_id, mobile_visit_status)
    WHERE deleted_at IS NULL
      AND mobile_visit_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_mobile_visit_status_updated_at
    ON appointments(mobile_visit_status_updated_at DESC)
    WHERE deleted_at IS NULL
      AND mobile_visit_status_updated_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_engineer_mobile_visit_action_entity
    ON audit_logs(entity_type, entity_id, action, created_at DESC)
    WHERE entity_type = 'appointment'
      AND action LIKE 'engineer_mobile.%';

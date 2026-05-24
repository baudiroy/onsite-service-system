-- MIGRATION FILE AUTHORING ONLY.
-- NOT APPLIED IN TASK 877.
-- APPLY OR DRY-RUN REQUIRES A SEPARATE TASK.
-- DO NOT RUN AGAINST SHARED RUNTIME WITHOUT EXPLICIT APPLY TASK.
-- DO NOT RUN AGAINST PRODUCTION OR STAGING WITHOUT EXPLICIT APPLY TASK.
-- FUTURE DRY-RUN OR APPLY REQUIRES EXPLICIT DISPOSABLE DB AUTHORIZATION.
-- NO DB CONNECTION, PSQL, OR SQL EXECUTION IS AUTHORIZED BY THIS FILE.
-- DATA CORRECTION DECISION AUDIT EVENT METADATA ONLY.
-- TABLE IS INTENDED TO BE INERT UNTIL A FUTURE RUNTIME TASK.
-- ROLLBACK PLAN (DOCUMENTATION ONLY; DO NOT EXECUTE FROM THIS DRAFT):
-- 1. Only create an executable rollback migration after a separately approved rollback task.
-- 2. Confirm no deployed runtime depends on data_correction_decision_audit_events.
-- 3. In that future approved rollback migration, remove dependent indexes before the table.
-- 4. Future rollback target: data_correction_decision_audit_events.
-- 5. Future rollback must not mutate cases, customers, appointments,
--    field_service_reports, service parts, repair intake data, or provider configuration.
-- 6. This authoring draft intentionally contains no active DROP, TRUNCATE, DELETE, or ALTER
--    statements outside comments.

CREATE TABLE IF NOT EXISTS data_correction_decision_audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    case_id uuid,
    appointment_id uuid,
    actor_id uuid,
    actor_role text,
    action text NOT NULL,
    field_key text,
    field_group text,
    event_type text NOT NULL,
    decision text NOT NULL,
    reason_code text,
    safe_message_key text,
    result_status text NOT NULL,
    request_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    retention_until timestamptz,
    deleted_at timestamptz,

    CONSTRAINT dc_decision_audit_events_action_not_blank_check CHECK (
        length(trim(action)) > 0
    ),
    CONSTRAINT dc_decision_audit_events_event_type_not_blank_check CHECK (
        length(trim(event_type)) > 0
    ),
    CONSTRAINT dc_decision_audit_events_decision_not_blank_check CHECK (
        length(trim(decision)) > 0
    ),
    CONSTRAINT dc_decision_audit_events_result_status_not_blank_check CHECK (
        length(trim(result_status)) > 0
    )
);

CREATE INDEX IF NOT EXISTS idx_dc_decision_audit_events_org_created
    ON data_correction_decision_audit_events(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dc_decision_audit_events_org_case_created
    ON data_correction_decision_audit_events(organization_id, case_id, created_at DESC)
    WHERE case_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dc_decision_audit_events_org_actor_created
    ON data_correction_decision_audit_events(organization_id, actor_id, created_at DESC)
    WHERE actor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dc_decision_audit_events_org_event_created
    ON data_correction_decision_audit_events(organization_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dc_decision_audit_events_org_request
    ON data_correction_decision_audit_events(organization_id, request_id)
    WHERE request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dc_decision_audit_events_org_retention
    ON data_correction_decision_audit_events(organization_id, retention_until)
    WHERE retention_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dc_decision_audit_events_org_deleted
    ON data_correction_decision_audit_events(organization_id, deleted_at)
    WHERE deleted_at IS NOT NULL;

-- MIGRATION FILE AUTHORING ONLY.
-- NOT APPLIED IN TASK 682.
-- APPLY OR DRY-RUN REQUIRES A SEPARATE TASK.
-- DO NOT RUN AGAINST SHARED RUNTIME WITHOUT EXPLICIT APPLY TASK.
-- NO DB CONNECTION, PSQL, OR SQL EXECUTION IS AUTHORIZED BY THIS FILE.
-- NO RAW PHONE/ADDRESS/LINE/FINAL APPOINTMENT VALUES ARE STORED BY THIS DRAFT.
-- TABLES ARE INTENDED TO BE INERT UNTIL A FUTURE RUNTIME TASK.

CREATE TABLE IF NOT EXISTS data_correction_audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    case_id uuid NOT NULL,
    appointment_id uuid,
    actor_user_id uuid,
    actor_role text,
    action_type text,
    decision text,
    reason_code text,
    safe_message_key text,
    record_type text,
    safe_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    occurred_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dc_audit_events_org_case_created
    ON data_correction_audit_events(organization_id, case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dc_audit_events_org_appointment
    ON data_correction_audit_events(organization_id, appointment_id)
    WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dc_audit_events_org_action_created
    ON data_correction_audit_events(organization_id, action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dc_audit_events_org_created
    ON data_correction_audit_events(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS data_correction_contact_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    case_id uuid NOT NULL,
    appointment_id uuid,
    actor_user_id uuid,
    actor_role text,
    action_type text,
    decision text,
    reason_code text,
    safe_message_key text,
    record_type text,
    safe_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    occurred_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dc_contact_logs_org_case_created
    ON data_correction_contact_logs(organization_id, case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dc_contact_logs_org_appointment
    ON data_correction_contact_logs(organization_id, appointment_id)
    WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dc_contact_logs_org_action_created
    ON data_correction_contact_logs(organization_id, action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dc_contact_logs_org_created
    ON data_correction_contact_logs(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS data_correction_dispatch_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    case_id uuid NOT NULL,
    appointment_id uuid,
    actor_user_id uuid,
    actor_role text,
    action_type text,
    decision text,
    reason_code text,
    safe_message_key text,
    record_type text,
    safe_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    occurred_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dc_dispatch_notes_org_case_created
    ON data_correction_dispatch_notes(organization_id, case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dc_dispatch_notes_org_appointment
    ON data_correction_dispatch_notes(organization_id, appointment_id)
    WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dc_dispatch_notes_org_action_created
    ON data_correction_dispatch_notes(organization_id, action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dc_dispatch_notes_org_created
    ON data_correction_dispatch_notes(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS data_correction_engineer_notification_intents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    case_id uuid NOT NULL,
    appointment_id uuid,
    actor_user_id uuid,
    actor_role text,
    action_type text,
    decision text,
    reason_code text,
    safe_message_key text,
    record_type text,
    safe_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    occurred_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dc_engineer_notification_intents_org_case_created
    ON data_correction_engineer_notification_intents(organization_id, case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dc_engineer_notification_intents_org_appointment
    ON data_correction_engineer_notification_intents(organization_id, appointment_id)
    WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dc_engineer_notification_intents_org_action_created
    ON data_correction_engineer_notification_intents(organization_id, action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dc_engineer_notification_intents_org_created
    ON data_correction_engineer_notification_intents(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS data_correction_appointment_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    case_id uuid NOT NULL,
    appointment_id uuid,
    actor_user_id uuid,
    actor_role text,
    action_type text,
    decision text,
    reason_code text,
    safe_message_key text,
    record_type text,
    safe_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    occurred_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dc_appointment_results_org_case_created
    ON data_correction_appointment_results(organization_id, case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dc_appointment_results_org_appointment
    ON data_correction_appointment_results(organization_id, appointment_id)
    WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dc_appointment_results_org_action_created
    ON data_correction_appointment_results(organization_id, action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dc_appointment_results_org_created
    ON data_correction_appointment_results(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS data_correction_evidence_refs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    case_id uuid NOT NULL,
    appointment_id uuid,
    actor_user_id uuid,
    actor_role text,
    action_type text,
    decision text,
    reason_code text,
    safe_message_key text,
    record_type text,
    safe_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    occurred_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dc_evidence_refs_org_case_created
    ON data_correction_evidence_refs(organization_id, case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dc_evidence_refs_org_appointment
    ON data_correction_evidence_refs(organization_id, appointment_id)
    WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dc_evidence_refs_org_action_created
    ON data_correction_evidence_refs(organization_id, action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dc_evidence_refs_org_created
    ON data_correction_evidence_refs(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS data_correction_follow_up_drafts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    case_id uuid NOT NULL,
    appointment_id uuid,
    actor_user_id uuid,
    actor_role text,
    action_type text,
    decision text,
    reason_code text,
    safe_message_key text,
    record_type text,
    safe_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    occurred_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dc_follow_up_drafts_org_case_created
    ON data_correction_follow_up_drafts(organization_id, case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dc_follow_up_drafts_org_appointment
    ON data_correction_follow_up_drafts(organization_id, appointment_id)
    WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dc_follow_up_drafts_org_action_created
    ON data_correction_follow_up_drafts(organization_id, action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dc_follow_up_drafts_org_created
    ON data_correction_follow_up_drafts(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS data_correction_application_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    case_id uuid NOT NULL,
    appointment_id uuid,
    actor_user_id uuid,
    actor_role text,
    action_type text,
    decision text,
    reason_code text,
    safe_message_key text,
    record_type text,
    safe_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    occurred_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dc_application_records_org_case_created
    ON data_correction_application_records(organization_id, case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dc_application_records_org_appointment
    ON data_correction_application_records(organization_id, appointment_id)
    WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dc_application_records_org_action_created
    ON data_correction_application_records(organization_id, action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dc_application_records_org_created
    ON data_correction_application_records(organization_id, created_at DESC);

-- ROLLBACK PLAN DOCUMENTATION ONLY.
-- THIS IS NOT AN EXECUTABLE DOWN MIGRATION.
-- DO NOT APPLY OR DRY-RUN WITHOUT A SEPARATE EXPLICIT DISPOSABLE DB TASK.
-- SHARED RUNTIME / PRODUCTION ROLLBACK IS NOT AUTHORIZED BY THIS DRAFT.
-- Manual rollback should be evaluated only on a disposable/test DB before production adoption.
-- Reverse dependency / reverse create order table review:
-- 1. data_correction_application_records
-- 2. data_correction_follow_up_drafts
-- 3. data_correction_evidence_refs
-- 4. data_correction_appointment_results
-- 5. data_correction_engineer_notification_intents
-- 6. data_correction_dispatch_notes
-- 7. data_correction_contact_logs
-- 8. data_correction_audit_events
-- This draft does not mutate Case / Appointment / Field Service Report / Customer tables.
-- This draft does not create Field Service Reports or store finalAppointmentId.
-- This draft does not store raw phone, raw address, raw LINE id, token, secret, or DB URL values.

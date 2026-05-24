-- MIGRATION FILE AUTHORING ONLY.
-- NOT APPLIED IN TASK 715.
-- APPLY OR DRY-RUN REQUIRES A SEPARATE TASK.
-- DO NOT RUN AGAINST SHARED RUNTIME WITHOUT EXPLICIT APPLY TASK.
-- DO NOT RUN AGAINST PRODUCTION OR STAGING WITHOUT EXPLICIT APPLY TASK.
-- FUTURE DRY-RUN OR APPLY REQUIRES EXPLICIT DISPOSABLE DB AUTHORIZATION.
-- NO DB CONNECTION, PSQL, OR SQL EXECUTION IS AUTHORIZED BY THIS FILE.
-- READ MODEL SUPPORT ONLY; IT DOES NOT MUTATE CASE, APPOINTMENT, OR FIELD SERVICE REPORT DATA.
-- TABLE IS INTENDED TO BE INERT UNTIL A FUTURE RUNTIME TASK.
-- ROLLBACK PLAN (DOCUMENTATION ONLY; DO NOT EXECUTE FROM THIS DRAFT):
-- 1. Only create an executable rollback migration after a separately approved rollback task.
-- 2. Confirm no deployed runtime depends on engineer_mobile_task_read_models.
-- 3. In that future approved rollback migration, remove dependent indexes before the table.
-- 4. Future rollback target: engineer_mobile_task_read_models.
-- 5. Future rollback must not mutate field_service_reports, appointments, cases, customers,
--    customer_channel_identities, or any customer channel binding data.
-- 6. This authoring draft intentionally contains no active DROP, TRUNCATE, DELETE, or ALTER
--    statements outside comments.

CREATE TABLE IF NOT EXISTS engineer_mobile_task_read_models (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    case_id uuid NOT NULL,
    appointment_id uuid NOT NULL,
    assigned_engineer_id uuid NOT NULL,
    scheduled_start timestamptz,
    scheduled_end timestamptz,
    status text NOT NULL,
    customer_name_masked text,
    customer_phone_masked text,
    address_summary text,
    product_summary text,
    issue_summary text,
    service_summary text,
    service_type text,
    site_note_safe text,
    checklist_summary jsonb NOT NULL DEFAULT '[]'::jsonb,
    evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT engineer_mobile_task_read_models_checklist_summary_array_check CHECK (
        jsonb_typeof(checklist_summary) = 'array'
    ),
    CONSTRAINT engineer_mobile_task_read_models_evidence_refs_array_check CHECK (
        jsonb_typeof(evidence_refs) = 'array'
    ),
    CONSTRAINT engineer_mobile_task_read_models_status_not_blank_check CHECK (
        length(trim(status)) > 0
    )
);

CREATE INDEX IF NOT EXISTS idx_em_task_read_models_org_engineer_scheduled_start
    ON engineer_mobile_task_read_models(organization_id, assigned_engineer_id, scheduled_start);

CREATE INDEX IF NOT EXISTS idx_em_task_read_models_org_engineer_appointment
    ON engineer_mobile_task_read_models(organization_id, assigned_engineer_id, appointment_id);

CREATE INDEX IF NOT EXISTS idx_em_task_read_models_org_case
    ON engineer_mobile_task_read_models(organization_id, case_id);

CREATE INDEX IF NOT EXISTS idx_em_task_read_models_org_appointment
    ON engineer_mobile_task_read_models(organization_id, appointment_id);

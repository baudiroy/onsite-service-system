-- MIGRATION FILE AUTHORING ONLY.
-- NOT APPLIED IN TASK 765.
-- APPLY OR DRY-RUN REQUIRES A SEPARATE TASK.
-- DO NOT RUN AGAINST SHARED RUNTIME WITHOUT EXPLICIT APPLY TASK.
-- DO NOT RUN AGAINST PRODUCTION OR STAGING WITHOUT EXPLICIT APPLY TASK.
-- FUTURE DRY-RUN OR APPLY REQUIRES EXPLICIT DISPOSABLE DB AUTHORIZATION.
-- NO DB CONNECTION, PSQL, OR SQL EXECUTION IS AUTHORIZED BY THIS FILE.
-- BRAND REFERRAL CONTACT EVENT METADATA ONLY.
-- TABLE IS INTENDED TO BE INERT UNTIL A FUTURE RUNTIME TASK.
-- ROLLBACK PLAN (DOCUMENTATION ONLY; DO NOT EXECUTE FROM THIS DRAFT):
-- 1. Only create an executable rollback migration after a separately approved rollback task.
-- 2. Confirm no deployed runtime depends on brand_referral_contact_events.
-- 3. In that future approved rollback migration, remove dependent indexes before the table.
-- 4. Future rollback target: brand_referral_contact_events.
-- 5. Future rollback must not mutate cases, customers, customer_channel_identities,
--    appointments, field_service_reports, repair intake data, or provider configuration.
-- 6. This authoring draft intentionally contains no active DROP, TRUNCATE, DELETE, or ALTER
--    statements outside comments.

CREATE TABLE IF NOT EXISTS brand_referral_contact_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    brand_id uuid,
    source_channel text,
    referral_source text,
    entry_context text,
    line_channel_id text,
    event_type text NOT NULL,
    reason_key text,
    result_status text NOT NULL,
    request_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    retention_until timestamptz,
    deleted_at timestamptz,

    CONSTRAINT brand_referral_contact_events_event_type_not_blank_check CHECK (
        length(trim(event_type)) > 0
    ),
    CONSTRAINT brand_referral_contact_events_result_status_not_blank_check CHECK (
        length(trim(result_status)) > 0
    )
);

CREATE INDEX IF NOT EXISTS idx_br_contact_events_org_created
    ON brand_referral_contact_events(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_br_contact_events_org_brand_created
    ON brand_referral_contact_events(organization_id, brand_id, created_at DESC)
    WHERE brand_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_br_contact_events_org_source_created
    ON brand_referral_contact_events(organization_id, source_channel, created_at DESC)
    WHERE source_channel IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_br_contact_events_org_request
    ON brand_referral_contact_events(organization_id, request_id)
    WHERE request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_br_contact_events_org_retention
    ON brand_referral_contact_events(organization_id, retention_until)
    WHERE retention_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_br_contact_events_org_deleted
    ON brand_referral_contact_events(organization_id, deleted_at)
    WHERE deleted_at IS NOT NULL;

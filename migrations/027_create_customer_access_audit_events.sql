-- MIGRATION FILE AUTHORING ONLY.
-- NOT APPLIED IN TASK 2130.
-- APPLY OR DRY-RUN REQUIRES A SEPARATE TASK.
-- DO NOT RUN AGAINST SHARED RUNTIME WITHOUT EXPLICIT APPLY TASK.
-- DO NOT RUN AGAINST PRODUCTION OR STAGING WITHOUT EXPLICIT APPLY TASK.
-- FUTURE DRY-RUN OR APPLY REQUIRES EXPLICIT DISPOSABLE DB AUTHORIZATION.
-- NO DB CONNECTION, PSQL, OR SQL EXECUTION IS AUTHORIZED BY THIS FILE.
-- CUSTOMER ACCESS AUDIT EVENT METADATA ONLY.
-- TABLE IS INTENDED TO BE INERT UNTIL A FUTURE RUNTIME TASK.
-- ROLLBACK PLAN (DOCUMENTATION ONLY; DO NOT EXECUTE FROM THIS DRAFT):
-- 1. Only create an executable rollback migration after a separately approved rollback task.
-- 2. Confirm no deployed runtime depends on customer_access_audit_events.
-- 3. In that future approved rollback migration, remove dependent indexes before the table.
-- 4. Future rollback target: customer_access_audit_events.
-- 5. Future rollback must not mutate customer access routes, cases, customers,
--    field_service_reports, service-report projection data, or provider configuration.
-- 6. This authoring draft intentionally contains no active DROP, TRUNCATE, DELETE, or ALTER
--    statements outside comments.

CREATE TABLE IF NOT EXISTS customer_access_audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    occurred_at timestamptz,
    request_id text,
    actor_type text,
    organization_id uuid,
    customer_id uuid,
    case_id uuid,
    report_id text,
    decision text NOT NULL,
    reason_code text,
    route text NOT NULL,
    method text NOT NULL,
    source text NOT NULL,
    metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT customer_access_audit_events_event_type_check CHECK (
        event_type IN (
            'customer_access.case_overview.allow',
            'customer_access.case_overview.deny',
            'customer_access.service_report.allow',
            'customer_access.service_report.deny',
            'customer_access.route_registration.success',
            'customer_access.route_registration.failure'
        )
    ),
    CONSTRAINT customer_access_audit_events_decision_check CHECK (
        decision IN ('allow', 'deny', 'success', 'failure')
    ),
    CONSTRAINT customer_access_audit_events_reason_code_check CHECK (
        reason_code IS NULL
        OR reason_code IN (
            'customerAccess.unavailable',
            'invalid_input',
            'invalid_context',
            'invalid_identifier',
            'access_denied',
            'not_found',
            'service_unavailable',
            'mount_target_invalid',
            'db_client_invalid',
            'route_registration_failed'
        )
    ),
    CONSTRAINT customer_access_audit_events_method_check CHECK (
        method = 'GET'
    ),
    CONSTRAINT customer_access_audit_events_route_not_blank_check CHECK (
        length(trim(route)) > 0
    ),
    CONSTRAINT customer_access_audit_events_source_not_blank_check CHECK (
        length(trim(source)) > 0
    ),
    CONSTRAINT customer_access_audit_events_metadata_object_check CHECK (
        jsonb_typeof(metadata_json) = 'object'
    )
);

CREATE INDEX IF NOT EXISTS idx_customer_access_audit_events_org_created
    ON customer_access_audit_events(organization_id, created_at DESC)
    WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_access_audit_events_org_case_created
    ON customer_access_audit_events(organization_id, case_id, created_at DESC)
    WHERE organization_id IS NOT NULL
      AND case_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_access_audit_events_org_report_created
    ON customer_access_audit_events(organization_id, report_id, created_at DESC)
    WHERE organization_id IS NOT NULL
      AND report_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_access_audit_events_event_created
    ON customer_access_audit_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_access_audit_events_org_request
    ON customer_access_audit_events(organization_id, request_id)
    WHERE organization_id IS NOT NULL
      AND request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_access_audit_events_created
    ON customer_access_audit_events(created_at DESC);

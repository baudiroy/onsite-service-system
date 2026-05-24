-- MIGRATION FILE AUTHORING ONLY.
-- NOT APPLIED IN TASK 1157.
-- APPLY OR DRY-RUN REQUIRES A SEPARATE TASK.
-- DO NOT RUN AGAINST SHARED RUNTIME WITHOUT EXPLICIT APPLY TASK.
-- DO NOT RUN AGAINST PRODUCTION OR STAGING WITHOUT EXPLICIT APPLY TASK.
-- FUTURE DRY-RUN OR APPLY REQUIRES EXPLICIT DISPOSABLE DB AUTHORIZATION.
-- NO DB CONNECTION OR EXECUTION IS AUTHORIZED BY THIS FILE.
-- REPAIR INTAKE PERSISTENCE PROPOSAL ONLY.
-- TABLES ARE INTENDED TO BE INERT UNTIL A FUTURE RUNTIME TASK.

CREATE TABLE IF NOT EXISTS repair_intake_drafts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    tenant_id uuid,
    draft_status text NOT NULL DEFAULT 'received',
    source text NOT NULL,
    source_ref text,
    intake_source text,
    import_batch_id uuid,
    reporter_context_ref text,
    customer_ref uuid,
    contact_channel_ref text,
    safe_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
    safe_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    validation_status text NOT NULL DEFAULT 'pending',
    validation_errors_safe jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    validated_at timestamptz,
    converted_at timestamptz,
    rejected_at timestamptz,
    expired_at timestamptz,

    CONSTRAINT repair_intake_drafts_status_check CHECK (
        draft_status IN (
            'received',
            'validated',
            'needs_review',
            'ready_for_conversion',
            'converted',
            'rejected',
            'expired'
        )
    ),
    CONSTRAINT repair_intake_drafts_source_not_blank_check CHECK (
        length(trim(source)) > 0
    ),
    CONSTRAINT repair_intake_drafts_safe_summary_object_check CHECK (
        jsonb_typeof(safe_summary) = 'object'
    ),
    CONSTRAINT repair_intake_drafts_safe_metadata_object_check CHECK (
        jsonb_typeof(safe_metadata) = 'object'
    ),
    CONSTRAINT repair_intake_drafts_validation_errors_array_check CHECK (
        jsonb_typeof(validation_errors_safe) = 'array'
    )
);

CREATE INDEX IF NOT EXISTS idx_repair_intake_drafts_org_status_created
    ON repair_intake_drafts(organization_id, draft_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_repair_intake_drafts_org_source_ref
    ON repair_intake_drafts(organization_id, source, source_ref)
    WHERE source_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_repair_intake_drafts_org_tenant_created
    ON repair_intake_drafts(organization_id, tenant_id, created_at DESC)
    WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_repair_intake_drafts_org_import_batch
    ON repair_intake_drafts(organization_id, import_batch_id)
    WHERE import_batch_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS repair_intake_draft_case_conversions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    tenant_id uuid,
    draft_id uuid NOT NULL REFERENCES repair_intake_drafts(id),
    case_id uuid,
    case_ref text,
    conversion_status text NOT NULL DEFAULT 'planned',
    idempotency_key text,
    actor_id uuid,
    actor_type text,
    request_id text,
    safe_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    planned_at timestamptz,
    submitted_at timestamptz,
    converted_at timestamptz,
    failed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT repair_intake_draft_case_conversions_status_check CHECK (
        conversion_status IN (
            'planned',
            'submitted',
            'converted',
            'duplicate_replayed',
            'conflict',
            'failed',
            'cancelled'
        )
    ),
    CONSTRAINT repair_intake_draft_case_conversions_safe_metadata_object_check CHECK (
        jsonb_typeof(safe_metadata) = 'object'
    )
);

CREATE INDEX IF NOT EXISTS idx_repair_intake_conversions_org_draft
    ON repair_intake_draft_case_conversions(organization_id, draft_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_repair_intake_conversions_org_case
    ON repair_intake_draft_case_conversions(organization_id, case_id, created_at DESC)
    WHERE case_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_repair_intake_conversions_org_status
    ON repair_intake_draft_case_conversions(organization_id, conversion_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_repair_intake_conversions_org_idempotency
    ON repair_intake_draft_case_conversions(organization_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS repair_intake_idempotency_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    tenant_id uuid,
    idempotency_key text NOT NULL,
    operation_type text NOT NULL,
    draft_id uuid REFERENCES repair_intake_drafts(id),
    safe_request_fingerprint text NOT NULL,
    replay_case_id uuid,
    replay_case_ref text,
    replay_result_safe jsonb NOT NULL DEFAULT '{}'::jsonb,
    record_status text NOT NULL DEFAULT 'in_progress',
    first_seen_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    last_replayed_at timestamptz,
    expires_at timestamptz,
    retention_until timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT repair_intake_idempotency_key_not_blank_check CHECK (
        length(trim(idempotency_key)) > 0
    ),
    CONSTRAINT repair_intake_idempotency_operation_not_blank_check CHECK (
        length(trim(operation_type)) > 0
    ),
    CONSTRAINT repair_intake_idempotency_fingerprint_not_blank_check CHECK (
        length(trim(safe_request_fingerprint)) > 0
    ),
    CONSTRAINT repair_intake_idempotency_status_check CHECK (
        record_status IN ('in_progress', 'completed', 'failed', 'expired')
    ),
    CONSTRAINT repair_intake_idempotency_replay_result_object_check CHECK (
        jsonb_typeof(replay_result_safe) = 'object'
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_repair_intake_idempotency_org_tenant_operation_key
    ON repair_intake_idempotency_records(
        organization_id,
        COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),
        operation_type,
        idempotency_key
    );

CREATE INDEX IF NOT EXISTS idx_repair_intake_idempotency_org_draft
    ON repair_intake_idempotency_records(organization_id, draft_id)
    WHERE draft_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_repair_intake_idempotency_org_expires
    ON repair_intake_idempotency_records(organization_id, expires_at)
    WHERE expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS repair_intake_audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    tenant_id uuid,
    event_type text NOT NULL,
    draft_id uuid REFERENCES repair_intake_drafts(id),
    case_id uuid,
    case_ref text,
    actor_id uuid,
    actor_type text,
    request_id text,
    decision text,
    outcome text NOT NULL,
    reason_code text,
    safe_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    visibility text NOT NULL DEFAULT 'internal_only',
    occurred_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    retention_until timestamptz,

    CONSTRAINT repair_intake_audit_events_event_type_not_blank_check CHECK (
        length(trim(event_type)) > 0
    ),
    CONSTRAINT repair_intake_audit_events_outcome_not_blank_check CHECK (
        length(trim(outcome)) > 0
    ),
    CONSTRAINT repair_intake_audit_events_visibility_check CHECK (
        visibility IN ('internal_only')
    ),
    CONSTRAINT repair_intake_audit_events_safe_metadata_object_check CHECK (
        jsonb_typeof(safe_metadata) = 'object'
    )
);

CREATE INDEX IF NOT EXISTS idx_repair_intake_audit_events_org_created
    ON repair_intake_audit_events(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_repair_intake_audit_events_org_event_created
    ON repair_intake_audit_events(organization_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_repair_intake_audit_events_org_draft
    ON repair_intake_audit_events(organization_id, draft_id, created_at DESC)
    WHERE draft_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_repair_intake_audit_events_org_case
    ON repair_intake_audit_events(organization_id, case_id, created_at DESC)
    WHERE case_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_repair_intake_audit_events_org_request
    ON repair_intake_audit_events(organization_id, request_id)
    WHERE request_id IS NOT NULL;

-- MIGRATION FILE AUTHORING ONLY.
-- NOT APPLIED IN TASK 126.
-- APPLY REQUIRES A SEPARATE TASK.
-- NOT APPROVED FOR RUNTIME WRITES.
-- NOT APPROVED FOR SURVEY SENDING.
-- DO NOT RUN AGAINST SHARED RUNTIME WITHOUT EXPLICIT APPLY TASK.
-- NO LINE / APP / SMS / EMAIL SENDING IS ENABLED BY THIS MIGRATION.
-- NO HISTORICAL BACKFILL IS ENABLED BY THIS MIGRATION.
-- NO ADMIN UI IS ENABLED BY THIS MIGRATION.
-- NO AI IS ENABLED BY THIS MIGRATION.
-- NO DELIVERY RESOLVER RUNTIME IS ENABLED BY THIS MIGRATION.
-- NO SURVEY RESPONSE INTAKE IS ENABLED BY THIS MIGRATION.
-- NO NOTIFICATION TEMPLATE SEED IS CREATED BY THIS MIGRATION.
-- NO SURVEY CONTENT SEED IS CREATED BY THIS MIGRATION.
-- TABLES ARE INTENDED TO BE INERT UNTIL A FUTURE RUNTIME TASK.

CREATE TABLE survey_intents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    case_id uuid NOT NULL REFERENCES cases(id),
    service_report_id uuid NOT NULL REFERENCES field_service_reports(id),
    final_appointment_id uuid REFERENCES appointments(id),
    trigger_event_type text NOT NULL DEFAULT 'case.service_completion.first_transitioned',
    trigger_event_version integer NOT NULL DEFAULT 1,
    idempotency_key text NOT NULL,
    intent_status text NOT NULL DEFAULT 'pending_policy',
    policy_status text NOT NULL DEFAULT 'pending',
    suppression_reason_code text,
    suppression_detail_safe jsonb,
    completed_at timestamptz NOT NULL,
    survey_policy_version text,
    eligibility_policy_version text,
    source text NOT NULL DEFAULT 'backend',
    safe_context_summary jsonb,
    triggered_by_user_id uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT survey_intents_trigger_event_type_check CHECK (
        trigger_event_type IN ('case.service_completion.first_transitioned')
    ),
    CONSTRAINT survey_intents_trigger_event_version_positive_check CHECK (
        trigger_event_version > 0
    ),
    CONSTRAINT survey_intents_idempotency_key_not_blank_check CHECK (
        length(trim(idempotency_key)) > 0
    ),
    CONSTRAINT survey_intents_intent_status_check CHECK (
        intent_status IN (
            'pending_policy',
            'channel_resolution_pending',
            'pending_channel',
            'suppressed',
            'not_deliverable',
            'ready_for_delivery',
            'expired',
            'cancelled',
            'voided'
        )
    ),
    CONSTRAINT survey_intents_policy_status_check CHECK (
        policy_status IN ('pending', 'eligible', 'suppressed', 'not_deliverable')
    ),
    CONSTRAINT survey_intents_suppression_detail_safe_type_check CHECK (
        suppression_detail_safe IS NULL OR jsonb_typeof(suppression_detail_safe) = 'object'
    ),
    CONSTRAINT survey_intents_safe_context_summary_type_check CHECK (
        safe_context_summary IS NULL OR jsonb_typeof(safe_context_summary) = 'object'
    ),
    CONSTRAINT survey_intents_source_check CHECK (
        source IN ('backend')
    )
);

CREATE FUNCTION set_survey_intents_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_survey_intents_set_updated_at
BEFORE UPDATE ON survey_intents
FOR EACH ROW
EXECUTE FUNCTION set_survey_intents_updated_at();

CREATE UNIQUE INDEX idx_survey_intents_idempotency_unique
    ON survey_intents(organization_id, idempotency_key);

CREATE UNIQUE INDEX idx_survey_intents_case_report_unique
    ON survey_intents(organization_id, case_id, service_report_id);

CREATE INDEX idx_survey_intents_status_created_at
    ON survey_intents(organization_id, intent_status, created_at DESC);

CREATE INDEX idx_survey_intents_case_id
    ON survey_intents(organization_id, case_id);

CREATE INDEX idx_survey_intents_service_report_id
    ON survey_intents(organization_id, service_report_id);

CREATE INDEX idx_survey_intents_final_appointment_id
    ON survey_intents(organization_id, final_appointment_id)
    WHERE final_appointment_id IS NOT NULL;

CREATE INDEX idx_survey_intents_completed_at
    ON survey_intents(organization_id, completed_at DESC);

CREATE TABLE event_outbox (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    event_type text NOT NULL DEFAULT 'case.service_completion.first_transitioned',
    event_version integer NOT NULL DEFAULT 1,
    aggregate_type text NOT NULL DEFAULT 'case',
    aggregate_id uuid NOT NULL,
    survey_intent_id uuid REFERENCES survey_intents(id),
    idempotency_key text NOT NULL,
    payload jsonb NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    available_at timestamptz NOT NULL DEFAULT now(),
    occurred_at timestamptz NOT NULL,
    locked_at timestamptz,
    lock_expires_at timestamptz,
    locked_by varchar(120),
    attempts integer NOT NULL DEFAULT 0,
    max_attempts integer NOT NULL DEFAULT 5,
    last_error varchar(2000),
    processed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT event_outbox_event_type_check CHECK (
        event_type IN ('case.service_completion.first_transitioned')
    ),
    CONSTRAINT event_outbox_event_version_positive_check CHECK (
        event_version > 0
    ),
    CONSTRAINT event_outbox_aggregate_type_check CHECK (
        aggregate_type IN ('case')
    ),
    CONSTRAINT event_outbox_idempotency_key_not_blank_check CHECK (
        length(trim(idempotency_key)) > 0
    ),
    CONSTRAINT event_outbox_payload_type_check CHECK (
        jsonb_typeof(payload) = 'object'
    ),
    CONSTRAINT event_outbox_status_check CHECK (
        status IN ('pending', 'processing', 'processed', 'failed', 'dead', 'skipped')
    ),
    CONSTRAINT event_outbox_attempts_check CHECK (
        attempts >= 0 AND max_attempts > 0 AND attempts <= max_attempts
    ),
    CONSTRAINT event_outbox_lock_check CHECK (
        (locked_at IS NULL AND lock_expires_at IS NULL AND locked_by IS NULL)
        OR (locked_at IS NOT NULL AND lock_expires_at IS NOT NULL AND locked_by IS NOT NULL)
    ),
    CONSTRAINT event_outbox_processed_status_check CHECK (
        (status = 'processed' AND processed_at IS NOT NULL)
        OR (status <> 'processed')
    )
);

CREATE FUNCTION set_event_outbox_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_event_outbox_set_updated_at
BEFORE UPDATE ON event_outbox
FOR EACH ROW
EXECUTE FUNCTION set_event_outbox_updated_at();

CREATE UNIQUE INDEX idx_event_outbox_idempotency_unique
    ON event_outbox(organization_id, event_type, idempotency_key);

CREATE INDEX idx_event_outbox_ready
    ON event_outbox(organization_id, status, available_at, created_at)
    WHERE status IN ('pending', 'failed');

CREATE INDEX idx_event_outbox_aggregate
    ON event_outbox(organization_id, aggregate_type, aggregate_id, created_at DESC);

CREATE INDEX idx_event_outbox_lock_expires
    ON event_outbox(organization_id, lock_expires_at)
    WHERE lock_expires_at IS NOT NULL;

CREATE INDEX idx_event_outbox_survey_intent_id
    ON event_outbox(organization_id, survey_intent_id)
    WHERE survey_intent_id IS NOT NULL;

CREATE INDEX idx_event_outbox_processed_at
    ON event_outbox(organization_id, processed_at DESC)
    WHERE processed_at IS NOT NULL;

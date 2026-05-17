CREATE TABLE ai_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type text NOT NULL,
    provider text NOT NULL DEFAULT 'placeholder',
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    request_payload jsonb,
    response_payload jsonb,
    error_message text,
    requested_by_user_id uuid REFERENCES users(id),
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT ai_jobs_job_type_check CHECK (
        job_type IN (
            'case_summary',
            'case_classification',
            'dispatch_suggestion',
            'ocr',
            'service_report_analysis',
            'billing_analysis'
        )
    ),
    CONSTRAINT ai_jobs_entity_type_check CHECK (
        entity_type IN ('case', 'attachment', 'service_report', 'billing_record')
    ),
    CONSTRAINT ai_jobs_status_check CHECK (
        status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
    ),
    CONSTRAINT ai_jobs_request_payload_type_check CHECK (
        request_payload IS NULL OR jsonb_typeof(request_payload) = 'object'
    ),
    CONSTRAINT ai_jobs_response_payload_type_check CHECK (
        response_payload IS NULL OR jsonb_typeof(response_payload) = 'object'
    ),
    CONSTRAINT ai_jobs_completed_after_started_check CHECK (
        completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at
    ),
    CONSTRAINT ai_jobs_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    )
);

CREATE FUNCTION set_ai_jobs_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ai_jobs_set_updated_at
BEFORE UPDATE ON ai_jobs
FOR EACH ROW
EXECUTE FUNCTION set_ai_jobs_updated_at();

CREATE INDEX idx_ai_jobs_type_status ON ai_jobs(job_type, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_ai_jobs_entity ON ai_jobs(entity_type, entity_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_ai_jobs_requested_by_user_id ON ai_jobs(requested_by_user_id) WHERE requested_by_user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_ai_jobs_created_at ON ai_jobs(created_at DESC) WHERE deleted_at IS NULL;

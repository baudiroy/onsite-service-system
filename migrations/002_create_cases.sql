CREATE TABLE cases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_no text NOT NULL,
    customer_id uuid NOT NULL REFERENCES customers(id),

    status text NOT NULL DEFAULT 'draft',
    priority text NOT NULL DEFAULT 'normal',
    warranty_status text NOT NULL DEFAULT 'unknown',
    appointment_status text NOT NULL DEFAULT 'not_required',
    completion_status text NOT NULL DEFAULT 'not_started',
    source text NOT NULL,

    brand text NOT NULL,
    case_type text NOT NULL DEFAULT 'repair',
    product_type text NOT NULL,
    model_no text NOT NULL,
    serial_no text,
    invoice_date date,
    problem_description text NOT NULL,
    preferred_visit_time timestamptz,
    service_region text,

    ai_summary text,
    ai_classification jsonb,
    ai_confidence numeric(5,4),
    ai_suggested_dispatch_unit_id uuid REFERENCES dispatch_units(id),
    ai_ocr_status text NOT NULL DEFAULT 'not_started',

    dispatch_unit_id uuid REFERENCES dispatch_units(id),
    dispatch_assignment_source text,

    customer_snapshot jsonb,
    metadata jsonb,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES users(id),
    updated_by uuid REFERENCES users(id),
    submitted_at timestamptz,
    reviewed_at timestamptz,
    accepted_at timestamptz,
    rejected_at timestamptz,
    cancelled_at timestamptz,
    scheduled_at timestamptz,
    completed_at timestamptz,
    last_customer_message_at timestamptz,
    last_internal_activity_at timestamptz,
    deleted_at timestamptz,

    CONSTRAINT cases_case_no_unique UNIQUE (case_no),
    CONSTRAINT cases_status_check CHECK (
        status IN (
            'draft',
            'pending_customer',
            'submitted',
            'reviewing',
            'accepted',
            'rejected',
            'cancelled',
            'dispatch_pending',
            'assigned',
            'scheduled',
            'on_site',
            'completed',
            'closed'
        )
    ),
    CONSTRAINT cases_priority_check CHECK (
        priority IN ('low', 'normal', 'high', 'urgent', 'vip')
    ),
    CONSTRAINT cases_warranty_status_check CHECK (
        warranty_status IN (
            'unknown',
            'pending_review',
            'in_warranty',
            'out_of_warranty'
        )
    ),
    CONSTRAINT cases_appointment_status_check CHECK (
        appointment_status IN (
            'not_required',
            'pending',
            'requested',
            'confirmed',
            'reschedule_requested',
            'cancelled'
        )
    ),
    CONSTRAINT cases_completion_status_check CHECK (
        completion_status IN (
            'not_started',
            'in_progress',
            'completed',
            'customer_confirmed',
            'disputed'
        )
    ),
    CONSTRAINT cases_case_type_check CHECK (
        case_type IN (
            'repair',
            'installation',
            'maintenance',
            'inspection',
            'return',
            'warranty',
            'other'
        )
    ),
    CONSTRAINT cases_source_check CHECK (
        source IN (
            'line',
            'website',
            'admin',
            'api',
            'migration',
            'phone',
            'whatsapp',
            'facebook',
            'instagram',
            'email'
        )
    ),
    CONSTRAINT cases_problem_description_not_blank_check CHECK (
        length(trim(problem_description)) > 0
    ),
    CONSTRAINT cases_ai_ocr_status_check CHECK (
        ai_ocr_status IN (
            'not_started',
            'pending',
            'processing',
            'partial',
            'completed',
            'failed',
            'manual_review'
        )
    ),
    CONSTRAINT cases_dispatch_assignment_source_check CHECK (
        dispatch_assignment_source IS NULL
        OR dispatch_assignment_source IN ('rule', 'ai', 'manual')
    ),
    CONSTRAINT cases_ai_confidence_check CHECK (
        ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1)
    ),
    CONSTRAINT cases_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    )
);

CREATE FUNCTION set_cases_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cases_set_updated_at
BEFORE UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION set_cases_updated_at();

CREATE INDEX idx_cases_customer_id ON cases(customer_id);
CREATE INDEX idx_cases_status ON cases(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_status_priority_submitted_at ON cases(status, priority, submitted_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_warranty_status ON cases(warranty_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_source ON cases(source) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_dispatch_unit_id ON cases(dispatch_unit_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_ai_suggested_dispatch_unit_id ON cases(ai_suggested_dispatch_unit_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX idx_cases_submitted_at ON cases(submitted_at DESC) WHERE submitted_at IS NOT NULL;
CREATE INDEX idx_cases_scheduled_at ON cases(scheduled_at DESC) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_cases_completed_at ON cases(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_cases_last_customer_message_at ON cases(last_customer_message_at DESC) WHERE last_customer_message_at IS NOT NULL;
CREATE INDEX idx_cases_last_internal_activity_at ON cases(last_internal_activity_at DESC) WHERE last_internal_activity_at IS NOT NULL;
CREATE INDEX idx_cases_case_type ON cases(case_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_service_region ON cases(service_region) WHERE service_region IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_cases_brand_product_type ON cases(brand, product_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_search_text ON cases USING gin (
    to_tsvector(
        'simple',
        coalesce(case_no, '') || ' ' ||
        coalesce(brand, '') || ' ' ||
        coalesce(product_type, '') || ' ' ||
        coalesce(model_no, '') || ' ' ||
        coalesce(serial_no, '') || ' ' ||
        coalesce(problem_description, '')
    )
);

CREATE TABLE billing_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    field_service_report_id uuid REFERENCES field_service_reports(id),
    labor_amount numeric(12,2) NOT NULL DEFAULT 0,
    parts_amount numeric(12,2) NOT NULL DEFAULT 0,
    transport_amount numeric(12,2) NOT NULL DEFAULT 0,
    additional_amount numeric(12,2) NOT NULL DEFAULT 0,
    total_amount numeric(12,2) NOT NULL DEFAULT 0,
    warranty_amount numeric(12,2) NOT NULL DEFAULT 0,
    customer_charge_amount numeric(12,2) NOT NULL DEFAULT 0,
    manufacturer_claim_amount numeric(12,2) NOT NULL DEFAULT 0,
    billing_status text NOT NULL DEFAULT 'draft',
    billing_note text,
    created_by uuid REFERENCES users(id),
    updated_by uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT billing_records_status_check CHECK (
        billing_status IN ('draft', 'pending_review', 'approved', 'submitted', 'settled', 'cancelled')
    ),
    CONSTRAINT billing_records_amounts_non_negative_check CHECK (
        labor_amount >= 0
        AND parts_amount >= 0
        AND transport_amount >= 0
        AND additional_amount >= 0
        AND total_amount >= 0
        AND warranty_amount >= 0
        AND customer_charge_amount >= 0
        AND manufacturer_claim_amount >= 0
    ),
    CONSTRAINT billing_records_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    )
);

CREATE FUNCTION set_billing_records_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_billing_records_set_updated_at
BEFORE UPDATE ON billing_records
FOR EACH ROW
EXECUTE FUNCTION set_billing_records_updated_at();

CREATE UNIQUE INDEX idx_billing_records_case_active_unique
    ON billing_records(case_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_billing_records_case_id ON billing_records(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_billing_records_field_service_report_id ON billing_records(field_service_report_id) WHERE field_service_report_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_billing_records_status ON billing_records(billing_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_billing_records_created_at ON billing_records(created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE settlement_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_record_id uuid NOT NULL REFERENCES billing_records(id) ON DELETE CASCADE,
    settlement_target_type text NOT NULL,
    settlement_target_id uuid,
    settlement_amount numeric(12,2) NOT NULL DEFAULT 0,
    settlement_status text NOT NULL DEFAULT 'pending',
    settlement_rule_code text,
    settlement_policy_version text,
    settlement_metadata jsonb,
    settlement_note text,
    settled_at timestamptz,
    created_by uuid REFERENCES users(id),
    updated_by uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT settlement_records_target_type_check CHECK (
        settlement_target_type IN ('engineer', 'manufacturer', 'internal', 'vendor', 'distributor', 'partner', 'subcontractor')
    ),
    CONSTRAINT settlement_records_status_check CHECK (
        settlement_status IN ('pending', 'submitted', 'completed', 'rejected')
    ),
    CONSTRAINT settlement_records_metadata_type_check CHECK (
        settlement_metadata IS NULL OR jsonb_typeof(settlement_metadata) = 'object'
    ),
    CONSTRAINT settlement_records_amount_non_negative_check CHECK (
        settlement_amount >= 0
    ),
    CONSTRAINT settlement_records_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    )
);

CREATE FUNCTION set_settlement_records_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_settlement_records_set_updated_at
BEFORE UPDATE ON settlement_records
FOR EACH ROW
EXECUTE FUNCTION set_settlement_records_updated_at();

CREATE INDEX idx_settlement_records_billing_record_id ON settlement_records(billing_record_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_settlement_records_target ON settlement_records(settlement_target_type, settlement_target_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_settlement_records_status ON settlement_records(settlement_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_settlement_records_rule_code ON settlement_records(settlement_rule_code) WHERE settlement_rule_code IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_settlement_records_settled_at ON settlement_records(settled_at DESC) WHERE settled_at IS NOT NULL AND deleted_at IS NULL;

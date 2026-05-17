CREATE TABLE field_service_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    diagnosis_result text,
    repair_action text,
    repair_result text,
    service_status text NOT NULL DEFAULT 'in_progress',
    engineer_note text,
    customer_note text,
    installation_checklist jsonb,
    onsite_started_at timestamptz,
    onsite_completed_at timestamptz,
    created_by uuid REFERENCES users(id),
    updated_by uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT field_service_reports_status_check CHECK (
        service_status IN ('in_progress', 'pending_parts', 'completed', 'cancelled')
    ),
    CONSTRAINT field_service_reports_installation_checklist_type_check CHECK (
        installation_checklist IS NULL OR jsonb_typeof(installation_checklist) = 'object'
    ),
    CONSTRAINT field_service_reports_onsite_time_check CHECK (
        onsite_completed_at IS NULL
        OR onsite_started_at IS NULL
        OR onsite_completed_at >= onsite_started_at
    ),
    CONSTRAINT field_service_reports_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    )
);

CREATE FUNCTION set_field_service_reports_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_field_service_reports_set_updated_at
BEFORE UPDATE ON field_service_reports
FOR EACH ROW
EXECUTE FUNCTION set_field_service_reports_updated_at();

CREATE UNIQUE INDEX idx_field_service_reports_case_active_unique
    ON field_service_reports(case_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_field_service_reports_case_id ON field_service_reports(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_field_service_reports_status ON field_service_reports(service_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_field_service_reports_onsite_started_at ON field_service_reports(onsite_started_at DESC) WHERE onsite_started_at IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_field_service_reports_onsite_completed_at ON field_service_reports(onsite_completed_at DESC) WHERE onsite_completed_at IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE service_parts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_report_id uuid NOT NULL REFERENCES field_service_reports(id) ON DELETE CASCADE,
    part_name text NOT NULL,
    part_no text,
    quantity integer NOT NULL DEFAULT 1,
    old_serial_no text,
    new_serial_no text,
    part_status text NOT NULL DEFAULT 'planned',
    replaced_at timestamptz,
    created_by uuid REFERENCES users(id),
    updated_by uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT service_parts_part_name_not_blank_check CHECK (
        length(trim(part_name)) > 0
    ),
    CONSTRAINT service_parts_quantity_positive_check CHECK (
        quantity > 0
    ),
    CONSTRAINT service_parts_status_check CHECK (
        part_status IN ('planned', 'used', 'replaced', 'returned', 'cancelled')
    ),
    CONSTRAINT service_parts_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    )
);

CREATE FUNCTION set_service_parts_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_service_parts_set_updated_at
BEFORE UPDATE ON service_parts
FOR EACH ROW
EXECUTE FUNCTION set_service_parts_updated_at();

CREATE INDEX idx_service_parts_report_id ON service_parts(service_report_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_parts_part_no ON service_parts(part_no) WHERE part_no IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_service_parts_status ON service_parts(part_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_parts_replaced_at ON service_parts(replaced_at DESC) WHERE replaced_at IS NOT NULL AND deleted_at IS NULL;

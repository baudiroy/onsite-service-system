CREATE TABLE dispatch_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    dispatch_unit_id uuid NOT NULL REFERENCES dispatch_units(id),
    assigned_engineer_id uuid REFERENCES users(id),
    dispatch_status text NOT NULL DEFAULT 'pending',
    assignment_note text,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES users(id),
    updated_by uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT dispatch_assignments_status_check CHECK (
        dispatch_status IN ('pending', 'assigned', 'accepted', 'rejected', 'cancelled', 'completed')
    ),
    CONSTRAINT dispatch_assignments_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    )
);

CREATE FUNCTION set_dispatch_assignments_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dispatch_assignments_set_updated_at
BEFORE UPDATE ON dispatch_assignments
FOR EACH ROW
EXECUTE FUNCTION set_dispatch_assignments_updated_at();

CREATE INDEX idx_dispatch_assignments_case_id ON dispatch_assignments(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_dispatch_assignments_dispatch_unit_id ON dispatch_assignments(dispatch_unit_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_dispatch_assignments_engineer_id ON dispatch_assignments(assigned_engineer_id) WHERE assigned_engineer_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_dispatch_assignments_status ON dispatch_assignments(dispatch_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_dispatch_assignments_assigned_at ON dispatch_assignments(assigned_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE appointments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    dispatch_assignment_id uuid REFERENCES dispatch_assignments(id),
    scheduled_start_at timestamptz NOT NULL,
    scheduled_end_at timestamptz NOT NULL,
    appointment_status text NOT NULL DEFAULT 'scheduled',
    visit_type text NOT NULL,
    timezone text NOT NULL DEFAULT 'Asia/Taipei',
    reschedule_reason text,
    note text,
    created_by uuid REFERENCES users(id),
    updated_by uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT appointments_status_check CHECK (
        appointment_status IN ('scheduled', 'rescheduled', 'cancelled', 'completed', 'no_show')
    ),
    CONSTRAINT appointments_visit_type_check CHECK (
        visit_type IN ('repair', 'installation', 'inspection')
    ),
    CONSTRAINT appointments_time_range_check CHECK (
        scheduled_end_at > scheduled_start_at
    ),
    CONSTRAINT appointments_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    )
);

CREATE FUNCTION set_appointments_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_appointments_set_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION set_appointments_updated_at();

CREATE INDEX idx_appointments_case_id ON appointments(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_dispatch_assignment_id ON appointments(dispatch_assignment_id) WHERE dispatch_assignment_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_appointments_status ON appointments(appointment_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_scheduled_start_at ON appointments(scheduled_start_at DESC) WHERE deleted_at IS NULL;

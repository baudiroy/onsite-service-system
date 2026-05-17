ALTER TABLE customers
    ADD COLUMN organization_id uuid REFERENCES organizations(id);

ALTER TABLE cases
    ADD COLUMN organization_id uuid REFERENCES organizations(id),
    ADD COLUMN intake_line_channel_id uuid REFERENCES line_channels(id);

ALTER TABLE dispatch_units
    ADD COLUMN organization_id uuid REFERENCES organizations(id);

CREATE TABLE user_organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    role_note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT user_organizations_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    )
);

CREATE INDEX idx_customers_organization_id ON customers(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_organization_mobile ON customers(organization_id, mobile) WHERE deleted_at IS NULL;
DROP INDEX IF EXISTS idx_customers_line_user_id_unique;
CREATE INDEX idx_customers_organization_line_user_id ON customers(organization_id, line_user_id)
    WHERE line_user_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_cases_organization_id ON cases(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_organization_status ON cases(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_intake_line_channel_id ON cases(intake_line_channel_id) WHERE intake_line_channel_id IS NOT NULL AND deleted_at IS NULL;

DROP INDEX IF EXISTS idx_dispatch_units_code_unique;
CREATE UNIQUE INDEX idx_dispatch_units_organization_code_unique ON dispatch_units(organization_id, code)
    WHERE organization_id IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX idx_dispatch_units_code_unique_without_organization ON dispatch_units(code)
    WHERE organization_id IS NULL AND deleted_at IS NULL;
CREATE INDEX idx_dispatch_units_organization_id ON dispatch_units(organization_id) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX idx_user_organizations_active_unique ON user_organizations(user_id, organization_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_user_organizations_user_id ON user_organizations(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_organizations_organization_id ON user_organizations(organization_id) WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS idx_customer_line_identities_active_unique;
CREATE UNIQUE INDEX idx_customer_line_identities_scope_unique ON customer_line_identities(organization_id, line_channel_id, line_user_id)
    WHERE unlinked_at IS NULL;

CREATE TABLE organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_code text NOT NULL,
    organization_name text NOT NULL,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT organizations_code_not_blank_check CHECK (length(trim(organization_code)) > 0),
    CONSTRAINT organizations_name_not_blank_check CHECK (length(trim(organization_name)) > 0),
    CONSTRAINT organizations_status_check CHECK (status IN ('active', 'disabled')),
    CONSTRAINT organizations_deleted_after_created_check CHECK (deleted_at IS NULL OR deleted_at >= created_at)
);

CREATE FUNCTION set_organizations_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_set_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION set_organizations_updated_at();

CREATE UNIQUE INDEX idx_organizations_code_unique ON organizations(organization_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_status ON organizations(status) WHERE deleted_at IS NULL;

CREATE TABLE line_channels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    channel_code text NOT NULL,
    channel_name text NOT NULL,
    channel_id text,
    channel_secret text NOT NULL,
    channel_access_token text,
    webhook_path text NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES users(id),
    updated_by uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT line_channels_code_not_blank_check CHECK (length(trim(channel_code)) > 0),
    CONSTRAINT line_channels_name_not_blank_check CHECK (length(trim(channel_name)) > 0),
    CONSTRAINT line_channels_secret_not_blank_check CHECK (length(trim(channel_secret)) > 0),
    CONSTRAINT line_channels_webhook_path_not_blank_check CHECK (length(trim(webhook_path)) > 0),
    CONSTRAINT line_channels_deleted_after_created_check CHECK (deleted_at IS NULL OR deleted_at >= created_at)
);

CREATE FUNCTION set_line_channels_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_line_channels_set_updated_at
BEFORE UPDATE ON line_channels
FOR EACH ROW
EXECUTE FUNCTION set_line_channels_updated_at();

CREATE UNIQUE INDEX idx_line_channels_code_unique ON line_channels(channel_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_line_channels_organization_id ON line_channels(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_line_channels_enabled ON line_channels(enabled) WHERE deleted_at IS NULL;

CREATE TABLE customer_line_identities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid REFERENCES customers(id),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    line_channel_id uuid NOT NULL REFERENCES line_channels(id),
    line_user_id text NOT NULL,
    display_name text,
    linked_at timestamptz,
    unlinked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT customer_line_identities_user_id_not_blank_check CHECK (length(trim(line_user_id)) > 0),
    CONSTRAINT customer_line_identities_link_time_check CHECK (unlinked_at IS NULL OR linked_at IS NULL OR unlinked_at >= linked_at)
);

CREATE UNIQUE INDEX idx_customer_line_identities_channel_user_active_unique
    ON customer_line_identities(line_channel_id, line_user_id)
    WHERE unlinked_at IS NULL;
CREATE INDEX idx_customer_line_identities_customer_id ON customer_line_identities(customer_id) WHERE customer_id IS NOT NULL AND unlinked_at IS NULL;
CREATE INDEX idx_customer_line_identities_organization_id ON customer_line_identities(organization_id) WHERE unlinked_at IS NULL;

CREATE TABLE line_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    line_channel_id uuid NOT NULL REFERENCES line_channels(id),
    line_user_id text,
    event_type text NOT NULL,
    message_type text,
    external_event_id text,
    raw_payload jsonb,
    linked_customer_id uuid REFERENCES customers(id),
    linked_case_id uuid REFERENCES cases(id),
    processed_status text NOT NULL DEFAULT 'received',
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT line_events_type_not_blank_check CHECK (length(trim(event_type)) > 0),
    CONSTRAINT line_events_status_check CHECK (processed_status IN ('received', 'processed', 'ignored', 'failed')),
    CONSTRAINT line_events_raw_payload_type_check CHECK (raw_payload IS NULL OR jsonb_typeof(raw_payload) = 'object')
);

CREATE INDEX idx_line_events_channel_user_created_at ON line_events(line_channel_id, line_user_id, created_at DESC);
CREATE INDEX idx_line_events_organization_created_at ON line_events(organization_id, created_at DESC);
CREATE INDEX idx_line_events_processed_status ON line_events(processed_status, created_at DESC);
CREATE INDEX idx_line_events_external_event_id ON line_events(external_event_id) WHERE external_event_id IS NOT NULL;

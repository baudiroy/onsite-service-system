CREATE TABLE notification_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type text NOT NULL,
    target_id uuid,
    event_key text NOT NULL,
    channel text NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES users(id),
    updated_by uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT notification_preferences_target_type_check CHECK (
        target_type IN ('customer', 'user', 'role', 'dispatch_unit', 'system')
    ),
    CONSTRAINT notification_preferences_channel_check CHECK (
        channel IN ('line', 'sms', 'email', 'in_app')
    ),
    CONSTRAINT notification_preferences_event_key_not_blank_check CHECK (
        length(trim(event_key)) > 0
    ),
    CONSTRAINT notification_preferences_system_target_check CHECK (
        (target_type = 'system' AND target_id IS NULL)
        OR (target_type <> 'system' AND target_id IS NOT NULL)
    ),
    CONSTRAINT notification_preferences_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    )
);

CREATE FUNCTION set_notification_preferences_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notification_preferences_set_updated_at
BEFORE UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION set_notification_preferences_updated_at();

CREATE UNIQUE INDEX idx_notification_preferences_unique_active
    ON notification_preferences(target_type, coalesce(target_id, '00000000-0000-0000-0000-000000000000'::uuid), event_key, channel)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_notification_preferences_lookup ON notification_preferences(target_type, target_id, event_key, channel) WHERE deleted_at IS NULL;
CREATE INDEX idx_notification_preferences_event_channel ON notification_preferences(event_key, channel) WHERE deleted_at IS NULL;

CREATE TABLE notification_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_key text NOT NULL,
    channel text NOT NULL,
    template_name text NOT NULL,
    subject text,
    body_template text NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    version integer NOT NULL DEFAULT 1,
    created_by uuid REFERENCES users(id),
    updated_by uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT notification_templates_channel_check CHECK (
        channel IN ('line', 'sms', 'email', 'in_app')
    ),
    CONSTRAINT notification_templates_event_key_not_blank_check CHECK (
        length(trim(event_key)) > 0
    ),
    CONSTRAINT notification_templates_name_not_blank_check CHECK (
        length(trim(template_name)) > 0
    ),
    CONSTRAINT notification_templates_body_not_blank_check CHECK (
        length(trim(body_template)) > 0
    ),
    CONSTRAINT notification_templates_version_positive_check CHECK (
        version > 0
    ),
    CONSTRAINT notification_templates_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    )
);

CREATE FUNCTION set_notification_templates_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notification_templates_set_updated_at
BEFORE UPDATE ON notification_templates
FOR EACH ROW
EXECUTE FUNCTION set_notification_templates_updated_at();

CREATE UNIQUE INDEX idx_notification_templates_unique_active
    ON notification_templates(event_key, channel, version)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_notification_templates_event_channel_enabled ON notification_templates(event_key, channel, enabled) WHERE deleted_at IS NULL;

CREATE TABLE notification_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_key text NOT NULL,
    channel text NOT NULL,
    target_type text NOT NULL,
    target_id uuid,
    recipient text,
    status text NOT NULL DEFAULT 'pending',
    payload jsonb,
    provider_response jsonb,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    sent_at timestamptz,

    CONSTRAINT notification_logs_target_type_check CHECK (
        target_type IN ('customer', 'user', 'role', 'dispatch_unit', 'system')
    ),
    CONSTRAINT notification_logs_channel_check CHECK (
        channel IN ('line', 'sms', 'email', 'in_app')
    ),
    CONSTRAINT notification_logs_status_check CHECK (
        status IN ('pending', 'skipped', 'sent', 'failed')
    ),
    CONSTRAINT notification_logs_event_key_not_blank_check CHECK (
        length(trim(event_key)) > 0
    ),
    CONSTRAINT notification_logs_payload_type_check CHECK (
        payload IS NULL OR jsonb_typeof(payload) = 'object'
    ),
    CONSTRAINT notification_logs_provider_response_type_check CHECK (
        provider_response IS NULL OR jsonb_typeof(provider_response) = 'object'
    )
);

CREATE INDEX idx_notification_logs_event_channel_created_at ON notification_logs(event_key, channel, created_at DESC);
CREATE INDEX idx_notification_logs_target ON notification_logs(target_type, target_id, created_at DESC);
CREATE INDEX idx_notification_logs_status ON notification_logs(status, created_at DESC);

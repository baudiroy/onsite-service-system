CREATE TABLE case_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    attachment_type text NOT NULL,
    storage_provider text NOT NULL DEFAULT 'cloudflare_r2',
    bucket text NOT NULL,
    object_key text NOT NULL,
    object_version text,
    original_filename text,
    content_type text,
    byte_size bigint,
    checksum_sha256 text,
    uploaded_by_type text NOT NULL DEFAULT 'customer',
    uploaded_by_id uuid,
    source_channel text NOT NULL,
    ocr_status text NOT NULL DEFAULT 'not_started',
    ai_extraction_result jsonb,
    ai_extraction_confidence numeric(5,4),
    last_signed_url_issued_at timestamptz,
    last_signed_url_expires_at timestamptz,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT case_attachments_attachment_type_check CHECK (
        attachment_type IN (
            'fault_photo',
            'serial_photo',
            'invoice_photo',
            'completion_photo',
            'signature',
            'other'
        )
    ),
    CONSTRAINT case_attachments_storage_provider_check CHECK (
        storage_provider IN ('cloudflare_r2', 'other')
    ),
    CONSTRAINT case_attachments_bucket_not_blank_check CHECK (
        length(trim(bucket)) > 0
    ),
    CONSTRAINT case_attachments_object_key_not_blank_check CHECK (
        length(trim(object_key)) > 0
    ),
    CONSTRAINT case_attachments_byte_size_check CHECK (
        byte_size IS NULL OR byte_size >= 0
    ),
    CONSTRAINT case_attachments_uploaded_by_type_check CHECK (
        uploaded_by_type IN ('customer', 'ai', 'admin', 'system', 'engineer')
    ),
    CONSTRAINT case_attachments_source_channel_check CHECK (
        source_channel IN (
            'line',
            'website',
            'admin',
            'api',
            'phone',
            'whatsapp',
            'facebook',
            'instagram',
            'email'
        )
    ),
    CONSTRAINT case_attachments_ocr_status_check CHECK (
        ocr_status IN (
            'not_started',
            'pending',
            'processing',
            'partial',
            'completed',
            'failed',
            'manual_review'
        )
    ),
    CONSTRAINT case_attachments_ai_extraction_confidence_check CHECK (
        ai_extraction_confidence IS NULL
        OR (ai_extraction_confidence >= 0 AND ai_extraction_confidence <= 1)
    ),
    CONSTRAINT case_attachments_signed_url_lifecycle_check CHECK (
        last_signed_url_expires_at IS NULL
        OR last_signed_url_issued_at IS NOT NULL
    ),
    CONSTRAINT case_attachments_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    ),
    CONSTRAINT case_attachments_id_case_id_unique UNIQUE (id, case_id)
);

CREATE FUNCTION set_case_attachments_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_case_attachments_set_updated_at
BEFORE UPDATE ON case_attachments
FOR EACH ROW
EXECUTE FUNCTION set_case_attachments_updated_at();

CREATE UNIQUE INDEX idx_case_attachments_object_unique ON case_attachments(storage_provider, bucket, object_key) WHERE deleted_at IS NULL;
CREATE INDEX idx_case_attachments_case_id ON case_attachments(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_case_attachments_type ON case_attachments(attachment_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_case_attachments_ocr_status ON case_attachments(ocr_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_case_attachments_created_at ON case_attachments(created_at DESC);

CREATE TABLE case_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    attachment_id uuid,
    sender_type text NOT NULL,
    sender_id uuid,
    sender_display_name text,
    channel text NOT NULL,
    message_type text NOT NULL,
    body_text text,
    external_message_id text,
    raw_payload jsonb,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT case_messages_sender_type_check CHECK (
        sender_type IN ('customer', 'ai', 'admin', 'system', 'engineer')
    ),
    CONSTRAINT case_messages_channel_check CHECK (
        channel IN (
            'line',
            'website',
            'admin',
            'api',
            'phone',
            'whatsapp',
            'facebook',
            'instagram',
            'email'
        )
    ),
    CONSTRAINT case_messages_message_type_check CHECK (
        message_type IN (
            'text',
            'image',
            'file',
            'audio',
            'video',
            'system_event'
        )
    ),
    CONSTRAINT case_messages_text_body_not_blank_check CHECK (
        message_type <> 'text'
        OR length(trim(coalesce(body_text, ''))) > 0
    ),
    CONSTRAINT case_messages_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    ),
    CONSTRAINT case_messages_attachment_same_case_fk FOREIGN KEY (attachment_id, case_id)
        REFERENCES case_attachments(id, case_id)
);

CREATE INDEX idx_case_messages_case_id_created_at ON case_messages(case_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_case_messages_attachment_id ON case_messages(attachment_id) WHERE attachment_id IS NOT NULL;
CREATE INDEX idx_case_messages_channel ON case_messages(channel) WHERE deleted_at IS NULL;
CREATE INDEX idx_case_messages_sender_type ON case_messages(sender_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_case_messages_external_message_id ON case_messages(external_message_id) WHERE external_message_id IS NOT NULL;

CREATE TABLE audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type text NOT NULL,
    actor_id uuid,
    actor_display_name text,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    before_data jsonb,
    after_data jsonb,
    ip_address inet,
    user_agent text,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT audit_logs_actor_type_check CHECK (
        actor_type IN ('customer', 'ai', 'admin', 'system', 'engineer', 'api')
    ),
    CONSTRAINT audit_logs_action_not_blank_check CHECK (
        length(trim(action)) > 0
    ),
    CONSTRAINT audit_logs_entity_type_check CHECK (
        entity_type IN (
            'case',
            'customer',
            'attachment',
            'message',
            'user',
            'dispatch_unit',
            'ai_provider',
            'system'
        )
    )
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_type, actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

ALTER TABLE case_messages
    DROP CONSTRAINT IF EXISTS case_messages_message_type_check;

ALTER TABLE case_messages
    ADD CONSTRAINT case_messages_message_type_check CHECK (
        message_type IN (
            'internal_note',
            'system_event',
            'customer_note',
            'workflow_event',
            'text',
            'image',
            'file',
            'audio',
            'video'
        )
    );

ALTER TABLE case_messages
    DROP CONSTRAINT IF EXISTS case_messages_text_body_not_blank_check;

ALTER TABLE case_messages
    ADD CONSTRAINT case_messages_body_required_check CHECK (
        message_type NOT IN ('internal_note', 'customer_note', 'workflow_event', 'text')
        OR length(trim(coalesce(body_text, ''))) > 0
    );

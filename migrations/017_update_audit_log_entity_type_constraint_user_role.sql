ALTER TABLE audit_logs
DROP CONSTRAINT IF EXISTS audit_logs_entity_type_check;

ALTER TABLE audit_logs
ADD CONSTRAINT audit_logs_entity_type_check
CHECK (
    entity_type IN (
        'case',
        'customer',
        'attachment',
        'message',
        'dispatch',
        'dispatch_unit',
        'appointment',
        'service_report',
        'service_part',
        'billing',
        'billing_record',
        'settlement',
        'settlement_record',
        'notification',
        'notification_log',
        'notification_preference',
        'notification_template',
        'ai_job',
        'ai_provider',
        'line_event',
        'line_channel',
        'line_identity',
        'customer_line_identity',
        'organization',
        'user_organization',
        'auth',
        'user',
        'user_role',
        'role',
        'permission',
        'system'
    )
);

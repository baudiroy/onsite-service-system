ALTER TABLE case_attachments
    ADD COLUMN IF NOT EXISTS ocr_result jsonb,
    ADD COLUMN IF NOT EXISTS ocr_confidence numeric(5,4),
    ADD COLUMN IF NOT EXISTS ocr_processed_at timestamptz;

ALTER TABLE case_attachments
    DROP CONSTRAINT IF EXISTS case_attachments_attachment_type_check;

ALTER TABLE case_attachments
    ADD CONSTRAINT case_attachments_attachment_type_check CHECK (
        attachment_type IN (
            'fault_photo',
            'serial_photo',
            'invoice_photo',
            'product_photo',
            'issue_photo',
            'completion_photo',
            'signature',
            'other'
        )
    );

ALTER TABLE case_attachments
    ADD CONSTRAINT case_attachments_ocr_confidence_check CHECK (
        ocr_confidence IS NULL
        OR (ocr_confidence >= 0 AND ocr_confidence <= 1)
    );

ALTER TABLE ai_jobs
    ADD COLUMN organization_id uuid REFERENCES organizations(id),
    ADD COLUMN line_channel_id uuid REFERENCES line_channels(id),
    ADD COLUMN customer_id uuid REFERENCES customers(id),
    ADD COLUMN case_id uuid REFERENCES cases(id);

CREATE INDEX idx_ai_jobs_organization_id ON ai_jobs(organization_id) WHERE organization_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_ai_jobs_case_id ON ai_jobs(case_id) WHERE case_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_ai_jobs_customer_id ON ai_jobs(customer_id) WHERE customer_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_ai_jobs_line_channel_id ON ai_jobs(line_channel_id) WHERE line_channel_id IS NOT NULL AND deleted_at IS NULL;

-- MIGRATION FILE AUTHORING ONLY.
-- NOT APPLIED IN TASK 2403.
-- APPLY OR DRY-RUN REQUIRES A SEPARATE TASK.
-- DO NOT RUN AGAINST SHARED RUNTIME WITHOUT EXPLICIT APPLY TASK.
-- DO NOT RUN AGAINST PRODUCTION OR STAGING WITHOUT EXPLICIT APPLY TASK.
-- FUTURE DRY-RUN OR APPLY REQUIRES EXPLICIT DISPOSABLE DB AUTHORIZATION.
-- NO DB CONNECTION OR DATABASE EXECUTION IS AUTHORIZED BY THIS FILE.
-- DEPOT / WORKSHOP REPAIR ORDER SCHEMA ONLY.
-- TABLE IS INTENDED TO BE INERT UNTIL A FUTURE RUNTIME TASK.

CREATE TABLE IF NOT EXISTS depot_workshop_repair_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    tenant_id uuid,
    case_id uuid NOT NULL REFERENCES cases(id),
    depot_intake_id uuid REFERENCES repair_intake_drafts(id),
    repair_order_ref text NOT NULL,
    depot_status text NOT NULL DEFAULT 'intake_received',
    workflow_type text NOT NULL DEFAULT 'depot_workshop_repair',
    brand_id uuid,
    service_provider_id uuid,
    subcontractor_organization_id uuid,
    workshop_id uuid,
    workshop_team_id uuid,
    assigned_technician_id uuid,
    request_id text,
    created_by_actor_id uuid,
    updated_by_actor_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    metadata_safe jsonb NOT NULL DEFAULT '{}'::jsonb,
    customer_projection_safe jsonb NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT depot_workshop_repair_orders_ref_not_blank_check CHECK (
        length(trim(repair_order_ref)) > 0
    ),
    CONSTRAINT depot_workshop_repair_orders_workflow_type_check CHECK (
        workflow_type IN ('depot_workshop_repair')
    ),
    CONSTRAINT depot_workshop_repair_orders_status_check CHECK (
        depot_status IN (
            'intake_received',
            'diagnosis_pending',
            'diagnosis_completed',
            'quote_pending',
            'quote_approved',
            'repair_in_progress',
            'quality_check',
            'ready_for_return',
            'returned',
            'cancelled',
            'closed'
        )
    ),
    CONSTRAINT depot_workshop_repair_orders_metadata_safe_object_check CHECK (
        jsonb_typeof(metadata_safe) = 'object'
    ),
    CONSTRAINT depot_workshop_repair_orders_customer_projection_safe_object_check CHECK (
        jsonb_typeof(customer_projection_safe) = 'object'
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_depot_workshop_repair_orders_org_ref
    ON depot_workshop_repair_orders(organization_id, repair_order_ref);

CREATE UNIQUE INDEX IF NOT EXISTS idx_depot_workshop_repair_orders_org_request
    ON depot_workshop_repair_orders(organization_id, request_id)
    WHERE request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_depot_workshop_repair_orders_org_tenant_status
    ON depot_workshop_repair_orders(organization_id, tenant_id, depot_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_depot_workshop_repair_orders_org_case
    ON depot_workshop_repair_orders(organization_id, case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_depot_workshop_repair_orders_org_depot_intake
    ON depot_workshop_repair_orders(organization_id, depot_intake_id, created_at DESC)
    WHERE depot_intake_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_depot_workshop_repair_orders_org_status
    ON depot_workshop_repair_orders(organization_id, depot_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_depot_workshop_repair_orders_org_assignment
    ON depot_workshop_repair_orders(
        organization_id,
        workshop_id,
        workshop_team_id,
        assigned_technician_id,
        created_at DESC
    )
    WHERE workshop_id IS NOT NULL
       OR workshop_team_id IS NOT NULL
       OR assigned_technician_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_depot_workshop_repair_orders_org_provider_scope
    ON depot_workshop_repair_orders(
        organization_id,
        brand_id,
        service_provider_id,
        subcontractor_organization_id,
        created_at DESC
    )
    WHERE brand_id IS NOT NULL
       OR service_provider_id IS NOT NULL
       OR subcontractor_organization_id IS NOT NULL;

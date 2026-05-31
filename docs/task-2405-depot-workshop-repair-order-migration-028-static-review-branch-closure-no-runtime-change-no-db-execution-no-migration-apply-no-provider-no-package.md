# Task2405 Depot Workshop Repair Order Migration 028 Static Review Branch Closure

## Scope

Task2405 closes the Depot / Workshop repair order migration 028 static-review branch for this phase.

This is a docs-only closure task. It does not change runtime/source/test behavior, modify migration files, execute DB/SQL, run migration dry-run/apply, inspect env/Zeabur/secrets, implement repository adapter behavior, enable route write scope, add provider sending, change packages, start servers, run smoke tests, create formal Field Service Report / Completion Report behavior, or mutate `finalAppointmentId`.

## Accepted Outcomes

Task2401 defined the schema boundary for future Depot / Workshop repair order persistence.

Task2402 authorized future migration file creation and selected the migration 028 scope.

Task2403 created:

- `migrations/028_create_depot_workshop_repair_orders.sql`
- `tests/depotWorkshop/depotWorkshopRepairOrderMigration028.static.test.js`

Task2404 added:

- `tests/depotWorkshop/depotWorkshopRepairOrderMigration028Portfolio.static.test.js`
- the static review portfolio guard for migration 028

## Current Migration 028 Status

Migration file exists:

- `migrations/028_create_depot_workshop_repair_orders.sql`

The migration creates:

- `depot_workshop_repair_orders`

Required columns are present:

- `id`
- `organization_id`
- `tenant_id`
- `case_id`
- `depot_intake_id`
- `repair_order_ref`
- `depot_status`
- `workflow_type`
- `brand_id`
- `service_provider_id`
- `subcontractor_organization_id`
- `workshop_id`
- `workshop_team_id`
- `assigned_technician_id`
- `request_id`
- `created_by_actor_id`
- `updated_by_actor_id`
- `created_at`
- `updated_at`
- `metadata_safe`
- `customer_projection_safe`

The `depot_status` constraint includes the accepted Task2373 statuses:

- `intake_received`
- `diagnosis_pending`
- `diagnosis_completed`
- `quote_pending`
- `quote_approved`
- `repair_in_progress`
- `quality_check`
- `ready_for_return`
- `returned`
- `cancelled`
- `closed`

Expected indexes / unique constraints are present:

- `repair_order_ref` uniqueness within organization scope
- `request_id` idempotency uniqueness within organization scope when present
- organization/tenant/status lookup
- case lookup
- depot intake lookup
- status lookup
- assignment lookup
- brand/service-provider/subcontractor lookup

Safe JSON object checks are present for:

- `metadata_safe`
- `customer_projection_safe`

## Current Safety Status

Forbidden columns remain absent:

- `final_appointment_id`
- formal FSR / Completion Report columns
- FSR / Completion Report approval/publication/finalization columns
- raw customer/private columns
- raw DB row dump columns
- provider payload columns
- billing/settlement/payment/invoice columns
- AI/RAG/vector/raw model output columns
- SQL/stack/token/password/secret/debug payload columns

Route write scope remains blocked.

No repository adapter implementation exists for this migration branch.

No provider sending exists for this migration branch.

No DB execution occurred.

No SQL execution against a DB occurred.

No migration dry-run/apply occurred.

No real DB connection occurred.

No env/Zeabur/secrets were inspected.

## Closed For This Phase

Depot / Workshop migration 028 static review branch is closed for this phase.

This closure authorizes no additional runtime work.

Future DB execution, SQL execution, migration dry-run/apply, disposable DB target, repository adapter implementation, route write scope, provider sending, admin UI, billing, or smoke/staging/prod rollout requires separate exact PM authorization.

## Non-Authorized Future Work

The following future work remains non-authorized:

- disposable DB dry-run authorization packet
- repository adapter design packet
- route write-scope authorization packet
- admin UI design packet
- provider/notification sending
- billing/settlement/payment/invoice implementation
- smoke/staging/prod rollout

## Held Docs

The 7 held historical docs remain outside Task2405 scope and must stay untracked, unstaged, and untouched.

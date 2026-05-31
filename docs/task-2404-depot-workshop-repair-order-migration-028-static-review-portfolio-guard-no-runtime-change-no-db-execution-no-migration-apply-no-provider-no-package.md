# Task2404 Depot Workshop Repair Order Migration 028 Static Review Portfolio Guard

## Scope

Task2404 adds a focused static portfolio guard for the accepted Depot / Workshop repair order migration 028 creation and static SQL review.

This is a no-runtime-change static/docs task. It does not change runtime/source behavior, modify migration files, execute DB/SQL, run migration dry-run/apply, inspect env/Zeabur/secrets, implement repository adapter behavior, enable route write scope, add provider sending, change packages, start servers, run smoke tests, create formal Field Service Report / Completion Report behavior, or mutate `finalAppointmentId`.

## Migration 028 Current Status

`migrations/028_create_depot_workshop_repair_orders.sql` exists as a schema-only migration artifact.

The migration creates:

- `depot_workshop_repair_orders`

The migration remains inert until a future exact PM authorization approves a bounded next step. Task2404 does not authorize applying, dry-running, or connecting this migration to runtime behavior.

## Static SQL Review Status

Task2403 added:

- `tests/depotWorkshop/depotWorkshopRepairOrderMigration028.static.test.js`

Task2404 adds:

- `tests/depotWorkshop/depotWorkshopRepairOrderMigration028Portfolio.static.test.js`

The portfolio guard freezes that the migration still includes:

- required Depot / Workshop repair order columns
- Task2373 `depot_status` values
- `repair_order_ref` uniqueness within organization scope
- `request_id` idempotency uniqueness within organization scope when present
- organization/tenant/status lookup
- case lookup
- depot intake lookup
- status lookup
- assignment lookup
- brand/service-provider/subcontractor lookup
- safe JSON object checks for `metadata_safe` and `customer_projection_safe`

The portfolio guard also freezes that forbidden column families remain absent:

- `final_appointment_id`
- formal Field Service Report columns
- formal Completion Report columns
- FSR / Completion Report approval/publication/finalization columns
- raw customer contact/address/signature/photo/private columns
- raw DB row dump columns
- provider payload columns
- billing/settlement/payment/invoice columns
- AI/RAG/vector/raw model output columns
- SQL/stack/token/password/secret/debug payload columns

## No DB Execution / No Migration Apply Status

No DB/SQL execution occurred.

No migration dry-run/apply occurred.

No real DB connection occurred.

No env/Zeabur/secrets were inspected.

No executable DB command authorization is introduced by Task2404.

## Current Safety Boundaries

Current safety boundaries remain:

- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`
- repository adapter implementation remains non-authorized
- provider/package behavior remains non-authorized
- formal Field Service Report / Completion Report behavior remains non-authorized
- `finalAppointmentId` mutation remains non-authorized
- migration 028 remains schema-only

## Possible Next Tasks

Possible next tasks as non-authorized candidates only:

- migration 028 branch closure
- disposable DB dry-run authorization packet
- repository adapter design packet
- route write-scope authorization packet

These candidates are not authorized by Task2404. Any future work requires separate exact PM authorization.

## Held Docs

The 7 held historical docs remain outside Task2404 scope and must stay untracked, unstaged, and untouched.

# Task2403 Depot Workshop Repair Order Migration File Creation Static SQL Review

## Scope

Task2403 creates the authorized Depot / Workshop repair order migration file and a static SQL review guard.

Created migration file:

- `migrations/028_create_depot_workshop_repair_orders.sql`

Created static review guard:

- `tests/depotWorkshop/depotWorkshopRepairOrderMigration028.static.test.js`

This task creates schema artifacts only. It does not execute DB/SQL, run migration dry-run/apply, inspect env/Zeabur/secrets, implement repository adapter behavior, enable route write scope, add provider sending, change packages, start servers, run smoke tests, create formal Field Service Report / Completion Report behavior, or mutate `finalAppointmentId`.

## Migration 028 Summary

Migration file created but not executed.

The migration creates:

- `depot_workshop_repair_orders`

The table includes:

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

`metadata_safe` and `customer_projection_safe` are sanitized JSON object columns only. They are not raw payload storage.

## Status Constraint

`depot_status` is constrained to the accepted Task2373 state model:

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

## Index And Constraint Coverage

Migration 028 includes:

- `repair_order_ref` uniqueness within organization scope
- `request_id` idempotency uniqueness within organization scope when present
- organization/tenant/status lookup index
- case reference lookup index
- depot intake reference lookup index
- status lookup index
- assignment lookup index
- brand/service-provider/subcontractor scope lookup index
- JSON object checks for `metadata_safe` and `customer_projection_safe`
- non-blank `repair_order_ref` check
- fixed `workflow_type` check

## Explicitly Excluded

Migration 028 does not include:

- `final_appointment_id`
- formal Field Service Report columns
- formal Completion Report columns
- Field Service Report approval/publication/finalization columns
- Completion Report approval/publication/finalization columns
- raw customer contact/address/signature/photo/private columns
- raw DB row dump columns
- provider payload columns
- billing/settlement/payment/invoice columns
- AI/RAG/vector/raw model output columns
- SQL/stack/token/password/secret/debug payload columns

## Non-Execution Record

No DB/SQL execution occurred.

No migration dry-run/apply occurred.

No env/Zeabur/secrets were inspected.

No provider sending occurred.

No package or package-lock changes occurred.

The migration is schema-only and future application requires separate exact PM authorization.

## Static SQL Review Coverage

The static guard asserts:

- migration 028 exists
- migration 028 creates `depot_workshop_repair_orders`
- required columns are present
- `depot_status` constraint includes accepted Task2373 statuses
- expected indexes/unique constraint candidates are present
- forbidden columns are absent
- provider/billing/AI/raw secret payload columns are absent
- formal FSR / Completion Report / finalAppointmentId columns are absent
- Task2401 and Task2402 docs exist
- route write scope remains blocked
- no DB execution / migration apply / migration dry-run authorization is introduced by Task2403

## Recommended Next Bounded Task

Recommended next bounded task as non-authorized only: migration 028 static review portfolio guard.

Reason: Task2403 creates the migration file and a focused static SQL review test. A portfolio guard can close the migration-file creation branch without applying the migration, running DB commands, enabling route write scope, or implementing a repository adapter.

## Held Docs

The 7 held historical docs remain outside Task2403 scope and must stay untracked, unstaged, and untouched.

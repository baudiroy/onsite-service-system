# Task2402 Depot Workshop Repair Order Migration File Creation Authorization Packet

## Scope

Task2402 adds a focused authorization packet for future Depot / Workshop repair order migration file creation.

This is a docs/static-only task. It does not create a migration file, execute DB/SQL, implement repository adapter behavior, change runtime/source behavior, enable route write scope, add provider sending, change packages, start servers, run smoke tests, inspect env/Zeabur/secrets, create formal Field Service Report / Completion Report behavior, or mutate `finalAppointmentId`.

## Migration Inventory

The current repository migration inventory is read-only for this task.

Observed highest migration prefix: `027`.

Current latest migration file:

- `027_create_customer_access_audit_events.sql`

Recommended future migration file name, not created by this task:

- `028_create_depot_workshop_repair_orders.sql`

No file with that name exists in this task.

## Future Migration Target

Primary future migration target:

- table candidate: `depot_workshop_repair_orders`

Out of scope for the future migration file unless separately authorized:

- `depot_workshop_repair_order_events`
- provider sending
- customer publication
- billing/settlement/payment/invoice behavior
- route write-scope behavior
- repository adapter implementation

## Frozen Intended Column Set

The future migration file creation authorization should freeze this intended column set:

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
- optional `metadata_safe`
- optional `customer_projection_safe`

Optional JSON columns must remain sanitized and allowlisted only. They must not become raw payload storage.

## Frozen Future Constraints And Indexes

The future migration should include:

- organization scoping index candidates
- tenant scoping index candidates
- case reference index candidate
- depot intake reference index candidate
- `repair_order_ref` uniqueness within organization scope
- `request_id` idempotency candidate if `request_id` is used
- `depot_status` constraint aligned to Task2373 state model
- assignment lookup index candidates only if needed

Accepted Task2373 statuses for the future `depot_status` constraint:

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

## Explicitly Rejected Future Columns And Behavior

The future migration must not include:

- `final_appointment_id`
- formal Field Service Report columns
- formal Completion Report columns
- Field Service Report approval/publication/finalization columns
- Completion Report approval/publication/finalization columns
- raw customer contact columns
- raw customer address columns
- raw customer signature columns
- raw customer photo columns
- raw customer private data columns
- raw DB row dump columns
- provider payload columns
- billing columns
- settlement columns
- payment columns
- invoice columns
- AI/RAG/vector/raw model output columns
- SQL/stack/token/password/secret/debug payload columns

## Preconditions Before Future Migration File Creation

Before any future migration file is created, the project needs separate exact PM authorization for:

- migration file creation
- final migration number/name
- final table name
- final column set
- final constraint and index list
- whether optional `metadata_safe` is included
- whether optional `customer_projection_safe` is included

The future migration file creation task must still have:

- no DB execution
- no migration dry-run/apply
- no production DB use
- no staging/shared DB use
- no `DATABASE_URL`, env, Zeabur, or secrets inspection
- no secrets printing

## Recommended Next Bounded Task

Recommended next bounded task: migration file creation with static tests only.

Reason: Task2401 defined the schema boundary and Task2402 freezes the migration file name/scope. The next bounded step can create the migration file and static SQL-review tests, while still forbidding DB execution, migration dry-run/apply, provider sending, route write scope, and runtime/source behavior changes.

## Static Guard Coverage

Task2402 adds:

- `tests/depotWorkshop/depotWorkshopRepairOrderMigrationFileCreationAuthorization.static.test.js`

The static guard asserts:

- Task2401 schema design packet exists
- this Task2402 authorization packet exists
- no migration file is added by Task2402
- no SQL execution command is introduced as executable authorization
- recommended future migration file name is documented
- target table and core columns are documented
- forbidden columns are rejected
- status constraint references accepted Task2373 statuses
- Task2398 repository contract remains visible
- route write scope remains blocked
- DB/migration execution/provider/package/formal-report/finalAppointmentId behavior remains non-authorized

## Non-Authorization

Task2402 does not authorize:

- runtime/source behavior changes
- migration file creation
- repository implementation changes
- DB adapter implementation
- route write-scope behavior
- route response source changes
- route wiring changes
- route path or mount changes
- helper wiring into existing runtime
- permission changes
- service behavior changes
- controller creation
- new DB behavior
- DB commands
- SQL execution
- real DB connection
- migration dry-run or apply
- `DATABASE_URL`, Zeabur, env, or secrets inspection
- server/listener startup
- smoke test execution
- endpoint probes
- shared runtime
- deploy
- staging/prod traffic
- `/healthz`
- provider sending
- package or package-lock changes
- auth/session middleware changes
- permission model changes, role expansion, or organization isolation source changes
- AI/RAG/OpenAI/vector DB runtime behavior
- admin frontend behavior
- billing/settlement/payment/invoice behavior
- Customer Access runtime behavior changes
- Engineer Mobile runtime behavior changes
- Repair Intake runtime behavior changes
- formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior
- `finalAppointmentId` mutation path

## Held Docs

The 7 held historical docs remain outside Task2402 scope and must stay untracked, unstaged, and untouched.

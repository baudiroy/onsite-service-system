# Task2401 Depot Workshop Repair Order Migration Schema Design Packet

## Scope

Task2401 adds a focused migration/schema design packet for future Depot / Workshop repair order persistence.

This is a docs/static-only design task. It does not create a migration file, execute DB/SQL, implement a repository adapter, change runtime/source behavior, enable route write scope, add provider sending, change packages, start servers, run smoke tests, inspect env/Zeabur/secrets, create formal Field Service Report / Completion Report behavior, or mutate `finalAppointmentId`.

## Current Inputs

The design follows:

- Task2397 repository/migration authorization packet
- Task2398 pure repository contract helper
- Task2399 repository contract static portfolio guard
- Task2400 repository contract branch closure
- `src/depotWorkshop/depotWorkshopRepairOrderRepositoryContract.js`
- `src/depotWorkshop/depotWorkshopRepairOrderStateModel.js`
- `docs/design/depot-workshop-repair.md`
- current migrations directory read-only inventory

No dedicated Depot / Workshop repair order migration exists in the current migration directory.

## Future Table Candidates

Primary future table candidate:

- `depot_workshop_repair_orders`

Optional future audit/event table:

- out of scope for this design packet
- any future `depot_workshop_repair_order_events` table requires separate exact PM authorization
- existing helper-level audit intent remains internal/sanitized and is not a formal report approval event

## Suggested Columns

Suggested columns for a future `depot_workshop_repair_orders` table:

- `id`: repair order primary key
- `organization_id`: required organization isolation scope
- `tenant_id`: optional tenant isolation scope
- `case_id`: Case reference
- `depot_intake_id`: Repair Intake draft / Depot intake source reference
- `repair_order_ref`: customer/admin-safe repair order reference
- `depot_status`: Depot / Workshop repair order status
- `workflow_type`: depot-style workflow discriminator
- `brand_id`: optional brand scope
- `service_provider_id`: optional service-provider scope
- `subcontractor_organization_id`: optional subcontractor scope
- `workshop_id`: optional workshop assignment scope
- `workshop_team_id`: optional workshop team scope
- `assigned_technician_id`: optional assigned technician scope
- `request_id`: request/idempotency correlation
- `created_by_actor_id`: creator actor reference
- `updated_by_actor_id`: last updater actor reference
- `created_at`: creation timestamp
- `updated_at`: update timestamp
- `metadata_safe`: optional sanitized JSON metadata, allowlisted only
- `customer_projection_safe`: optional sanitized JSON customer projection preview, allowlisted only

Sanitized JSON columns are optional. If used, they must remain bounded to allowlisted helper output and must not become raw payload storage.

## Status Constraint

`depot_status` must align with the accepted Task2373 state model:

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

Any future migration file must encode the accepted state model without inventing new statuses.

## Constraint And Index Design

Future schema design should include:

- organization scoping on `organization_id`
- tenant scoping on `tenant_id` when present
- Case reference on `case_id`
- Depot intake reference on `depot_intake_id`
- repair order reference uniqueness within organization scope, using `organization_id` plus `repair_order_ref`
- idempotency candidate using `organization_id` plus `request_id` when `request_id` is present
- lookup index candidate for `organization_id`, `tenant_id`, `depot_status`
- lookup index candidate for `organization_id`, `case_id`
- lookup index candidate for `organization_id`, `depot_intake_id`
- optional assignment lookup candidate for `organization_id`, `workshop_id`, `workshop_team_id`, `assigned_technician_id`

The final index set must be separately authorized before a migration file is created.

## Explicitly Rejected Columns

The future table must not include:

- `final_appointment_id`
- `field_service_report_id`
- `field_service_report`
- `completion_report_id`
- `completion_report`
- formal Field Service Report approval/publication/finalization columns
- formal Completion Report approval/publication/finalization columns
- raw customer contact columns
- raw customer address columns
- raw customer signature columns
- raw customer photo columns
- raw customer private data columns
- raw DB row columns
- provider payload columns
- billing payload columns
- settlement payload columns
- payment payload columns
- invoice payload columns
- AI raw output columns
- RAG/vector payload columns
- SQL, stack, token, password, secret, or debug payload columns

## Repository Contract Alignment

The schema design remains downstream of the accepted Task2398 pure repository contract:

- trusted `organizationId` maps to `organization_id`
- trusted `tenantId` maps to `tenant_id` when present
- trusted `caseId` maps to `case_id`
- trusted `depotIntakeId` maps to `depot_intake_id`
- trusted `repairOrderId` or generated storage identity maps to `id` or `repair_order_ref` depending on future adapter design
- exact action remains `depot_workshop.assignment_intent.write`
- repository result `written` remains repository-result-only and does not authorize route write scope

Task2401 does not implement that adapter mapping.

## Future Migration Prerequisites

Before any migration file exists, the project must have separate exact PM authorization for:

- migration file creation
- final table name and column list
- final constraint and index list
- rollback/drop policy
- disposable DB dry-run authorization
- approved disposable DB tooling

Before any apply or validation:

- no production DB without explicit authorization
- no staging/shared DB without explicit authorization
- no `DATABASE_URL` printing
- no secrets printing
- no unbounded DB command

## Recommended Next Bounded Task

Recommended next bounded task: migration file creation authorization packet.

Reason: the repository contract is closed, and this schema design packet defines the future table/column/constraint boundary. The next safe step is still not to create the migration, but to ask PM to authorize whether a migration file may be created and what final migration number/name should be used.

## Static Guard Coverage

Task2401 adds:

- `tests/depotWorkshop/depotWorkshopRepairOrderMigrationSchemaDesign.static.test.js`

The static guard asserts:

- this design packet exists
- no migration file is added by Task2401
- no SQL execution command is introduced as executable authorization
- table candidate and core columns are documented
- forbidden columns are explicitly rejected
- status constraint references the accepted Task2373 state model
- Task2398 repository contract remains visible
- route write scope remains blocked
- DB/migration/provider/package/formal-report/finalAppointmentId behavior remains non-authorized

## Non-Authorization

Task2401 does not authorize:

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

The 7 held historical docs remain outside Task2401 scope and must stay untracked, unstaged, and untouched.

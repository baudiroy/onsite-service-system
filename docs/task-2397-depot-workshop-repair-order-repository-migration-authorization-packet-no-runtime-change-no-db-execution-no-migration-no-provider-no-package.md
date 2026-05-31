# Task2397 Depot Workshop Repair Order Repository Migration Authorization Packet

## Scope

Task2397 creates a docs/static-only repository and migration authorization packet for future Depot / Workshop repair order persistence.

This task does not change runtime/source behavior, helper implementation, helper wiring, route write-scope behavior, route response source, route wiring, route path or mount, permission, service behavior, controllers, repositories, DB behavior, migrations, provider sending, package dependencies, smoke tests, endpoint probes, server/listener startup, deploy, staging/prod traffic, billing, AI/RAG, Customer Access, Engineer Mobile, Repair Intake, formal Field Service Report / Completion Report, or final appointment behavior.

## Current Persistence State

The current persistence state is:

- `src/repositories/DepotIntakeSqlRepositoryAdapter.js` is the only Depot / Workshop repository-adjacent adapter in this branch.
- `DepotIntakeSqlRepositoryAdapter` is read-only for accepted behavior.
- `DepotIntakeSqlRepositoryAdapter` uses an injected DB client with `query` or `execute`.
- `DepotIntakeSqlRepositoryAdapter` reads existing `repair_intake_drafts` only.
- `DepotIntakeSqlRepositoryAdapter` selects safe Repair Intake draft fields only: `id`, `organization_id`, `tenant_id`, `draft_status`, `source`, `source_ref`, `intake_source`, `safe_summary`, `safe_metadata`, `validation_status`, `validation_errors_safe`, `created_at`, and `updated_at`.
- `DepotIntakeSqlRepositoryAdapter` returns `written: false` on failure and read success.
- `recordDepotIntakeIntent` remains denied by `depot_intake_write_scope_not_approved`.
- No dedicated Depot / Workshop repair order repository implementation exists.
- No dedicated Depot / Workshop migration exists.
- Current route write scope remains blocked by `depot_repair_route_write_scope_not_approved`.
- `WorkshopAssignmentService` remains prepare-only and returns `written: false`.
- `WorkshopAssignmentService` uses `depotIntakeRepository.findDepotIntakeState` as the only repository call.
- The pure write command helper exists at `src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.js`.
- The pure write command helper remains unwired into routes, services, controllers, repositories, DB, migrations, and provider sending.

## Existing Migration Inventory

The current migration directory contains no dedicated Depot / Workshop repair order migration and no dedicated workshop job migration.

The only repair-related persistence migration currently present is Repair Intake migration `026_create_repair_intake_persistence_tables.sql`, which is not a Depot / Workshop repair order repository schema.

Task2397 does not add, edit, dry-run, or apply any migration file.

## Future Repository Contract Prerequisites

A future Depot / Workshop repair order repository contract must be authorized before implementation. It should define:

- exact entity/table candidate: `depot_workshop_repair_orders`
- optional future child/audit table candidate only if separately justified: `depot_workshop_repair_order_events`
- required organization isolation column: `organization_id`
- optional tenant isolation column: `tenant_id`
- optional brand isolation column: `brand_id`
- optional service-provider isolation column: `service_provider_id`
- optional subcontractor isolation column: `subcontractor_organization_id`
- Case reference: `case_id`
- Repair Intake draft reference: `depot_intake_id` or `repair_intake_draft_id`
- Repair order primary reference: `repair_order_id`
- workflow type constrained to depot-style workflows: `depot`, `carry_in`, `mail_in`, or `pickup_delivery`
- status column constrained to the Task2373 state model: `intake_received`, `diagnosis_pending`, `diagnosis_completed`, `quote_pending`, `quote_approved`, `repair_in_progress`, `quality_check`, `ready_for_return`, `returned`, `cancelled`, or `closed`
- assignment references: `workshop_id`, `workshop_team_id`, `assigned_technician_id`, and `assignment_relationship`
- safe item/product/issue references only, not raw customer data
- audit relationship through a safe internal event reference or event table if needed
- customer projection storage boundary only for allowlisted customer-visible projection fields
- idempotency/write command boundary for `depot_workshop.assignment_intent.write`
- explicit `written: false` to `written: true` transition rules for future repository results
- failure-safe reason codes that do not expose SQL, stack, token, provider payload, or raw customer data

## Future Migration Design Prerequisites

A future migration/schema authorization packet must come after the repository contract and before implementation. It must define:

- table name and ownership
- primary key and idempotency key strategy
- organization and tenant isolation indexes
- Case and Repair Intake reference constraints or documented nullable transition strategy
- status constraint aligned with Task2373
- timestamps and actor audit columns
- internal-only JSON boundaries if any
- customer projection storage policy if any
- audit event relationship if any
- rollback and stop conditions
- disposable DB dry-run command plan only after explicit DB authorization/tooling

No migration file may be created by this packet.

## Formal Completion Boundaries

Future repository or migration work must preserve these hard boundaries:

- no formal Field Service Report mutation
- no Completion Report creation, approval, publication, finalization, or mutation
- no `finalAppointmentId` mutation
- no appointment completion mutation
- no provider sending
- no billing, payment, invoice, settlement, or warranty decision
- no AI/RAG/OpenAI/vector DB runtime behavior
- no customer publication from internal projection previews

Depot / Workshop repair order persistence remains an operational/internal workflow boundary until a separate customer-facing publication task is explicitly authorized.

## Future Implementation Order

The required future implementation order is:

1. repository contract first
2. migration/schema authorization packet second
3. disposable DB dry-run only with explicit DB authorization and approved tooling
4. repository adapter implementation only after contract plus migration design
5. route write scope only after repository/DB readiness and separate PM authorization

Route write scope must not be implemented directly from this packet.

## Candidate Next Tasks

Option A: pure repository contract helper/interface.

- Defines repository method names, inputs, safe result envelopes, idempotency keys, and `written` transition semantics.
- Can stay no-DB/no-route/no-runtime.
- Best fit because no dedicated Depot / Workshop repair order repository contract exists yet.

Option B: migration/schema design packet.

- Defines table shape and indexes.
- Too early until the repository contract names the exact persistence boundary.

Option C: route write scope implementation.

- Not ready because repository contract, migration design, DB dry-run, and repository adapter do not exist.

Option D: keep persistence blocked.

- Safest operational state but does not advance the next boundary.

Recommended next bounded task: pure repository contract helper/interface static guard.

## Static Guard Coverage

Task2397 adds:

- `tests/depotWorkshop/depotWorkshopRepairOrderRepositoryMigrationAuthorization.static.test.js`

The static guard reads current files only and asserts:

- this packet exists
- current read-only repository adapter remains read-only
- route write scope denial marker remains visible
- `written: false` remains visible
- pure write command helper remains unwired
- no migration file is added by Task2397
- no repository implementation is added by Task2397
- no DB/migration/provider/package/formal-report authorization is introduced

## Non-Authorization

Task2397 does not authorize:

- runtime/source behavior changes
- helper implementation changes
- helper wiring changes
- route write-scope behavior
- route response source changes
- route wiring changes
- route path or mount changes
- permission changes
- service behavior changes
- controller creation
- repository implementation
- new DB behavior
- DB commands
- SQL execution
- real DB connection
- migration creation
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

The 7 held historical docs remain outside Task2397 scope and must stay untracked, unstaged, and untouched.

# Task1911 Workshop Assignment Service

Status: implemented and verified locally with injected dependencies and synthetic tests only. No real DB connection, SQL execution, migration, seed, smoke, Zeabur action, deploy, runtime server start, route mount, provider sending, billing, AI/RAG execution, customer-visible depot/workshop publication, admin frontend, package, or lockfile changes were made for this task.

## Scope

Task1911 adds a prepare-only Workshop Assignment Service for depot/workshop repair assignment intent validation.

Changed files:

- `src/services/WorkshopAssignmentService.js`
- `tests/depotWorkshop/workshopAssignmentService.unit.test.js`
- `tests/depotWorkshop/workshopAssignmentService.static.test.js`
- `docs/task-1911-workshop-assignment-service.md`

## Boundary Contract

Service kind:

- `depot_workshop.workshop_assignment_service`

Factory:

- `createWorkshopAssignmentService(options)`

The service uses injected dependencies only. It accepts an injected `depotIntakeRepository` with `findDepotIntakeState(input)` and returns normalized allow/deny envelopes from `prepareAssignmentIntent(input)`.

The service does not import app/server/runtime modules, does not construct a DB pool, does not read `DATABASE_URL`, does not run SQL directly, and does not mount a route.

## Prepare-Only Behavior

Task1911 does not approve a write schema. The service prepares assignment intent only and returns `written: false`.

Any request that attempts to write or persist fails closed with:

- `workshop_assignment_write_scope_not_approved`

## Required Controls

The service enforces:

- organization isolation
- optional tenant isolation
- brand/service-provider scope
- depot/workshop workflow eligibility
- depot status eligibility
- workshop assignment permission
- subcontractor assignment relationship scope
- customer-sensitive data minimization

Eligible depot/workshop statuses are intentionally narrow:

- `intake_received`
- `diagnosis_pending`
- `diagnosis_completed`
- `quote_pending`
- `quote_approved`
- `repair_in_progress`
- `quality_check`

Closed, returned, cancelled, unsupported, or onsite workflow states are not assignable through this service.

## Sanitized Output

Successful preparation returns a bounded `assignmentIntent` only, including:

- depot intake id
- organization id
- tenant id
- workflow type
- depot status
- brand id
- service provider id
- safe item/product/issue references
- workshop/team/technician/subcontractor ids
- assignment note
- assigning actor id
- request id

The service does not expose raw DB rows, raw customer/contact data, raw phone/address, provider payloads, tokens, SQL, stack traces, secrets, billing internals, or AI output.

## Safety Boundaries

- Injected dependencies only.
- Synthetic tests only.
- No real DB connection.
- No DATABASE_URL usage.
- No global pool construction.
- No SQL execution.
- No migration execution.
- No seed execution.
- No runtime start.
- No route mount.
- No smoke execution.
- No Zeabur/deploy action.
- No provider sending.
- No LINE, SMS, email, app push, or webhook execution.
- No billing/AI/RAG execution.
- No customer-visible depot/workshop publication behavior.
- No subcontractor customer-sensitive data exposure.
- No Completion Report / Field Service Report creation.
- No Completion Report / Field Service Report approval, publish, revoke, or mutation.
- No finalAppointmentId mutation.
- No admin frontend/package/lockfile changes.

## Verification

Targeted Task1911 tests:

- `node --test tests/depotWorkshop/workshopAssignmentService.unit.test.js tests/depotWorkshop/workshopAssignmentService.static.test.js`

Related depot/workshop boundary tests:

- `node --test tests/depotWorkshop/depotRepairStatusBoundary.unit.test.js tests/depotWorkshop/depotRepairStatusBoundary.static.test.js`
- `node --test tests/depotWorkshop/depotIntakeSqlRepositoryAdapter.unit.test.js tests/depotWorkshop/depotIntakeSqlRepositoryAdapterBoundary.static.test.js`

Static syntax/check fallback when npm is unavailable:

- `find src -name '*.js' -print0 | xargs -0 -n1 node --check`

Project check:

- `npm run check`

If `npm` is unavailable in the active shell, the npm check cannot run there; the static syntax fallback above is the documented replacement for this task.

## Next Task Recommendation

After PM acceptance, Task1912 may proceed only if PM explicitly scopes it. Any real depot/workshop write schema, migration, DB apply, seed, Zeabur/deploy action, route mount, smoke test, provider sending, billing/AI/RAG execution, customer-visible publication, Completion Report / Field Service Report behavior, `finalAppointmentId` mutation, or subcontractor customer-sensitive data exposure still requires a separate explicit gate.

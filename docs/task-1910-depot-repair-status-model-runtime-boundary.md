# Task1910 Depot Repair Status Model Runtime Boundary

Status: implemented and verified locally with pure synthetic tests only. No real DB connection, migration, seed, smoke, Zeabur action, deploy, runtime server start, route mount, provider sending, billing, AI/RAG execution, customer-visible publication, admin frontend, package, or lockfile changes were made for this task.

## Scope

Task1910 adds a pure status boundary for Depot / Workshop Repair lifecycle transitions.

Changed files:

- `src/guards/DepotRepairStatusBoundary.js`
- `tests/depotWorkshop/depotRepairStatusBoundary.unit.test.js`
- `tests/depotWorkshop/depotRepairStatusBoundary.static.test.js`
- `docs/task-1910-depot-repair-status-model-runtime-boundary.md`

## Boundary Contract

Boundary kind:

- `depot_workshop.depot_repair_status_boundary`

Pure function:

- `evaluateDepotRepairStatusTransition(input)`

The boundary accepts synthetic status transition inputs and returns a normalized allow/deny envelope. It does not import runtime modules and does not connect to DB, routes, app/server, providers, AI, billing, or Zeabur.

## Supported Workflows

The boundary is limited to explicitly scoped depot/workshop workflow types:

- `depot`
- `carry_in`
- `mail_in`
- `pickup_delivery`

Any onsite workflow type or mismatched explicit/depot intake workflow type fails closed.

## Supported Depot Statuses

The status model includes:

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

Allowed transitions are intentionally narrow and depot-specific. Closed/cancelled/finalized states fail closed.

## Safety Boundaries

The status model is separate from onsite appointment completion and formal Completion Report / Field Service Report state.

The boundary fail-closes for:

- missing actor
- missing organization
- organization mismatch
- unsupported workflow type
- workflow type mismatch
- unknown current status
- unsupported target status
- invalid transition
- closed/cancelled/finalized depot state
- forbidden mutation intent fields

Forbidden mutation intent fields include:

- `finalAppointmentId`
- Completion Report / Field Service Report fields
- provider payload fields
- customer-visible publication fields
- billing fields
- AI output fields

## Success Envelope

A valid transition returns only a bounded internal transition intent:

- depot intake id
- organization id
- workflow type
- actor id
- current status
- target status
- request id

The returned mutation intent is limited to:

- `depotStatus`
- `updatedBy`

It does not include appointment status, case status, Completion Report / Field Service Report fields, `finalAppointmentId`, provider payloads, customer-visible publication fields, billing internals, or AI output.

## Safety Properties

- Pure status boundary.
- Synthetic tests only.
- No real DB connection.
- No DATABASE_URL usage.
- No global pool construction.
- No app/server import.
- No migration execution.
- No runtime start.
- No route mount.
- No seed execution.
- No smoke execution.
- No Zeabur/deploy action.
- No provider sending.
- No LINE, SMS, email, app push, or webhook execution.
- No billing/AI/RAG execution.
- No customer-visible publication behavior.
- No assignment, appointment, case, or depot/workshop mutation in real runtime.
- No Completion Report / Field Service Report creation.
- No finalAppointmentId mutation.
- No admin frontend/package/lockfile changes.

## Verification

Targeted tests:

- `node --test tests/depotWorkshop/depotRepairStatusBoundary.unit.test.js tests/depotWorkshop/depotRepairStatusBoundary.static.test.js`

Related depot/workshop tests:

- `node --test tests/depotWorkshop/depotIntakeSqlRepositoryAdapter.unit.test.js tests/depotWorkshop/depotIntakeSqlRepositoryAdapterBoundary.static.test.js`

Static syntax/check fallback when npm is unavailable:

- `find src -name '*.js' -print0 | xargs -0 -n1 node --check`

Project check:

- `npm run check`

If `npm` is unavailable in the active shell, the npm check cannot run there; the static syntax fallback above is the documented replacement for this task.

## Next Task Recommendation

Task1911 can add a Workshop Assignment Service using injected dependencies only after PM acceptance. It should use the Task1910 status boundary and Task1909 depot intake boundary, keep write behavior fail-closed unless explicitly approved, and keep DB, migration, seed, smoke, Zeabur/deploy, provider sending, AI/RAG, billing, Completion Report / Field Service Report, `finalAppointmentId`, customer-visible publication, and subcontractor-sensitive-data exposure behind separate explicit gates.

# Task1915 Depot Workshop Audit Log Boundary

Status: implemented and verified locally with injected audit writer and synthetic tests only. No real DB connection, SQL execution, migration, seed, smoke, Zeabur action, deploy, runtime server start, provider sending, billing, AI/RAG execution, depot/workshop record mutation, customer-visible depot/workshop publication mutation, admin frontend, package, or lockfile changes were made for this task.

## Scope

Task1915 adds an internal-only audit boundary for depot/workshop status, assignment, route, and access decisions.

Changed files:

- `src/depotWorkshop/depotWorkshopAuditBoundary.js`
- `tests/depotWorkshop/depotWorkshopAuditBoundary.unit.test.js`
- `tests/depotWorkshop/depotWorkshopAuditBoundary.static.test.js`
- `docs/task-1915-depot-workshop-audit-log-boundary.md`

## Boundary Contract

Boundary kind:

- `depot_workshop.audit_boundary`

Event kind:

- `depot_workshop.audit_event`

Functions:

- `buildDepotWorkshopAuditEvent(input)`
- `createDepotWorkshopAuditBoundary(options)`

The boundary uses an injected audit writer only. It does not import DB, app/server, route, migration, provider, AI, billing, or runtime internals.

## Safe Internal Metadata

Audit events are internal-only and customer-invisible:

- `internalOnly: true`
- `customerVisible: false`

Audit metadata may include only safe scoped fields:

- event/action type
- organizationId
- depotIntakeId / depotRepairId
- caseId / draftId when already safe and scoped
- brandId / serviceProviderId / subcontractorId
- actorId
- requestId
- status / assignment / access / permission / route decision metadata
- occurredAt

## Excluded Data

The audit boundary fails closed before writer invocation when forbidden fields are present, including:

- raw DB rows
- raw customer/contact data
- raw phone/address
- subcontractor-forbidden customer-sensitive fields
- provider payloads/tokens
- DATABASE_URL/JWT_SECRET/secrets
- stack traces / SQL
- billing internals
- AI output
- Completion Report / Field Service Report internals
- finalAppointmentId
- customer-visible report body

Audit writer failures are sanitized and do not expose raw errors.

## Safety Properties

- Injected audit writer.
- Synthetic tests only.
- Internal-only audit event.
- No real DB connection.
- No DATABASE_URL usage.
- No global pool construction.
- No SQL execution.
- No migration execution.
- No seed execution.
- No runtime start.
- No depot/workshop smoke.
- No Zeabur/deploy action.
- No provider sending.
- No LINE, SMS, email, app push, or webhook execution.
- No billing/AI/RAG execution.
- No depot/workshop record mutation.
- No appointment lifecycle mutation.
- No finalAppointmentId mutation.
- No Completion Report / Field Service Report behavior.
- No customer-visible depot/workshop publication behavior beyond filtered DTO policy.
- No subcontractor customer-sensitive data exposure.
- No admin frontend/package/lockfile changes.

## Verification

Targeted Task1915 tests:

- `node --test tests/depotWorkshop/depotWorkshopAuditBoundary.unit.test.js tests/depotWorkshop/depotWorkshopAuditBoundary.static.test.js`

Related depot/workshop tests:

- `node --test tests/depotWorkshop/depotRepairCustomerVisibleDataFilter.unit.test.js tests/depotWorkshop/depotRepairCustomerVisibleDataFilter.static.test.js`
- `node --test tests/depotWorkshop/depotRepairRoutePermissionGuard.unit.test.js tests/depotWorkshop/depotRepairRoutePermissionGuard.static.test.js`
- `node --test tests/depotWorkshop/depotAccessScopeGuard.unit.test.js tests/depotWorkshop/depotAccessScopeGuard.static.test.js`
- `node --test tests/depotWorkshop/workshopAssignmentService.unit.test.js tests/depotWorkshop/workshopAssignmentService.static.test.js`
- `node --test tests/depotWorkshop/depotRepairStatusBoundary.unit.test.js tests/depotWorkshop/depotRepairStatusBoundary.static.test.js`
- `node --test tests/depotWorkshop/depotIntakeSqlRepositoryAdapter.unit.test.js tests/depotWorkshop/depotIntakeSqlRepositoryAdapterBoundary.static.test.js`

Static syntax/check fallback when npm is unavailable:

- `find src -name '*.js' -print0 | xargs -0 -n1 node --check`

Project check:

- `npm run check`

If `npm` is unavailable in the active shell, the npm check cannot run there; the static syntax fallback above is the documented replacement for this task.

## Next Task Recommendation

After PM acceptance, sync Task1914/1915 first. Task1916 must not start without the next explicit PM batch. Any real DB, migration, seed, smoke, Zeabur/deploy action, provider sending, billing/AI/RAG execution, appointment lifecycle mutation, depot/workshop record mutation, Completion Report / Field Service Report behavior, `finalAppointmentId`, customer-visible publication behavior beyond filtered DTO policy, or subcontractor-sensitive-data exposure still requires a separate explicit gate.

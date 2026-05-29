# Task1914 Depot Repair Customer-visible Data Filter

Status: implemented and verified locally with a pure filter and synthetic tests only. No real DB connection, SQL execution, migration, seed, smoke, Zeabur action, deploy, runtime server start, route mount changes, provider sending, billing, AI/RAG execution, customer-visible depot/workshop publication mutation, admin frontend, package, or lockfile changes were made for this task.

## Scope

Task1914 adds a depot/workshop customer-visible data filter that projects already-provided synthetic depot repair input into a safe customer-facing DTO.

Changed files:

- `src/depotWorkshop/depotRepairCustomerVisibleDataFilter.js`
- `tests/depotWorkshop/depotRepairCustomerVisibleDataFilter.unit.test.js`
- `tests/depotWorkshop/depotRepairCustomerVisibleDataFilter.static.test.js`
- `docs/task-1914-depot-repair-customer-visible-data-filter.md`

## Boundary Contract

Filter kind:

- `depot_workshop.customer_visible_data_filter`

DTO type:

- `depot_repair_customer_visible`

Pure function:

- `buildDepotRepairCustomerVisibleDto(input)`

The filter only selects safe fields from already-provided input. It does not publish, create, approve, revoke, or mutate any customer-visible depot/workshop state.

## Safe DTO Fields

The customer-visible DTO allows only:

- `customerRepairReference`
- `workflowType`
- `displayStatus`
- `statusSummary`
- `issueSummary`
- `workSummary`
- `nextCustomerAction`
- `estimatedReadyAt`
- `readyForReturnAt`
- `returnedAt`
- `lastCustomerUpdateAt`
- `supportContactHint`

These are policy-level DTO fields only. They remain separate from formal Completion Report / Field Service Report projections.

## Excluded Data

The filter excludes:

- raw DB rows
- internal notes
- technician/internal repair notes
- brand/provider/subcontractor internal notes
- subcontractor customer-sensitive fields
- raw phone/address
- provider payloads/tokens
- DATABASE_URL/JWT_SECRET/secrets
- stack traces / SQL
- billing internals
- AI output
- finalAppointmentId
- formal Completion Report / Field Service Report internals
- assignment internals not explicitly safe

Allowed-field text containing unsafe markers is also rejected.

## Safety Properties

- Pure filter.
- Synthetic tests only.
- No real DB connection.
- No DATABASE_URL usage.
- No global pool construction.
- No SQL execution.
- No migration execution.
- No seed execution.
- No runtime start.
- No route mount changes.
- No depot/workshop smoke.
- No Zeabur/deploy action.
- No provider sending.
- No LINE, SMS, email, app push, or webhook execution.
- No billing/AI/RAG execution.
- No appointment lifecycle mutation.
- No finalAppointmentId mutation.
- No Completion Report / Field Service Report behavior.
- No customer-visible depot/workshop publication behavior beyond filtered DTO policy.
- No subcontractor customer-sensitive data exposure.
- No admin frontend/package/lockfile changes.

## Verification

Targeted Task1914 tests:

- `node --test tests/depotWorkshop/depotRepairCustomerVisibleDataFilter.unit.test.js tests/depotWorkshop/depotRepairCustomerVisibleDataFilter.static.test.js`

Related depot/workshop tests:

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

After PM acceptance, Task1915 can add a depot/workshop audit boundary using injected audit writer dependencies only. It must keep real DB, migration, seed, smoke, Zeabur/deploy, provider sending, billing/AI/RAG execution, appointment lifecycle mutation, depot/workshop record mutation, Completion Report / Field Service Report behavior, `finalAppointmentId`, customer-visible publication behavior beyond filtered DTO policy, and subcontractor-sensitive-data exposure behind separate explicit gates.

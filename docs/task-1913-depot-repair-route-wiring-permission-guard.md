# Task1913 Depot Repair Route Wiring / Permission Guard

Status: implemented and verified locally with synthetic route tests only. No real DB connection, SQL execution, migration, seed, smoke, Zeabur action, deploy, runtime server start, provider sending, billing, AI/RAG execution, customer-visible depot/workshop publication, admin frontend, package, or lockfile changes were made for this task.

## Scope

Task1913 adds a depot repair route boundary/registrar with permission guard, access guard, injected service handling, and sanitized safe-deny envelopes.

Changed files:

- `src/routes/depotRepair.routes.js`
- `tests/depotWorkshop/depotRepairRoutePermissionGuard.unit.test.js`
- `tests/depotWorkshop/depotRepairRoutePermissionGuard.static.test.js`
- `docs/task-1913-depot-repair-route-wiring-permission-guard.md`

## Route Boundary

Route path:

- `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`

Permission:

- `depot.repair.prepare`

The route registrar mounts this route only when an injected depot/workshop service is provided. The route module is not wired into the app router in this task.

## Permission and Access Order

The route registration order is:

1. `requirePermission('depot.repair.prepare')`
2. depot repair handler
3. access guard evaluation before injected service call
4. injected service prepare call

This preserves permission guard before handler/service and keeps the route from bypassing the Task1912 access guard.

## Injected Services Only

The route handler accepts injected services only:

- `depotRepairService.prepareDepotRepairRouteIntent(input)`
- `workshopAssignmentService.prepareAssignmentIntent(input)`
- compatible function injection

It does not import DB, migration, provider, AI, billing, or runtime internals.

## Safe Failure Boundaries

The route fails closed for:

- missing injected service
- missing/invalid permission
- access guard denial
- organization/brand/service-provider/subcontractor scope denial
- write scope not approved
- invalid depot/workshop status surfaced by injected service
- service failure
- missing depot intake/workshop item surfaced by injected service

Write scope is not approved in this task. Any write/persist intent returns:

- `depot_repair_route_write_scope_not_approved`

## Sanitized Output

Route responses are normalized and sanitized. They do not expose:

- raw DB rows
- raw customer/contact data
- raw phone/address
- subcontractor-forbidden customer-sensitive fields
- provider payloads/tokens
- SQL/stack traces/secrets
- finalAppointmentId
- FSR internals
- billing internals
- AI output

Successful route responses return only a bounded prepared depot repair intent from the injected service and always report `written: false`.

## Safety Properties

- Synthetic route tests only.
- Injected services only.
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
- No appointment lifecycle mutation.
- No finalAppointmentId mutation.
- No Completion Report / Field Service Report behavior.
- No customer-visible depot/workshop publication behavior.
- No subcontractor customer-sensitive data exposure.
- No admin frontend/package/lockfile changes.

## Verification

Targeted Task1913 tests:

- `node --test tests/depotWorkshop/depotRepairRoutePermissionGuard.unit.test.js tests/depotWorkshop/depotRepairRoutePermissionGuard.static.test.js`

Related depot/workshop route/access tests:

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

After PM acceptance, sync Task1912/1913 first. Task1914 must not start without the next explicit PM batch. Any real DB, migration, seed, smoke, Zeabur/deploy action, provider sending, billing/AI/RAG execution, appointment lifecycle mutation, Completion Report / Field Service Report behavior, `finalAppointmentId` mutation, customer-visible publication, or subcontractor-sensitive-data exposure still requires a separate explicit gate.

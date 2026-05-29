# Task1912 Brand / Service Provider / Subcontractor Access Guard

Status: implemented and verified locally with a pure guard and synthetic tests only. No real DB connection, SQL execution, migration, seed, smoke, Zeabur action, deploy, runtime server start, route mount, provider sending, billing, AI/RAG execution, customer-visible depot/workshop publication, admin frontend, package, or lockfile changes were made for this task.

## Scope

Task1912 adds a depot/workshop access scope guard for brand, service provider, and subcontractor visibility boundaries.

Changed files:

- `src/guards/DepotAccessScopeGuard.js`
- `tests/depotWorkshop/depotAccessScopeGuard.unit.test.js`
- `tests/depotWorkshop/depotAccessScopeGuard.static.test.js`
- `docs/task-1912-brand-service-provider-subcontractor-access-guard.md`

## Boundary Contract

Guard kind:

- `depot_workshop.access_scope_guard`

Pure function:

- `evaluateDepotAccessScope(input)`

The guard evaluates synthetic actor/access/resource context and returns a normalized allow/deny envelope. It does not import runtime modules and does not connect to DB, routes, app/server, providers, AI, billing, or Zeabur.

## Enforced Scopes

The guard supports only explicitly scoped depot/workshop access roles:

- `brand`
- `service_provider`
- `subcontractor`

The guard enforces:

- organization isolation
- brand scope
- service provider scope
- subcontractor scope
- explicit assignment/access relationship for subcontractor access
- customer-sensitive data minimization for subcontractor scope
- no global organization fallback
- no provider identity treated as global identity

## Fail-Closed Reasons

The guard fails closed for:

- missing actor/access context
- missing organization context
- organization mismatch
- brand mismatch
- service provider mismatch
- subcontractor without explicit assignment/access relationship
- subcontractor scope mismatch
- revoked or disabled access
- unknown role/scope

## Sanitized Output

Successful access returns a bounded `accessScope` only, including:

- organization id
- actor id
- role
- scoped brand id, service provider id, or subcontractor organization id when applicable
- data profile
- allowed field names
- request id

Subcontractor success uses:

- `subcontractor_minimized`

Subcontractor allowed fields are limited to non-customer-sensitive depot/workshop references, status, item/product/issue references, workshop id, and assignment reference.

The guard output does not expose raw customer/contact data, raw phone/address, provider payloads/tokens, secrets, raw DB rows, billing internals, AI output, FSR internals, or finalAppointmentId.

## Safety Properties

- Pure guard.
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
- No appointment lifecycle mutation.
- No finalAppointmentId mutation.
- No Completion Report / Field Service Report behavior.
- No admin frontend/package/lockfile changes.

## Verification

Targeted Task1912 tests:

- `node --test tests/depotWorkshop/depotAccessScopeGuard.unit.test.js tests/depotWorkshop/depotAccessScopeGuard.static.test.js`

Related depot/workshop boundary tests:

- `node --test tests/depotWorkshop/workshopAssignmentService.unit.test.js tests/depotWorkshop/workshopAssignmentService.static.test.js`
- `node --test tests/depotWorkshop/depotRepairStatusBoundary.unit.test.js tests/depotWorkshop/depotRepairStatusBoundary.static.test.js`
- `node --test tests/depotWorkshop/depotIntakeSqlRepositoryAdapter.unit.test.js tests/depotWorkshop/depotIntakeSqlRepositoryAdapterBoundary.static.test.js`

Static syntax/check fallback when npm is unavailable:

- `find src -name '*.js' -print0 | xargs -0 -n1 node --check`

Project check:

- `npm run check`

If `npm` is unavailable in the active shell, the npm check cannot run there; the static syntax fallback above is the documented replacement for this task.

## Next Task Recommendation

After PM acceptance, Task1913 can add a depot repair route permission boundary using this access guard and injected services only. It must keep DB, migration, seed, smoke, Zeabur/deploy, provider sending, billing/AI/RAG, appointment lifecycle, Completion Report / Field Service Report, `finalAppointmentId`, customer-visible publication, and subcontractor-sensitive-data exposure behind separate explicit gates.

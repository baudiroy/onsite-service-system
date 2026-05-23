# Task630 - Customer Access Route DB Adapter Options Integration / No Shared DB / No Migration

## Scope

Task630 lets the customer access route factory accept explicit DB adapter options:

- `options.dbAdapter`
- `options.dbClient`

Modified or added files:

- `src/routes/customerAccessRoutes.js`
- `tests/customerAccess/customerAccessRouteDbAdapterOptions.unit.test.js`

This task does not modify route index, app/server bootstrap, controllers, middleware, repositories, services, `src/db/`, admin frontend, fixtures, migrations, package files, DTOs, projections, smoke tests, or browser tests.

## Runtime Decision

`registerCustomerAccessRoutes(router, options)` still registers:

```text
GET /customer-access/:caseId
```

The route factory now normalizes options before constructing the existing customer access context middleware.

## Options Priority

The route-level option priority is:

1. `options.repository`
2. `options.dbAdapter.repository`
3. `options.queryExecutor`
4. `options.dbAdapter.queryExecutor`
5. `options.dbClient` through `createCustomerAccessDbAdapter({ dbClient })`
6. `options.readModel` / `options.dataProvider`
7. no options keeps existing caller-provided or fail-closed behavior

Malformed `dbAdapter` options fail closed by passing a malformed repository into the existing middleware path, which produces a generic deny response without leaking raw details.

## DB Boundary

`dbClient` must be explicitly injected. The route module does not import a DB singleton, pool, connection, transaction helper, backend repository, provider module, AI/RAG/vector module, or app/server bootstrap.

Route registration does not call `dbClient`. Any client call can only happen later through the request execution path.

## Safety Policy

The route DB adapter options path preserves:

- generic safe-deny on DB throw or malformed adapter
- no raw DB error leakage
- no raw phone/address/LINE id leakage
- no internal note, audit log, AI raw payload, token, or secret leakage
- no `finalAppointmentId` output or mutation
- no Field Service Report, appointment, publication, or customer identity mutation

## Non-goals

Task630 does not:

- connect to shared DB
- execute SQL against shared DB
- add migrations
- change schema
- modify route index
- modify app/server bootstrap
- modify controllers or middleware
- add audit runtime
- add permission runtime
- send LINE, SMS, email, app push, or provider calls
- implement AI, RAG, billing, entitlement, usage, or Enterprise SSO runtime

## Verification

Required targeted checks:

```bash
node --check src/routes/customerAccessRoutes.js
node --test tests/customerAccess/customerAccessRouteDbAdapterOptions.unit.test.js
git diff --check -- src/routes/customerAccessRoutes.js tests/customerAccess/customerAccessRouteDbAdapterOptions.unit.test.js docs/task-630-customer-access-route-db-adapter-options-integration-no-shared-db-no-migration.md
```

## Future Task Boundary

If future work passes a real DB client from the app layer, that task must explicitly define the exact app/router file, read-only boundary, environment, test command, stop condition, and whether DB verification is local disposable only. Shared DB execution remains out of scope unless explicitly approved.

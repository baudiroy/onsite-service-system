# Task627 - Customer Access Read-Only Repository Query Executor Injection / No Real DB / No Migration

## Scope

Task627 wires the Task626 pre-DB query spec and row mapper into the customer access read-only repository through an injected `queryExecutor`.

Modified or added files:

- `src/customerAccess/customerAccessReadOnlyRepository.js`
- `src/customerAccess/customerAccessContextMiddleware.js`
- `tests/customerAccess/customerAccessReadOnlyRepositoryQueryExecutor.unit.test.js`
- `tests/customerAccess/customerAccessRouteQueryExecutorIntegration.unit.test.js`

This task does not modify routes, controllers, services, backend repositories, database helpers, admin frontend code, migrations, fixtures, package scripts, smoke tests, DTOs, projections, or application bootstrap files.

## Runtime Decision

The runtime slice is intentionally bounded:

- `queryExecutor` is an injected function only.
- The repository builds a Task626 query spec.
- If the spec is executable, the injected executor may return a synthetic row bundle.
- The Task626 mapper converts that row bundle to the Task625 readModel shape.
- Existing repository contract methods read from that readModel.

No real database connection is opened. No SQL is executed by this task. No migration is added.

## Fail-closed Behavior

The query executor path fails closed when:

- required query spec params are missing
- the query spec is not executable
- `queryExecutor` is missing
- `queryExecutor` throws
- `queryExecutor` returns malformed rows
- organization scope mismatches
- customer linkage mismatches
- identity is unverified
- case is not linked to customer
- publication is not allowed
- customer-visible policy fails
- service report projection is unavailable

Raw executor errors are not exposed.

## Middleware Integration

`buildCustomerAccessContextMiddleware(options)` keeps the existing priority:

1. `options.repository`
2. `options.readModel` / `options.dataProvider` / `options.queryExecutor`
3. caller-provided request context

This allows route tests to pass `{ queryExecutor }` through existing route options without modifying route files.

## Safety Policy

The query executor path does not expose:

- raw phone
- raw address
- raw LINE user id
- token or secret
- internal note
- audit log
- AI raw payload
- internal billing data
- internal settlement data
- `finalAppointmentId`

`finalAppointmentId` is not modified, included, or used as an authority in this task.

## Non-goals

Task627 does not:

- connect to a real database
- execute SQL
- add migrations
- modify schema
- add API endpoints
- modify routes or controllers
- write audit logs
- send LINE, SMS, email, app push, or provider calls
- implement AI, RAG, vector retrieval, billing, entitlement, or usage runtime
- alter customer channel identity records
- alter Field Service Report, appointment, publication, or customer identity rows

## Verification

Required targeted checks:

```bash
node --check src/customerAccess/customerAccessReadOnlyRepository.js
node --check src/customerAccess/customerAccessContextMiddleware.js
node --test tests/customerAccess/customerAccessReadOnlyRepositoryQueryExecutor.unit.test.js
node --test tests/customerAccess/customerAccessRouteQueryExecutorIntegration.unit.test.js
git diff --check -- src/customerAccess/customerAccessReadOnlyRepository.js src/customerAccess/customerAccessContextMiddleware.js tests/customerAccess/customerAccessReadOnlyRepositoryQueryExecutor.unit.test.js tests/customerAccess/customerAccessRouteQueryExecutorIntegration.unit.test.js docs/task-627-customer-access-read-only-repository-query-executor-injection-no-real-db-no-migration.md
```

## Future Task Boundary

If future work connects the query spec to a real DB client, it must be a separate task with explicit scope for:

- exact DB adapter/repository file
- read-only SQL execution boundary
- transaction and timeout behavior, if any
- permission and customer-visible data policy
- audit log policy
- local-only or test-only DB verification rules

Shared runtime DB access, migration apply, provider sending, and production data inspection remain out of scope for this task.

# Task 615 - Mount Customer Access Route in Route Index

## Scope

Task 615 mounted the existing customer access route registry into the central route index.

Changed files:

- `src/routes/index.js`
- `tests/customerAccess/customerAccessRouteMount.unit.test.js`
- `docs/task-615-mount-customer-access-route-in-route-index-no-db-no-repository-no-provider.md`

This task intentionally stayed limited to route wiring and targeted tests.

## Route Mount

The customer access route is mounted through:

- `registerCustomerAccessModuleRoutes(router)`

The route path remains:

- `GET /customer-access/:caseId`

The route registry owns the full route path. `src/routes/index.js` does not add an additional prefix, so the route does not become `/customer/customer-access/:caseId` or any other nested duplicate.

## Runtime Boundary

This task did not add:

- DB access
- repository access
- provider integration
- notification sending
- AI/RAG behavior
- audit writes
- new middleware
- migration
- smoke test

The endpoint remains backed by the existing safe-deny controller skeleton. Without future middleware-provided context, it returns a generic customer unavailable response.

## Safe-deny Behavior

The mounted route currently returns generic safe-deny when invoked without verified access context.

The response does not expose:

- internal denial reason codes
- customer existence
- case existence
- organization matching details
- raw phone
- raw address
- raw LINE user id
- publication or policy internals

## Files Intentionally Not Changed

Task 615 did not modify:

- `src/app.js`
- `src/server.js`
- `src/routes/customerAccessRoutes.js`
- `src/controllers/customerAccessController.js`
- `src/customerAccess/`
- `src/repositories/`
- `src/services/`
- `admin/src/`
- `migrations/`
- `package.json`
- smoke tests

## Invariants Preserved

Task 615 preserves:

- one Case = one formal Field Service Report
- customer-facing report is a filtered publication view
- LINE user id is not a global identity
- no internal data leakage to customer-facing responses
- organization isolation remains required for future context
- no AI auto decision
- no DB/schema/index change
- no sensitive output

## Verification

Planned verification:

- `node --check src/routes/index.js`
- `node --test tests/customerAccess/customerAccessRouteMount.unit.test.js`
- `git diff --check -- src/routes/index.js tests/customerAccess/customerAccessRouteMount.unit.test.js docs/task-615-mount-customer-access-route-in-route-index-no-db-no-repository-no-provider.md`

# Task 620 - Customer Access Route Middleware Integration and Tests

## Scope

Task 620 integrated the customer access context middleware into the customer access route module.

Changed files:

- `src/routes/customerAccessRoutes.js`
- `tests/customerAccess/customerAccessRouteMiddlewareIntegration.unit.test.js`
- `docs/task-620-customer-access-route-middleware-integration-and-tests-no-db-no-repository.md`

This is a runtime + tests + docs slice. It wires an existing pure middleware skeleton into the route stack without adding DB-backed behavior.

## Route Integration

The customer access route remains:

- `GET /customer-access/:caseId`

The route now registers:

1. `customerAccessContextMiddleware`
2. `handleCustomerAccessRequest`

The route path, route registry, route index, app bootstrap, server bootstrap, and controller behavior were not changed.

## Runtime Boundary

Task 620 did not add:

- DB access
- repository access
- route index changes
- app/server bootstrap changes
- controller changes
- provider integration
- LINE/SMS/Email/App push behavior
- AI/RAG behavior
- audit writes
- migration
- smoke tests

The middleware currently reads only caller-provided `req.customerAccessContextInput`.

The route still does not have a DB-backed customer identity resolver, Case/Customer lookup, Field Service Report publication lookup, or formal access context.

## Behavior Covered

The new unit test confirms:

- route registers `GET /customer-access/:caseId`
- route registers middleware before controller handler
- missing context returns generic safe-deny
- verified synthetic context returns allow envelope
- allow envelope includes customer-visible service report data
- forbidden/internal fields are stripped
- deny response does not expose internal reason
- response does not expose raw phone/address/LINE id
- `finalAppointmentId` is not modified
- route module requires only the context middleware and controller

## Safety Rules

Raw phone, raw address, raw LINE id, or scoped channel metadata alone do not authorize customer access.

Forbidden/internal customer-visible fields are filtered before the controller builds the response, including:

- `internalNote`
- `auditLog`
- `aiRawPayload`
- `internalBillingData`
- raw phone/address/LINE id
- token/secret

## Invariants Preserved

Task 620 preserves:

- one Case = one formal Field Service Report
- customer-facing report is a filtered publication view
- LINE user id is not a global identity
- no internal data leakage
- organization isolation remains required for future verified context
- no AI auto decision
- no migration/schema/index change
- no sensitive output

## Verification

Planned verification:

- `node --check src/routes/customerAccessRoutes.js`
- `node --test tests/customerAccess/customerAccessRouteMiddlewareIntegration.unit.test.js`
- `git diff --check -- src/routes/customerAccessRoutes.js tests/customerAccess/customerAccessRouteMiddlewareIntegration.unit.test.js docs/task-620-customer-access-route-middleware-integration-and-tests-no-db-no-repository.md`

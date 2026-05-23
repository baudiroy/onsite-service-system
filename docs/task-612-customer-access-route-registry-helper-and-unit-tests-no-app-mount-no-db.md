# Task 612 - Customer Access Route Registry Helper and Unit Tests / No App Mount / No DB

## Scope

Task612 creates a Customer Access Route Registry helper and unit tests.

Allowed files:

- `src/customerAccess/customerAccessRouteRegistry.js`
- `tests/customerAccess/customerAccessRouteRegistry.unit.test.js`
- `docs/task-612-customer-access-route-registry-helper-and-unit-tests-no-app-mount-no-db.md`

Task612 does not modify any other file.

## Route Registry Helper

Task612 adds `src/customerAccess/customerAccessRouteRegistry.js`.

Exports:

- `registerCustomerAccessModuleRoutes(router)`
- `getCustomerAccessRouteDefinitions()`

The registry helper:

- imports only `src/routes/customerAccessRoutes.js`.
- calls `registerCustomerAccessRoutes(router)`.
- returns safe static route metadata.
- does not mount into the app.
- does not modify route index.
- does not import an Express app.
- does not import DB / repository.
- does not import DTO / projection.
- does not import provider / AI.
- does not write audit log.
- does not write customer identity.
- does not write publication state.
- does not write Field Service Report / appointment.
- does not include sensitive data in metadata.

Metadata shape:

```js
[
  {
    module: 'customerAccess',
    method: 'GET',
    path: '/customer-access/:caseId'
  }
]
```

## Unit Test Coverage

Task612 adds `tests/customerAccess/customerAccessRouteRegistry.unit.test.js` using the Node built-in test runner.

The tests cover:

- exports `registerCustomerAccessModuleRoutes`.
- exports `getCustomerAccessRouteDefinitions`.
- registry registers route through synthetic router.
- registered route path includes `:caseId`.
- registered handler is a function.
- metadata returns customer access route path and method without sensitive data.
- invalid / missing router safe no-ops.
- no app bootstrap / route index required.
- invoking registered handler with missing middleware context returns generic safe-deny.
- response does not expose internal reason or raw phone / address / LINE id.

The tests use synthetic router / request / response objects only.

The tests do not:

- start a server.
- import app / server bootstrap.
- modify route index.
- connect to DB.
- import repositories.
- import DTOs / projections.
- import providers.
- import AI / RAG.
- use real customer PII.
- use token / secret / LINE credential.
- add fixture files.

## Runtime Boundary

Task612 does not implement:

- app mount.
- route index modification.
- API endpoint registration in the running app.
- middleware.
- DB query.
- migration.
- repository.
- provider sending.
- LINE / SMS / Email / App push.
- AI / RAG / vector DB.
- audit log write.
- file storage access.
- Field Service Report write.
- appointment write.
- publication state write.
- customer identity write.
- `finalAppointmentId` modification.

## Mandatory Invariants

Task612 preserves:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Registry cannot create, approve, complete, reopen, or publish a Field Service Report.
- Registry cannot modify completion source-data.
- Registry cannot modify `finalAppointmentId`.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- `organization_id + line_channel_id + line_user_id` alone is insufficient authorization.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.
- Customer-facing output cannot expose internal note, audit log, AI raw payload, internal billing / settlement data, engineer internal comment, supervisor review, or cross-organization data.

## Verification

Allowed commands for Task612:

```bash
node --check src/customerAccess/customerAccessRouteRegistry.js
node --test tests/customerAccess/customerAccessRouteRegistry.unit.test.js
git diff --check -- src/customerAccess/customerAccessRouteRegistry.js tests/customerAccess/customerAccessRouteRegistry.unit.test.js docs/task-612-customer-access-route-registry-helper-and-unit-tests-no-app-mount-no-db.md
```

No smoke tests, DB commands, migration commands, API commands, browser commands, or provider sending commands are part of Task612.

## Guardrails Review

Task612 remains aligned with `PROJECT_GUARDRAILS.md`:

- no schema or migration change.
- no app route registration.
- no DB / repository integration.
- no permission runtime integration.
- no audit log runtime change.
- no smoke test change.
- no customer channel identity runtime write.
- no organization isolation runtime write.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
- no sensitive data, token, secret, personal data, or LINE credential touched.

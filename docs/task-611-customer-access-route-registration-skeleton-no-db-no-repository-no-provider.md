# Task 611 - Customer Access Route Registration Skeleton / No DB / No Repository / No Provider

## Scope

Task611 creates a customer access route registration skeleton and unit/static tests.

Allowed files:

- `src/routes/customerAccessRoutes.js`
- `tests/customerAccess/customerAccessRoutes.unit.test.js`
- `docs/task-611-customer-access-route-registration-skeleton-no-db-no-repository-no-provider.md`

Task611 does not modify any other file.

## Route Skeleton

Task611 adds `src/routes/customerAccessRoutes.js`.

Exports:

- `CUSTOMER_ACCESS_ROUTE_PATH`
- `registerCustomerAccessRoutes(router)`

The route skeleton:

- imports only `src/controllers/customerAccessController.js`.
- accepts a caller-provided router.
- registers one GET route when `router.get` exists.
- no-ops when router is missing or invalid.
- returns the provided router.

Selected route path:

```text
/customer-access/:caseId
```

Reason:

- It is explicit and customer-facing.
- It includes the required `caseId` param.
- It avoids implying the route is already mounted under `/customer`.
- It keeps this standalone route skeleton unambiguous until a future route index / app bootstrap task decides mount location.

## Runtime Boundary

Task611 does not:

- register the route into app bootstrap.
- modify route index.
- create middleware.
- import DB.
- import repository.
- import DTO / projection.
- import provider / LINE / SMS / Email / App push.
- import AI / RAG.
- write audit log.
- establish customer identity linkage.
- decide publication allowed.
- query Case / Customer / Field Service Report / appointment.
- modify `finalAppointmentId`.
- modify package files.
- modify smoke tests.

No side effect occurs beyond registering a handler on the caller-provided router.

## Unit / Static Test Coverage

Task611 adds `tests/customerAccess/customerAccessRoutes.unit.test.js` using the Node built-in test runner.

The tests cover:

- module exports `registerCustomerAccessRoutes`.
- registers one GET route on a synthetic router.
- registered path includes `:caseId`.
- registered handler is a function.
- missing / invalid router no-ops without external side effect.
- route module does not require app bootstrap.
- route module does not require DB / repository / provider import.
- registered handler can be invoked with synthetic `req` / `res`.
- missing middleware context returns generic safe-deny.
- response does not expose internal reason.
- response does not expose raw phone / address / LINE id.

The tests use synthetic router / request / response objects only.

The tests do not:

- start a server.
- register with app bootstrap.
- connect to DB.
- import repositories.
- import DTOs / projections.
- import providers.
- import AI / RAG.
- use real customer PII.
- use token / secret / LINE credential.
- add fixture files.

## Mandatory Invariants

Task611 preserves:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Route skeleton cannot create, approve, complete, reopen, or publish a Field Service Report.
- Route skeleton cannot modify completion source-data.
- Route skeleton cannot modify `finalAppointmentId`.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- `organization_id + line_channel_id + line_user_id` alone is insufficient authorization.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.
- Customer-facing output cannot expose internal note, audit log, AI raw payload, internal billing / settlement data, engineer internal comment, supervisor review, or cross-organization data.

## Verification

Allowed commands for Task611:

```bash
node --check src/routes/customerAccessRoutes.js
node --test tests/customerAccess/customerAccessRoutes.unit.test.js
git diff --check -- src/routes/customerAccessRoutes.js tests/customerAccess/customerAccessRoutes.unit.test.js docs/task-611-customer-access-route-registration-skeleton-no-db-no-repository-no-provider.md
```

No smoke tests, DB commands, migration commands, API commands, browser commands, or provider sending commands are part of Task611.

## Guardrails Review

Task611 remains aligned with `PROJECT_GUARDRAILS.md`:

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

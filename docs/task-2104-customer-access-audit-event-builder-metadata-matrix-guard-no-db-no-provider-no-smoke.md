# Task2104 - Customer Access Audit Event Builder Metadata Matrix Guard

## Scope

- Added a pure per-event metadata matrix to the Customer Access audit event builder.
- Added unit and static guards for event-appropriate metadata.
- Added this documentation checkpoint.
- The builder remains pure and is not integrated into runtime.
- No DB, audit persistence, migration, SQL, route, controller, global mount, production mount, smoke, server, listener, network, Zeabur/env, provider, admin, AI, billing, settlement, payment, invoice, package, app, server, or public-routes work was performed.
- The 7 held historical docs remain untracked and untouched.

## Final Metadata Matrix

Global metadata allowlist remains:

- `routeMatched`
- `contextPresent`
- `identifierValid`
- `dependencyValid`
- `registrationResult`

Per-event metadata matrix:

- `customer_access.case_overview.allow`: `routeMatched`, `contextPresent`, `identifierValid`
- `customer_access.case_overview.deny`: `routeMatched`, `contextPresent`, `identifierValid`
- `customer_access.service_report.allow`: `routeMatched`, `contextPresent`, `identifierValid`
- `customer_access.service_report.deny`: `routeMatched`, `contextPresent`, `identifierValid`
- `customer_access.route_registration.success`: `dependencyValid`, `registrationResult`
- `customer_access.route_registration.failure`: `dependencyValid`, `registrationResult`

Cross-event metadata is omitted rather than failing the whole event.

## Metadata Value Rules

Boolean metadata keys must be actual booleans only:

- `routeMatched`
- `contextPresent`
- `identifierValid`
- `dependencyValid`

The builder does not accept string or numeric booleans such as:

- `"true"`
- `"false"`
- `"1"`
- `"0"`
- `1`
- `0`
- `"yes"`
- `"no"`

`registrationResult` must be one of:

- `success`
- `failure`
- `invalid`
- `skipped`
- `unavailable`

Invalid metadata values are omitted rather than failing the whole event.

## Contradiction Behavior

Contradictory metadata is omitted rather than failing the whole event.

Allow event contradiction rules:

- `customer_access.case_overview.allow` omits `routeMatched: false`, `contextPresent: false`, and `identifierValid: false`
- `customer_access.service_report.allow` omits `routeMatched: false`, `contextPresent: false`, and `identifierValid: false`

Route registration success contradiction rules:

- `customer_access.route_registration.success` omits `dependencyValid: false`
- `customer_access.route_registration.success` omits `registrationResult` values other than `success`

Deny/failure behavior:

- deny case/service events may emit `false` boolean values for their allowed route/context/identifier metadata keys
- `customer_access.route_registration.failure` may emit `dependencyValid: false`
- `customer_access.route_registration.failure` may emit `registrationResult: failure`, `invalid`, `skipped`, or `unavailable`
- `customer_access.route_registration.failure` omits `registrationResult: success`

## Invalid Metadata ReasonCodes

Task2104 does not add invalid metadata failure reasonCodes.

Invalid, cross-event, unknown, raw, or contradictory metadata is omitted, not returned as:

- `invalid_metadata`
- `invalid_metadata_value`
- `invalid_metadata_matrix`

The event result shape remains unchanged:

- `{ ok: true, auditEvent }`
- `{ ok: false, reasonCode }`

## Sensitive Metadata Non-Leakage

Metadata never emits:

- unknown metadata keys
- nested objects
- arrays
- raw request or response
- headers or tokens
- policy rule lists
- organization graph details
- DB result or query metadata
- provider payload
- AI prompt or response
- debug, stack, or SQL
- billing or private fields

## Regression Boundaries

Preserved from Task2101 through Task2103:

- supported event types remain unchanged
- audit event output keys remain unchanged
- Task2103 decision, reasonCode, route, method, and source matrix remains unchanged
- Task2102 immutability, determinism, output isolation, and static side-effect behavior remains unchanged
- sensitive data stripping remains unchanged
- audit builder remains not integrated into runtime

## Verification

Run targeted tests:

```sh
node --test tests/customerAccess/customerAccessAuditEventBuilder.unit.test.js tests/customerAccess/customerAccessAuditEventBuilderBoundary.static.test.js
```

Run:

```sh
git diff --check
git status --short --branch
```

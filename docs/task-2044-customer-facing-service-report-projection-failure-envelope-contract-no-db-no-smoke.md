# Task2044 Customer-facing Service Report Projection Failure Envelope Contract / No DB No Smoke

## Current baseline

- Baseline commit before this task: `1907691887c011df5f75ad829bcaf4f6729233f8`
- Branch: `main`
- Upstream: `origin/main`
- Scope: Customer-facing service report projection failure envelope contract only.

## Findings

No runtime source change was necessary. Existing customer-facing service report projection behavior already fails closed through the generic safe-deny/not-found envelope when the injected projection dependency throws, rejects, returns no row, or returns malformed result shape.

The missing coverage was explicit no-DB test coverage for full-route projection-stage failure cases and direct handler rejection/malformed-result cases. Task2044 adds focused synthetic tests for those boundaries.

## Coverage added

The direct handler coverage now confirms:

- Injected `dbClient.query` rejection returns generic safe-deny.
- Malformed projection query results return generic safe-deny.
- Connector/internal sentinel text, query config sentinel text, raw projection row sentinel text, SQL text, and stack text do not leak into the customer-facing response.
- Each failing projection path still calls the injected query only once after the request has passed the earlier context gates.

The full-route no-DB integration coverage now confirms:

- Projection pool/query throw returns app-level 404 safe-deny without leaking raw internals.
- Projection pool/query rejection returns app-level 404 safe-deny without leaking raw internals.
- Empty projection result returns app-level 404 safe-deny.
- Malformed projection row/result shape returns app-level 404 safe-deny.
- Response metadata remains the safe JSON response metadata checked by Task2043.
- Valid full-route sanitized DTO behavior remains unchanged.
- Deny-before-projection behavior remains unchanged.

## Explicit non-actions

- No runtime source changes.
- No DB connection.
- No SQL, migration, seed, or smoke execution.
- No endpoint probe or public/shared/prod target access.
- No Zeabur observation, deploy, restart, rollback, or env inspection.
- No provider, billing, or AI execution.
- No Completion Report or Field Service Report creation, approval, publication, revocation, or mutation.
- No `finalAppointmentId` mutation.
- No customer-visible publication behavior mutation.

## Verification

- `node --test tests/customerAccess/customerAccessServerExplicitPoolFullRoute.integration.test.js tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js tests/customerAccess/customerServiceReportProjectionService.unit.test.js tests/customerAccess/customerAccessRoutes.unit.test.js`
  - Result: PASS, 60/60 tests passing.
- `find tests/customerAccess -name '*.js' -print0 | xargs -0 node --test`
  - Result: PASS, 774/774 tests passing.
- `npm run check`
  - Result: PASS.

## Safety notes

- This task is no-DB and no-smoke.
- All new failure cases use synthetic injected clients/pools only.
- No raw DB rows, query config, SQL text, connector internals, stack traces, customer access context internals, or internal projection fields are exposed by the tested customer-facing envelopes.

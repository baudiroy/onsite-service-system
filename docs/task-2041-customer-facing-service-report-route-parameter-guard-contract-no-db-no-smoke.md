# Task2041 Customer-facing Service Report Route Parameter Guard Contract / No DB No Smoke

## Current baseline

- Baseline commit before this task: `eb83b7dd4be6e021bffd4d4ab9533e4b9aa4977b`
- Branch: `main`
- Upstream: `origin/main`
- Scope: Customer-facing service report route parameter guard hardening only.

## Runtime contract gap found

The service report projection already failed closed for missing or empty route identifiers. The missing boundary was suspicious non-empty identifiers:

- Suspicious `caseId` and `reportId` route parameters could still flow far enough to risk projection query execution.
- Suspicious customer access context identifier values could be skipped if a fallback identifier existed.
- Route params could be overwritten by normalized synthetic context params before the service report projection handler inspected them.

The prior behavior remained parameterized and did not expose raw rows, but it did not fully satisfy the route parameter guard contract.

## Change summary

- Added a projection identifier guard for `caseId`, `reportId`, organization id, customer id, scoped case id, and scoped report id inputs.
- Any malformed provided customer access context identifier now fails closed instead of falling through to another source.
- Customer access context middleware now preserves actual route params over normalized context params so the route handler can deny suspicious path values.
- Added no-DB synthetic tests for missing, empty, path-like, quote-like, and semicolon-like identifiers.
- Preserved valid full-route allow behavior and sanitized DTO response shape.

## Explicit non-actions

- No DB connection.
- No SQL, migration, seed, or smoke execution.
- No Zeabur observation, deploy, restart, rollback, or env inspection.
- No provider, billing, or AI execution.
- No Completion Report or Field Service Report creation, approval, publication, revocation, or mutation.
- No `finalAppointmentId` mutation.
- No customer-visible publication behavior mutation.

## Verification

- `node --test tests/customerAccess/customerServiceReportProjectionService.unit.test.js tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js tests/customerAccess/customerAccessServerExplicitPoolFullRoute.integration.test.js tests/customerAccess/customerAccessRoutes.unit.test.js tests/customerAccess/customerAccessRouteMiddlewareIntegration.unit.test.js`
  - Result: PASS, 62/62 tests passing.
- `find tests/customerAccess -name '*.js' -print0 | xargs -0 node --test`
  - Result: PASS, 768/768 tests passing.
- `npm run check`
  - Result: PASS.

## Safety notes

- Invalid route parameters now return the existing generic 404 safe-deny envelope.
- Invalid route parameters do not reach the service report projection query.
- Valid parameters continue through the accepted full-route sanitized DTO path.
- Deny-before-projection behavior remains unchanged for resolver gate failures.

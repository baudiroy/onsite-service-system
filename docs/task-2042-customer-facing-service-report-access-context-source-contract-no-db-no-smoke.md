# Task2042 Customer-facing Service Report Access Context Source Contract / No DB No Smoke

## Current baseline

- Baseline commit before this task: `0f781af6938bb04140787cbc774d33f3a3b5f0ab`
- Branch: `main`
- Upstream: `origin/main`
- Scope: Customer-facing service report access context source and priority hardening only.

## Runtime contract gaps found

Two no-DB source priority gaps were found:

- `query.reportId` could be used as a fallback when `params.reportId` was missing.
- Malformed customer access context identifiers could be skipped if another fallback source held a valid identifier.

Both behaviors weakened the intended source contract that route params and normalized trusted context must be authoritative.

## Change summary

- Removed `query.reportId` fallback from the service report projection handler.
- Required `params.reportId` for projection handler access.
- Hardened customer access request context resolver so any malformed provided identifier fails closed instead of falling through.
- Covered organization, customer, case, and report identifier source priority.
- Added no-DB tests proving request params, query string, body, and headers cannot override normalized context identifiers.
- Added full-route no-DB coverage proving query params cannot override route `caseId` or `reportId`.

## Preserved behavior

- Valid full-route sanitized DTO behavior remains unchanged.
- Valid route params remain authoritative.
- Missing or malformed customer scope still denies before projection.
- Generic 404 safe-deny envelope remains unchanged.
- No raw DB rows, internal context, SQL, stack, provider, billing, AI, phone, address, or token values are exposed.

## Explicit non-actions

- No DB connection.
- No SQL, migration, seed, or smoke execution.
- No Zeabur observation, deploy, restart, rollback, or env inspection.
- No provider, billing, or AI execution.
- No Completion Report or Field Service Report creation, approval, publication, revocation, or mutation.
- No `finalAppointmentId` mutation.
- No customer-visible publication behavior mutation.

## Verification

- `node --test tests/customerAccess/customerAccessRequestContextResolver.unit.test.js tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js tests/customerAccess/customerAccessServerExplicitPoolFullRoute.integration.test.js tests/customerAccess/customerAccessRoutes.unit.test.js tests/customerAccess/customerAccessRouteMiddlewareIntegration.unit.test.js`
  - Result: PASS, 64/64 tests passing.
- `find tests/customerAccess -name '*.js' -print0 | xargs -0 node --test`
  - Result: PASS, 772/772 tests passing.
- `npm run check`
  - Result: PASS.

## Safety notes

- Query string, body, and headers are not trusted as service report route identifier sources.
- Route `caseId` and `reportId` remain the only accepted handler route identifier inputs.
- Context resolver output is normalized only from the explicit customer access context source.
- Source changes are limited to closing the confirmed no-DB runtime contract gap.

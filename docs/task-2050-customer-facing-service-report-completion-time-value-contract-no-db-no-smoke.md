# Task2050 Customer-facing Service Report Completion Time Value Contract / No DB No Smoke

## Current baseline

- Baseline commit before this task: `afe1e50717a6cdb5c51663b33c4c74d5e24a5025`
- Branch: `main`
- Upstream: `origin/main`
- Scope: Customer-facing service report `completionTime` value filtering only.

## Findings

Task2049 narrowed attachment label output so storage/path/auth-looking values do not appear in customer-facing attachment metadata.

Task2050 applies the same projection-drift hardening principle to the optional service report `completionTime` field. Before this task, any non-empty string from `completionTime`, `completion_time`, or `completed_at` could be emitted. That made malformed synthetic rows or projection-view drift harder to detect when a non-date sentinel, token, or internal marker accidentally reached the completion time column.

## Runtime change

`src/customerAccess/customerServiceReportProjectionService.js` now emits `completionTime` only when the value is date/time-shaped:

- `YYYY-MM-DD`
- `YYYY-MM-DD HH:mm`
- `YYYY-MM-DD HH:mm:ss`
- `YYYY-MM-DDTHH:mm:ss.sssZ`
- equivalent values with timezone offsets

Malformed or non-date completion-time values are omitted from the successful DTO instead of being emitted.

## Coverage added

The no-DB tests now explicitly cover:

- Direct projection service rows with malformed completion time values.
- Full mounted customer-facing service report route rows with malformed completion time values.
- Existing full-route and direct projection handler DTO equivalence after completion time filtering.
- Safe omission without leaking the malformed completion time sentinel.

## Behavior preserved

- Existing row-level publication and customer-visible policy guard remains unchanged.
- Existing attachment visibility and metadata filtering remains unchanged.
- Existing successful customer-facing service report DTO allowlist remains unchanged.
- Existing safe-deny / not-found / projection failure envelopes remain unchanged.
- Existing response header / content-type behavior remains unchanged.
- Existing parameter guard and customer access context behavior remain unchanged.

## Explicit non-actions

- No DB connection.
- No SQL, migration, seed, or smoke execution.
- No endpoint probe or public/shared/prod target access.
- No Zeabur observation, deploy, restart, rollback, or env inspection.
- No provider, billing, AI, storage provider, or RAG execution.
- No file upload, file download, or signed URL generation.
- No Completion Report or Field Service Report creation, approval, publication, revocation, or mutation.
- No `finalAppointmentId` mutation.
- No route expansion or global app/server mount change.

## Verification

- `node --test tests/customerAccess/customerServiceReportProjectionService.unit.test.js tests/customerAccess/customerAccessServerExplicitPoolFullRoute.integration.test.js tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js tests/customerAccess/customerAccessInternalTestRouteMount.unit.test.js tests/customerAccess/customerAccessRoutes.unit.test.js`
  - Result: PASS, 84/84 tests passing.
- `find tests/customerAccess -name '*.js' -print0 | xargs -0 node --test`
  - Result: PASS, 784/784 tests passing.
- `npm run check`
  - Result: PASS.
- `git diff --check`
  - Result: PASS.

## Safety notes

- This task is no-DB and no-smoke.
- All new coverage uses synthetic injected rows, clients, pools, and in-process route harnesses only.
- No real database, Zeabur service, deployed endpoint, provider, billing, storage, or AI integration was touched.

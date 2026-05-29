# Task2053 Customer-facing Service Report Appointment Window Value Contract / No DB No Smoke

## Current baseline

- Baseline commit before this task: `9aade5937cf343ce6b8e070f049b398cf6ad3380`
- Branch: `main`
- Upstream: `origin/main`
- Scope: Customer-facing service report `appointmentWindow` display value filtering only.

## Findings

Task2051 and Task2052 filtered malformed `serviceStatus` and `engineerDisplayName` display values before they can be emitted in the customer-facing service report DTO.

Task2053 applies the same bounded display-value contract to the optional `appointmentWindow` field. Before this task, any non-empty string from `appointmentWindow`, `appointment_window`, or `appointmentDisplayTimeWindow` could be emitted. That made malformed rows harder to catch when URL-like text, token markers, SQL text, DB URLs, paths, or other internal sentinels were accidentally placed in the appointment window display column.

## Runtime change

`src/customerAccess/customerServiceReportProjectionService.js` now emits `appointmentWindow` only when the value is a safe customer display string.

The filter omits values that look like:

- URL-like strings;
- absolute or parent-directory paths;
- token / secret / password markers;
- SQL-like sentinel text such as `select ... from cases`;
- PostgreSQL URL markers.

Safe ordinary appointment window display text, such as `2026-05-21 10:00-12:00`, remains unchanged.

## Coverage added

The no-DB tests now explicitly cover:

- Direct projection service rows with malformed appointment windows.
- Full mounted customer-facing service report route rows with malformed appointment windows.
- Existing full-route and direct projection handler DTO equivalence after appointment window filtering.
- Safe omission without leaking the malformed appointment window sentinel.

## Behavior preserved

- Existing row-level publication and customer-visible policy guard remains unchanged.
- Existing service status, engineer display-name, and completion time filtering remains unchanged.
- Existing attachment visibility and metadata filtering remains unchanged.
- Existing successful customer-facing service report DTO allowlist remains unchanged.
- Existing safe-deny / not-found / projection failure envelopes remain unchanged.
- Existing response header / content-type behavior remains unchanged.
- Existing parameter guard and customer access context behavior remains unchanged.

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
  - Result: PASS, 90/90 tests passing.
- `find tests/customerAccess -name '*.js' -print0 | xargs -0 node --test`
  - Result: PASS, 790/790 tests passing.
- `npm run check`
  - Result: PASS.
- `git diff --check`
  - Result: PASS.

## Safety notes

- This task is no-DB and no-smoke.
- All new coverage uses synthetic injected rows, clients, pools, and in-process route harnesses only.
- No real database, Zeabur service, deployed endpoint, provider, billing, storage, or AI integration was touched.

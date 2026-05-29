# Task2051 Customer-facing Service Report Service Status Value Contract / No DB No Smoke

## Current baseline

- Baseline commit before this task: `fd18c0eef69364113d86c19eea9aabb28639aeb8`
- Branch: `main`
- Upstream: `origin/main`
- Scope: Customer-facing service report `serviceStatus` display value filtering only.

## Findings

Task2050 narrowed `completionTime` so malformed non-date values cannot be emitted as customer-facing completion timestamps.

Task2051 applies the same projection-drift hardening principle to the optional `serviceStatus` display field. Before this task, any non-empty string from `serviceStatus`, `service_status_display`, `serviceStatusDisplay`, or `statusDisplay` could be emitted. That made malformed rows harder to catch when SQL text, token markers, DB URLs, paths, or other internal sentinels were accidentally placed in a status display column.

## Runtime change

`src/customerAccess/customerServiceReportProjectionService.js` now emits `serviceStatus` only when the value is a safe customer display string.

The filter omits values that look like:

- URL-like strings;
- absolute or parent-directory paths;
- token / secret / password markers;
- SQL-like sentinel text such as `select ... from cases`;
- PostgreSQL URL markers.

Safe ordinary status display text, such as `Completed`, remains unchanged.

## Coverage added

The no-DB tests now explicitly cover:

- Direct projection service rows with malformed service status display values.
- Full mounted customer-facing service report route rows with malformed service status display values.
- Existing full-route and direct projection handler DTO equivalence after service status filtering.
- Safe omission without leaking the malformed service status sentinel.

## Behavior preserved

- Existing row-level publication and customer-visible policy guard remains unchanged.
- Existing completion time filtering remains unchanged.
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
  - Result: PASS, 86/86 tests passing.
- `find tests/customerAccess -name '*.js' -print0 | xargs -0 node --test`
  - Result: PASS, 786/786 tests passing.
- `npm run check`
  - Result: PASS.
- `git diff --check`
  - Result: PASS.

## Safety notes

- This task is no-DB and no-smoke.
- All new coverage uses synthetic injected rows, clients, pools, and in-process route harnesses only.
- No real database, Zeabur service, deployed endpoint, provider, billing, storage, or AI integration was touched.

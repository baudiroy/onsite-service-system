# Task2057 Customer-facing Service Report Canonical Report ID Row Match Contract / No DB No Smoke

## Current baseline

- Baseline commit before this task: `ba1c4d91f62b38f157ea9ac72a49189cbe8cac55`
- Branch: `main`
- Upstream: `origin/main`
- Scope: Customer-facing service report row match by canonical public report id only.

## Findings

Task2055 tightened the emitted `customerReportReference` value to the existing identifier contract.

Task2057 hardens the row-selection side of the same boundary. Before this task, the projection row match could fall back to a DTO-style `customerReportReference` alias when checking whether a returned row matched the requested `reportId`. Since the query contract selects `public_report_id`, row scope should be anchored to canonical `public_report_id` / `publicReportId`, not a DTO alias.

## Runtime change

`src/customerAccess/customerServiceReportProjectionService.js` now uses a dedicated `rowReportId(row)` helper for row matching.

`rowReportId(row)`:

- reads only `public_report_id` or `publicReportId`;
- applies the existing identifier contract;
- does not use `customerReportReference` as a row-match fallback.

If a synthetic or drifted row lacks a canonical public report id, the customer-facing service report projection fails closed even when a DTO alias happens to equal the requested report id.

## Coverage added

The no-DB tests now explicitly cover:

- Direct projection service rows that omit canonical public report id while carrying a matching `customerReportReference` alias.
- Full mounted customer-facing service report route rows that omit canonical public report id while carrying a matching `customerReportReference` alias.
- Existing full-route and direct projection handler DTO equivalence after canonical report-id row matching.
- Safe deny without leaking internal row details.

## Behavior preserved

- Existing row-level publication and customer-visible policy guard remains unchanged.
- Existing DTO field value filtering remains unchanged.
- Existing attachment visibility and metadata filtering remains unchanged.
- Existing successful customer-facing service report DTO allowlist remains unchanged when canonical `public_report_id` is present.
- Existing safe-deny / not-found / projection failure envelopes remain unchanged.
- Existing response header / content-type behavior remains unchanged.
- Existing parameter guard and customer access context behavior remains unchanged.
- `serviceSummary` remains untouched pending PM decision from Task2056.

## Explicit non-actions

- No service summary runtime change.
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
  - Result: PASS, 96/96 tests passing.
- `find tests/customerAccess -name '*.js' -print0 | xargs -0 node --test`
  - Result: PASS, 796/796 tests passing.
- `npm run check`
  - Result: PASS.
- `git diff --check`
  - Result: PASS.

## Safety notes

- This task is no-DB and no-smoke.
- All new coverage uses synthetic injected rows, clients, pools, and in-process route harnesses only.
- No real database, Zeabur service, deployed endpoint, provider, billing, storage, or AI integration was touched.

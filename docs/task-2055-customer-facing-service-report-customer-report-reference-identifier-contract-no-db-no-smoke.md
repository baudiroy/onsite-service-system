# Task2055 Customer-facing Service Report Customer Report Reference Identifier Contract / No DB No Smoke

## Current baseline

- Baseline commit before this task: `83ba16d7c5e63329ef79acd03ba3fa13641508dc`
- Branch: `main`
- Upstream: `origin/main`
- Scope: Customer-facing service report `customerReportReference` identifier filtering only.

## Findings

Task2051 through Task2054 filtered malformed customer-facing display values before they can be emitted in the service report DTO.

Task2055 handles `customerReportReference` as an identifier rather than a free-text display value. Before this task, any non-empty string from `customerReportReference`, `public_report_id`, or `publicReportId` could be emitted. Because this field is a public report reference, it should stay within the existing identifier contract used elsewhere in the projection layer.

## Runtime change

`src/customerAccess/customerServiceReportProjectionService.js` now emits `customerReportReference` only when the value passes the existing `identifierValue` contract.

The identifier contract allows ordinary public references such as `report_public_projection_001`, while omitting malformed URL-like, path-like, SQL-like, or token-bearing values.

## Coverage added

The no-DB tests now explicitly cover:

- Direct projection service rows with malformed customer report references.
- Full mounted customer-facing service report route rows with malformed customer report references.
- Existing full-route and direct projection handler DTO equivalence after customer report reference filtering.
- Safe omission without leaking the malformed customer report reference sentinel.

## Behavior preserved

- Existing row-level publication and customer-visible policy guard remains unchanged.
- Existing service status, engineer display-name, appointment window, case reference, and completion time filtering remains unchanged.
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
- No service summary filtering; `serviceSummary` remains a customer-facing free-text summary field.

## Verification

- `node --test tests/customerAccess/customerServiceReportProjectionService.unit.test.js tests/customerAccess/customerAccessServerExplicitPoolFullRoute.integration.test.js tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js tests/customerAccess/customerAccessInternalTestRouteMount.unit.test.js tests/customerAccess/customerAccessRoutes.unit.test.js`
  - Result: PASS, 94/94 tests passing.
- `find tests/customerAccess -name '*.js' -print0 | xargs -0 node --test`
  - Result: PASS, 794/794 tests passing.
- `npm run check`
  - Result: PASS.
- `git diff --check`
  - Result: PASS.

## Safety notes

- This task is no-DB and no-smoke.
- All new coverage uses synthetic injected rows, clients, pools, and in-process route harnesses only.
- No real database, Zeabur service, deployed endpoint, provider, billing, storage, or AI integration was touched.

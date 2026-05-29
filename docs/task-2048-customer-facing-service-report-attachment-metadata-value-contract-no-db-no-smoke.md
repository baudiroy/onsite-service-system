# Task2048 Customer-facing Service Report Attachment Metadata Value Contract / No DB No Smoke

## Current baseline

- Baseline commit before this task: `2dd8a539d8dedfe433197221c3e1aecd395889cf`
- Branch: `main`
- Upstream: `origin/main`
- Scope: Customer-facing service report attachment metadata value filtering only.

## Findings

Task2046 required explicit attachment visibility signals. Task2048 narrows the metadata values that can be emitted after an attachment passes visibility.

Before this task, a visible attachment item could emit an arbitrary non-empty `attachmentId` value, and arbitrary non-empty `mimeType` value. That made malformed synthetic rows or projection-view drift harder to catch when a storage URL, path-like value, SQL-like value, or MIME parameter was accidentally placed into customer-facing metadata fields.

## Runtime change

`src/customerAccess/customerServiceReportProjectionService.js` now:

- requires each emitted public attachment item to have a safe public attachment identifier;
- omits attachment items with missing, URL-like, path-like, SQL-like, or otherwise malformed attachment identifiers;
- emits `mimeType` only when the value matches a simple MIME-like `type/subtype` shape;
- keeps `label` optional and customer-facing, but only after the attachment has a safe public attachment identifier;
- continues to omit malformed or empty attachment items instead of emitting placeholders.

## Coverage added

The no-DB tests now explicitly cover:

- Direct projection service attachment filtering for URL-like and path-like attachment identifiers.
- Full mounted customer-facing service report route filtering for URL-like and path-like attachment identifiers.
- Invalid MIME-with-parameters values being omitted from `mimeType` while preserving the safe attachment id and label.
- Existing full-route and direct projection handler DTO equivalence when attachment metadata value filtering is applied.

## Behavior preserved

- Existing row-level publication and customer-visible policy guard remains unchanged.
- Existing attachment visibility filtering remains unchanged.
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
  - Result: PASS, 82/82 tests passing.
- `find tests/customerAccess -name '*.js' -print0 | xargs -0 node --test`
  - Result: PASS, 782/782 tests passing.
- `npm run check`
  - Result: PASS.
- `git diff --check`
  - Result: PASS.

## Safety notes

- This task is no-DB and no-smoke.
- All new coverage uses synthetic injected rows, clients, pools, and in-process route harnesses only.
- No real database, Zeabur service, deployed endpoint, provider, billing, storage, or AI integration was touched.

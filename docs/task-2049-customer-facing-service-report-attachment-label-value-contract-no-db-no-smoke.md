# Task2049 Customer-facing Service Report Attachment Label Value Contract / No DB No Smoke

## Current baseline

- Baseline commit before this task: `71bc945df6141c89d8a20bbc0da83807b16ea595`
- Branch: `main`
- Upstream: `origin/main`
- Scope: Customer-facing service report attachment label value filtering only.

## Findings

Task2048 required safe public attachment identifiers and MIME-like `mimeType` values before attachment metadata can appear in the customer-facing service report DTO.

Task2049 narrows attachment label emission. A visible attachment can still be shown when it has a safe public attachment id, but the optional `label` is omitted when the label source looks like a URL, filesystem path, parent-directory path, signed/private storage hint, token, secret, or password-bearing value.

## Runtime change

`src/customerAccess/customerServiceReportProjectionService.js` now:

- keeps attachment `label` optional and customer-facing only;
- omits URL-like labels;
- omits absolute and parent-directory path-like labels;
- omits labels containing obvious sensitive storage/auth markers such as token, secret, password, signed, or private;
- preserves safe ordinary display labels, including normal words that might appear in existing synthetic fixtures.

## Coverage added

The no-DB tests now explicitly cover:

- Direct projection service filtering of URL-like attachment labels.
- Direct projection service filtering of path-like filename fallback labels.
- Full mounted customer-facing service report route filtering of URL-like attachment labels.
- Full mounted customer-facing service report route filtering of path-like filename fallback labels.
- Existing full-route and direct projection handler DTO equivalence after label value filtering.

## Behavior preserved

- Existing row-level publication and customer-visible policy guard remains unchanged.
- Existing attachment visibility filtering remains unchanged.
- Existing attachment id and MIME value filtering remains unchanged.
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

# Task 775 — Engineer Mobile Workbench Arrived / Started Provider Async Coverage / No Runtime Change

## Scope

Add targeted app/server compatibility coverage for async Engineer Mobile Workbench operation-specific shortcut providers:

- `engineerMobileWorkbenchArrivedProvider.markArrived`
- `engineerMobileWorkbenchStartedProvider.markStarted`

This task is test-only plus this implementation note. It does not change runtime behavior, API shape, DB access, migrations, provider sending, AI, RAG, LINE, SMS, smoke scripts, or package scripts.

## Changes

- Added app factory coverage that verifies async arrived provider shortcuts are awaited.
- Added app factory coverage that verifies async started provider shortcuts are awaited.
- Added server bootstrap coverage for the same async operation-specific providers.
- Confirmed calls receive scoped organization, engineer, user, task, operation, and client request ID.
- Confirmed forbidden body/provider fields such as token, secret, raw phone, and raw provider data are not included in the safe response.

## Guardrails

- Arrived and started operations remain Workbench task-status source-data and do not create or mutate formal Field Service Reports.
- No DB connection, migration, provider sending, AI/RAG, LINE/SMS, or customer-visible expansion is introduced.
- Engineer and organization scope remain enforced by the existing Workbench request path.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchAppFactoryOptions.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchServerOptions.unit.test.js` — PASS, 51 passed / 0 failed.
- `node --test tests/engineerMobileWorkbench/*.js` — PASS, 201 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1758 passed / 0 failed.
- `git diff --check` — PASS.

# Task 772 — Engineer Mobile Workbench Async Status Operation Shortcut Coverage / No Runtime Change

## Scope

Add targeted app/server compatibility coverage for async Engineer Mobile Workbench status operation shortcuts:

- `engineerMobileWorkbenchTaskStatusProvider.markTaskStatus`
- `engineerMobileWorkbenchStatusOperationProvider.execute`

This task is test-only plus this implementation note. It does not change runtime behavior, API shape, DB access, migrations, provider sending, AI, RAG, LINE, SMS, smoke scripts, or package scripts.

## Changes

- Added app factory coverage that verifies async task status shortcut providers are awaited.
- Added app factory coverage that verifies async status operation shortcut providers are awaited.
- Added server bootstrap coverage for the same two async shortcut paths.
- Confirmed calls receive scoped organization, engineer, user, task, operation, and client request IDs.
- Confirmed safe response output strips raw phone, tokens, secrets, and request-body secret fields.

## Guardrails

- Workbench status operations remain source-data / operation signals and do not create or mutate formal Field Service Reports.
- No `finalAppointmentId` authority is introduced.
- No DB connection, migration, provider sending, AI/RAG, LINE/SMS, or customer-visible expansion is introduced.
- Engineer and organization scope remain enforced through the existing Workbench request path.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchAppFactoryOptions.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchServerOptions.unit.test.js` — PASS, 41 passed / 0 failed.
- `node --test tests/engineerMobileWorkbench/*.js` — PASS, 191 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1748 passed / 0 failed.
- `git diff --check` — PASS.

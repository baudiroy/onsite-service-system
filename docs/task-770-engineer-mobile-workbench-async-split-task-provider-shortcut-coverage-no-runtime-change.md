# Task 770 — Engineer Mobile Workbench Async Split Task Provider Shortcut Coverage / No Runtime Change

## Scope

Add targeted coverage for async split Engineer Mobile Workbench task provider shortcuts:

- `engineerMobileWorkbenchTaskListProvider.listTasks`
- `engineerMobileWorkbenchTaskDetailProvider.getTaskDetail`

This task is test-only plus this implementation note. It does not change runtime behavior, backend persistence, API contracts, migrations, smoke scripts, package scripts, provider sending, AI, RAG, LINE, SMS, or shared DB behavior.

## Changes

- Added app factory coverage that verifies async split list/detail shortcut providers are awaited.
- Added server bootstrap coverage that verifies async split list/detail shortcut providers are awaited.
- Confirmed provider calls receive scoped `organizationId`, `engineerId`, and detail `appointmentId`.
- Confirmed wrong-engineer list rows remain filtered.
- Confirmed safe responses do not leak raw phone, raw LINE user id, tokens, secrets, or provider call payloads containing those values.

## Guardrails

- One Case = one formal completion report remains unchanged.
- Multiple appointments / dispatch visits per Case remain unchanged.
- `finalAppointmentId` remains backend/system-determined and is not introduced to Workbench shortcut payloads.
- No manual picker, AI auto-decision, provider sending, DB execution, migration apply, or shared runtime cleanup.
- Organization scope and engineer assignment filtering remain enforced by the existing Workbench safe projection path.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchAppFactoryOptions.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchServerOptions.unit.test.js` — PASS, 35 passed / 0 failed.
- `node --test tests/engineerMobileWorkbench/*.js` — PASS, 185 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1742 passed / 0 failed.
- `git diff --check` — PASS.

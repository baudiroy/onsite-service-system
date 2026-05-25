# Task 750 — Engineer Mobile Workbench Split Task Provider Shortcut Options / No DB

## Status

Completed.

## Scope

This task extends the Engineer Mobile Workbench app/server shortcut option wiring so tests and future bounded runtime slices can inject task list and task detail providers separately without creating a real DB-backed provider.

## Changes

- Added split Workbench shortcut option support in `src/app.js`:
  - `engineerMobileWorkbenchTaskListProvider`
  - `engineerMobileWorkbenchTaskDetailProvider`
- Added the same split Workbench shortcut option support in `src/server.js`.
- Composed the split providers into the existing Workbench `taskProvider` shape:
  - `listTasks`
  - `getTaskDetail`
- Preserved priority for the full provider shortcut:
  - `engineerMobileWorkbenchTaskProvider`
  - `engineerMobileWorkbenchTasksProvider`
- Bound split provider methods to their provider object so provider-local state remains available.
- Added app/server tests proving task list and task detail endpoints can use split shortcut providers while preserving engineer scoped, redacted responses.

## Boundaries

- No DB connection.
- No DB migration.
- No schema or index change.
- No real task repository implementation.
- No provider sending, notification, LINE, SMS, App push, or calendar behavior.
- No AI, RAG, vector, or provider integration.
- No Field Service Report or `finalAppointmentId` behavior change.
- No Billing / Settlement behavior change.
- No customer-visible data expansion.
- Full `taskProvider` shortcuts keep priority over split providers.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchAppFactoryOptions.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchServerOptions.unit.test.js` — PASS, 21 passed / 0 failed.
- `node --test tests/engineerMobileWorkbench/*.js` — PASS, 171 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1697 passed / 0 failed.
- `npm run check` — PASS.

## Notes

This keeps the Workbench task list/detail runtime injectable for bounded tests and later real providers, while the current task stays inside no-DB app/server option composition.

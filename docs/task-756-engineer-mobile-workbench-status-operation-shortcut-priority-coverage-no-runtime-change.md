# Task 756 — Engineer Mobile Workbench Status Operation Shortcut Priority Coverage / No Runtime Change

## Status

Completed.

## Scope

This task adds regression coverage for the status-operation shortcut introduced in Task 755. Dedicated nested `engineerMobileWorkbench` options must remain the source of truth when both nested options and top-level shortcut options are supplied.

## Changes

- Added app factory coverage in `tests/engineerMobileWorkbench/engineerMobileWorkbenchAppFactoryOptions.unit.test.js`.
- Added server bootstrap coverage in `tests/engineerMobileWorkbench/engineerMobileWorkbenchServerOptions.unit.test.js`.
- Verified nested `engineerMobileWorkbench.taskStatusProvider` wins over top-level `engineerMobileWorkbenchStatusOperationProvider`.
- Verified the shortcut status operation provider is not called when nested Workbench status options are present.

## Boundaries

- No source runtime change.
- No DB connection.
- No DB migration.
- No schema or index change.
- No API shape change.
- No real provider implementation.
- No notification, LINE, SMS, App push, calendar, file upload, or offline sync behavior.
- No AI, RAG, vector, or external provider integration.
- No Field Service Report or `finalAppointmentId` mutation.
- No Billing / Settlement behavior change.
- No customer-visible data expansion.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchAppFactoryOptions.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchServerOptions.unit.test.js` — PASS, 31 passed / 0 failed.
- `node --test tests/engineerMobileWorkbench/*.js` — PASS, 181 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1709 passed / 0 failed.

## Notes

This closes the shortcut-priority loop for the Workbench status operation path: convenience shortcuts cannot override explicit nested Workbench options.

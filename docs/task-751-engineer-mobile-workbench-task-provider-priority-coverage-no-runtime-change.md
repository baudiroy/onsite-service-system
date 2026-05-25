# Task 751 — Engineer Mobile Workbench Task Provider Priority Coverage / No Runtime Change

## Status

Completed.

## Scope

This task adds targeted test coverage for Engineer Mobile Workbench task provider shortcut priority. It verifies that a full Workbench `taskProvider` shortcut keeps priority over split list/detail shortcuts when both are supplied.

## Changes

- Added app factory coverage in `tests/engineerMobileWorkbench/engineerMobileWorkbenchAppFactoryOptions.unit.test.js`.
- Added server bootstrap coverage in `tests/engineerMobileWorkbench/engineerMobileWorkbenchServerOptions.unit.test.js`.
- Verified both task list and task detail endpoints use the full provider.
- Verified split providers are not called when the full provider is present.

## Boundaries

- No source runtime change.
- No DB connection.
- No DB migration.
- No schema or index change.
- No provider sending, notification, LINE, SMS, App push, or calendar behavior.
- No AI, RAG, vector, or provider integration.
- No Field Service Report or `finalAppointmentId` behavior change.
- No Billing / Settlement behavior change.
- No customer-visible data expansion.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchAppFactoryOptions.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchServerOptions.unit.test.js` — PASS, 23 passed / 0 failed.
- `node --test tests/engineerMobileWorkbench/*.js` — PASS, 173 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1699 passed / 0 failed.

## Notes

The priority rule is now explicit: full Workbench task provider shortcuts remain the preferred authority, and split provider shortcuts are only used when a full provider is not supplied.

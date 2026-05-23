# Task 752 — Data Correction Nested Options Priority Coverage / No Runtime Change

## Status

Completed.

## Scope

This task adds targeted coverage for Data Correction option priority. It verifies that explicit nested `dataCorrection` options remain authoritative over all top-level shortcut writers when both are supplied.

## Changes

- Added app factory coverage in `tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js`.
- Added server bootstrap coverage in `tests/dataCorrection/dataCorrectionServerOptions.unit.test.js`.
- Exercised the nested-priority behavior across the main governance paths:
  - pre-departure apply
  - post-departure freeze
  - unable-to-complete result
  - follow-up proposal
- Verified shortcut writers are not called when nested `dataCorrection` options are present.

## Boundaries

- No source runtime change.
- No DB connection.
- No DB migration.
- No schema or index change.
- No API shape change.
- No provider sending, notification, LINE, SMS, App push, or calendar behavior.
- No AI, RAG, vector, or provider integration.
- No Field Service Report or `finalAppointmentId` behavior change.
- No Billing / Settlement behavior change.
- No customer-visible data expansion.

## Verification

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` — PASS, 26 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 476 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1701 passed / 0 failed.

## Notes

The Data Correction app/server composition contract is now explicit: nested `dataCorrection` options have priority over all shortcut writer options, and shortcut writers are used only when no explicit nested options are supplied.

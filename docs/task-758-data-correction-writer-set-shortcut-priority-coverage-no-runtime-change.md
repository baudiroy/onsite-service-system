# Task 758 — Data Correction Writer Set Shortcut Priority Coverage / No Runtime Change

## Status

Completed.

## Scope

This task adds targeted priority coverage for the Data Correction writer-set shortcut introduced in Task 757. It verifies that explicit nested `dataCorrection` options remain the source of truth when both nested options and the top-level `dataCorrectionWriterSet` shortcut are supplied.

## Changes

- Added app factory priority coverage in `tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js`.
- Added server bootstrap priority coverage in `tests/dataCorrection/dataCorrectionServerOptions.unit.test.js`.

## Runtime Contract

- Nested `dataCorrection` options take priority over `dataCorrectionWriterSet`.
- The writer-set shortcut is ignored when explicit nested Data Correction options are present.
- No writer is called during app/server bootstrap.
- Writers execute only on matching Data Correction governance requests.

## Boundaries

- No runtime behavior change.
- No DB connection.
- No DB migration.
- No schema or index change.
- No API shape change.
- No real persistence implementation.
- No notification, LINE, SMS, App push, file upload, or external provider behavior.
- No AI, RAG, vector, or external provider integration.
- No Field Service Report or `finalAppointmentId` mutation.
- No Billing / Settlement behavior change.
- No customer-visible data expansion.

## Verification

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` — PASS, 30 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 480 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1713 passed / 0 failed.

## Notes

This closes the writer-set shortcut priority gap without broadening the Data Correction runtime surface.

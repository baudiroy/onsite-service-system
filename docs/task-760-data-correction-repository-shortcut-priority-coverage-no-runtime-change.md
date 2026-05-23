# Task 760 — Data Correction Repository Shortcut Priority Coverage / No Runtime Change

## Status

Completed.

## Scope

This task adds targeted priority coverage for the Data Correction repository shortcut introduced in Task 759. It verifies that explicit nested `dataCorrection` options and the prebuilt `dataCorrectionWriterSet` shortcut keep precedence over a repository shortcut.

## Changes

- Added app factory priority coverage in `tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js`.
- Added server bootstrap priority coverage in `tests/dataCorrection/dataCorrectionServerOptions.unit.test.js`.

## Runtime Contract

- Nested `dataCorrection` options take priority over `dataCorrectionRepository`.
- `dataCorrectionWriterSet` takes priority over `dataCorrectionRepository`.
- Repository shortcut writers are ignored when a higher-priority Data Correction option is supplied.
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

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` — PASS, 36 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 486 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1719 passed / 0 failed.

## Notes

This keeps the Data Correction bootstrap option order explicit before future repository-backed wiring moves closer to real persistence.

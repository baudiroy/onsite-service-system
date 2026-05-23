# Task 757 — Data Correction Writer Set Shortcut Options / No DB

## Status

Completed.

## Scope

This task adds a small Data Correction bootstrap shortcut for injecting a complete writer set. Existing nested `dataCorrection` options remain the explicit source of truth; the new shortcut is only a convenience path when a caller has a prebuilt safe writer set.

## Changes

- Added `dataCorrectionWriterSet` shortcut support in `src/app.js`.
- Added `dataCorrectionWriterSet` shortcut support in `src/server.js`.
- Added app factory coverage in `tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js`.
- Added server bootstrap coverage in `tests/dataCorrection/dataCorrectionServerOptions.unit.test.js`.
- Updated app/server static source-boundary checks to keep the shortcut visible without importing DB, providers, AI, or runtime side effects.

## Runtime Contract

- `dataCorrection` nested options keep priority over every shortcut.
- `dataCorrectionWriterSet` is passed through as the Data Correction writer set only when nested `dataCorrection` is absent.
- Individual shortcut writers remain supported.
- No writer is called during bootstrap.
- Writers execute only on matching Data Correction governance requests.

## Boundaries

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

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` — PASS, 28 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 478 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1711 passed / 0 failed.

## Notes

This keeps app/server Data Correction bootstrap flexible for future safe writer-set injection while preserving the current no-DB and permission-gated route boundaries.

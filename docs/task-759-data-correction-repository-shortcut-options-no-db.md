# Task 759 — Data Correction Repository Shortcut Options / No DB

## Status

Completed.

## Scope

This task adds a small app/server bootstrap shortcut for injecting an already-created Data Correction persistence repository. The shortcut reads the repository writer set through `getWriterSet()` and passes those writers into the existing Data Correction governance route.

## Changes

- Added `dataCorrectionRepository` shortcut support in `src/app.js`.
- Added `dataCorrectionRepository` shortcut support in `src/server.js`.
- Added app factory coverage in `tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js`.
- Added server bootstrap coverage in `tests/dataCorrection/dataCorrectionServerOptions.unit.test.js`.
- Updated app/server static source-boundary checks to keep the shortcut visible without importing DB, Data Correction repository modules, external providers, AI, or runtime side effects.

## Runtime Contract

- Nested `dataCorrection` options keep priority over every shortcut.
- `dataCorrectionWriterSet` keeps priority over `dataCorrectionRepository`.
- `dataCorrectionRepository.getWriterSet()` is used only when nested `dataCorrection` and `dataCorrectionWriterSet` are absent.
- The app/server layer does not import Data Correction repository internals.
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

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` — PASS, 32 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 482 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1715 passed / 0 failed.

## Notes

This keeps future repository-backed Data Correction wiring explicit and injected while preserving the current no-DB bootstrap boundary.

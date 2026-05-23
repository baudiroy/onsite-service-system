# Task 785 — Data Correction Query Executor Alias Runtime Support / No DB / No Migration

## Scope

Add a small compatibility alias so Data Correction query-backed persistence writers can receive `queryExecutor` as an alias for `executor`.

This is a runtime-adjacent integration convenience for future app/server/bootstrap wiring. It does not open a database connection, does not add a DB adapter, and does not change the existing synchronous default contract.

## Changes

- Updated the query-backed persistence writer option resolver to prefer `queryExecutor` when explicitly provided, otherwise falling back to `executor`.
- Added sync query-backed writer coverage for the `queryExecutor` alias.
- Added async query-backed writer coverage for the `queryExecutor` alias.
- Added repository method coverage for both sync and async `queryExecutor` alias usage.
- Kept the sync contract test intact so the default high-level query-backed writers still return plain objects and still reject Promise-returning executors.

## Guardrails

- No DB connection is opened; tests use injected synthetic executors only.
- No migration, schema, index, API route, package script, provider sending, LINE/SMS/App push, AI/RAG, billing, settlement, or customer-visible behavior is introduced.
- The default repository path remains synchronous unless `asyncWriters` / `useAsyncWriters` is explicitly enabled.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionQueryBackedPersistenceWriters.unit.test.js tests/dataCorrection/dataCorrectionPersistenceRepository.unit.test.js tests/dataCorrection/dataCorrectionQueryBackedPersistenceWritersSyncContract.unit.test.js` — PASS, 58 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 548 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1820 passed / 0 failed.
- `git diff --check` — PASS.

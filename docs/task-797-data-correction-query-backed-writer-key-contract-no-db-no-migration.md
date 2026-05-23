# Task 797 - Data Correction Query-backed Writer Key Contract / No DB / No Migration

## Scope

Expose the Data Correction query-backed persistence writer high-level and low-level writer keys as public immutable contracts derived from the binding list.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, or change persistence write behavior.

## Changes

- Added `DATA_CORRECTION_QUERY_BACKED_HIGH_LEVEL_WRITER_KEYS`.
- Added `DATA_CORRECTION_QUERY_BACKED_LOW_LEVEL_WRITER_KEYS`.
- Kept both key lists derived from `QUERY_BACKED_WRITER_BINDINGS` so the exported contract cannot drift from the writer binding map.
- Added coverage that the exported key lists are frozen, match the existing expected writer keys, and stay aligned with the binding list.

## Guardrails

- No DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing query-backed writer behavior remains unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionQueryBackedPersistenceWriters.unit.test.js` - PASS, 29 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 565 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1837 passed / 0 failed.
- `git diff --check` - PASS.

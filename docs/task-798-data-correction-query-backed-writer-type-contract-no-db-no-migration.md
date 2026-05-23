# Task 798 - Data Correction Query-backed Writer Type Contract / No DB / No Migration

## Scope

Expose the Data Correction query-backed persistence writer types as a public immutable contract derived from the binding list.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, or change persistence write behavior.

## Changes

- Added `DATA_CORRECTION_QUERY_BACKED_WRITER_TYPES`.
- Kept the writer type list derived from `QUERY_BACKED_WRITER_BINDINGS` so the exported contract stays aligned with the query-backed writer binding map.
- Added coverage that the writer type list is frozen, unique, aligned with the binding list, and aligned with `DATA_CORRECTION_PERSISTENCE_WRITER_TYPES`.

## Guardrails

- No DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing query-backed writer behavior remains unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionQueryBackedPersistenceWriters.unit.test.js` - PASS, 30 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 566 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1838 passed / 0 failed.
- `git diff --check` - PASS.

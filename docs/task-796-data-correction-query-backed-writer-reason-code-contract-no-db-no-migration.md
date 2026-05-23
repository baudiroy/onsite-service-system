# Task 796 — Data Correction Query-backed Writer Reason Code Contract / No DB / No Migration

## Scope

Expose the Data Correction query-backed persistence writer fail-closed reason codes as a public immutable contract.

This is a bounded runtime source change. It does not connect to a database, execute SQL, add a migration, or change persistence write behavior.

## Changes

- Added `DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES`.
- Reused the exported reason-code contract inside sync and async query-backed writer fail-closed paths.
- Added coverage that the reason-code contract is immutable and includes the query-backed writer failure reasons.

## Guardrails

- No DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing query-backed writer behavior remains unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionQueryBackedPersistenceWriters.unit.test.js` - PASS, 28 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 564 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1836 passed / 0 failed.
- `git diff --check` - PASS.

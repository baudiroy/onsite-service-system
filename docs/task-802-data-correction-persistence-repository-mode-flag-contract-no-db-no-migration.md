# Task 802 - Data Correction Persistence Repository Mode Flag Contract / No DB / No Migration

## Scope

Expose the Data Correction persistence repository async writer mode option names as an immutable source contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, or change persistence write behavior.

## Changes

- Added `DATA_CORRECTION_PERSISTENCE_REPOSITORY_MODE_FLAGS`.
- Updated repository mode selection to use the exported mode flag contract instead of inline option strings.
- Added coverage that the mode flag contract is immutable and still maps to `asyncWriters` / `useAsyncWriters`.

## Guardrails

- No DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing sync and async repository behavior remains unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionPersistenceRepository.unit.test.js` - PASS, 22 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 568 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1840 passed / 0 failed.
- `git diff --check` - PASS.

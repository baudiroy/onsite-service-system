# Task 799 - Data Correction Repository Writer Key Contract Alignment / No DB / No Migration

## Scope

Align the Data Correction persistence repository writer key contract with the query-backed writer high-level key contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, or change persistence write behavior.

## Changes

- Updated `DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITER_KEYS` to derive from `DATA_CORRECTION_QUERY_BACKED_HIGH_LEVEL_WRITER_KEYS`.
- Added coverage that the repository writer key contract remains identical to the query-backed high-level writer key contract.

## Guardrails

- No DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing repository write method behavior remains unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionPersistenceRepository.unit.test.js` - PASS, 20 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 566 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1838 passed / 0 failed.
- `git diff --check` - PASS.

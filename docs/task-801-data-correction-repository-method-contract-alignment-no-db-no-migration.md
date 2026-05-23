# Task 801 - Data Correction Repository Method Contract Alignment / No DB / No Migration

## Scope

Align the Data Correction persistence repository full method contract with the write-method-only contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, or change persistence write behavior.

## Changes

- Updated `DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHODS` to derive from `getWriterSet` plus `DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITE_METHODS`.
- Added coverage that the full repository method list remains exactly `getWriterSet` followed by the write-method-only contract.

## Guardrails

- No DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing repository method behavior remains unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionPersistenceRepository.unit.test.js` - PASS, 21 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 567 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1839 passed / 0 failed.
- `git diff --check` - PASS.

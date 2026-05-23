# Task 803 - Data Correction Persistence Repository Read Method Contract / No DB / No Migration

## Scope

Expose the Data Correction persistence repository read/accessor method list as an immutable source contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, or change persistence write behavior.

## Changes

- Added `DATA_CORRECTION_PERSISTENCE_REPOSITORY_READ_METHODS`.
- Updated `DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHODS` to derive from read methods plus write methods.
- Added coverage that the read-method contract remains immutable, limited to `getWriterSet`, and disjoint from write methods.

## Guardrails

- No DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing repository method behavior remains unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionPersistenceRepository.unit.test.js` - PASS, 23 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 569 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1841 passed / 0 failed.
- `git diff --check` - PASS.

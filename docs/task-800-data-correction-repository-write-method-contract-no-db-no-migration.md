# Task 800 - Data Correction Repository Write Method Contract / No DB / No Migration

## Scope

Expose the Data Correction persistence repository write-method-only list as a public immutable contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, or change persistence write behavior.

## Changes

- Added `DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITE_METHODS`.
- Derived the write-method-only contract from the repository method-to-writer-key map, excluding non-write helper methods such as `getWriterSet`.
- Added coverage that the write-method-only list is frozen, excludes `getWriterSet`, and aligns with both the method-to-writer-key map and the full repository method list.

## Guardrails

- No DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing repository write method behavior remains unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionPersistenceRepository.unit.test.js` - PASS, 21 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 567 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1839 passed / 0 failed.
- `git diff --check` - PASS.

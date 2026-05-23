# Task 793 — Data Correction Persistence Repository Method Map Contract / No DB / No Migration

## Scope

Expose the Data Correction persistence repository method-to-writer-key mapping as a public immutable contract.

This is a bounded runtime source change. It does not connect to a database, execute SQL, add a migration, or change persistence write behavior.

## Changes

- Added `DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHOD_TO_WRITER_KEY`.
- Added coverage that the exported method map covers every repository write method except `getWriterSet`.
- Added coverage that every mapped writer key is part of the public repository writer-key contract.
- Added immutability coverage for the exported method-map contract.

## Guardrails

- No DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing repository methods and writer behavior remain unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionPersistenceRepository.unit.test.js` — PASS, 20 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 561 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1833 passed / 0 failed.
- `git diff --check` — PASS.

# Task 811 - Data Correction Controller Sanitizer Pattern Contract / No DB / No Migration

## Scope

Expose the Data Correction controller response sanitizer patterns as an immutable source contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, add a route, or change HTTP response behavior.

## Changes

- Added `DATA_CORRECTION_CONTROLLER_SANITIZER_PATTERNS`.
- Updated controller forbidden-key and sensitive-string checks to use the exported sanitizer pattern contract.
- Added coverage that the sanitizer pattern contract is immutable and still detects sensitive keys/values while allowing safe display text.

## Guardrails

- No DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing sanitizer behavior remains unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionController.unit.test.js` - PASS, 33 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 577 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1849 passed / 0 failed.
- `git diff --check` - PASS.

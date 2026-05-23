# Task 809 - Data Correction Controller Safe Message Key Contract / No DB / No Migration

## Scope

Expose the Data Correction controller safe message key mapping as an immutable source contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, add a route, or change HTTP response behavior.

## Changes

- Added `DATA_CORRECTION_CONTROLLER_SAFE_MESSAGE_KEYS`.
- Updated controller forbidden and malformed response builders to use the exported message key contract.
- Added coverage that the controller safe message key contract is immutable and still exposes the existing values.

## Guardrails

- No DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing controller safe message keys remain unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionController.unit.test.js` - PASS, 31 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 575 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1847 passed / 0 failed.
- `git diff --check` - PASS.

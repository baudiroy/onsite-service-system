# Task 807 - Data Correction Controller Status Code Contract / No DB / No Migration

## Scope

Expose the Data Correction controller HTTP status code mapping as an immutable source contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, or change HTTP response behavior.

## Changes

- Added `DATA_CORRECTION_CONTROLLER_STATUS_CODES`.
- Updated controller response builders to use the exported status code contract for `200`, `400`, and `403`.
- Reused the governance envelope status contract for deny responses.
- Added coverage that the controller status code contract is immutable and still exposes the existing values.

## Guardrails

- No DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing controller HTTP status mapping remains unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionController.unit.test.js` - PASS, 29 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 573 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1845 passed / 0 failed.
- `git diff --check` - PASS.

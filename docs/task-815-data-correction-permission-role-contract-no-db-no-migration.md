# Task 815 - Data Correction Permission Role Contract / No DB / No Migration

## Scope

Expose the Data Correction permission middleware role/action boundary as an immutable source contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, add a new route, or change HTTP behavior.

## Changes

- Added `DATA_CORRECTION_PERMISSION_ROLE_CONTRACT`.
- Frozen the general correction roles allowed to request/apply normal correction decisions.
- Frozen the engineer action boundary to `unable_to_complete_result` only.
- Updated the middleware to derive internal `Set` checks from the frozen role/action contract.
- Added coverage that the role contract is immutable and does not allow AI/customer/engineer role expansion into general correction.

## Guardrails

- No DB connection, migration, schema, index, new API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing Data Correction permission behavior remains unchanged.
- AI role remains denied even with permissions.
- Engineers remain limited to assigned unable-to-complete result flow and cannot perform general data correction.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionPermissionMiddleware.unit.test.js` - PASS, 21 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 578 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1850 passed / 0 failed.
- `git diff --check` - PASS.

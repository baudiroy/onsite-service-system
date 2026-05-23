# Task 810 - Data Correction Controller Decision Contract / No DB / No Migration

## Scope

Expose the Data Correction controller safe-deny decision value as an immutable source contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, add a route, or change HTTP response behavior.

## Changes

- Added `DATA_CORRECTION_CONTROLLER_DECISIONS`.
- Updated controller forbidden, malformed, and deny response fallback paths to use the exported decision contract.
- Added coverage that the controller decision contract is immutable and still exposes the existing `safe_deny` value.

## Guardrails

- No DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing controller decision values remain unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionController.unit.test.js` - PASS, 32 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 576 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1848 passed / 0 failed.
- `git diff --check` - PASS.

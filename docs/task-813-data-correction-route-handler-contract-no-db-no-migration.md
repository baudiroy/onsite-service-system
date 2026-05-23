# Task 813 - Data Correction Route Handler Contract / No DB / No Migration

## Scope

Expose the Data Correction governance route handler chain as an immutable source contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, add a new route, or change HTTP behavior.

## Changes

- Added `DATA_CORRECTION_GOVERNANCE_ROUTE_HANDLER_CONTRACT`.
- Kept the route handler chain at exactly two handlers:
  - permission middleware first
  - governance handler second
- Updated route registration to build the handler chain explicitly before registering the existing route.
- Added coverage that the handler contract is immutable and that route registration keeps the permission middleware before the governance handler.

## Guardrails

- No DB connection, migration, schema, index, new API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing Data Correction route method and path remain unchanged.
- Route permission enforcement remains before governance handling.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionRoutes.unit.test.js` - PASS, 9 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 578 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1850 passed / 0 failed.
- `git diff --check` - PASS.

# Task 812 - Data Correction Route Contract / No DB / No Migration

## Scope

Expose the Data Correction governance route method/path pair as an immutable source contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, add a new route, or change HTTP behavior.

## Changes

- Added `DATA_CORRECTION_GOVERNANCE_ROUTE_CONTRACT`.
- Updated route registration to use the frozen route contract for method and path.
- Preserved the existing `DATA_CORRECTION_GOVERNANCE_ROUTE_PATH` export for compatibility.
- Added coverage that the route contract is immutable and still exposes the existing `POST /data-correction/governance` route.

## Guardrails

- No DB connection, migration, schema, index, new API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing Data Correction route method and path remain unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionRoutes.unit.test.js` - PASS, 8 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 577 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1849 passed / 0 failed.
- `git diff --check` - PASS.

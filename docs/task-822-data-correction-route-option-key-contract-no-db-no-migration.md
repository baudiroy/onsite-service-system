# Task 822 - Data Correction Route Option Key Contract / No DB / No Migration

## Scope

Expose the Data Correction route-specific option key as an immutable contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, add a new route, or change HTTP behavior.

## Changes

- Added `DATA_CORRECTION_GOVERNANCE_ROUTE_OPTION_KEYS`.
- The route layer continues to pass `options.permission` to `createDataCorrectionPermissionMiddleware`.
- The route layer continues to pass the full options object to `createDataCorrectionGovernanceHandler` for existing writer/provider injection behavior.
- Added coverage that the route option key contract is frozen.

## Guardrails

- No DB connection, migration, schema, index, new API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing route path, method, handler order, and writer option behavior remain unchanged.
- Permission middleware remains first in the route chain.
- Phone changes still require re-verification and cannot be applied through normal correction.
- AI role remains denied by the permission layer.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionRoutes.unit.test.js` - PASS, 10 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 584 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1856 passed / 0 failed.
- `git diff --check` - PASS.

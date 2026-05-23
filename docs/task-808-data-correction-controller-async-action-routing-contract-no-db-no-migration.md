# Task 808 - Data Correction Controller Async Action Routing Contract / No DB / No Migration

## Scope

Expose the Data Correction controller async action routing list as an immutable source contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, add a route, or change HTTP behavior.

## Changes

- Added `DATA_CORRECTION_CONTROLLER_ASYNC_ACTIONS`.
- Derived the controller async action values from the governance orchestrator action contract.
- Updated controller async handler routing to use the exported contract instead of inline action strings.
- Added coverage that the async action routing contract is immutable and aligned with governance action values.

## Guardrails

- No DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing controller async routing behavior remains unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionController.unit.test.js` - PASS, 30 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 574 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1846 passed / 0 failed.
- `git diff --check` - PASS.

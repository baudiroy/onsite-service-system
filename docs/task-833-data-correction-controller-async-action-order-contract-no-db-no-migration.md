# Task 833 - Data Correction Controller Async Action Order Contract / No DB / No Migration

## Scope

Expose and cover a frozen controller async action order contract for Data Correction writer-backed actions.

This is a bounded runtime contract task. It does not connect to a database, execute SQL, add a migration, add a route, change HTTP behavior, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Added `DATA_CORRECTION_CONTROLLER_ASYNC_ACTION_ORDER` in `src/controllers/dataCorrectionController.js`.
- Exported the frozen async action order contract.
- Updated controller unit coverage for the new exported contract.
- Updated action parity coverage to compare async action order against the writer-backed governance action set.

## Guardrails

- Controller async routing behavior is unchanged.
- The async action order is derived from `DATA_CORRECTION_CONTROLLER_ASYNC_ACTIONS`.
- `data_correction_request` remains outside the async writer-backed routing contract.
- No DB schema, migration, API, permission, audit log, notification, customer channel, AI/RAG, billing, or settlement behavior is introduced.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionController.unit.test.js tests/dataCorrection/dataCorrectionActionContractParity.unit.test.js` - PASS, 40 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 598 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1870 passed / 0 failed.
- `git diff --check` - PASS.

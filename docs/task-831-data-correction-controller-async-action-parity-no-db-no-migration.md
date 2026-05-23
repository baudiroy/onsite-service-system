# Task 831 - Data Correction Controller Async Action Parity / No DB / No Migration

## Scope

Add parity coverage that the Data Correction controller async action routing contract stays limited to writer-backed governance actions.

This is a bounded runtime test-contract task. It does not connect to a database, execute SQL, add a migration, add a route, change HTTP behavior, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Updated `tests/dataCorrection/dataCorrectionActionContractParity.unit.test.js`.
- Added coverage that `DATA_CORRECTION_CONTROLLER_ASYNC_ACTIONS` matches governance actions except `data_correction_request`.
- Added coverage that `data_correction_request` is not part of the controller async writer-backed action route.
- Added immutability coverage for the controller async action contract inside the parity test.

## Guardrails

- Controller async routing remains limited to actions that may call injected writers:
  - `data_correction_request` (added to the async writer-backed contract by Task 836 for audit/contact/dispatch-note writers)
  - `pre_departure_apply`
  - `post_departure_freeze`
  - `unable_to_complete_result`
  - `follow_up_proposal`
- `data_correction_request` remains outside official correction application, but is no longer outside the async writer-backed routing contract after Task 836.
- No DB schema, migration, API, permission, audit log, notification, customer channel, AI/RAG, billing, or settlement behavior is introduced.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionActionContractParity.unit.test.js` - PASS, 3 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 596 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1868 passed / 0 failed.
- `git diff --check` - PASS.

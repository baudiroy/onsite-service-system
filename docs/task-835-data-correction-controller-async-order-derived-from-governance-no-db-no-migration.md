# Task 835 - Data Correction Controller Async Order Derived From Governance / No DB / No Migration

## Scope

Derive the Data Correction controller async action order from the governance-layer writer-backed action contract.

This is a bounded runtime contract task. It does not connect to a database, execute SQL, add a migration, add a route, change HTTP behavior, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Updated `src/controllers/dataCorrectionController.js`.
- Imported `DATA_CORRECTION_GOVERNANCE_WRITER_BACKED_ACTION_ORDER`.
- Derived `DATA_CORRECTION_CONTROLLER_ASYNC_ACTION_ORDER` from the governance writer-backed action order.

## Guardrails

- Controller async routing behavior is unchanged.
- The controller still exposes its own async action map and order contract.
- The action order source of truth now comes from governance writer-backed action order.
- `data_correction_request` remains outside official correction application, but is included in the async writer-backed routing contract after Task 836 for audit/contact/dispatch-note writers.
- No DB schema, migration, API, permission, audit log, notification, customer channel, AI/RAG, billing, or settlement behavior is introduced.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionController.unit.test.js tests/dataCorrection/dataCorrectionActionContractParity.unit.test.js` - PASS, 40 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 598 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1870 passed / 0 failed.
- `git diff --check` - PASS.

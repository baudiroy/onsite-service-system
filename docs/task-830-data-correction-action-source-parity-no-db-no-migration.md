# Task 830 - Data Correction Action Source Parity / No DB / No Migration

## Scope

Add parity coverage for Data Correction `actionType` source paths across permission middleware, controller, and governance orchestrator layers.

This is a bounded runtime test-contract task. It does not connect to a database, execute SQL, add a migration, add a route, change HTTP behavior, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Added `tests/dataCorrection/dataCorrectionActionSourceParity.unit.test.js`.
- Added coverage that controller and permission middleware action source paths are identical.
- Added coverage that controller request-body paths normalize to the governance request paths.
- Added immutability coverage for all involved action source path contracts.

## Guardrails

- `actionType` remains accepted only from the request body contract:
  - `body.actionType`
  - `body.payload.actionType`
- Governance orchestrator continues to receive normalized request input:
  - `actionType`
  - `payload.actionType`
- Query strings, headers, sessions, and other action-like sources remain outside the contract.
- No DB schema, migration, API, permission, audit log, notification, customer channel, AI/RAG, billing, or settlement behavior is introduced.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionActionSourceParity.unit.test.js` - PASS, 2 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 595 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1867 passed / 0 failed.
- `git diff --check` - PASS.

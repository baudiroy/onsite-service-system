# Task 829 - Data Correction Writer Option Parity / No DB / No Migration

## Scope

Add parity coverage for Data Correction writer option keys across controller, app/server shortcut, query-backed writer, and persistence repository layers.

This is a bounded runtime test-contract task. It does not connect to a database, execute SQL, add a migration, add a route, change HTTP behavior, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Added `tests/dataCorrection/dataCorrectionWriterOptionParity.unit.test.js`.
- Added coverage that controller writer option keys match query-backed high-level writer keys.
- Added coverage that persistence repository writer keys match query-backed high-level writer keys.
- Added coverage that app/server `dataCorrection...` shortcut writer keys normalize back to the same high-level writer keys.
- Added immutability coverage for all involved writer option contracts.

## Guardrails

- The writer behavior is unchanged.
- App/server shortcut values retain the existing `dataCorrection...` prefix.
- The parity test only normalizes shortcut keys for comparison against internal writer option names.
- No DB schema, migration, API, permission, audit log, notification, customer channel, AI/RAG, billing, or settlement behavior is introduced.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionWriterOptionParity.unit.test.js` - PASS, 2 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 593 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1865 passed / 0 failed.
- `git diff --check` - PASS.

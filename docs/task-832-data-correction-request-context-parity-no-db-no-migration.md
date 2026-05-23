# Task 832 - Data Correction Request Context Parity / No DB / No Migration

## Scope

Add parity coverage for Data Correction request context keys across permission middleware and controller layers.

This is a bounded runtime test-contract task. It does not connect to a database, execute SQL, add a migration, add a route, change HTTP behavior, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Added `tests/dataCorrection/dataCorrectionRequestContextParity.unit.test.js`.
- Added coverage that controller request context keys match permission middleware request context keys.
- Added coverage that the request auth contract remains limited to:
  - `auth`
  - `dataCorrectionPermissionContext`
- Added immutability coverage for both request context key contracts.

## Guardrails

- Request auth/context source behavior is unchanged.
- Headers, sessions, cookies, query strings, and other auth-like locations remain outside this contract.
- No DB schema, migration, API, permission, audit log, notification, customer channel, AI/RAG, billing, or settlement behavior is introduced.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionRequestContextParity.unit.test.js` - PASS, 2 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 598 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1870 passed / 0 failed.
- `git diff --check` - PASS.

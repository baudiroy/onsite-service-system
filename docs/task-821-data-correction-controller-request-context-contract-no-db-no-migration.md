# Task 821 - Data Correction Controller Request Context Contract / No DB / No Migration

## Scope

Expose the Data Correction controller request auth source, permission context source, and action source paths as immutable contracts.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, add a new route, or change HTTP behavior beyond making existing controller boundaries explicit.

## Changes

- Added `DATA_CORRECTION_CONTROLLER_REQUEST_CONTEXT_KEYS`.
- Added `DATA_CORRECTION_CONTROLLER_ACTION_SOURCE_PATHS`.
- The controller continues to prefer `req.dataCorrectionPermissionContext` over `req.auth`.
- The controller continues to resolve `actionType` only from:
  - `body.actionType`
  - `body.payload.actionType`
- Added coverage that header/session auth-like values are ignored.
- Added coverage that query/header action-like values are ignored while payload fallback remains supported.

## Guardrails

- No DB connection, migration, schema, index, new API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing Data Correction controller behavior remains unchanged for supported request sources.
- Headers, sessions, query string, raw phone, raw LINE id, token, secret, internal note, AI raw payload, request body, and full payload are not used as permission context.
- Phone changes still require re-verification and cannot be applied through normal correction.
- AI role remains denied by the route permission layer and cannot become an official actor through payload data.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionController.unit.test.js` - PASS, 36 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 583 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1855 passed / 0 failed.
- `git diff --check` - PASS.

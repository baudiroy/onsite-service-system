# Task 819 - Data Correction Permission Action Source Contract / No DB / No Migration

## Scope

Expose the Data Correction permission action source paths as an immutable contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, add a new route, or change HTTP behavior beyond making the existing action source boundary explicit.

## Changes

- Added `DATA_CORRECTION_PERMISSION_ACTION_SOURCE_PATHS`.
- The permission middleware continues to resolve `actionType` from:
  - `body.actionType`
  - `body.payload.actionType`
- Added coverage that the source-path contract is frozen.
- Added coverage that payload fallback remains accepted while query/header action sources are ignored.

## Guardrails

- No DB connection, migration, schema, index, new API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing Data Correction permission behavior remains unchanged for supported body/payload action sources.
- Query string, header, raw phone, raw LINE id, token, secret, internal note, AI raw payload, request body, and full payload are not used as permission context.
- Phone changes still require re-verification and cannot be applied through normal correction.
- AI role remains denied even with permissions.
- Engineers remain limited to assigned unable-to-complete result flow and cannot perform general data correction.

## Verification

- `node --test tests/dataCorrection/dataCorrectionPermissionMiddleware.unit.test.js` - PASS, 22 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 579 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1851 passed / 0 failed.
- `git diff --check` - PASS.

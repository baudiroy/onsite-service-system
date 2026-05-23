# Task 820 - Data Correction Permission Request Context Contract / No DB / No Migration

## Scope

Expose the Data Correction permission middleware request auth source and permission context write target as an immutable contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, add a new route, or change HTTP behavior.

## Changes

- Added `DATA_CORRECTION_PERMISSION_REQUEST_CONTEXT_KEYS`.
- The middleware continues to read auth only from `req.auth`.
- The middleware continues to write safe permission output only to `req.dataCorrectionPermissionContext`.
- Added coverage that the request-context contract is frozen.
- Added coverage that headers/session auth-like data is not accepted as a permission context source.

## Guardrails

- No DB connection, migration, schema, index, new API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing Data Correction permission behavior remains unchanged for supported `req.auth` context.
- Headers, sessions, raw phone, raw LINE id, token, secret, internal note, AI raw payload, request body, and full payload are not used as permission context.
- Phone changes still require re-verification and cannot be applied through normal correction.
- AI role remains denied even with permissions.
- Engineers remain limited to assigned unable-to-complete result flow and cannot perform general data correction.

## Verification

- `node --test tests/dataCorrection/dataCorrectionPermissionMiddleware.unit.test.js` - PASS, 23 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 580 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1852 passed / 0 failed.
- `git diff --check` - PASS.

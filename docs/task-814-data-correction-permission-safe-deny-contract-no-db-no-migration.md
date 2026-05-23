# Task 814 - Data Correction Permission Safe Deny Contract / No DB / No Migration

## Scope

Expose the Data Correction permission middleware safe-deny status code and response body as immutable source contracts.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, add a new route, or change HTTP behavior.

## Changes

- Added `DATA_CORRECTION_PERMISSION_STATUS_CODES`.
- Added `DATA_CORRECTION_PERMISSION_SAFE_DENY_RESPONSE`.
- Updated permission middleware helpers to use the exported contracts for the existing `403` deny response and existing safe body.
- Added coverage that the contracts are immutable and preserve the generic safe-deny response.

## Guardrails

- No DB connection, migration, schema, index, new API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing Data Correction permission responses remain unchanged.
- Permission denial remains generic and does not expose raw phone, address, LINE id, token, secret, internal note, AI raw payload, or denial internals.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionPermissionMiddleware.unit.test.js` - PASS, 21 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 578 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1850 passed / 0 failed.
- `git diff --check` - PASS.

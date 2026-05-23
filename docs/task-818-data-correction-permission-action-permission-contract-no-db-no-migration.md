# Task 818 - Data Correction Permission Action Permission Contract / No DB / No Migration

## Scope

Expose the Data Correction action order, canonical permission map, and alias permission map through one immutable source contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, add a new route, or change HTTP behavior.

## Changes

- Added `DATA_CORRECTION_PERMISSION_ACTION_PERMISSION_CONTRACT`.
- The contract points to the existing frozen:
  - `DATA_CORRECTION_PERMISSION_ACTION_ORDER`
  - `DATA_CORRECTION_ACTION_PERMISSION_MAP`
  - `DATA_CORRECTION_ACTION_PERMISSION_ALIASES`
- Added coverage that the contract is frozen, has only the expected top-level keys, and references the same canonical action/permission sources used by the middleware.

## Guardrails

- No DB connection, migration, schema, index, new API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing Data Correction permission behavior remains unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- AI role remains denied even with permissions.
- Engineers remain limited to assigned unable-to-complete result flow and cannot perform general data correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionPermissionMiddleware.unit.test.js` - PASS, 21 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 578 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1850 passed / 0 failed.
- `git diff --check` - PASS.

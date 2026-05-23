# Task 804 - Data Correction App Shortcut Option Key Contract / No DB / No Migration

## Scope

Expose the `createApp` Data Correction shortcut option names as an immutable source contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, or change application route behavior.

## Changes

- Froze the app-level Data Correction shortcut option key list.
- Exported `DATA_CORRECTION_APP_SHORTCUT_OPTION_KEYS`.
- Added coverage that the shortcut option key contract is immutable and still includes the supported repository, writer-set, and individual writer shortcut options.

## Guardrails

- No DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing `createApp` Data Correction option priority remains unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js` - PASS, 31 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 570 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1842 passed / 0 failed.
- `git diff --check` - PASS.

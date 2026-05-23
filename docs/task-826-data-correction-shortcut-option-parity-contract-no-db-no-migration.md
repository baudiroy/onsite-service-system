# Task 826 - Data Correction Shortcut Option Parity Contract / No DB / No Migration

## Scope

Add parity coverage for Data Correction shortcut option contracts across the app factory and server bootstrap layers.

This is a bounded runtime test contract change. It does not connect to a database, execute SQL, add a migration, add a new route, change HTTP behavior, or introduce any customer notification, AI, billing, settlement, or shared runtime side effect.

## Changes

- Added parity coverage that `DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP` matches `DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP`.
- Added parity coverage that `DATA_CORRECTION_APP_SHORTCUT_OPTION_KEYS` matches `DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEYS`.
- Added coverage that all four shortcut contracts remain frozen.

## Guardrails

- No DB connection, migration, schema, index, new API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing app factory and server bootstrap Data Correction shortcut behavior remain unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- Post-departure changes remain manual-contact oriented.
- Unable-to-complete and follow-up flows remain source-data contracts only; no formal appointment or FSR creation is introduced.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionShortcutOptionParity.unit.test.js` - PASS, 2 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 587 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1859 passed / 0 failed.
- `git diff --check` - PASS.

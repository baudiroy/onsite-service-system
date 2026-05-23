# Task 825 - Data Correction Server Shortcut Option Key Map Contract / No DB / No Migration

## Scope

Expose the Data Correction server bootstrap shortcut option keys as an immutable map while preserving the existing immutable shortcut key list.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, add a new route, change HTTP behavior, or introduce any customer notification, AI, billing, settlement, or shared runtime side effect.

## Changes

- Added `DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP`.
- Derived the existing `DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEYS` list from the key map.
- Replaced server-bootstrap internal Data Correction shortcut option string reads with the frozen key map.
- Preserved existing shortcut option names and priority behavior:
  - explicit `dataCorrection` options still win.
  - `dataCorrectionWriterSet` still wins over `dataCorrectionRepository`.
  - explicit shortcut writers still map to the same governance writer slots.
- Added coverage that the server shortcut option key map and list are frozen.

## Guardrails

- No DB connection, migration, schema, index, new API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing server bootstrap app resolution, listen behavior, and Data Correction shortcut priority remain unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- Post-departure changes remain manual-contact oriented.
- Unable-to-complete and follow-up flows remain source-data contracts only; no formal appointment or FSR creation is introduced.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` - PASS, 33 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 585 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1857 passed / 0 failed.
- `git diff --check` - PASS.

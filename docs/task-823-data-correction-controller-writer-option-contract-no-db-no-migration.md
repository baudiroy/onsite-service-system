# Task 823 - Data Correction Controller Writer Option Contract / No DB / No Migration

## Scope

Expose the Data Correction controller writer option keys as an immutable source contract.

This is a bounded runtime source contract change. It does not connect to a database, execute SQL, add a migration, add a new route, change HTTP behavior, or introduce any customer notification, AI, billing, settlement, or shared runtime side effect.

## Changes

- Added `DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS`.
- Replaced controller-internal writer option string reads with the exported frozen contract.
- Preserved existing writer option names:
  - `appointmentResultWriter`
  - `auditWriter`
  - `contactLogWriter`
  - `correctionWriter`
  - `dispatchNoteWriter`
  - `engineerNotificationWriter`
  - `evidenceWriter`
  - `followUpDraftWriter`
- Added coverage that the writer option key contract is frozen.

## Guardrails

- No DB connection, migration, schema, index, new API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Existing writer injection names and async writer detection behavior remain unchanged.
- Phone changes still require re-verification and cannot be applied through normal correction.
- Post-departure changes remain manual-contact oriented.
- Unable-to-complete and follow-up flows remain source-data contracts only; no formal appointment or FSR creation is introduced.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionController.unit.test.js` - PASS, 37 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 585 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1857 passed / 0 failed.
- `git diff --check` - PASS.

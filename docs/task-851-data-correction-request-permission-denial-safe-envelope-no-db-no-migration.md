# Task 851 - Data Correction Request Permission Denial Safe Envelope / No Manual Writers / No DB

## Scope

Harden the tested boundary for `data_correction_request` permission-denied behavior. A denied request must return a safe generic envelope before manual-handling writers run, must not create or imply a correction application, and must not expose permission internals or sensitive payload data.

This is a bounded runtime test and documentation task. It does not connect to a database, execute SQL, add or apply a migration, change API route shape, expand DTO contracts, modify admin frontend code, send notifications, or introduce provider, AI/RAG, billing, settlement, LINE/SMS/App push, or shared runtime behavior.

## Changes

- Added request-service coverage proving missing permission blocks before audit, contact-log, dispatch-note, or correction writers run.
- Added app-factory coverage proving permission-denied `data_correction_request` returns a safe generic denial and does not call manual-handling writers.
- Added server-bootstrap coverage for the same permission-denied request path.
- Confirmed `correctionApplicationReady` remains false and no official correction application is created or implied.

## Guardrails

- Permission model and permission names are unchanged.
- `data_correction_request` remains request/manual-handling oriented and cannot apply an official correction.
- Permission-denied requests do not call contact-log, dispatch-note, audit, or correction writers.
- Denial envelopes remain safe and generic.
- No DB schema, migration, provider, customer channel, AI/RAG, billing, or settlement behavior is introduced.

## Verification

- `node --test tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` - PASS, 102 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 627 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1899 passed / 0 failed.
- `git diff --check -- src/dataCorrection/dataCorrectionRequestService.js tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js docs/task-851-data-correction-request-permission-denial-safe-envelope-no-db-no-migration.md` - PASS.

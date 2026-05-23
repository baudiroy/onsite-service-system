# Task 850 - Data Correction Request Manual-Handling Writer Failure Safe Envelope / No DB / No Migration

## Scope

Harden `data_correction_request` response behavior when request-path manual-handling writers fail. A failed audit, contact-log, or dispatch-note writer now returns a safe `failed` envelope while preserving the request-only boundary.

This is a bounded runtime hardening and test task. It does not connect to a database, execute SQL, add or apply a migration, change route shape, expand DTOs, modify admin frontend code, send notifications, or introduce provider, AI/RAG, billing, settlement, LINE/SMS/App push, or shared runtime behavior.

## Changes

- Added request-service coverage where audit, contact-log, and dispatch-note writers fail on a post-departure `data_correction_request`.
- Normalized request-service output so any failed injected writer sets `status: failed` and `safeMessageKey: dataCorrection.writerFailed`.
- Updated app/server request-path failure coverage to expect a safe failed envelope for failing persistence writers.
- Confirmed `correctionWriter` remains unused for request-path writer failure and `correctionApplicationReady` remains false.

## Guardrails

- `data_correction_request` remains manual-handling/contact-log/dispatch-note/audit oriented.
- Official correction application remains limited to the pre-departure apply path.
- No official correction application is created or implied by request-path writer failure.
- Permission-denied behavior and pre-departure correction application behavior are not widened.
- No DB schema, migration, provider, customer channel, AI/RAG, billing, or settlement behavior is introduced.

## Verification

- `node --test tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` - PASS, 99 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 624 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1896 passed / 0 failed.
- `git diff --check -- tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js src/dataCorrection/dataCorrectionRequestService.js docs/task-850-data-correction-request-manual-handling-writer-failure-safe-envelope.md` - PASS.

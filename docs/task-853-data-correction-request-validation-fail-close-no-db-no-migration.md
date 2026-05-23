# Task 853 — Data Correction Request Validation Fail-Close / No Manual Writers / No DB

## Goal

Harden invalid `data_correction_request` input handling so malformed or incomplete requests fail safely before audit, contact-log, dispatch-note, or correction writers run.

## Scope

Changed files:

- `src/dataCorrection/dataCorrectionRequestService.js`
- `tests/dataCorrection/dataCorrectionRequestService.unit.test.js`
- `tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js`
- `tests/dataCorrection/dataCorrectionServerOptions.unit.test.js`
- `docs/task-853-data-correction-request-validation-fail-close-no-db-no-migration.md`

## Runtime Change

The request service now performs a bounded required correction input guard before policy evaluation and before any writer execution.

Invalid request input requires:

- `correction.fieldKey`
- `correction.fieldGroup`

If either is missing, the request returns a safe deny envelope with:

- `allowed: false`
- `status: blocked`
- `decision: safe_deny`
- `reasonCode: FIELD_GROUP_NOT_ALLOWED`
- `safeMessageKey: dataCorrection.unavailable`
- `correctionApplicationReady: false`
- `manualHandlingRequired: false`
- empty `writerResults`

This guard runs before audit/contact-log/dispatch-note writer paths and before manual handling paths.

## Safety Decisions

- Invalid input does not call `auditWriter`.
- Invalid input does not call `contactLogWriter`.
- Invalid input does not call `dispatchNoteWriter`.
- Invalid input does not call `correctionWriter`.
- Invalid input does not create, imply, or expose official correction application.
- Safe envelopes do not include stack traces, SQL, token, secret, DB URL, raw LINE id, full phone/address, raw validation internals, or full payload.
- Existing valid request behavior is not intentionally changed.

## Non-goals

This task did not:

- add API routes, DTO fields, controllers, services, or repositories beyond the bounded request-service guard.
- add DB schema, migrations, seed data, DDL, or psql usage.
- change permission model, policy schema, or audit runtime.
- add real audit/contact/dispatch/correction persistence.
- add smoke or integration tests.
- change admin frontend.
- touch provider sending, AI/RAG runtime, billing, settlement, package files, or credentials.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js # PASS, 108 passed / 0 failed
node --test tests/dataCorrection/*.js # PASS, 633 passed / 0 failed
npm run check # PASS
find tests -type f -name '*.js' -exec node --test {} + # PASS, 1961 passed / 0 failed
git diff --check -- src/dataCorrection/dataCorrectionRequestService.js tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js docs/task-853-data-correction-request-validation-fail-close-no-db-no-migration.md # PASS
```

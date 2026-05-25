# Task 902 - Data Correction Decision Audit Writer Invocation Boundary Helper

Status: completed

## Goal

Move the remaining injected `decisionAuditWriter` invocation behavior into a small pure helper so the service layer no longer owns writer resolution, try/catch handling, promise compatibility handling, or writer result shaping directly.

This is a bounded runtime-adjacent helper slice. It does not add a default audit writer, real DB access, repository wiring, migration execution, provider runtime, public API body expansion, route/controller behavior change, correction behavior change, or public response shape change.

## Modified Files

- `src/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.js`
- `src/dataCorrection/dataCorrectionRequestService.js`
- `src/dataCorrection/preDepartureCorrectionApplicationService.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.unit.test.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocationClosure.static.test.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriterClosure.static.test.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditIntentSideChannelClosure.static.test.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizerClosure.static.test.js`
- `tests/dataCorrection/dataCorrectionRequestService.unit.test.js`
- `tests/dataCorrection/preDepartureCorrectionApplicationService.unit.test.js`
- `tests/dataCorrection/dataCorrectionSourceBoundary.static.test.js`
- `docs/task-902-data-correction-decision-audit-writer-invocation-boundary-helper-no-db-no-api-shape-change.md`

No `admin/src/`, `migrations/`, package, env/config, DB/global repository, API route/controller/DTO public contract, provider, LINE/SMS/App push/webhook/email, AI/RAG, billing/settlement, smoke, or credential file was modified for Task902.

## Implementation Summary

Added `dataCorrectionDecisionAuditWriterInvocation.js` as a pure helper that:

- resolves only explicitly injected writer functions or object writers with a `write` method;
- returns skipped metadata when no valid injected writer exists;
- calls sync injected writers and normalizes their result through the Task900 normalizer;
- preserves the existing sync promise-like compatibility path by treating promise-like sync writer returns as recorded while suppressing unhandled rejection noise;
- calls async injected writers through an awaited helper and normalizes success, failure-like result, and thrown/rejected errors to safe metadata;
- never imports DB, repositories, providers, routes/controllers, app/server wiring, env/config, logger, AI/RAG, billing/settlement, or permission runtime.

Updated the request and pre-departure apply services to delegate injected writer invocation to the new helper while preserving existing behavior.

## Preserved Behavior

- `decisionAuditWriter` remains optional and injected-only.
- Missing or invalid writer remains skipped.
- Success-like writer result remains recorded.
- Failure flags remain safe failed metadata.
- Writer throw or async rejection remains safe failed metadata.
- Public/default response body remains unchanged.
- `auditIntent` and `decisionAuditWriterResult` remain internal/opt-in only.
- `data_correction_request` remains manual-handling and does not apply an official correction.
- official correction application remains limited to valid `pre_departure_apply`.
- No Case / Appointment / Field Service Report / `finalAppointmentId` behavior changed.

## Coverage

The new and updated tests verify:

- helper accepts only explicit function writers or object writers with `write`;
- missing/non-function writer returns skipped safely;
- sync function and object writer success returns recorded without echoing writer internals;
- failure-like writer results normalize to safe failed metadata;
- thrown writer errors normalize to safe failed metadata;
- sync promise-like writer return keeps the previous recorded compatibility path;
- async helper awaits success, failure, and rejection safely;
- helper imports only the pure normalizer and no side-effect runtime;
- request/apply services import the helper and do not keep local writer invocation logic;
- request service still does not apply a correction or invoke a correction writer for `data_correction_request`;
- public HTTP/default envelopes still do not expose `auditIntent` or `decisionAuditWriterResult`;
- unsafe values and keys remain absent from helper results, public envelopes, and closure assertions.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.unit.test.js
node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocationClosure.static.test.js
node --test tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.http-behavior.unit.test.js
node --test tests/dataCorrection/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/dataCorrection tests/dataCorrection docs/task-902-data-correction-decision-audit-writer-invocation-boundary-helper-no-db-no-api-shape-change.md
```

Results:

- `node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.unit.test.js`: PASS, 9 passed / 0 failed.
- `node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocationClosure.static.test.js`: PASS, 6 passed / 0 failed.
- `node --test tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.http-behavior.unit.test.js`: PASS, 17 passed / 0 failed.
- `node --test tests/dataCorrection/*.js`: PASS, 933 passed / 0 failed.
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS, 2813 passed / 0 failed.
- `git diff --check -- src/dataCorrection tests/dataCorrection docs/task-902-data-correction-decision-audit-writer-invocation-boundary-helper-no-db-no-api-shape-change.md`: PASS.

# Task 900 - Data Correction Decision Audit Writer Result Normalizer

Status: completed

## Goal

Centralize safe `decisionAuditWriterResult` normalization into a small pure utility and use it from the existing Data Correction request/apply injected-writer paths.

This is a bounded runtime utility slice. It does not add a default writer, real DB, audit sink, migration execution, provider runtime, public API response expansion, or correction behavior change.

## Modified Files

- `src/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer.js`
- `src/dataCorrection/dataCorrectionRequestService.js`
- `src/dataCorrection/preDepartureCorrectionApplicationService.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer.unit.test.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditIntentSideChannelClosure.static.test.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriterClosure.static.test.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditWriterClosure.static.test.js`
- `tests/dataCorrection/dataCorrectionSourceBoundary.static.test.js`
- `tests/dataCorrection/dataCorrectionRequestService.unit.test.js`
- `tests/dataCorrection/preDepartureCorrectionApplicationService.unit.test.js`
- `docs/task-900-data-correction-decision-audit-writer-result-normalizer-no-db-no-api-shape-change.md`

No `admin/src/`, `migrations/`, package, env/config, DB/global repository, API route/controller/DTO public contract, provider, LINE/SMS/App push/webhook/email, AI/RAG, billing/settlement, smoke, or credential file was modified.

## Runtime Change

Added a pure normalizer module:

- `normalizeDecisionAuditWriterRecordedResult()`
- `normalizeDecisionAuditWriterSkippedResult()`
- `normalizeDecisionAuditWriterFailureResult()`
- `normalizeDecisionAuditWriterResult(result)`

The request/apply services now reuse this pure normalizer for the optional injected `decisionAuditWriter` result shaping.

## Preserved Behavior

- Missing or invalid decision audit writer still returns `status: skipped`.
- Success-like writer return still normalizes to `status: recorded`.
- `ok: false`, `persisted: false`, `recorded: false`, or `auditWritten: false` still normalizes to:
  - `status: failed`
  - `reasonCode: DECISION_AUDIT_WRITER_FAILED`
  - `safeMessageKey: dataCorrection.decisionAuditWriterFailed`
- Writer throw still normalizes to the same safe failed metadata.
- Public/default response body remains unchanged.
- Public/default response body still does not expose `auditIntent` or `decisionAuditWriterResult`.
- `data_correction_request` remains manual-handling.
- official correction application remains limited to valid `pre_departure_apply`.
- Writer success/failure does not change request/apply outcome.
- No Case / Appointment / Field Service Report / `finalAppointmentId` behavior changed.

## Guardrail Coverage

The new unit test verifies:

- normalizer status constants and helpers.
- success-like writer result normalization.
- failure-flag normalization.
- skipped / recorded / failed helper result safety.
- returned result objects are detached copies.
- unsafe writer internals, raw phone/address/LINE id, token/secret/DB URL, SQL/stack, `finalAppointmentId`, FSR/report id, internal note, AI raw payload, billing/settlement internals, and full payload do not appear in normalized results.
- normalizer source imports no DB, repository, provider, AI/RAG, billing/settlement, route/controller/app/server, env/config/network/logger, permission runtime, or audit sink.

Existing source-boundary tests were updated only to recognize the new pure local normalizer dependency.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer.unit.test.js tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.http-behavior.unit.test.js
node --test tests/dataCorrection/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer.js src/dataCorrection/dataCorrectionRequestService.js src/dataCorrection/preDepartureCorrectionApplicationService.js tests/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer.unit.test.js tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js docs/task-900-data-correction-decision-audit-writer-result-normalizer-no-db-no-api-shape-change.md
```

Results:

- `node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer.unit.test.js tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.http-behavior.unit.test.js`: PASS, 22 passed / 0 failed.
- `node --test tests/dataCorrection/*.js`: PASS, 910 passed / 0 failed.
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS, 2790 passed / 0 failed.
- `git diff --check -- src/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer.js src/dataCorrection/dataCorrectionRequestService.js src/dataCorrection/preDepartureCorrectionApplicationService.js tests/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer.unit.test.js tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js docs/task-900-data-correction-decision-audit-writer-result-normalizer-no-db-no-api-shape-change.md`: PASS.

# Task 904 - Data Correction Decision Audit Writer Sanitized Invocation Matrix

Status: completed

## Goal

Add an end-to-end synthetic-writer test matrix proving every existing injected `decisionAuditWriter` call receives only the Task903 sanitized writer input, never raw service payloads or the full audit intent object.

This is a bounded runtime-adjacent verification task. It does not add a default writer, repository-backed audit writer, DB access, migration execution, route/controller behavior, public API shape change, provider sending, AI/RAG behavior, billing/settlement behavior, smoke/shared runtime, or official correction behavior change.

## Modified Files

- `tests/dataCorrection/dataCorrectionDecisionAuditSanitizedInvocationMatrix.unit.test.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditSanitizedInvocationMatrixClosure.static.test.js`
- `docs/task-904-data-correction-decision-audit-writer-sanitized-invocation-matrix-no-db-no-api-shape-change.md`

No `src/` production file was modified for Task904. No `admin/src/`, `migrations/`, package, env/config, DB/repository, API route/controller/bootstrap, provider, LINE/SMS/App push/webhook/email, AI/RAG, billing/settlement, smoke/shared runtime, or credential file was modified.

## Implementation Summary

Added `dataCorrectionDecisionAuditSanitizedInvocationMatrix.unit.test.js` using synthetic writer spies through actual service paths:

- `processDataCorrectionRequest`
- `processDataCorrectionRequestAsync`
- `applyPreDepartureCorrection`
- `applyPreDepartureCorrectionAsync`

The matrix verifies that the injected `decisionAuditWriter` receives sanitized writer input from Task903's builder rather than raw service payloads, full audit intent objects, writer internals, or response envelopes.

Added `dataCorrectionDecisionAuditSanitizedInvocationMatrixClosure.static.test.js` to lock the new matrix and existing helper path to pure service/test dependencies only.

## Matrix Coverage

The matrix covers:

- successful valid `pre_departure_apply`;
- writer recorded/success-like result;
- writer failure-like result;
- writer throw;
- async writer rejection path;
- partial request metadata;
- nested sensitive data;
- unsafe-looking allowlisted values;
- manual `data_correction_request` path remains non-applying;
- default public response shape remains closed without opt-in side channels.

## Sensitive Field Assertions

Synthetic writer calls prove they do not receive raw or nested forms of:

- phone / mobile / tel;
- address;
- `line_user_id` / `lineUserId`;
- `finalAppointmentId`;
- Field Service Report / FSR / report identifiers;
- SQL / DB URL / connection string;
- stack traces;
- token / secret / password / API key;
- raw AI/provider payload;
- billing / settlement internals;
- internal notes;
- full/raw request payloads;
- writer raw internals.

## Preserved Behavior

- `decisionAuditWriter` remains optional and injected-only.
- No default writer and no repository-backed audit writer.
- Writer success/failure/throw/rejection behavior remains normalized.
- Writer success/failure/throw does not change official apply outcome.
- `data_correction_request` remains manual-handling and does not apply an official correction.
- Official correction application remains limited to valid `pre_departure_apply`.
- Default public response shape remains closed: no `auditIntent`, `decisionAuditWriterResult`, writer input, or writer internals.

## Explicit Non-scope

- No DB.
- No migration.
- No psql.
- No `npm run db:migrate`.
- No DDL/SQL dry-run/apply.
- No default writer.
- No repository-backed audit writer.
- No API shape change.
- No admin/src.
- No provider sending.
- No LINE/SMS/App/email/webhook.
- No AI/RAG.
- No billing/settlement.
- No smoke/shared runtime.
- No token, secret, credential, LINE access token, or AI provider setting change.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditSanitizedInvocationMatrix.unit.test.js
node --test tests/dataCorrection/dataCorrectionDecisionAuditSanitizedInvocationMatrixClosure.static.test.js
node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.unit.test.js
node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.unit.test.js
node --test tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.http-behavior.unit.test.js
node --test tests/dataCorrection/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/dataCorrection tests/dataCorrection docs/task-904-data-correction-decision-audit-writer-sanitized-invocation-matrix-no-db-no-api-shape-change.md
```

Results:

- `node --test tests/dataCorrection/dataCorrectionDecisionAuditSanitizedInvocationMatrix.unit.test.js`: PASS, 8 passed / 0 failed.
- `node --test tests/dataCorrection/dataCorrectionDecisionAuditSanitizedInvocationMatrixClosure.static.test.js`: PASS, 6 passed / 0 failed.
- `node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.unit.test.js`: PASS, 5 passed / 0 failed.
- `node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.unit.test.js`: PASS, 9 passed / 0 failed.
- `node --test tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.http-behavior.unit.test.js`: PASS, 17 passed / 0 failed.
- `node --test tests/dataCorrection/*.js`: PASS, 959 passed / 0 failed.
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS, 2839 passed / 0 failed.
- `git diff --check -- src/dataCorrection tests/dataCorrection docs/task-904-data-correction-decision-audit-writer-sanitized-invocation-matrix-no-db-no-api-shape-change.md`: PASS.

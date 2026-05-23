# Task 903 - Data Correction Decision Audit Writer Input Builder Sensitive Field Exclusion

Status: completed

## Goal

Ensure the optional injected `decisionAuditWriter` receives a minimal, allowlist-based, sanitized writer input instead of the raw service payload or the full audit intent object.

This is a bounded runtime-adjacent safety slice. It does not add a default writer, repository-backed writer, DB access, migration execution, route/controller behavior, public API shape change, provider sending, AI/RAG behavior, billing/settlement behavior, smoke/shared runtime, or official correction behavior change.

## Modified Files

- `src/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.js`
- `src/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.unit.test.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilderClosure.static.test.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.unit.test.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocationClosure.static.test.js`
- `tests/dataCorrection/dataCorrectionSourceBoundary.static.test.js`
- `docs/task-903-data-correction-decision-audit-writer-input-builder-sensitive-field-exclusion-no-db-no-api-shape-change.md`

No `admin/src/`, `migrations/`, package, env/config, DB/repository, API route/controller/DTO public contract, provider, LINE/SMS/App push/webhook/email, AI/RAG, billing/settlement, smoke, shared runtime, or credential file was modified for Task903.

## Implementation Summary

Added `dataCorrectionDecisionAuditWriterInputBuilder.js` as a pure helper that:

- uses an explicit allowlist for decision audit writer input fields;
- preserves safe metadata such as action, event type, status, organization id, actor id, case id, appointment id, field metadata, reason code, message key, request id, timestamp, and audit-written state;
- drops missing, partial, non-object, unsafe-looking, overly long, or sensitive-looking values;
- excludes top-level and nested sensitive fields by construction;
- imports no DB, repository, provider, route/controller, app/server, env/config, network, logger, AI/RAG, billing/settlement, permission runtime, or writer sink.

Updated `dataCorrectionDecisionAuditWriterInvocation.js` so the injected writer receives the sanitized writer input from the builder before result normalization.

## Preserved Behavior

- `decisionAuditWriter` remains optional and injected-only.
- Missing or invalid writer remains skipped.
- Writer success, failure-like result, throw, promise-like compatibility, and async rejection behavior remain normalized as before.
- Public/default response body remains unchanged.
- `auditIntent`, `decisionAuditWriterResult`, writer input, and writer internals remain absent from default/public responses.
- `data_correction_request` remains manual-handling and does not apply an official correction.
- official correction application remains limited to valid `pre_departure_apply`.
- No Case / Appointment / Field Service Report / `finalAppointmentId` behavior changed.

## Sensitive Field Exclusion

The builder excludes raw or nested forms of:

- phone / mobile / tel;
- address;
- LINE user id;
- `finalAppointmentId`;
- Field Service Report / report identifiers;
- SQL / DB URL / connection strings;
- stack traces;
- token / secret / password / API key;
- raw AI/provider payload;
- billing / settlement internals;
- internal notes;
- full/raw request payloads;
- writer internals.

## Coverage

The new and updated tests verify:

- builder is pure and has no side-effect runtime imports;
- missing, non-object, or partial input produces a safe minimal writer input;
- safe metadata is preserved;
- sensitive top-level and nested fields are excluded;
- unsafe-looking allowlisted values are dropped;
- injected writer receives sanitized writer input instead of raw audit intent;
- request/apply services continue to keep default public response shape closed;
- request path remains non-applying;
- invocation helper keeps only pure builder and normalizer dependencies;
- route/controller sources still expose no audit side-channel fields.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.unit.test.js
node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilderClosure.static.test.js
node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.unit.test.js
node --test tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.http-behavior.unit.test.js
node --test tests/dataCorrection/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/dataCorrection tests/dataCorrection docs/task-903-data-correction-decision-audit-writer-input-builder-sensitive-field-exclusion-no-db-no-api-shape-change.md
```

Results:

- `node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.unit.test.js`: PASS, 5 passed / 0 failed.
- `node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilderClosure.static.test.js`: PASS, 7 passed / 0 failed.
- `node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.unit.test.js`: PASS, 9 passed / 0 failed.
- `node --test tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.http-behavior.unit.test.js`: PASS, 17 passed / 0 failed.
- `node --test tests/dataCorrection/*.js`: PASS, 945 passed / 0 failed.
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS, 2825 passed / 0 failed.
- `git diff --check -- src/dataCorrection tests/dataCorrection docs/task-903-data-correction-decision-audit-writer-input-builder-sensitive-field-exclusion-no-db-no-api-shape-change.md`: PASS.

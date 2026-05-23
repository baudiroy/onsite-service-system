# Task 898 - Data Correction Decision Audit Injected Writer HTTP Behavior Unit Test

Status: completed

## Goal

Add HTTP/app-like unit coverage proving the explicit injected `decisionAuditWriter` app/server option works through existing Data Correction request/apply paths without changing the public response body.

This task uses fake injected writers only. It adds no real DB, no audit sink, no migration execution, no public API shape change, and no server listen behavior.

## Modified Files

- `tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.http-behavior.unit.test.js`
- `docs/task-898-data-correction-decision-audit-injected-writer-http-behavior-unit-test-no-real-db-no-api-shape-change.md`

No `src/`, `admin/src/`, `migrations/`, package, provider, AI/RAG, billing/settlement, smoke, credential, or config file was modified.

## Coverage Added

The unit test covers:

- default app-like HTTP path has no decision audit writer and no public audit side-channel body.
- explicit `createApp` injected `decisionAuditWriter` can receive safe Task869/870 request `auditIntent` metadata.
- explicit `createApp` injected `decisionAuditWriter` can receive safe apply `auditIntent` metadata while correction application outcome remains unchanged.
- explicit `createServerBootstrap` injected `decisionAuditWriter` works through the app-like handler path without starting a server.
- injected writer failure is redacted and does not change the request/apply outcome.
- public response body never exposes:
  - `auditIntent`.
  - `decisionAuditWriterResult`.
  - raw writer result.
  - writer internals.
  - raw values.
  - phone/address/LINE id.
  - `finalAppointmentId`.
  - Field Service Report id / report id.
  - internal note.
  - AI raw payload.
  - billing / settlement internals.
- the test source remains app-like and does not use server listen, `supertest`, `node:http`, `node:https`, or `node:net`.
- app/server do not import the decision-audit repository/writer directly.

## Preserved Boundaries

- `data_correction_request` remains manual-handling.
- official correction application remains limited to valid `pre_departure_apply`.
- writer success/failure remains side-effect bounded.
- no default writer is configured.
- no real DB/global repository/env/config/provider/AI/RAG/billing/settlement/audit sink is imported or called.
- no Case / Appointment / Field Service Report / `finalAppointmentId` behavior changes.
- no provider sending, admin UI, package, smoke, secret, or config change.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.http-behavior.unit.test.js
node --test tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriterAppServerOptions.unit.test.js tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/preDepartureCorrectionApplicationService.unit.test.js
node --test tests/dataCorrection/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.http-behavior.unit.test.js docs/task-898-data-correction-decision-audit-injected-writer-http-behavior-unit-test-no-real-db-no-api-shape-change.md src/app.js src/server.js
```

Results:

- `node --test tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.http-behavior.unit.test.js`: PASS, 6 passed / 0 failed.
- `node --test tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriterAppServerOptions.unit.test.js tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/preDepartureCorrectionApplicationService.unit.test.js`: PASS, 62 passed / 0 failed.
- `node --test tests/dataCorrection/*.js`: PASS, 895 passed / 0 failed.
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS, 2775 passed / 0 failed.
- `git diff --check -- tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.http-behavior.unit.test.js docs/task-898-data-correction-decision-audit-injected-writer-http-behavior-unit-test-no-real-db-no-api-shape-change.md src/app.js src/server.js`: PASS.

# Task 887 - Data Correction Decision Audit Service Injected Writer Path

Status: completed

## Goal

Wire the Task885 decision-audit writer into the existing Data Correction request/apply services as an optional injected internal side effect after Task870 audit intent creation.

Task887 keeps the path opt-in and unit-test-only:

- no default writer configuration
- no service/app/API public response shape change
- no route/controller/DTO change
- no real DB connection
- no global DB import
- no `psql`
- no migration execution
- no dry-run
- no apply
- no provider / LINE / SMS / App push / webhook / email runtime
- no AI / RAG runtime
- no billing / settlement runtime
- no admin frontend
- no package change
- no smoke/integration test

## Modified Files

- `src/dataCorrection/dataCorrectionRequestService.js`
- `src/dataCorrection/preDepartureCorrectionApplicationService.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js`
- `docs/task-887-data-correction-decision-audit-service-injected-writer-path-no-real-db-no-api-shape-change.md`

## Implementation Summary

- Added optional `decisionAuditWriter` support to `processDataCorrectionRequest`.
- Added optional `decisionAuditWriter` support to `processDataCorrectionRequestAsync`.
- Added optional `decisionAuditWriter` support to `applyPreDepartureCorrection`.
- Added optional `decisionAuditWriter` support to `applyPreDepartureCorrectionAsync`.
- The writer receives only Task869/Task870 safe `auditIntent` metadata.
- Writer success/failure is independent from official correction outcomes.
- Writer failure returns safe internal metadata only when the caller explicitly requests the audit side-channel.
- Default service output remains unchanged when `includeDecisionAuditIntent` / `includeAuditIntent` is not set.

## Safe Runtime Boundary

Task887 does not import or call:

- global DB / pool / pg
- repositories
- environment / config / credentials
- API routes / controllers / DTOs
- app/server/bootstrap code
- provider / LINE / SMS / App push / webhook / email runtime
- AI / RAG runtime
- billing / settlement runtime
- permission runtime
- correction behavior beyond the existing request/apply services

## Public Shape Boundary

Default request/apply responses remain unchanged:

- no `auditIntent`
- no `response`
- no `decisionAuditWriterResult`

When explicitly requested through the existing internal audit side-channel, the service may return:

- `auditIntent`
- `response`
- safe `decisionAuditWriterResult`

The writer result is never added to the public/default response.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js tests/dataCorrection/dataCorrectionDecisionAuditIntentSideChannel.unit.test.js tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/preDepartureCorrectionApplicationService.unit.test.js
node --test tests/dataCorrection/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/dataCorrection/dataCorrectionRequestService.js src/dataCorrection/preDepartureCorrectionApplicationService.js tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js tests/dataCorrection/dataCorrectionDecisionAuditIntentSideChannel.unit.test.js docs/task-887-data-correction-decision-audit-service-injected-writer-path-no-real-db-no-api-shape-change.md
```

- `node --test tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js tests/dataCorrection/dataCorrectionDecisionAuditIntentSideChannel.unit.test.js tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/preDepartureCorrectionApplicationService.unit.test.js`: PASS, 64 passed / 0 failed.
- `node --test tests/dataCorrection/*.js`: PASS, 823 passed / 0 failed.
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS, 2703 passed / 0 failed.
- `git diff --check -- ...`: PASS.

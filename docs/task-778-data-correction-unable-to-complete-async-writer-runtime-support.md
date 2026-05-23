# Task 778 — Data Correction Unable-to-complete Async Writer Runtime Support

## Scope

Add bounded runtime support for async unable-to-complete appointment result writers used through the Data Correction governance route.

This task only affects the arrived/on-site unable-to-complete writer path for appointment result, evidence, and audit writers. It does not add DB access, migrations, provider sending, AI, RAG, LINE, SMS, package scripts, or smoke scripts.

## Changes

- Added `recordUnableToCompleteAppointmentResultAsync` while preserving the existing synchronous `recordUnableToCompleteAppointmentResult` API.
- Routed `unable_to_complete_result` through the async governance path when `runDataCorrectionGovernanceActionAsync` is used.
- Updated the Data Correction controller handler factory so it only uses the async response path for `unable_to_complete_result` when an injected result/evidence/audit writer is async.
- Added service, orchestrator, controller, app factory, and server option coverage for async unable-to-complete writer success and safe failure handling.
- Confirmed async writer failure maps to safe `appointmentResult.writerFailed` output without leaking raw error values.

## Guardrails

- Unable-to-complete remains an appointment terminal result path, not a Field Service Report creation path.
- No follow-up appointment is created by this slice.
- Evidence refs remain sanitized and bounded.
- `finalAppointmentId` remains backend/system-determined and is stripped from outputs.
- No DB connection, migration, provider sending, AI/RAG, LINE/SMS, or customer-visible expansion is introduced.

## Verification

- `node --test tests/dataCorrection/unableToCompleteAppointmentResultService.unit.test.js tests/dataCorrection/dataCorrectionGovernanceOrchestrator.unit.test.js tests/dataCorrection/dataCorrectionController.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` — PASS, 114 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 516 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1788 passed / 0 failed.

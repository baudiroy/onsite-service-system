# Task 779 — Data Correction Follow-up Proposal Async Writer Runtime Support

## Scope

Add bounded runtime support for async follow-up appointment proposal writers used through the Data Correction governance route.

This task only affects the follow-up proposal writer path for follow-up draft, dispatch note, and audit writers. It does not add DB access, migrations, provider sending, AI, RAG, LINE, SMS, package scripts, or smoke scripts.

## Changes

- Added `proposeFollowUpAppointmentAsync` while preserving the existing synchronous `proposeFollowUpAppointment` API.
- Routed `follow_up_proposal` through the async governance path when `runDataCorrectionGovernanceActionAsync` is used.
- Updated the Data Correction controller handler factory so it only uses the async response path for `follow_up_proposal` when an injected follow-up writer is async.
- Added service, orchestrator, controller, app factory, and server option coverage for async follow-up proposal writer success and safe failure handling.
- Confirmed async writer failure maps to safe `followUp.writerFailed` output without leaking raw error values.

## Guardrails

- Follow-up proposal remains a draft/proposal path, not an automatic appointment creation path.
- The proposal path does not create or mutate a formal Field Service Report.
- `finalAppointmentId` remains backend/system-determined and is stripped from outputs.
- Evidence and required-parts refs remain sanitized and bounded.
- No DB connection, migration, provider sending, AI/RAG, LINE/SMS, or customer-visible expansion is introduced.

## Verification

- `node --test tests/dataCorrection/followUpAppointmentProposalService.unit.test.js tests/dataCorrection/dataCorrectionGovernanceOrchestrator.unit.test.js tests/dataCorrection/dataCorrectionController.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` — PASS, 123 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 527 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1799 passed / 0 failed.
- `git diff --check` — PASS.

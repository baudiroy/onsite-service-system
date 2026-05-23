# Task 777 — Data Correction Post-departure Freeze Async Writer Runtime Support

## Scope

Add bounded runtime support for async post-departure freeze writers used through the Data Correction governance route.

This task only affects the post-departure freeze writer path for contact log, dispatch note, audit, and engineer notification intent writers. It does not add DB access, migrations, provider sending, AI, RAG, LINE, SMS, package scripts, or smoke scripts.

## Changes

- Added `handlePostDepartureCorrectionFreezeAsync` while preserving the existing synchronous `handlePostDepartureCorrectionFreeze` API.
- Routed `post_departure_freeze` through the async governance path when `runDataCorrectionGovernanceActionAsync` is used.
- Updated the Data Correction controller handler factory so it only uses the async response path for `post_departure_freeze` when an injected post-departure writer is async.
- Added service, orchestrator, controller, app factory, and server option coverage for async post-departure freeze writer success and safe failure handling.
- Confirmed async writer failure maps to safe `dataCorrection.writerFailed` output without leaking raw error values.

## Guardrails

- Post-departure corrections remain frozen for normal data mutation and require manual contact / dispatch handling.
- Phone corrections still require re-verification and cannot be applied through the post-departure freeze path.
- Arrived/on-site corrections still require engineer evidence handling instead of normal freeze writer handling.
- No formal Field Service Report is created or mutated.
- `finalAppointmentId` remains backend/system-determined and is stripped from outputs.
- No DB connection, migration, provider sending, AI/RAG, LINE/SMS, or customer-visible expansion is introduced.

## Verification

- `node --test tests/dataCorrection/postDepartureCorrectionFreezeService.unit.test.js tests/dataCorrection/dataCorrectionGovernanceOrchestrator.unit.test.js tests/dataCorrection/dataCorrectionController.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` — PASS, 98 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 505 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1777 passed / 0 failed.

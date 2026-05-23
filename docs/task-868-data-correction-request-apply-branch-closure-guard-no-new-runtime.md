# Task 868 - Data Correction Request/Apply Branch Closure Guard

Status: completed

## Goal

Close the current Data Correction / Amendment Governance runtime hardening slice with a static safety net. This task adds no new runtime behavior. It documents the accepted boundaries from Task 845 through Task 867 and asserts that request and apply branches remain separated.

## Scope

Changed files:

- `tests/dataCorrection/dataCorrectionRequestApplyBranchClosure.static.test.js`
- `docs/task-868-data-correction-request-apply-branch-closure-guard-no-new-runtime.md`

No source/runtime implementation file was changed.

## Task 845-867 Closure Summary

- Task 845 established the first-phase Data Correction / Amendment Governance baseline.
- Task 846 hardened the early request/apply separation boundary.
- Task 847 kept the correction request path bounded to safe request handling.
- Task 848 kept route/controller envelopes from expanding into official correction mutation.
- Task 849 reinforced safe route boundaries and sensitive-output redaction.
- Task 850 expanded safe writer contracts without adding official data mutation.
- Task 851 kept writer behavior injected and synthetic, not a real audit/contact/dispatch sink.
- Task 852 preserved correction request behavior without database writes.
- Task 853 kept manual-handling metadata safe and bounded.
- Task 854 verified safe writer output stayed redacted.
- Task 855 covered post-departure freeze boundaries.
- Task 856 covered unable-to-complete appointment result boundaries.
- Task 857 covered follow-up proposal boundaries.
- Task 858 kept follow-up behavior from creating formal appointments.
- Task 859 kept writer-failure behavior safe across Data Correction services.
- Task 860 kept persistence planning bounded and non-applied where applicable.
- Task 861 kept migration/schema planning separate from runtime.
- Task 862 kept persistence dry-run/apply approval separate from implementation.
- Task 863 hardened pre-departure apply writer behavior without broadening API or permission semantics.
- Task 864 reinforced pre-departure apply writer failure handling.
- Task 865 verified permission-denied `pre_departure_apply` remains safe and does not call correction/manual writers.
- Task 866 verified malformed `pre_departure_apply` fails closed before correction/manual writers or repository shortcuts.
- Task 867 verified `pre_departure_apply` audit metadata remains safe, redacted, and limited to existing injected audit writer metadata.

## Accepted Branch Boundaries

The Data Correction request/apply branch is closed with these accepted boundaries:

- `data_correction_request` remains a request and manual-handling decision path.
- The request path may call injected `auditWriter`, `contactLogWriter`, and `dispatchNoteWriter` when policy requires those records.
- The request path never calls `correctionWriter`.
- The request path never calls correctionWriter.
- The request path must not create official correction application records or mutate official Case, Appointment, Field Service Report, customer identity, phone, channel identity, parts, billing, settlement, or `finalAppointmentId` data.
- Official correction application is limited to valid `pre_departure_apply`.
- Official correction application is limited to valid pre_departure_apply.
- `pre_departure_apply` must pass policy evaluation first and then apply only when the pre-departure eligibility checks pass.
- Permission-denied, malformed validation-failed, phone re-verification, post-departure, arrived, unsafe-value, and writer-failure paths must not create official correction application.
- Failed apply must not fall back to contact log / dispatch note as if it were a manual post-departure request.
- There is no manual fallback from failed apply.
- There is no silent overwrite.
- There is no finalAppointmentId mutation.
- There is no raw sensitive output.
- There is no DB, migration, psql, DDL, or schema change.
- There is no API shape expansion.
- There is no real audit sink.
- There is no admin frontend.
- There is no provider, AI/RAG, billing, or settlement runtime.

## Static Guard Added

`tests/dataCorrection/dataCorrectionRequestApplyBranchClosure.static.test.js` asserts:

- The closure doc mentions Task 845 through Task 867.
- `dataCorrectionRequestService` remains writer-only and does not reference `correctionWriter`, `buildSafeCorrectionPayload`, or official correction application mutation.
- Official correction application remains limited to `preDepartureCorrectionApplicationService`.
- Pre-departure apply consults the request policy with `auditWriter` only before any correction writer path.
- The orchestrator keeps `data_correction_request` and `pre_departure_apply` on separate service paths.
- The checked Data Correction files do not add DB, migration, repository, provider, AI/RAG, billing, settlement, admin, LINE/SMS/email/push, or transaction dependencies.
- This closure document records the no-runtime/no-sensitive-output boundaries.

## Non-goals

This task does not add or change:

- Runtime behavior.
- API shape, routes, controllers, DTOs, or response semantics.
- Permission model, schema, or policy expansion.
- DB, migration, psql, DDL, schema, repository, or persistence runtime.
- Real audit sink or audit-log storage.
- Admin frontend.
- Smoke or integration tests.
- Provider sending, AI/RAG, billing, settlement, notification, LINE, SMS, email, or push runtime.

This branch also does not authorize future implementation work by itself. Any persistence, DB, admin, or broader runtime task still requires a separate bounded task.

## Verification

- `node --test tests/dataCorrection/dataCorrectionRequestApplyBranchClosure.static.test.js` - PASS, 7 passed / 0 failed.
- `node --test tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` - PASS, 124 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 656 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1984 passed / 0 failed.
- `git diff --check -- docs/task-868-data-correction-request-apply-branch-closure-guard-no-new-runtime.md tests/dataCorrection/dataCorrectionRequestApplyBranchClosure.static.test.js tests/dataCorrection/dataCorrectionRequestService.unit.test.js` - PASS.

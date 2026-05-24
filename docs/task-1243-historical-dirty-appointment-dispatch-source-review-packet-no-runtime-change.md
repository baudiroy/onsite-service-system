# Task 1243 Historical Dirty Appointment/Dispatch Source Review Packet

Status: Completed as a docs-only review packet.

Scope: appointment / dispatch source subset only. No cleanup and no runtime change.

## Current Latest Commit

- `e61637f Document historical dirty source subset decision gate`

## Relationship To Task1239 And Task1240

Task1239 created the 4-file historical source subset decision gate.

Task1240 reviewed the 4-file diff and recommended splitting appointment/dispatch from Field Service Report completion/immutability.

Task1243 narrows review to appointment/dispatch only:

- `src/repositories/DispatchRepository.js`
- `src/services/AppointmentService.js`

## Explicit Exclusions

This packet excludes:

- `src/repositories/FieldServiceReportRepository.js`
- `src/services/FieldServiceReportService.js`
- `src/server.js`
- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`

The excluded FSR, server, docs, and smoke files require separate PM-approved tasks before review, staging, commit, cleanup, or execution.

## Required Command Snapshot

- `git log -1 --oneline`: `e61637f Document historical dirty source subset decision gate`
- `git diff --cached --name-only`: empty
- `git diff --name-only`: still the same 8 historical dirty tracked files
- `git diff --stat -- src/repositories/DispatchRepository.js src/services/AppointmentService.js`:
  - 2 files changed
  - 86 insertions
  - 3 deletions
- `git diff --check`: PASS

## Per-File Summary

### `src/repositories/DispatchRepository.js`

Runtime area: dispatch repository read path.

Observed diff:

- Adds `getDispatchAssignmentById(assignmentId, client)`.
- Uses the existing dispatch select projection.
- Filters deleted assignments with `deleted_at IS NULL`.
- Limits lookup to one row.

Likely intent:

- Give `AppointmentService` a way to validate caller-supplied `dispatchAssignmentId`.
- Support same-case ownership checks before appointment creation.
- Prevent cross-case dispatch assignment linkage.

Runtime risk:

- Adds repository behavior used by appointment creation.
- Crosses repository/service boundaries.
- Executes a DB query when a supplied dispatch assignment id is present.
- Needs synthetic repository tests and likely repository-level behavior review before any stage/commit of source changes.

### `src/services/AppointmentService.js`

Runtime area: appointment create/update validation.

Observed diff:

- Adds `validateActualTimeRange(input, existing)`.
- Adds `ensureAppointmentCompletionConsistency(existing, input, nextStatus)`.
- Adds `ensureDispatchAssignmentForCase(dispatchAssignmentId, caseId, client)`.
- Validates actual arrival / finished time range on create and update.
- Rejects completed appointment status without completed visit result.
- Rejects completed visit result without completed appointment status.
- Validates supplied `dispatchAssignmentId` belongs to the same case.
- Infers `nextStatus = 'completed'` when `visitResult` is completed.
- Stops trusting a supplied `dispatchAssignmentId` without repository validation.

Likely intent:

- Prevent invalid actual-time ranges.
- Prevent inconsistent appointment completion states.
- Prevent cross-case dispatch assignment references.
- Make completed visit-result updates produce a completed appointment status.

Runtime risk:

- Affects appointment create and update behavior.
- May change validation responses for existing clients.
- Adds a new repository call path when callers supply `dispatchAssignmentId`.
- Could affect final appointment inference indirectly by tightening completed appointment consistency.
- Needs targeted unit tests before any stage/commit of source changes.

## Runtime Risk Assessment

- The subset affects appointment create/update behavior.
- Dispatch assignment ownership validation crosses repository and service boundaries.
- DB query behavior appears involved through `getDispatchAssignmentById`.
- Unit tests or synthetic repository tests are needed before source stage/commit.
- Smoke scripts remain excluded and should not be run by this review packet.
- No DB execution is authorized by this packet.

## Candidate Future Test Plan

Before any future source stage/commit, PM should approve tests for:

- dispatch assignment found and belongs to the same case;
- dispatch assignment missing;
- dispatch assignment deleted or inactive, if applicable;
- dispatch assignment belongs to another case;
- completed `visitResult` implies completed appointment status;
- appointment completed status requires completed `visitResult`;
- actual arrival / departure time range validation;
- partial actual-time update validates the resulting range;
- completed appointment reopen/update guard if included in the final source subset.

## Future Action Options

Option A: docs-only hold. Keep the appointment/dispatch source subset untouched.

Option B: add unit tests around `AppointmentService` with synthetic repositories, then reassess.

Option C: stage and commit the appointment/dispatch source subset after targeted tests pass and PM approves the exact source paths.

Option D: discard / restore only with explicit PM confirmation that the changes are obsolete.

Option E: keep excluded FSR/source/server/smoke files untouched and decide them in separate tasks.

## Required Future Approval Before Any Action

Future action requires PM to specify:

- exact appointment/dispatch file subset;
- whether source modifications may be staged or committed;
- whether unit or integration tests may run;
- whether DB/repository behavior may be exercised;
- whether related smoke scripts remain excluded;
- whether FSR source files and `src/server.js` remain excluded.

## Current No-Go

Task1243 does not authorize:

- source modification;
- cleanup / discard;
- staging;
- commit;
- push;
- smoke execution;
- DB execution;
- migration;
- SQL dry-run;
- route mounting;
- `app.listen` work;
- provider sending;
- admin work;
- AI/RAG call;
- billing/settlement runtime;
- customer-visible runtime rollout;
- real auth/session/JWT runtime rollout;
- token parsing;
- JWT verification.

## Verification

Post-doc verification for Task1243:

- `git diff --cached --name-only`
- `git diff --name-only`
- `git diff --check`
- `git status --short -- docs/task-1243-historical-dirty-appointment-dispatch-source-review-packet-no-runtime-change.md`

Expected result:

- staged area remains empty;
- tracked dirty files remain exactly the same 8 historical dirty tracked files;
- Task1243 doc remains untracked unless a later PM-approved task stages it;
- diff check passes.

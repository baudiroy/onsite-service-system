# Task 1240 Historical Dirty Source Subset Diff Review Packet

Status: Completed as a docs-only diff review packet.

Scope: 4 historical source/runtime files only. No cleanup and no runtime change.

## Current Latest Commit

- `b0b8703 Document historical dirty stack decision boundary`

## Relationship To Task1239

Task1239 created the source subset decision gate for the historical dirty appointment / dispatch / Field Service Report source files.

Task1240 reviews the actual diff for the same 4 source files only:

- `src/repositories/DispatchRepository.js`
- `src/repositories/FieldServiceReportRepository.js`
- `src/services/AppointmentService.js`
- `src/services/FieldServiceReportService.js`

Task1240 continues to exclude:

- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`
- `src/server.js`

## Required Command Snapshot

- `git log -1 --oneline`: `b0b8703 Document historical dirty stack decision boundary`
- `git diff --cached --name-only`: empty
- `git diff --name-only`: still the same 8 historical dirty tracked files
- `git diff --stat -- <4 source files>`:
  - 4 files changed
  - 188 insertions
  - 17 deletions
- `git diff --check`: PASS

## Per-File Diff Summary

### `src/repositories/DispatchRepository.js`

Runtime area: repository read path.

Observed diff:

- Adds `getDispatchAssignmentById(assignmentId, client)`.
- Query uses existing dispatch select shape.
- Filters deleted dispatch assignments with `deleted_at IS NULL`.

Likely intent:

- Support appointment creation validation when a caller supplies `dispatchAssignmentId`.
- Allow service logic to verify that a dispatch assignment exists and belongs to the target case.

Risk:

- Runtime behavior is affected because a new repository method would be consumed by service validation.
- Unit tests should cover found, missing, deleted, and cross-case dispatch assignment behavior before any commit.

### `src/repositories/FieldServiceReportRepository.js`

Runtime area: repository write / locking path.

Observed diff:

- Adds `getServiceReportByIdForUpdate(reportId, client)`.
- Adds `completeServiceReportFirstTransition(reportId, data, client)`.
- Completion update sets `service_status = 'completed'`.
- Completion update requires `service_status <> 'completed'`.
- Completion update returns the updated report or no row if the report was already completed.
- Completion update can preserve existing `final_appointment_id` unless `finalAppointmentId` is explicitly supplied.

Likely intent:

- Support atomic first-transition completion.
- Reduce repeat-completion side effects.
- Prepare row-lock based completion behavior.

Risk:

- Runtime behavior and DB transaction semantics are involved.
- Repository tests should cover first completion, already-completed no-op / conflict path, final appointment preservation, and timestamp update behavior before any commit.
- DB/repository behavior review is likely required before runtime acceptance.

### `src/services/AppointmentService.js`

Runtime area: appointment validation and dispatch ownership.

Observed diff:

- Adds `validateActualTimeRange(input, existing)`.
- Adds `ensureAppointmentCompletionConsistency(existing, input, nextStatus)`.
- Adds `ensureDispatchAssignmentForCase(dispatchAssignmentId, caseId, client)`.
- Validates actual arrival / finished time range on create and update.
- Rejects completed appointment status unless `visitResult` is also completed.
- Rejects completed visit result unless appointment status is completed.
- When `dispatchAssignmentId` is supplied, validates it through `getDispatchAssignmentById` and requires it to belong to the same case.
- Infers `nextStatus = 'completed'` when `visitResult` is completed.

Likely intent:

- Prevent invalid actual-time ranges.
- Prevent inconsistent completed appointment states.
- Prevent cross-case dispatch assignment linkage.
- Keep appointment and dispatch consistency before downstream final appointment inference.

Risk:

- Runtime behavior is affected for appointment create/update.
- Targeted tests should cover create/update actual time validation, completion status / result consistency, cross-case dispatch assignment rejection, and existing open appointment behavior before any commit.

### `src/services/FieldServiceReportService.js`

Runtime area: Field Service Report completion, immutability, and idempotency.

Observed diff:

- Adds duplicate report conflict constants and `isDuplicateServiceReportError`.
- Adds `getReportOrThrowForUpdate(reportId, client)`.
- Adds `ensureReportMutable(report)`.
- Requires `finalAppointmentId` to reference a completed appointment when creating/updating a report.
- Normalizes unique-index duplicate report failures into `ConflictError`.
- Blocks update, part create, part update, and part delete once the report is completed.
- Uses row-lock read before completion.
- Rejects repeat completion when the report is already completed.
- Uses `completeServiceReportFirstTransition` for atomic completion update.
- Converts no-row completion update into a conflict response.

Likely intent:

- Make Field Service Report completion first-transition only.
- Keep `finalAppointmentId`, completed timestamps, and case completion side effects stable after completion.
- Prevent post-completion report and service-part mutation.
- Normalize duplicate report conflict behavior.

Risk:

- Runtime behavior, DB transaction behavior, locking behavior, and side-effect ordering are involved.
- Tests should cover duplicate report conflict normalization, completed report immutability, repeat completion rejection, first-transition side effects, and service part mutation rejection before any commit.
- Smoke scripts should remain separate and should not be run as part of this docs-only review.

## Risk Assessment

- All 4 reviewed files affect source/runtime behavior.
- `FieldServiceReportRepository.js` and `FieldServiceReportService.js` involve DB transaction and locking behavior.
- `DispatchRepository.js` and `AppointmentService.js` affect validation and ownership behavior before appointment persistence and update.
- Targeted unit and/or repository tests are likely required before any stage/commit task.
- Smoke scripts should remain excluded unless PM explicitly authorizes smoke execution.
- `src/server.js` remains excluded from this source subset and should stay isolated into a separate bootstrap review if needed.

## Recommended Split

Option 1: appointment / dispatch source branch:

- `src/repositories/DispatchRepository.js`
- `src/services/AppointmentService.js`

Recommended test focus:

- `dispatchAssignmentId` same-case validation;
- cross-case dispatch assignment rejection;
- actual time validation;
- appointment status / visit result completion consistency.

Option 2: Field Service Report completion / immutability source branch:

- `src/repositories/FieldServiceReportRepository.js`
- `src/services/FieldServiceReportService.js`

Recommended test focus:

- first-transition completion;
- repeat completion rejection;
- final appointment completed-only validation;
- completed report immutability;
- service part mutation rejection after completion;
- duplicate service report conflict normalization.

Option 3: keep all 4 source files together only if PM approves a combined appointment / Field Service Report consistency branch.

Option 4: discard / restore any subset only with explicit PM confirmation that the changes are obsolete.

## Required Future Approval Before Any Action

Before any future task acts on this source subset, PM must specify:

- exact file subset;
- whether source modifications may be staged or committed;
- whether unit, integration, or smoke tests may run;
- whether DB/repository behavior may be exercised;
- whether related smoke scripts are included;
- whether `src/server.js` remains excluded.

## Current No-Go

Task1240 does not authorize:

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

Post-doc verification for Task1240:

- `git diff --cached --name-only`
- `git diff --name-only`
- `git diff --check`
- `git status --short -- docs/task-1240-historical-dirty-source-subset-diff-review-packet-appointment-dispatch-fsr-no-runtime-change.md`

Expected result:

- staged area remains empty;
- tracked dirty files remain exactly the same 8 historical dirty tracked files;
- Task1240 doc remains untracked unless a later PM-approved task stages it;
- diff check passes.

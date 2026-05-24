# Task 1237 Historical Dirty Stack Decision Packet

Status: Completed as a docs-only decision packet.

Scope: no cleanup, no staging, no commit, no smoke execution, no runtime change.

## Current Latest Commits

- `b18c66e Document repair intake draft-to-case route readiness gate`
- `ac9d513 Document repair intake draft-to-case push decision gate`
- `05661ff Document repair intake draft-to-case branch closure`
- `035f1cf Add repair intake draft-to-case injected runtime chain`

## Task 1236 Conclusion

The worktree still has 8 tracked dirty files.

Those files are historical appointment, dispatch, Field Service Report, and broad server bootstrap work. They are not part of the current Repair Intake draft-to-Case branch.

The dirty files should not be cleaned, staged, committed, discarded, or executed opportunistically. Any future action requires a separate PM-approved bounded task with an exact file subset and allowed action.

## File Classification

### `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`

- Type: docs-only.
- Area: historical Field Service Report / final appointment note.
- Observed content: Task109 repeat-completion and idempotency note, plus Task110 post-completion survey cross-reference.
- Current decision: preserve untouched for now.
- Future action: separate PM decision required before cleanup, stage, or commit.

### `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`

- Type: smoke script.
- Area: historical final appointment / Field Service Report completion hardening.
- Observed content: completed-report immutability coverage, final appointment stability coverage, service part mutation rejection coverage, repeat completion rejection coverage, and concurrent first-transition completion coverage.
- Runtime risk: may execute runtime endpoints if run.
- Current decision: preserve untouched for now.
- Future action: separate PM decision required before cleanup, stage, commit, or smoke execution.

### `scripts/smoke/029_single_open_appointment_guard_smoke.js`

- Type: smoke script.
- Area: historical appointment / dispatch guard hardening.
- Observed content: cross-case `dispatchAssignmentId` rejection, appointment completed status and visit result consistency, scheduled and actual time range validation, and completed appointment reopen guard coverage.
- Runtime risk: may execute runtime endpoints if run.
- Current decision: preserve untouched for now.
- Future action: separate PM decision required before cleanup, stage, commit, or smoke execution.

### `src/repositories/DispatchRepository.js`

- Type: source/runtime repository.
- Area: historical appointment / dispatch ownership validation.
- Observed content: adds `getDispatchAssignmentById`.
- Current decision: preserve untouched for now.
- Future action: separate PM decision required before cleanup, stage, commit, or further runtime review.

### `src/repositories/FieldServiceReportRepository.js`

- Type: source/runtime repository.
- Area: historical Field Service Report completion, locking, and idempotency.
- Observed content: adds `getServiceReportByIdForUpdate` and `completeServiceReportFirstTransition`.
- Current decision: preserve untouched for now.
- Future action: separate PM decision required before cleanup, stage, commit, or further runtime review.

### `src/server.js`

- Type: source/runtime server bootstrap.
- Area: broad historical server bootstrap and provider wiring.
- Observed content: customer access bootstrap, data correction shortcut options, engineer mobile and engineer mobile workbench injection options, exportable `startServer`, `createServerBootstrap`, and app resolution helpers.
- Risk: broadest and highest-risk dirty tracked file because it changes server startup and bootstrap behavior.
- Current decision: preserve untouched for now.
- Future action: isolate into its own PM-approved bootstrap review before cleanup, stage, commit, or runtime verification.

### `src/services/AppointmentService.js`

- Type: source/runtime service.
- Area: historical appointment / dispatch validation.
- Observed content: actual time range validation, completed appointment status and visit result consistency, dispatch assignment belongs-to-case validation, and visit result completed implies appointment status completed.
- Current decision: preserve untouched for now.
- Future action: separate PM decision required before cleanup, stage, commit, or further runtime review.

### `src/services/FieldServiceReportService.js`

- Type: source/runtime service.
- Area: historical Field Service Report completion and immutability hardening.
- Observed content: duplicate report conflict normalization, completed report immutability, final appointment must reference a completed appointment, first-transition completion through row lock / atomic update, and completed report service part mutation rejection.
- Current decision: preserve untouched for now.
- Future action: separate PM decision required before cleanup, stage, commit, or further runtime review.

## Future Decision Options

Option A: preserve untouched and continue another module.

Option B: create a separate review / stage / commit branch for docs and smoke only.

Option C: create a separate bounded runtime review for appointment, dispatch, and Field Service Report source files.

Option D: isolate `src/server.js` into its own bootstrap review because it is broadest and highest-risk.

Option E: create an explicit cleanup / discard task only if PM confirms these changes are obsolete.

## Required Approval Before Any Future Action

Any future task touching this stack must specify:

- exact file subset;
- whether the action is review-only, stage / commit, cleanup / discard, or test execution;
- whether smoke scripts may be run;
- whether source/runtime files may be modified;
- whether `src/server.js` is included;
- whether DB, shared runtime, or provider calls are allowed.

## Task 1237 No-Go

This task did not authorize:

- cleanup;
- staging;
- commit;
- push;
- smoke execution;
- DB execution;
- migration;
- route mount;
- provider sending;
- runtime behavior change;
- AI/RAG call;
- billing/settlement runtime;
- customer-visible runtime rollout;
- real auth/session/JWT runtime rollout;
- token parsing;
- JWT verification.

## Verification

Required verification for Task1237:

- `git log -4 --oneline`
- `git diff --cached --name-only`
- `git diff --name-only`
- `git diff --check`
- `git status --short -- docs/task-1237-historical-dirty-stack-decision-packet-no-cleanup-no-runtime-change.md`

Expected result:

- latest four commits remain the Repair Intake commit stack ending at `b18c66e`;
- staged area remains empty;
- tracked dirty files remain exactly the same 8 historical dirty tracked files;
- this Task1237 doc remains untracked unless a later PM-approved task stages it;
- diff check passes.

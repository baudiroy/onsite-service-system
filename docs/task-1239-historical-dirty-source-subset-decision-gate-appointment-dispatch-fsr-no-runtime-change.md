# Task 1239 Historical Dirty Source Subset Decision Gate

Status: Completed as a docs/static guard decision gate.

Scope: appointment / dispatch / Field Service Report source subset only. No runtime change.

## Current Latest Commit

- `b0b8703 Document historical dirty stack decision boundary`

## Source Subset Under Review

This decision gate applies only to these 4 source/runtime files:

- `src/repositories/DispatchRepository.js`
- `src/repositories/FieldServiceReportRepository.js`
- `src/services/AppointmentService.js`
- `src/services/FieldServiceReportService.js`

These 4 files are source/runtime files. They must not be cleaned, staged, committed, modified, or run without a separate PM-approved bounded task.

## Explicit Exclusions

This task explicitly excludes:

- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`
- `src/server.js`

The excluded docs file, smoke scripts, and broad server bootstrap file require separate PM decisions. In particular, `src/server.js` remains the broadest and highest-risk historical dirty tracked file and should be isolated into its own bootstrap review if PM chooses to continue that path.

## Likely Intent From Task1236 And Task1237

Based on the prior review and decision packet, the source subset appears to support these historical intents:

- appointment / dispatch ownership validation;
- final appointment consistency;
- completed appointment guard;
- Field Service Report completion atomic / first-transition behavior;
- Field Service Report immutability after completion;
- `finalAppointmentId` validation.

This intent is historical appointment, dispatch, and Field Service Report work. It is not part of the current Repair Intake draft-to-Case branch.

## Risk Classification

- All 4 included files are source/runtime files.
- They cannot be cleaned, staged, committed, or modified without separate PM approval.
- They may require targeted unit tests before any commit.
- They may require DB/repository behavior review before runtime acceptance.
- Smoke scripts must not be run as part of this gate.
- No DB execution is authorized by this gate.
- No shared runtime, provider, route, admin, AI, billing, customer-visible runtime, auth, token, or JWT work is authorized by this gate.

## Future Bounded Options

Option A: create a review-only diff packet for these 4 source files.

Option B: split the subset into two future branches:

- appointment / dispatch validation branch;
- Field Service Report completion / immutability branch.

Option C: stage and commit a subset only after targeted tests and explicit PM approval.

Option D: discard / restore a subset only after explicit PM confirmation that the changes are obsolete.

Option E: keep the subset untouched and switch module.

## Required Approval Before Any Future Action

Before any future task touches the 4-file source subset, PM must specify:

- exact file subset;
- whether the action is review-only, source modification, stage / commit, cleanup / discard, or test execution;
- whether targeted unit tests may be added or run;
- whether smoke scripts may be run;
- whether DB or repository behavior review is allowed;
- whether shared runtime, route mount, provider, admin, AI, billing, customer-visible runtime, auth, token, or JWT work is allowed.

## No-Go

Task1239 does not authorize:

- file modification;
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

Required verification for Task1239:

- `node --test tests/historicalDirtyStack/historicalDirtySourceSubsetDecisionGate.static.test.js`
- `git log -1 --oneline`
- `git diff --cached --name-only`
- `git diff --name-only`
- `git diff --check`
- `git status --short -- docs/task-1239-historical-dirty-source-subset-decision-gate-appointment-dispatch-fsr-no-runtime-change.md tests/historicalDirtyStack/historicalDirtySourceSubsetDecisionGate.static.test.js`

Expected result:

- latest commit remains `b0b8703 Document historical dirty stack decision boundary`;
- staged area remains empty;
- tracked dirty files remain exactly the same 8 historical dirty tracked files;
- Task1239 doc and static guard remain untracked unless a later PM-approved task stages them;
- diff check passes.

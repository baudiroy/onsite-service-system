# Task1032 - Repair Intake CasePlanner Branch Checkpoint

## Accepted Status

- Task1029 accepted: pure casePlanner port adapter seam.
- Task1030 accepted: casePlanner adapter static boundary guard.
- Task1031 accepted: draftReader + casePlanner + applicationService integration test.

The branch is checkpointed after the pure casePlanner adapter seam and draftReader + casePlanner + applicationService integration validation.

## Implemented Runtime Surface

- Pure factory:
  - `createRepairIntakeCasePlannerPortAdapter(options)`
- Optional injected synthetic planning port:
  - `planningPolicy.planCaseFromDraft(input)`
- Internal deterministic default planner path.
- Returned adapter method:
  - `planCaseFromDraft(input)`
- Safe planning input extraction:
  - `draft`
  - `draftId`
  - `organizationId`
  - `tenantId`
  - `requestId`
  - `actor`
  - `metadata`
  - `warnings`
- Sanitized success, invalid-input, and plan-failure envelopes.
- Static boundary guard.
- DraftReader + casePlanner + applicationService integration test.

## Current Safe Full Chain

- Synthetic/injected mount target.
- Hardened HTTP mount adapter.
- Actual API module.
- Injected controller seam.
- Pure applicationService seam.
- Pure draftReader adapter seam.
- Pure casePlanner adapter seam.
- Synthetic draftRepository only.
- Synthetic planningPolicy only.
- Sanitized request input.
- Sanitized repository lookup.
- Sanitized planning payload.
- Sanitized inter-port payloads.
- Sanitized handler output.
- Sanitized sync and async failures.

## Current Local State Warning

- Task989-Task1032 branch files remain local/uncommitted/untracked unless staged outside this task by the user or another process.
- The broader dirty worktree still contains pre-existing tracked dirty files.
- The broader dirty worktree must not be cleaned, reverted, restaged, reset, or stashed blindly.
- `git diff --cached --name-only` must remain empty.

## Explicit Non-Goals

- No global route mount.
- No production API exposure.
- No real repository implementation.
- No DB, migration, SQL, psql, or db:migrate.
- No provider sending.
- No AI/RAG.
- No billing, settlement, payment, or invoice work.
- No staging or commit.

## Recommended Next Runtime Direction

- A next bounded branch may introduce a pure caseCreator port adapter seam while still avoiding DB access.
- Any real repository, DB, migration, or SQL work should be separately authorized and bounded.
- Any global route mount or production API exposure should be separately authorized and bounded.

## Checkpoint

- Still not globally mounted.
- Still not connected to a real DB or repository.
- Still not connected to provider sending.
- Still not connected to a runtime server.
- Current branch is checkpointed at the casePlanner adapter boundary.

# Task1023 - Repair Intake Draft-to-Case ApplicationService Branch Checkpoint

## Accepted Status

- Task1015 accepted: pure applicationService seam with injected synthetic ports.
- Task1016 accepted: applicationService static boundary guard.
- Task1017 accepted: applicationService + controller + API module + mount adapter integration test.
- Task1018 accepted: applicationService port payload sanitization guard.
- Task1018A accepted: verification gap closure for missing controller checks.
- Task1019R2 accepted: strict submit precondition guard with all fixture compatibility updates.
- Task1020 accepted: submit precondition static boundary guard.
- Task1021 accepted: optional idempotencyPort seam.
- Task1022 accepted: idempotency static boundary guard.

The branch is checkpointed after the pure applicationService seam, sanitized port payload boundaries, strict submit preconditions, and optional synthetic idempotencyPort seam.

## Current Runtime Surface

- Pure applicationService factory:
  - `createRepairIntakeDraftToCaseApplicationService`
- Required injected synthetic ports:
  - `draftReader.getDraftForConversion`
  - `casePlanner.planCaseFromDraft`
  - `caseCreator.createCaseFromDraft`
  - `auditWriter.recordDraftToCaseDecision`
- Optional injected synthetic idempotency port:
  - `idempotencyPort.findExistingDraftToCaseResult`
  - `idempotencyPort.recordDraftToCaseResult`
- `planDraftToCase(input)` remains read/plan only.
- `submitDraftToCase(input)` uses:
  - strict submit precondition guard
  - optional idempotency replay lookup
  - draft read
  - case planning
  - case creation
  - audit decision write
  - optional idempotency result record
- Sanitized request, inter-port payload, output, and failure envelopes are covered by unit/integration/static guards.

## Current Safe Flow

- Synthetic/injected mount target.
- Hardened HTTP mount adapter.
- Actual API module.
- Injected controller seam.
- Pure injected applicationService seam.
- Synthetic ports only.
- Sanitized request input.
- Sanitized inter-port payloads.
- Sanitized handler output.
- Sanitized sync and async failures.

## Current Local State Warning

- Task989-Task1023 branch files remain local/uncommitted/untracked unless staged outside this task by the user or another process.
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

- A next bounded branch may introduce a repository-port contract test or a synthetic draftReader repository adapter while still avoiding DB access.
- Any real repository, DB, migration, or SQL work should be separately authorized and bounded.
- Any global route mount or production API exposure should be separately authorized and bounded.

## Checkpoint

- Still not globally mounted.
- Still not connected to a real DB or repository.
- Still not connected to provider sending.
- Still not connected to a runtime server.
- Current branch is checkpointed at the applicationService runtime seam boundary.

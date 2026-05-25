# Task1041 — Repair Intake Full Port Adapter Branch Checkpoint / No Runtime Change

## Accepted Status

- Task1037, Task1038, Task1039, Task1039A, Task1040, and Task1040A are accepted.
- Branch is checkpointed after the pure auditWriter adapter seam and full injected runtime-chain validation.
- Still not globally mounted.
- Still not connected to real DB/repository/provider/runtime server.

## Implemented Runtime Surface

- pure `createRepairIntakeAuditWriterPortAdapter` factory
- injected synthetic `auditPort.recordDraftToCaseDecision(input)` port only
- `recordDraftToCaseDecision(input)` adapter method
- safe audit input extraction
- sanitized audit envelope
- sanitized audit failure envelopes
- static auditWriter boundary guard
- auditWriter + applicationService integration test
- full port-adapters injected runtime-chain integration test

## Current Safe Full Chain

- synthetic/injected mount target
- hardened HTTP mount adapter
- actual API module
- injected controller seam
- pure applicationService seam
- pure draftReader adapter seam
- pure casePlanner adapter seam
- pure caseCreator adapter seam
- pure auditWriter adapter seam
- synthetic draftRepository only
- synthetic planningPolicy only
- synthetic caseCreationPort only
- synthetic auditPort only
- sanitized request input
- sanitized repository lookup
- sanitized planning payload
- sanitized creation payload
- sanitized audit payload
- sanitized handler output
- sanitized sync/async failures

## Current Local/Uncommitted State Warning

- Task989–Task1041 branch files remain local/uncommitted/untracked unless user / Codex has staged them outside this task.
- Broader dirty worktree contains pre-existing tracked dirty files and must not be cleaned/reverted/restaged blindly.
- `git diff --cached --name-only` remains empty.

## Explicit Non-Goals / Not Yet Authorized

- no global route mount
- no production API exposure
- no real repository implementation
- no repository writer
- no DB / SQL / migration / psql / `db:migrate`
- no provider sending
- no AI/RAG
- no billing/settlement/payment/invoice
- no staging/commit/cleanup/revert/reset/stash

## Required Verification Commands

```bash
git diff -- docs/task-1041-repair-intake-full-port-adapter-branch-checkpoint-no-runtime-change.md
git diff --check -- docs/task-1041-repair-intake-full-port-adapter-branch-checkpoint-no-runtime-change.md
git status --short -- docs/task-1041-repair-intake-full-port-adapter-branch-checkpoint-no-runtime-change.md
git diff --cached --name-only
```

## Required Completion Report Format

```text
Task1041 completed locally. Implemented files only:
- docs/task-1041-repair-intake-full-port-adapter-branch-checkpoint-no-runtime-change.md
Source/test/runtime modified: no.
Existing docs modified: no.
Checkpoint summary includes:
- Task1037–Task1040A accepted status
- implemented runtime surface
- current safe full chain
- local/uncommitted/untracked state warning
- explicit non-goals
- recommended next runtime direction
Scope boundaries held:
- no src/**
- no tests/**
- no migrations/**
- no admin/**
- no package changes
- no global app mount / production route registration / listen startup
- no DB / SQL / migration / psql / db:migrate
- no real repository implementation or repository writer
- no API shape change
- no provider sending
- no AI/RAG
- no billing/settlement/payment/invoice
- no staging / cleanup / revert / reset / stash
Verification:
- git diff --name-only: [tracked output if any]
- git diff --cached --name-only: PASS / no output
Task1041 status paths:
- ...
Do not stage anything.
```

## Acceptance Criteria

Task1041 is acceptable only if:

- only the Task1041 doc is created
- no source/test/migration/admin/package files are modified
- no existing docs are modified
- no staging occurs
- the doc clearly states branch is checkpointed, not globally mounted, and not DB/provider/repository-writer connected.

## Recommended Next Runtime Direction

- next possible bounded branch may introduce an `idempotencyPort` adapter seam, still no DB/repository writer.
- any real repository/DB/migration work must be separately authorized and bounded.
- any global route mount must be separately authorized and bounded.

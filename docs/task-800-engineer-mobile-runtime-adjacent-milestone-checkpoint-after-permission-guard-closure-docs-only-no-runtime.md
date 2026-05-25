# Task800 - Engineer Mobile Runtime-adjacent Milestone Checkpoint after Permission Guard Closure / Docs Only / No Runtime

Status: completed

Scope: Engineer Mobile runtime-adjacent milestone checkpoint after Task783-799 / docs only / no runtime

## Purpose

Task800 records the Engineer Mobile runtime-adjacent state after the injected repository branch and the permission / assignment guard branch. It is a checkpoint only. It does not authorize real DB adoption, API shape expansion, completion writes, `finalAppointmentId` changes, provider sending, AI/RAG, admin UI, package changes, or smoke/integration expansion.

## Changed Files

- `docs/task-800-engineer-mobile-runtime-adjacent-milestone-checkpoint-after-permission-guard-closure-docs-only-no-runtime.md`
- `docs/design/engineer-mobile-workbench.md`

No runtime file was changed.

## Task783-789 Injected Repository Branch

Tasks783-789 closed the injected read-model repository branch.

Accepted boundary:

- injected repository only
- fake DB / unit-test only
- explicit injected `dbClient` or `transaction` boundary only
- request-aware provider path explicit opt-in only
- no real DB connection
- no Migration 022 execution
- no psql
- no db:migrate
- no DDL
- no dry-run
- no apply
- no API response shape change
- no completion write
- no Field Service Report write
- no provider sending
- no AI/RAG runtime
- no `finalAppointmentId` exposure, inference, or mutation

Repository promotion to a real DB read path still requires separate explicit approval.

## Task793-799 Permission / Assignment Guard Branch

Tasks793-799 closed the Engineer Mobile permission / assignment runtime-adjacent branch.

Accepted boundary:

- pure permission / assignment decision helper
- supports only `task_list` and `task_detail`
- optional
- injected
- synthetic-context only
- read-path only
- explicit opt-in only
- default guard-disabled behavior remains backward compatible
- no real permission service
- no real assignment resolver
- no audit writer
- no real DB
- no API response shape change
- no completion write
- no Field Service Report write
- no provider sending
- no AI/RAG runtime
- no `finalAppointmentId` exposure, inference, or mutation

The guard may be used by app/provider unit paths only when `permissionAssignmentGuardEnabled` or `usePermissionAssignmentGuard` is explicitly enabled.

## HTTP Behavior Boundary

Task787-788 and Task797-798 covered app-like HTTP behavior with `createApp` and `app.handle(req, res)`.

Accepted boundary:

- no listen
- no server start
- app-like unit tests only
- list response shape remains `status` / `tasks`
- detail response shape remains `status` / `detail`
- denied paths fail closed safely
- raw provider rows and internal fields must not leak
- no API shape expansion

## Migration 022 Status

Migration 022 remains paused.

Current status:

- SQL file exists as an authored artifact
- no DB connection
- no psql
- no db:migrate
- no DDL
- no local dry-run
- no shared apply
- no runtime writes

Any Migration 022 dry-run, local apply, shared apply, or runtime adoption requires separate explicit approval.

## Product Invariants

This checkpoint preserves:

- one Case = one formal completion report
- one Case may have multiple appointments / dispatch visits
- Engineer Mobile read behavior does not create, mutate, or infer Field Service Report ownership
- `finalAppointmentId` remains backend/system-owned
- Engineer Mobile should not expose `finalAppointmentId` to engineers as a normal workflow choice
- no sensitive data output

## Next Candidate Tasks Requiring Explicit Approval

The following are not approved by Task800 and require separate bounded tasks:

- real DB read adoption
- Migration 022 dry-run or apply
- real permission service integration
- real assignment resolver integration
- audit writer integration
- task-read evidence logging
- completion submission design
- Field Service Report write flow
- `finalAppointmentId` write/inference changes
- provider sending
- LINE / SMS / App push / webhook runtime
- AI/RAG helper
- admin / mobile UI behavior
- smoke / integration coverage

## Verification

Required verification:

```bash
test -f docs/task-800-engineer-mobile-runtime-adjacent-milestone-checkpoint-after-permission-guard-closure-docs-only-no-runtime.md
grep -Ei "Task783|Task799|Engineer Mobile|injected repository|permission|assignment|HTTP behavior|no DB|no API shape|no completion|finalAppointmentId|Migration 022|explicit approval" docs/task-800-engineer-mobile-runtime-adjacent-milestone-checkpoint-after-permission-guard-closure-docs-only-no-runtime.md
git diff --check -- docs/task-800-engineer-mobile-runtime-adjacent-milestone-checkpoint-after-permission-guard-closure-docs-only-no-runtime.md docs/design/engineer-mobile-workbench.md
```

## Runtime Decision

No runtime behavior changes for Task800.

Task800 is a checkpoint only and must not be interpreted as approval for deeper runtime integration.

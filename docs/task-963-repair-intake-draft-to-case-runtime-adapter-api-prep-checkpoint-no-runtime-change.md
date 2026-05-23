# Task963 Repair Intake Draft-to-Case Runtime Adapter and API-Prep Checkpoint

## Branch Status

Accepted branch range: Task950-Task962 as the Repair Intake draft-to-Case runtime adapter/API-prep continuation after Task949.

Status after Task963: accepted / checkpointed / paused.

This checkpoint pauses the branch before any global app bootstrap wiring, public route registration, OpenAPI/DTO publication, migration, DB execution, smoke runtime, provider sending, AI/admin/billing work, or production rollout.

## Accepted Runtime Adapter Surfaces

- Task950 repository case creator adapter
- Task951 repository adapter static boundary guard
- Task952 repair intake draft repository adapter
- Task953 case repository adapter
- Task954 transaction runner adapter
- Task955 audit writer adapter
- Task956 idempotency checker adapter
- Task957 runtime dependency factory
- Task958 application service factory
- Task959 controller adapter
- Task960 framework-neutral route factory
- Task961 injected-router registrar
- Task962 route registrar static boundary guard

## Current Capability

The branch now has injectable repository, audit, idempotency, application, controller, route, and registrar layers.

The route registrar can register explicit route definitions onto an injected router only. It is not global app route mounting.

There is still no global route registration, no public OpenAPI/DTO contract, and no app/server bootstrap wiring for this draft-to-Case flow.

## Preserved Non-Goals

- No DB execution / psql / SQL dry-run / `npm run db:migrate`
- No migration creation/apply
- No public route mounting or global route index change
- No app/server bootstrap change
- No DTO/OpenAPI publication
- No smoke/shared runtime
- No provider sending / LINE / SMS / App / email / webhook
- No AI/RAG/vector/provider runtime
- No admin frontend
- No billing/settlement/payment/invoice
- No Task902 work
- No Engineer Mobile reopening

## Future Authorization Gates

The next phases require explicit bounded authorization before work starts:

- Schema/migration review
- Disposable DB dry-run
- Route mounting in app/bootstrap
- OpenAPI/DTO publication
- Smoke/integration runtime
- Provider sending, if ever needed
- Admin UI, if needed
- AI/RAG, if needed

## Handoff Warning

Task921-Task963 accepted files remain local / uncommitted / untracked and must be included in the final patch/commit before merge or handoff.

The dirty worktree must not be cleaned, reverted, relocated, or restaged blindly.

## Verification

Required commands:

```bash
git diff -- docs/task-963-repair-intake-draft-to-case-runtime-adapter-api-prep-checkpoint-no-runtime-change.md
git diff --check -- docs/task-963-repair-intake-draft-to-case-runtime-adapter-api-prep-checkpoint-no-runtime-change.md
git status --short
git status --short -- docs/task-963-repair-intake-draft-to-case-runtime-adapter-api-prep-checkpoint-no-runtime-change.md
```

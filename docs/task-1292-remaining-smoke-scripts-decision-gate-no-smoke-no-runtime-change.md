# Task1292 - Remaining Smoke Scripts Decision Gate / No Smoke No Runtime Change

Status: local docs-only decision gate ready for PM review.

## Scope

Task1292 documents the decision gate for the final two remaining dirty tracked smoke scripts.

Created file:

- `docs/task-1292-remaining-smoke-scripts-decision-gate-no-smoke-no-runtime-change.md`

Scope under review:

- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`

This task does not modify, stage, commit, or run those smoke scripts.

## Current Verified State

Latest commit:

- `ffa737a Harden server bootstrap wiring`

Current remaining tracked dirty files:

- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`

Current milestone status:

- appointment/dispatch source subset has been committed
- Field Service Report completion/immutability source subset has been committed
- server bootstrap static and import-safety baselines have been committed
- server bootstrap source subset has been committed
- the two smoke scripts are now the only tracked dirty files

## Task1285 Smoke Summary

Task1285 classified the two smoke scripts as live admin/API/DB workflow assets:

- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
  - expands live admin smoke coverage for multi-dispatch, final appointment, and Field Service Report completion guards
  - depends on live API/server/admin auth/DB workflow state
  - can create or mutate workflow records
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`
  - expands live admin smoke coverage for single-open appointment and appointment consistency guards
  - depends on live API/server/admin auth/DB workflow state
  - can create or mutate workflow records

Neither smoke script should be run without explicit smoke/runtime authorization.

## Decision Options

Option A: hold smoke scripts uncommitted until explicit smoke runtime authorization.

Use when PM wants to keep the smoke work visible but not accepted as source assets yet.

Option B: commit smoke scripts later as not-run smoke assets, clearly documenting they were not executed.

Use when PM accepts them as script assets but still does not authorize a live smoke run.

Option C: run smoke only after explicit approval for API base URL, auth, DB/runtime target, and data cleanup expectations.

Use only when PM/user explicitly authorize live smoke/runtime execution and provide the required operational details.

Option D: discard/restore only if PM/user confirms the smoke scripts are obsolete.

Use only with explicit confirmation. This decision gate does not authorize discard, restore, cleanup, or reset.

## Required Approval Before Any Smoke Execution

Before either smoke script may run, PM/user must explicitly approve:

- target environment
- API base URL
- admin auth source
- DB/runtime safety confirmation
- whether workflow data mutations are allowed
- cleanup/reset strategy
- provider-sending disabled or proven safe
- exact command to run

## No-Go For Task1292

Task1292 does not allow:

- smoke execution
- DB connection
- SQL dry-run/apply
- migration
- provider sending
- app/server start
- route mounting
- `app.listen`
- `node src/server.js`
- staging
- commit
- push
- cleanup/discard/restore
- token parsing
- JWT verification
- cache/Redis write
- audit persistence
- AI/RAG call
- billing/settlement runtime
- customer-visible runtime rollout

## Remaining Decision

Task1292 recommends keeping the two smoke scripts uncommitted and unrun until PM chooses one of the decision options above.

No smoke/runtime acceptance is implied by this document.

## Verification

Required by PM:

- `git log -1 --oneline`
- `git diff --cached --name-only`
- `git diff --name-only`
- `git diff --check`
- `git status --short -- docs/task-1292-remaining-smoke-scripts-decision-gate-no-smoke-no-runtime-change.md`

Expected:

- latest commit remains `ffa737a Harden server bootstrap wiring`
- staged area remains empty
- `git diff --name-only` shows only:
  - `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
  - `scripts/smoke/029_single_open_appointment_guard_smoke.js`
- Task1292 doc remains untracked
- `git diff --check` passes

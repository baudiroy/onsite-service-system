# Task1125 - Accepted Patch Stack Exact Allowlist Inventory / No Staging No Runtime Change

## Status

Completed locally. Not staged.

Task1125 is an inventory-only staging-readiness document. It is not a staging, commit, cleanup, revert, reset, or stash task.

## Purpose

Prepare an exact allowlist for a future staging task.

Prevent broad `git add .`.

Preserve the pre-existing tracked dirty stack from accidental staging.

Keep accepted Repair Intake route-propagation work separable from unrelated local changes.

## Accepted Tracked Route-Propagation Files

These are the only tracked source files currently accepted for a future Repair Intake route-propagation staging allowlist:

- `src/routes/public.routes.js`
- `src/routes/index.js`
- `src/app.js`

Acceptance source:

- `src/routes/public.routes.js` accepted from Task1108A.
- `src/routes/index.js` accepted from Task1113.
- `src/app.js` accepted from Task1118.

## Tracked Dirty Files Excluded Unless Separately Authorized

The following currently dirty tracked files are excluded from the Repair Intake route-propagation staging allowlist unless separately authorized:

- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
- `migrations/README.md`
- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`
- `src/repositories/DispatchRepository.js`
- `src/repositories/FieldServiceReportRepository.js`
- `src/server.js`
- `src/services/AppointmentService.js`
- `src/services/FieldServiceReportService.js`

Do not stage these files as part of a Repair Intake route-propagation-only staging task unless PM explicitly widens the allowlist.

## Accepted Untracked Repair Intake / Data Correction Task File Categories

Accepted untracked file categories from Task989 through Task1124 include:

- `docs/task-989` through `docs/task-1124` Repair Intake and Data Correction task documentation;
- `tests/repairIntake` task-specific unit, integration, runtime behavior, static boundary, regression, preflight, checkpoint, and closure tests;
- `tests/dataCorrection` Task1102 through Task1103 static guards;
- `src/repairIntake/**` runtime, contract, adapter, composer, controller, application-service, route-composition, and synthetic harness files accepted in prior PM tasks.

This task intentionally does not enumerate the full `git status --short` output because the status is about 970 lines and spans multiple accepted branches plus older local project areas.

Any future staging task should inventory the exact target paths at execution time and stage only with explicit path arguments.

## Future Staging Command Style

A future staging task must use explicit path arguments only.

Forbidden:

- `git add .`
- broad directory staging such as `git add docs tests src`
- broad wildcards that capture unrelated files
- cleanup, revert, reset, or stash as part of staging

Required:

- run `git diff --cached --name-only` before staging;
- stage only an exact allowlist;
- run `git diff --cached --name-only` after staging;
- report every staged path explicitly;
- include an unstaging-only rollback plan;
- avoid working-tree cleanup unless separately authorized.

## Open Staging Decision

PM/user still needs to decide:

- whether to stage Repair Intake route-propagation only;
- whether to stage all accepted Repair Intake task files from Task989 through Task1123;
- whether to include Data Correction Task1102 through Task1105 files;
- whether to split into multiple commits;
- whether to leave the accepted patch stack uncommitted for now.

## Local Worktree Warning

The worktree remains large, local, uncommitted, and untracked.

The existing tracked dirty stack is pre-existing.

`git diff --cached --name-only` must remain empty for Task1125.

No staging occurs in this task.

## Scope Boundaries Held

- No production source files modified.
- No tests modified.
- No migrations.
- No admin changes.
- No package changes.
- No existing docs modified.
- No DB, SQL, migration, psql, or db:migrate.
- No migration creation or modification.
- No real repository implementation.
- No repository writer or repository imports.
- No route, API, provider, admin, AI/RAG, or billing changes.
- No staging, cleanup, revert, reset, or stash.

## Verification

Required commands:

```bash
git diff --name-only
git diff --cached --name-only
git status --short -- docs/task-1125-accepted-patch-stack-exact-allowlist-inventory-no-staging-no-runtime-change.md
```

Results are recorded in the completion report.

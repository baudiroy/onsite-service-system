# Task1126 - Repair Intake Route Propagation Staging Dry-Run Command Plan / No Staging No Runtime Change

## Status

Completed locally. Not staged.

Task1126 is a dry-run command plan only. It is not a staging, commit, cleanup, revert, reset, or stash task.

## Purpose

Plan a future exact-path staging task.

Confirm no broad staging is allowed.

Keep unrelated tracked dirty files excluded.

Preserve the large local patch stack until PM/user explicitly authorizes a staging task.

## Candidate Exact Staging Allowlist

This candidate allowlist is for a future Repair Intake route-propagation-only staging task.

### Tracked Source Candidates

- `src/routes/public.routes.js`
- `src/routes/index.js`
- `src/app.js`

### Associated Accepted Docs / Tests Candidates

- `docs/task-1108-repair-intake-public-route-mount-static-skeleton-no-db-no-repository-writer.md`
- `docs/task-1109a-repair-intake-public-route-mount-express-router-adapter-runtime-behavior-no-db-no-repository-writer.md`
- `docs/task-1110-repair-intake-public-route-mount-regression-guard-no-db-no-repository-writer.md`
- `docs/task-1111-repair-intake-public-route-mount-branch-checkpoint-no-runtime-change.md`
- `docs/task-1112-repair-intake-app-router-aggregation-preflight-no-runtime-change.md`
- `docs/task-1113-repair-intake-app-router-public-route-option-propagation-no-db-no-repository-writer.md`
- `docs/task-1114-repair-intake-app-router-public-route-propagation-runtime-behavior-no-db-no-repository-writer.md`
- `docs/task-1115-repair-intake-app-router-propagation-regression-static-guard-no-db-no-repository-writer.md`
- `docs/task-1116-repair-intake-app-router-mount-branch-checkpoint-no-runtime-change.md`
- `docs/task-1117-repair-intake-app-factory-route-options-preflight-no-runtime-change.md`
- `docs/task-1118-repair-intake-app-factory-route-option-propagation-no-db-no-repository-writer.md`
- `docs/task-1119-repair-intake-app-factory-route-option-runtime-behavior-no-db-no-repository-writer.md`
- `docs/task-1120-repair-intake-app-factory-route-propagation-regression-guard-no-db-no-repository-writer.md`
- `docs/task-1121-repair-intake-app-level-route-mount-branch-checkpoint-no-runtime-change.md`
- `docs/task-1122-repair-intake-server-startup-boundary-preflight-no-runtime-change.md`
- `docs/task-1123-repair-intake-app-level-route-propagation-final-closure-no-runtime-change.md`
- `docs/task-1124-accepted-patch-stack-staging-readiness-review-no-staging-no-runtime-change.md`
- `docs/task-1125-accepted-patch-stack-exact-allowlist-inventory-no-staging-no-runtime-change.md`
- `tests/repairIntake/repairIntakePublicRouteMount.static.test.js`
- `tests/repairIntake/repairIntakeRouteMountTargetPreflight.static.test.js`
- `tests/repairIntake/repairIntakePublicRouteMount.runtime-behavior.test.js`
- `tests/repairIntake/repairIntakePublicRouteMountRegression.static.test.js`
- `tests/repairIntake/repairIntakeAppRouterAggregationPreflight.static.test.js`
- `tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.static.test.js`
- `tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.runtime-behavior.test.js`
- `tests/repairIntake/repairIntakeAppRouterPropagationRegression.static.test.js`
- `tests/repairIntake/repairIntakeAppFactoryRouteOptionsPreflight.static.test.js`
- `tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.static.test.js`
- `tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.runtime-behavior.test.js`
- `tests/repairIntake/repairIntakeAppFactoryRoutePropagationRegression.static.test.js`
- `tests/repairIntake/repairIntakeServerStartupBoundaryPreflight.static.test.js`

## Explicit Exclusions

These currently dirty tracked files are not part of this staging subset unless separately authorized:

- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
- `migrations/README.md`
- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`
- `src/repositories/DispatchRepository.js`
- `src/repositories/FieldServiceReportRepository.js`
- `src/server.js`
- `src/services/AppointmentService.js`
- `src/services/FieldServiceReportService.js`

Do not stage these paths in a Repair Intake route-propagation-only staging task unless PM explicitly widens the allowlist.

## Future Staging Command Template

Do not run this command in Task1126.

Future task template:

```bash
git diff --cached --name-only
git add \
  src/routes/public.routes.js \
  src/routes/index.js \
  src/app.js \
  docs/task-1108-repair-intake-public-route-mount-static-skeleton-no-db-no-repository-writer.md \
  docs/task-1109a-repair-intake-public-route-mount-express-router-adapter-runtime-behavior-no-db-no-repository-writer.md \
  docs/task-1110-repair-intake-public-route-mount-regression-guard-no-db-no-repository-writer.md \
  docs/task-1111-repair-intake-public-route-mount-branch-checkpoint-no-runtime-change.md \
  docs/task-1112-repair-intake-app-router-aggregation-preflight-no-runtime-change.md \
  docs/task-1113-repair-intake-app-router-public-route-option-propagation-no-db-no-repository-writer.md \
  docs/task-1114-repair-intake-app-router-public-route-propagation-runtime-behavior-no-db-no-repository-writer.md \
  docs/task-1115-repair-intake-app-router-propagation-regression-static-guard-no-db-no-repository-writer.md \
  docs/task-1116-repair-intake-app-router-mount-branch-checkpoint-no-runtime-change.md \
  docs/task-1117-repair-intake-app-factory-route-options-preflight-no-runtime-change.md \
  docs/task-1118-repair-intake-app-factory-route-option-propagation-no-db-no-repository-writer.md \
  docs/task-1119-repair-intake-app-factory-route-option-runtime-behavior-no-db-no-repository-writer.md \
  docs/task-1120-repair-intake-app-factory-route-propagation-regression-guard-no-db-no-repository-writer.md \
  docs/task-1121-repair-intake-app-level-route-mount-branch-checkpoint-no-runtime-change.md \
  docs/task-1122-repair-intake-server-startup-boundary-preflight-no-runtime-change.md \
  docs/task-1123-repair-intake-app-level-route-propagation-final-closure-no-runtime-change.md \
  docs/task-1124-accepted-patch-stack-staging-readiness-review-no-staging-no-runtime-change.md \
  docs/task-1125-accepted-patch-stack-exact-allowlist-inventory-no-staging-no-runtime-change.md \
  tests/repairIntake/repairIntakePublicRouteMount.static.test.js \
  tests/repairIntake/repairIntakeRouteMountTargetPreflight.static.test.js \
  tests/repairIntake/repairIntakePublicRouteMount.runtime-behavior.test.js \
  tests/repairIntake/repairIntakePublicRouteMountRegression.static.test.js \
  tests/repairIntake/repairIntakeAppRouterAggregationPreflight.static.test.js \
  tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.static.test.js \
  tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.runtime-behavior.test.js \
  tests/repairIntake/repairIntakeAppRouterPropagationRegression.static.test.js \
  tests/repairIntake/repairIntakeAppFactoryRouteOptionsPreflight.static.test.js \
  tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.static.test.js \
  tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.runtime-behavior.test.js \
  tests/repairIntake/repairIntakeAppFactoryRoutePropagationRegression.static.test.js \
  tests/repairIntake/repairIntakeServerStartupBoundaryPreflight.static.test.js
git diff --cached --name-only
```

No wildcard is allowed.

No broad directory staging is allowed.

## Pre/Post Staging Checks For Future Task

Before staging:

```bash
git diff --cached --name-only
```

Expected before staging:

- no output.

After exact-path staging:

```bash
git diff --cached --name-only
```

Expected after staging:

- exactly the future approved allowlist;
- no excluded tracked dirty files;
- no unrelated untracked files.

The future task must compare staged names against the allowlist and report every staged path explicitly.

## Rollback / Unstaging Command Template

Do not run this command in Task1126.

Future unstaging-only rollback template:

```bash
git restore --staged \
  src/routes/public.routes.js \
  src/routes/index.js \
  src/app.js \
  docs/task-1108-repair-intake-public-route-mount-static-skeleton-no-db-no-repository-writer.md \
  docs/task-1109a-repair-intake-public-route-mount-express-router-adapter-runtime-behavior-no-db-no-repository-writer.md \
  docs/task-1110-repair-intake-public-route-mount-regression-guard-no-db-no-repository-writer.md \
  docs/task-1111-repair-intake-public-route-mount-branch-checkpoint-no-runtime-change.md \
  docs/task-1112-repair-intake-app-router-aggregation-preflight-no-runtime-change.md \
  docs/task-1113-repair-intake-app-router-public-route-option-propagation-no-db-no-repository-writer.md \
  docs/task-1114-repair-intake-app-router-public-route-propagation-runtime-behavior-no-db-no-repository-writer.md \
  docs/task-1115-repair-intake-app-router-propagation-regression-static-guard-no-db-no-repository-writer.md \
  docs/task-1116-repair-intake-app-router-mount-branch-checkpoint-no-runtime-change.md \
  docs/task-1117-repair-intake-app-factory-route-options-preflight-no-runtime-change.md \
  docs/task-1118-repair-intake-app-factory-route-option-propagation-no-db-no-repository-writer.md \
  docs/task-1119-repair-intake-app-factory-route-option-runtime-behavior-no-db-no-repository-writer.md \
  docs/task-1120-repair-intake-app-factory-route-propagation-regression-guard-no-db-no-repository-writer.md \
  docs/task-1121-repair-intake-app-level-route-mount-branch-checkpoint-no-runtime-change.md \
  docs/task-1122-repair-intake-server-startup-boundary-preflight-no-runtime-change.md \
  docs/task-1123-repair-intake-app-level-route-propagation-final-closure-no-runtime-change.md \
  docs/task-1124-accepted-patch-stack-staging-readiness-review-no-staging-no-runtime-change.md \
  docs/task-1125-accepted-patch-stack-exact-allowlist-inventory-no-staging-no-runtime-change.md \
  tests/repairIntake/repairIntakePublicRouteMount.static.test.js \
  tests/repairIntake/repairIntakeRouteMountTargetPreflight.static.test.js \
  tests/repairIntake/repairIntakePublicRouteMount.runtime-behavior.test.js \
  tests/repairIntake/repairIntakePublicRouteMountRegression.static.test.js \
  tests/repairIntake/repairIntakeAppRouterAggregationPreflight.static.test.js \
  tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.static.test.js \
  tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.runtime-behavior.test.js \
  tests/repairIntake/repairIntakeAppRouterPropagationRegression.static.test.js \
  tests/repairIntake/repairIntakeAppFactoryRouteOptionsPreflight.static.test.js \
  tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.static.test.js \
  tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.runtime-behavior.test.js \
  tests/repairIntake/repairIntakeAppFactoryRoutePropagationRegression.static.test.js \
  tests/repairIntake/repairIntakeServerStartupBoundaryPreflight.static.test.js
```

This rollback is unstaging-only. It must not clean, revert, reset, or stash working-tree files.

## Verification Command Set To Rerun Before Future Staging

Public route coverage:

```bash
node --test tests/repairIntake/repairIntakePublicRouteMount.static.test.js
node --test tests/repairIntake/repairIntakePublicRouteMount.runtime-behavior.test.js
node --test tests/repairIntake/repairIntakePublicRouteMountRegression.static.test.js
```

App-router coverage:

```bash
node --test tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.static.test.js
node --test tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.runtime-behavior.test.js
node --test tests/repairIntake/repairIntakeAppRouterPropagationRegression.static.test.js
```

App-factory coverage:

```bash
node --test tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.static.test.js
node --test tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.runtime-behavior.test.js
node --test tests/repairIntake/repairIntakeAppFactoryRoutePropagationRegression.static.test.js
```

Server boundary coverage:

```bash
node --test tests/repairIntake/repairIntakeServerStartupBoundaryPreflight.static.test.js
```

## Local Worktree Warning

Task989 through Task1126 files remain local, uncommitted, and untracked unless staged outside this task.

`git diff --cached --name-only` must remain empty for Task1126.

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
git status --short -- docs/task-1126-repair-intake-route-propagation-staging-dry-run-command-plan-no-staging-no-runtime-change.md
```

Results are recorded in the completion report.

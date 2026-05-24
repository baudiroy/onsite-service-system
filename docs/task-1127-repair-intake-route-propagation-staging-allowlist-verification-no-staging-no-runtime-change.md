# Task1127 - Repair Intake Route Propagation Staging Allowlist Verification / No Staging No Runtime Change

## Status

Completed locally. Not staged.

Task1127 is a verification-planning document only. It is not a staging, commit, cleanup, revert, reset, or stash task.

## Accepted Status

Task1126 was accepted by PM.

Task1127 does not stage or commit anything.

`git diff --cached --name-only` must remain empty.

## Exact Route-Propagation Staging Subset

### Tracked Source Allowlist

- `src/routes/public.routes.js`
- `src/routes/index.js`
- `src/app.js`

### Docs / Tests Allowlist From Task1108A Through Task1126

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
- `docs/task-1126-repair-intake-route-propagation-staging-dry-run-command-plan-no-staging-no-runtime-change.md`
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

## Existence Check

All allowlist paths currently exist locally.

| Status | Path |
| --- | --- |
| PRESENT | `src/routes/public.routes.js` |
| PRESENT | `src/routes/index.js` |
| PRESENT | `src/app.js` |
| PRESENT | `docs/task-1108-repair-intake-public-route-mount-static-skeleton-no-db-no-repository-writer.md` |
| PRESENT | `docs/task-1109a-repair-intake-public-route-mount-express-router-adapter-runtime-behavior-no-db-no-repository-writer.md` |
| PRESENT | `docs/task-1110-repair-intake-public-route-mount-regression-guard-no-db-no-repository-writer.md` |
| PRESENT | `docs/task-1111-repair-intake-public-route-mount-branch-checkpoint-no-runtime-change.md` |
| PRESENT | `docs/task-1112-repair-intake-app-router-aggregation-preflight-no-runtime-change.md` |
| PRESENT | `docs/task-1113-repair-intake-app-router-public-route-option-propagation-no-db-no-repository-writer.md` |
| PRESENT | `docs/task-1114-repair-intake-app-router-public-route-propagation-runtime-behavior-no-db-no-repository-writer.md` |
| PRESENT | `docs/task-1115-repair-intake-app-router-propagation-regression-static-guard-no-db-no-repository-writer.md` |
| PRESENT | `docs/task-1116-repair-intake-app-router-mount-branch-checkpoint-no-runtime-change.md` |
| PRESENT | `docs/task-1117-repair-intake-app-factory-route-options-preflight-no-runtime-change.md` |
| PRESENT | `docs/task-1118-repair-intake-app-factory-route-option-propagation-no-db-no-repository-writer.md` |
| PRESENT | `docs/task-1119-repair-intake-app-factory-route-option-runtime-behavior-no-db-no-repository-writer.md` |
| PRESENT | `docs/task-1120-repair-intake-app-factory-route-propagation-regression-guard-no-db-no-repository-writer.md` |
| PRESENT | `docs/task-1121-repair-intake-app-level-route-mount-branch-checkpoint-no-runtime-change.md` |
| PRESENT | `docs/task-1122-repair-intake-server-startup-boundary-preflight-no-runtime-change.md` |
| PRESENT | `docs/task-1123-repair-intake-app-level-route-propagation-final-closure-no-runtime-change.md` |
| PRESENT | `docs/task-1124-accepted-patch-stack-staging-readiness-review-no-staging-no-runtime-change.md` |
| PRESENT | `docs/task-1125-accepted-patch-stack-exact-allowlist-inventory-no-staging-no-runtime-change.md` |
| PRESENT | `docs/task-1126-repair-intake-route-propagation-staging-dry-run-command-plan-no-staging-no-runtime-change.md` |
| PRESENT | `tests/repairIntake/repairIntakePublicRouteMount.static.test.js` |
| PRESENT | `tests/repairIntake/repairIntakeRouteMountTargetPreflight.static.test.js` |
| PRESENT | `tests/repairIntake/repairIntakePublicRouteMount.runtime-behavior.test.js` |
| PRESENT | `tests/repairIntake/repairIntakePublicRouteMountRegression.static.test.js` |
| PRESENT | `tests/repairIntake/repairIntakeAppRouterAggregationPreflight.static.test.js` |
| PRESENT | `tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.static.test.js` |
| PRESENT | `tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.runtime-behavior.test.js` |
| PRESENT | `tests/repairIntake/repairIntakeAppRouterPropagationRegression.static.test.js` |
| PRESENT | `tests/repairIntake/repairIntakeAppFactoryRouteOptionsPreflight.static.test.js` |
| PRESENT | `tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.static.test.js` |
| PRESENT | `tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.runtime-behavior.test.js` |
| PRESENT | `tests/repairIntake/repairIntakeAppFactoryRoutePropagationRegression.static.test.js` |
| PRESENT | `tests/repairIntake/repairIntakeServerStartupBoundaryPreflight.static.test.js` |

If a future staging task finds any allowlist path missing, mark it `MISSING` and do not stage until PM resolves the mismatch.

Do not create or modify missing paths inside a staging task unless PM separately authorizes that work.

## Verification Commands To Run Before Future Staging

Run these exact route-propagation regression commands before any future staging:

```bash
node --test tests/repairIntake/repairIntakePublicRouteMount.static.test.js
node --test tests/repairIntake/repairIntakeRouteMountTargetPreflight.static.test.js
node --test tests/repairIntake/repairIntakePublicRouteMount.runtime-behavior.test.js
node --test tests/repairIntake/repairIntakePublicRouteMountRegression.static.test.js
node --test tests/repairIntake/repairIntakeAppRouterAggregationPreflight.static.test.js
node --test tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.static.test.js
node --test tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.runtime-behavior.test.js
node --test tests/repairIntake/repairIntakeAppRouterPropagationRegression.static.test.js
node --test tests/repairIntake/repairIntakeAppFactoryRouteOptionsPreflight.static.test.js
node --test tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.static.test.js
node --test tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.runtime-behavior.test.js
node --test tests/repairIntake/repairIntakeAppFactoryRoutePropagationRegression.static.test.js
node --test tests/repairIntake/repairIntakeServerStartupBoundaryPreflight.static.test.js
```

## Explicit Excluded Tracked Dirty Files

These tracked dirty files must not be staged in the route-propagation subset unless separately authorized:

- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
- `migrations/README.md`
- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`
- `src/repositories/DispatchRepository.js`
- `src/repositories/FieldServiceReportRepository.js`
- `src/server.js`
- `src/services/AppointmentService.js`
- `src/services/FieldServiceReportService.js`

## Future Staging Go / No-Go Rule

Future staging may proceed only if:

- all allowlist paths exist;
- all verification commands pass;
- `git diff --cached --name-only` is empty before staging;
- PM/user authorizes the exact staging allowlist;
- staging uses explicit `git add <path>` arguments only;
- no wildcard is used;
- `git add .` is not used;
- excluded tracked dirty files remain unstaged.

## Rollback / Unstage-Only Plan

If a future staging task stages the exact allowlist and then needs to roll back staged state, use:

```bash
git restore --staged <same explicit allowlist paths only>
```

No working tree cleanup, revert, reset, or stash is part of this rollback plan.

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
git status --short -- docs/task-1127-repair-intake-route-propagation-staging-allowlist-verification-no-staging-no-runtime-change.md
```

Results are recorded in the completion report.

# Task2146 — Customer Access Production Mount Implementation / Explicit App Composition Only / No DB No Smoke

## Phase

Phase A — Conditional production mount

## Baseline

- branch: main
- HEAD/origin/main: `788b0c817bfd7d2bd3d667df843a719fcaa6cee2`
- local main = origin/main
- tracked tree expected clean
- only the same 7 held historical docs may remain untracked / untouched

## Goal

Conditional future task: implement explicit Customer Access production mount in app composition layer only after explicit PM authorization. Do not start without explicit authorization.

## Allowed files

- `src/app.js or exact composition file identified by Task2145`
- `tests/customerAccess/customerAccessProductionMount.integration-surrogate.test.js`
- `tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- `docs/task-2146-customer-access-production-mount-implementation-explicit-app-composition-only-no-db-no-smoke.md`

## Forbidden scope

- CONDITIONAL future task; do not start unless explicitly authorized.
- No DB execution unless the task explicitly says it is a separately authorized disposable local/test DB dry-run.
- No migration apply unless separately and explicitly authorized.
- No migration dry-run unless separately and explicitly authorized.
- No psql / DATABASE_URL / env-Zeabur inspection unless separately and explicitly authorized.
- No smoke / endpoint probes / server-listener startup unless separately and explicitly authorized.
- No src/app.js / src/server.js / public.routes.js changes unless the task explicitly authorizes production mount implementation.
- No global route mount unless explicitly authorized.
- No provider sending, admin frontend, AI/RAG/model calls, billing/payment work.
- No package/package-lock changes unless absolutely unavoidable and explicitly reported.
- Do not touch / clean / reset / stash / revert the 7 held historical docs.

## Verification

- `node --test tests/customerAccess/customerAccessProductionMount.integration-surrogate.test.js tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- `node --test tests/customerAccess/customerAccessRoutes.unit.test.js tests/customerAccess/customerAccessProductionMountCompositionAdapter.unit.test.js`
- `git diff --check`
- `git status --short --branch`

## Required tests / acceptance behavior

- CONDITIONAL: explicit PM authorization required.
- Production app composition imports only approved composition adapter.
- No server/listener start.
- No DB query during mount.
- Registered routes remain the two accepted public Customer Access routes.

## Completion report requirements

1. Changed files.
2. Whether source changes were needed or docs/tests-only.
3. Summary of behavior / planning completed.
4. Tests/checks run with exact PASS/FAIL results.
5. Confirmation of no forbidden-scope work.
6. Confirmation the 7 held historical docs were untouched.
7. Final `git status --short --branch` summary.

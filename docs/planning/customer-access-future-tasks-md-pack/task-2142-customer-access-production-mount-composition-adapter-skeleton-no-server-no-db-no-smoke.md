# Task2142 — Customer Access Production Mount Composition Adapter Skeleton / No Server No DB No Smoke

## Phase

Phase A — Production mount composition

## Baseline

- branch: main
- HEAD/origin/main: `788b0c817bfd7d2bd3d667df843a719fcaa6cee2`
- local main = origin/main
- tracked tree expected clean
- only the same 7 held historical docs may remain untracked / untouched

## Goal

Create a small Customer Access production mount composition adapter skeleton that composes existing injected route registration with explicitly supplied dependencies. No global app mount, no server startup, no DB connection.

## Allowed files

- `src/customerAccess/customerAccessProductionMountCompositionAdapter.js`
- `tests/customerAccess/customerAccessProductionMountCompositionAdapter.unit.test.js`
- `tests/customerAccess/customerAccessProductionMountCompositionAdapterBoundary.static.test.js`
- `docs/task-2142-customer-access-production-mount-composition-adapter-skeleton-no-server-no-db-no-smoke.md`

## Forbidden scope

- No production mount.
- No app/server/public.routes changes.
- No new routes.
- No route behavior changes beyond using existing registration function.
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

- `node --test tests/customerAccess/customerAccessProductionMountCompositionAdapter.unit.test.js tests/customerAccess/customerAccessProductionMountCompositionAdapterBoundary.static.test.js`
- `node --test tests/customerAccess/customerAccessRoutes.unit.test.js`
- `git diff --check`
- `git status --short --branch`
- Do not run DB/migration/smoke/server/env commands.

## Required tests / acceptance behavior

- Export exact production mount composition API.
- Register existing Customer Access routes through registerCustomerAccessRoutes only.
- Preserve success/failure registration summary shapes.
- Do not expose raw router/dbClient/repository/auditWriter.
- Importing module has no side effects.
- dbClient.query is not called during registration.

## Completion report requirements

1. Changed files.
2. Whether source changes were needed or docs/tests-only.
3. Summary of behavior / planning completed.
4. Tests/checks run with exact PASS/FAIL results.
5. Confirmation of no forbidden-scope work.
6. Confirmation the 7 held historical docs were untouched.
7. Final `git status --short --branch` summary.

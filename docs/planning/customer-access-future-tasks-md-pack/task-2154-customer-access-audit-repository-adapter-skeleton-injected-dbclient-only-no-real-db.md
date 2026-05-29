# Task2154 — Customer Access Audit Repository Adapter Skeleton / Injected dbClient Only / No Real DB

## Phase

Phase C — Audit repository / persistence

## Baseline

- branch: main
- HEAD/origin/main: `788b0c817bfd7d2bd3d667df843a719fcaa6cee2`
- local main = origin/main
- tracked tree expected clean
- only the same 7 held historical docs may remain untracked / untouched

## Goal

Create injected dbClient-only audit repository adapter using synthetic dbClient tests. No real DB execution.

## Allowed files

- `src/customerAccess/customerAccessAuditRepositoryAdapter.js`
- `tests/customerAccess/customerAccessAuditRepositoryAdapter.unit.test.js`
- `tests/customerAccess/customerAccessAuditRepositoryAdapterBoundary.static.test.js`
- `docs/task-2154-customer-access-audit-repository-adapter-skeleton-injected-dbclient-only-no-real-db.md`

## Forbidden scope

- No real DB execution.
- No global DB pool/env fallback.
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

- `node --test tests/customerAccess/customerAccessAuditRepositoryAdapter.unit.test.js tests/customerAccess/customerAccessAuditRepositoryAdapterBoundary.static.test.js`
- `node --test tests/customerAccess/customerAccessAuditRepositoryContract.unit.test.js tests/customerAccess/customerAccessAuditRepositorySqlContract.unit.test.js`
- `git diff --check`
- `git status --short --branch`

## Required tests / acceptance behavior

Requires injected dbClient.query; invalid dbClient fails safely; valid sanitized record calls synthetic query once; query throw/reject normalizes safely; invalid record fails before query.

## Completion report requirements

1. Changed files.
2. Whether source changes were needed or docs/tests-only.
3. Summary of behavior / planning completed.
4. Tests/checks run with exact PASS/FAIL results.
5. Confirmation of no forbidden-scope work.
6. Confirmation the 7 held historical docs were untouched.
7. Final `git status --short --branch` summary.

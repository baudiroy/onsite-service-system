# Task2151 — Customer Access Audit Migration 027 Disposable Local Test DB Dry-Run / Explicit Authorization Required

## Phase

Phase B — Conditional audit migration dry-run

## Baseline

- branch: main
- HEAD/origin/main: `788b0c817bfd7d2bd3d667df843a719fcaa6cee2`
- local main = origin/main
- tracked tree expected clean
- only the same 7 held historical docs may remain untracked / untouched

## Goal

Conditional task for executing migration 027 against disposable local/test DB only. Do not start without explicit PM authorization naming Task2151, migration 027, disposable local/test DB, no staging/production/Zeabur, and no secrets printing.

## Allowed files

- `docs/task-2151-customer-access-audit-migration-027-disposable-local-test-db-dry-run-explicit-authorization-required.md`

## Forbidden scope

- CONDITIONAL future task; no execution unless explicitly authorized.
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

- Only commands explicitly authorized in a future PM message may be run.
- `git status --short --branch`

## Required tests / acceptance behavior

Report disposable DB identifier sanitized, command shape without secrets, migration target 027 only, PASS/FAIL, no staging/production/Zeabur, no secrets, no runtime integration.

## Completion report requirements

1. Changed files.
2. Whether source changes were needed or docs/tests-only.
3. Summary of behavior / planning completed.
4. Tests/checks run with exact PASS/FAIL results.
5. Confirmation of no forbidden-scope work.
6. Confirmation the 7 held historical docs were untouched.
7. Final `git status --short --branch` summary.

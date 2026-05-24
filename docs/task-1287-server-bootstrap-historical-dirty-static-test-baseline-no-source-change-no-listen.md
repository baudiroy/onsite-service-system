# Task1287 - Server Bootstrap Historical Dirty Static Test Baseline / No Source Change No Listen

Status: local tests/docs-only static baseline ready for PM review.

## Scope

Task1287 adds a static-only baseline for the remaining high-risk dirty `src/server.js` bootstrap rewrite before any future exact-subset stage/commit decision.

Created files:

- `tests/historicalDirtyStack/serverBootstrapHistoricalDirtyStaticBaseline.test.js`
- `docs/task-1287-server-bootstrap-historical-dirty-static-test-baseline-no-source-change-no-listen.md`

Static source under review:

- `src/server.js`

Explicitly not modified:

- `src/server.js`
- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`
- `src/app.js`
- `src/routes/**`
- `src/controllers/**`
- `src/db/**`
- `migrations/**`
- `admin/**`
- `package.json`
- `package-lock.json`

## Boundary Covered

`tests/historicalDirtyStack/serverBootstrapHistoricalDirtyStaticBaseline.test.js` reads `src/server.js` as text and does not import it.

The static baseline covers:

- `src/server.js` exists.
- Direct startup is guarded by `require.main === module`.
- Observed bootstrap functions are defined:
  - `createServerBootstrap`
  - `startServer`
  - `resolveServerApp`
  - `resolvePort`
- Observed external bootstrap boundary exports include:
  - `createServerBootstrap`
  - `resolveServerApp`
  - `startServer`
- `resolvePort` is observed as defined but not exported in the current dirty source. The test documents that exact observed shape and does not force a source edit.
- The only `.listen(` call is inside the `startServer` section before the `require.main` startup guard.
- `createServerBootstrap().start(...)` delegates to `startServer(...)` and does not call `.listen(` while creating the bootstrap object.
- Pool loading is lazy through `loadDefaultPool()` instead of a top-level `require('./db/pool')`.
- `closePool`, `pool.end()`, `SIGINT`, and `SIGTERM` handling are observed inside the startup path.

## Explicit Non-Goals

This task does not:

- modify source/runtime files
- import `src/server.js`
- run `src/server.js`
- call `app.listen`
- mount routes
- connect to DB
- run SQL dry-run/apply
- run migrations
- run smoke scripts
- call providers
- call AI/RAG
- parse tokens or verify JWTs
- write cache/Redis
- persist audit records
- stage or commit anything

## Remaining Limits

This baseline is text/static-only. It does not prove:

- runtime import safety
- live server startup behavior
- route mount behavior
- DB pool behavior against a real database
- signal handling in a real process
- smoke behavior

`src/server.js` remains dirty and is not accepted by this task.

## Future Options

Future work requires explicit PM approval before any of these steps:

- add a synthetic import-safety test
- exact-subset stage/commit `src/server.js`
- review or run the two smoke scripts separately
- discard/restore any dirty file if PM confirms it is obsolete

## Verification

Required by PM:

- `node --test tests/historicalDirtyStack/serverBootstrapHistoricalDirtyStaticBaseline.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git diff --cached --name-only`
- `git diff --name-only`
- `git log -1 --oneline`
- `git status --short -- tests/historicalDirtyStack/serverBootstrapHistoricalDirtyStaticBaseline.test.js docs/task-1287-server-bootstrap-historical-dirty-static-test-baseline-no-source-change-no-listen.md`

Expected:

- new static test passes
- diff checks pass
- staged area remains empty
- latest commit remains `76dca7f Document FSR repeat completion contract`
- `git diff --name-only` still shows only:
  - `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
  - `scripts/smoke/029_single_open_appointment_guard_smoke.js`
  - `src/server.js`
- Task1287 files remain untracked

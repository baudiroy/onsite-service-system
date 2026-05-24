# Task1289 - Server Bootstrap Import-Safety Synthetic Test / No Source Change No Listen

Status: local tests/docs-only import-safety baseline ready for PM review.

## Scope

Task1289 adds a controlled synthetic import-safety baseline for the remaining dirty `src/server.js` bootstrap rewrite.

Created files:

- `tests/historicalDirtyStack/serverBootstrapImportSafety.unit.test.js`
- `docs/task-1289-server-bootstrap-import-safety-synthetic-test-no-source-change-no-listen.md`

Runtime source imported under test:

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

## Import-Safety Coverage

`tests/historicalDirtyStack/serverBootstrapImportSafety.unit.test.js` imports `src/server.js` with in-test synthetic stubs for:

- `./app`
- `./config/env`
- customer access bootstrap dependencies
- `./db/pool`, only as a guard if startup accidentally reaches pool loading

The test temporarily intercepts synthetic `app.listen` calls and `process.on('SIGINT'/'SIGTERM', ...)` registrations, then restores the patches after each import.

Covered behavior:

- importing `src/server.js` does not call `app.listen`
- importing `src/server.js` does not register shutdown signals
- importing `src/server.js` does not load or end the DB pool
- exported surface includes:
  - `createServerBootstrap`
  - `startServer`
  - `resolveServerApp`
- `resolveServerApp({ app })` returns the provided synthetic app without starting it
- `createServerBootstrap({ app, port })` returns a bootstrap object with the provided app/port and a `start` delegate without calling `.listen`

The test intentionally does not call `createServerBootstrap().start(...)`.

## Explicit Non-Goals

This task does not:

- modify source/runtime files
- run `src/server.js` as an entrypoint
- call `app.listen`
- mount routes
- connect to DB
- require real `DATABASE_URL`
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

This baseline proves controlled import-safety only. It does not prove:

- live startup behavior
- real HTTP binding behavior
- real DB pool shutdown behavior
- real signal handling in a live process
- smoke behavior

`src/server.js` remains dirty and is not accepted by this task.

## Future Options

Future work requires explicit PM approval before any of these steps:

- exact-subset stage/commit `src/server.js`
- review or run the two smoke scripts separately
- push to remote, if a remote is configured later
- discard/restore any dirty file if PM confirms it is obsolete

## Verification

Required by PM:

- `node --test tests/historicalDirtyStack/serverBootstrapImportSafety.unit.test.js`
- `node --test tests/historicalDirtyStack/serverBootstrapHistoricalDirtyStaticBaseline.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git diff --cached --name-only`
- `git diff --name-only`
- `git log -1 --oneline`
- `git status --short -- tests/historicalDirtyStack/serverBootstrapImportSafety.unit.test.js docs/task-1289-server-bootstrap-import-safety-synthetic-test-no-source-change-no-listen.md`

Expected:

- new import-safety test passes
- Task1287 static baseline test passes
- diff checks pass
- staged area remains empty
- latest commit remains `4ce81c4 Add server bootstrap static baseline`
- `git diff --name-only` still shows only:
  - `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
  - `scripts/smoke/029_single_open_appointment_guard_smoke.js`
  - `src/server.js`
- Task1289 files remain untracked

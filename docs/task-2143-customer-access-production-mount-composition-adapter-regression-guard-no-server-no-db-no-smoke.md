# Task2143 - Customer Access Production Mount Composition Adapter Regression Guard

## Status

- Added regression coverage around the Task2142 production mount composition adapter.
- This task is tests-only plus documentation.
- No source changes were needed.
- This task does not create a production mount.
- This task does not change app/server/public routes.
- This task does not execute DB, migration, smoke, server, listener, env, Zeabur, provider, AI, or billing work.
- The 7 held historical docs remain untracked and untouched.

## Baseline

- Branch: `main`.
- Starting HEAD/origin baseline: `66ff654a517463ef5054c846b115d8dcecb6d126`.
- Local `main` equaled `origin/main`.
- `git status --short --branch` showed only the same 7 held historical docs untracked before work.
- Task2142 was accepted, pushed, and synced.

## Changed Files

- `tests/customerAccess/customerAccessProductionMountCompositionAdapter.unit.test.js`
- `tests/customerAccess/customerAccessProductionMountCompositionAdapterBoundary.static.test.js`
- `docs/task-2143-customer-access-production-mount-composition-adapter-regression-guard-no-server-no-db-no-smoke.md`

No source files were changed.

## Regression Guards Added

- Repeated valid composition calls use independent injected routers and dbClients.
- Each composition call registers exactly the existing two Customer Access public routes on that call's router.
- Returned success summaries remain exact, sanitized, and independent objects.
- `dbClient.query` is still not called during registration.
- Raw dependency sentinels from router, dbClient, repository, auditWriter, and options do not leak into registration summaries.
- Missing or malformed router remains `mount_target_invalid`.
- Missing or malformed dbClient remains `db_client_invalid`.
- Throwing route registration remains `route_registration_failed`.
- Failure summaries omit `routes` and raw thrown error details.
- Static boundary keeps the adapter delegated to `registerCustomerAccessRoutes` instead of synthesizing route summaries or alternate routes.
- Static boundary keeps app/server/public routes, global route registry, DB/env/provider/AI/billing imports, startup calls, DB calls, and network calls out of the adapter.

## Registration Summary Shapes

Success summary remains:

```js
{
  registered: true,
  routes: [
    { method: 'GET', path: '/customer-access/:caseId' },
    { method: 'GET', path: '/customer-access/:caseId/service-report/:reportId' },
  ],
}
```

Failure summary remains:

```js
{
  registered: false,
  messageKey: 'customerAccess.unavailable',
  customerVisible: false,
  reasonCode,
}
```

Covered reason codes remain:

- `mount_target_invalid`
- `db_client_invalid`
- `route_registration_failed`

## Explicit Non-Changes

- No source/runtime code changes.
- No `src/app.js` changes.
- No `src/server.js` changes.
- No `public.routes.js` changes.
- No global route mount.
- No production mount.
- No new routes.
- No route behavior changes.
- No server/listener startup.
- No smoke or endpoint probes.
- No DB execution or DB connection creation.
- No migration apply or dry-run.
- No `psql`, `DATABASE_URL`, env, Zeabur, or secret inspection.
- No repository implementation changes.
- No audit persistence DB writer integration.
- No provider/admin/AI/RAG/model/billing/payment/package work.

## Verification

```sh
node --test tests/customerAccess/customerAccessProductionMountCompositionAdapter.unit.test.js tests/customerAccess/customerAccessProductionMountCompositionAdapterBoundary.static.test.js tests/customerAccess/customerAccessRoutes.unit.test.js
git diff --check
git status --short --branch
```

Results:

- `node --test tests/customerAccess/customerAccessProductionMountCompositionAdapter.unit.test.js tests/customerAccess/customerAccessProductionMountCompositionAdapterBoundary.static.test.js tests/customerAccess/customerAccessRoutes.unit.test.js`: PASS, 58/58.
- `git diff --check`: PASS.
- `git status --short --branch`: `main...origin/main` with this task's 3 changed files plus the same 7 held historical docs untracked before commit.

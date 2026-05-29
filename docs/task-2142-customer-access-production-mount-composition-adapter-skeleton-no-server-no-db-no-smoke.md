# Task2142 - Customer Access Production Mount Composition Adapter Skeleton

## Status

- Created a runtime-adjacent Customer Access production mount composition adapter skeleton.
- The adapter composes the existing injected route registration function with explicitly supplied dependencies.
- This task does not create a production mount.
- This task does not change `src/app.js`, `src/server.js`, or `public.routes.js`.
- This task does not start a server or listener.
- This task does not create or execute a DB connection.
- This task does not run smoke probes.
- The 7 held historical docs remain untracked and untouched.

## Baseline

- Branch: `main`.
- Starting HEAD/origin baseline: `ae15e797c897810e0dde6581525b288dc40027c8`.
- Local `main` equaled `origin/main`.
- `git status --short --branch` showed only the same 7 held historical docs untracked before work.
- Future task Markdown pack had already been imported under `docs/planning/customer-access-future-tasks-md-pack/`.

## Changed Files

- `src/customerAccess/customerAccessProductionMountCompositionAdapter.js`
- `tests/customerAccess/customerAccessProductionMountCompositionAdapter.unit.test.js`
- `tests/customerAccess/customerAccessProductionMountCompositionAdapterBoundary.static.test.js`
- `docs/task-2142-customer-access-production-mount-composition-adapter-skeleton-no-server-no-db-no-smoke.md`

## Exported API

```js
createCustomerAccessProductionMountComposition({
  router,
  dbClient,
  repository,
  auditWriter,
})
```

## Composition Behavior

- Requires an explicitly injected `router` mount target and `dbClient`.
- Accepts optional injected `repository` and `auditWriter`.
- Calls existing `registerCustomerAccessRoutes` with only the injected dependencies.
- Does not import or fallback to global app, server, public routes, route index, route registry, DB factory, env, Zeabur, providers, AI/RAG/model code, or billing modules.
- Does not expose raw router, dbClient, repository, auditWriter, dependency objects, raw errors, env, provider, token, or SQL details in registration summaries.
- Does not call `dbClient.query` during registration.
- Does not call `listen`, start a server, mount globally, create a DB connection, or inspect env.

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

Accepted failure reason codes covered by this adapter:

- `mount_target_invalid`
- `db_client_invalid`
- `route_registration_failed`

## Test Coverage

- Valid synthetic router and dbClient register the existing two Customer Access routes.
- Registration returns the exact sanitized success summary.
- `dbClient.query` is not called during registration.
- Optional `auditWriter` preserves existing route-registration audit side-channel behavior.
- Audit writer failure does not alter the registration summary.
- Audit writer results are not included in the registration summary.
- Missing or malformed router returns sanitized `mount_target_invalid`.
- Missing or malformed dbClient returns sanitized `db_client_invalid`.
- Throwing `router.get` returns sanitized `route_registration_failed`.
- Raw errors and dependency objects do not leak.
- Static boundary confirms no forbidden app/server/public routes/env/DB/provider/AI/billing imports or startup/DB execution calls.

## Explicit Non-Changes

- No `src/app.js` changes.
- No `src/server.js` changes.
- No `public.routes.js` changes.
- No global route mount.
- No production mount.
- No new routes.
- No server or listener startup.
- No smoke or endpoint probes.
- No DB execution or DB connection creation.
- No migration apply or dry-run.
- No `psql`, `DATABASE_URL`, env, Zeabur, or secret inspection.
- No repository implementation changes.
- No audit persistence DB writer integration.
- No provider/admin/AI/RAG/model/billing/payment/package work.
- No existing route behavior changes beyond using the existing registration function through this new adapter.

## Verification

```sh
node --test tests/customerAccess/customerAccessProductionMountCompositionAdapter.unit.test.js tests/customerAccess/customerAccessProductionMountCompositionAdapterBoundary.static.test.js
node --test tests/customerAccess/customerAccessRoutes.unit.test.js
git diff --check
git status --short --branch
```

Results:

- `node --test tests/customerAccess/customerAccessProductionMountCompositionAdapter.unit.test.js tests/customerAccess/customerAccessProductionMountCompositionAdapterBoundary.static.test.js`: PASS, 13/13.
- `node --test tests/customerAccess/customerAccessRoutes.unit.test.js`: PASS, 41/41.
- `git diff --check`: PASS.
- `git status --short --branch`: `main...origin/main` with this task's 4 new files plus the same 7 held historical docs untracked before commit.

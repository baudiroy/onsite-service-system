# Task2077 Customer Access Routes Dependency Injection Contract Guard

## Scope

- Runtime branch: `main`
- Baseline before work: `35acef46537640c91d0cd691c48b14f789784a1d`
- Area: Customer Access route registration dependency contract

## Guarded Contract

`registerCustomerAccessRoutes` uses only dependencies explicitly provided by its caller. Route registration must not create or import global app/server/router, DB connection pools, env/Zeabur secrets, provider clients, AI/RAG providers, or billing dependencies.

Route registration does not call `dbClient.query` and does not call an injected `projectionService`. Those dependencies are only relevant to later request handling paths.

## Registration Summaries

Successful registration keeps the Task2076 sanitized shape:

```js
{
  registered: true,
  routes: [
    { method: 'GET', path: '/customer-access/:caseId' },
    { method: 'GET', path: '/customer-access/:caseId/service-report/:reportId' },
  ],
}
```

Failure remains sanitized:

```js
{
  registered: false,
  messageKey: 'customerAccess.unavailable',
  customerVisible: false,
  reasonCode,
}
```

Guarded reason codes:

- `mount_target_invalid`
- `db_client_invalid`
- `route_registration_failed`

## Guardrails

- No new route.
- No global route mount.
- No `src/app.js`, `src/server.js`, or `public.routes.js` change.
- No DB execution, DB connection, migration, SQL, seed, schema, index, `psql`, dry-run, or migration apply.
- No repository query, projection service behavior, or HTTP handler behavior change.
- No smoke, listener, Zeabur, provider sending, admin frontend, AI/RAG, billing, settlement, payment, invoice, or package change.
- The 7 held historical untracked docs remain untouched.

## Verification

- Targeted customerAccess route/app-adapter/static tests only.
- `git diff --check`.
- `git status --short --branch`.

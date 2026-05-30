# Task2165 Engineer Mobile Production Mount Composition Adapter Skeleton / No Server No DB No Smoke

## Status

Task2165 adds a bounded Engineer Mobile production mount composition adapter skeleton and focused tests only. It does not mount the adapter from `src/app.js`, `src/server.js`, `src/routes/index.js`, or `public.routes.js`.

## Changed Files

- `src/engineerMobile/engineerMobileProductionMountCompositionAdapter.js`
- `tests/engineerMobile/engineerMobileProductionMountCompositionAdapter.unit.test.js`
- `tests/engineerMobile/engineerMobileProductionMountCompositionAdapterBoundary.static.test.js`
- `docs/task-2165-engineer-mobile-production-mount-composition-adapter-skeleton-no-server-no-db-no-smoke.md`

## Exported API

`src/engineerMobile/engineerMobileProductionMountCompositionAdapter.js` exports:

- `createEngineerMobileProductionMountComposition(input)`
- `ENGINEER_MOBILE_PRODUCTION_MOUNT_MODULE`
- `ENGINEER_MOBILE_PRODUCTION_ROUTES`

`createEngineerMobileProductionMountComposition(input)` expects an injected-only input object.

Required dependency:

- `router`: an injected mount target with `get()` and `post()` functions.

Optional dependencies passed through to existing Engineer Mobile route registration contracts:

- `repository`
- `readModel`
- `taskProvider`
- `taskListProvider`
- `taskDetailProvider`
- `permission`
- `visitActionService`
- `visitActionAppointmentProvider`
- `appointmentProvider`
- `visitAction`
- `now`
- any other already-supported Engineer Mobile options used by the existing route registration layer

Optional registration side-channel:

- `auditWriter`: function, or object with `write()` / `record()`.

`dbClient` is accepted only as an inert injected option if provided by the caller. The adapter does not require it, does not inspect it, and does not call `dbClient.query()` during registration.

## Existing Registration Boundary Used

The adapter delegates to the existing Engineer Mobile route registration functions:

- `registerEngineerMobileRoutes(router, options)`
- `registerEngineerMobileTaskDetailRoutes(router, options)`
- `registerEngineerMobileVisitActionRoutes(router, options)`

No route handlers were manually reimplemented in the adapter.

## Composition Behavior

Successful registration returns a sanitized summary:

```json
{
  "registered": true,
  "module": "engineerMobile",
  "routes": [
    { "method": "GET", "path": "/engineer-mobile/tasks" },
    { "method": "GET", "path": "/engineer-mobile/tasks/:appointmentId" },
    { "method": "POST", "path": "/engineer-mobile/appointments/:appointmentId/actions/:action" }
  ]
}
```

Missing or malformed mount target returns a sanitized failure:

```json
{
  "registered": false,
  "module": "engineerMobile",
  "messageKey": "engineerMobile.unavailable",
  "customerVisible": false,
  "reasonCode": "mount_target_invalid"
}
```

If registration throws, the adapter returns the same safe failure envelope with `reasonCode: "route_registration_failed"`.

The summary does not expose raw router, DB client, repository, provider, audit writer, auth, session, SQL, token, stack, or customer PII objects. Optional `auditWriter` registration events are best-effort and cannot change the registration summary.

## No Side Effects

The adapter:

- does not register routes on import
- does not import `src/app.js`
- does not import `src/server.js`
- does not import `public.routes.js`
- does not import `src/routes/index.js`
- does not start server/listener
- does not call `listen()`
- does not create DB connections
- does not call `dbClient.query()`
- does not inspect env, Zeabur, or secrets
- does not execute SQL or migrations
- does not run smoke or endpoint probes
- does not send LINE/SMS/email/webhook/app push/provider messages
- does not call AI/RAG/model providers
- does not touch billing or payment modules

## Verification

Targeted Task2165 tests:

```bash
node --test tests/engineerMobile/engineerMobileProductionMountCompositionAdapter.unit.test.js tests/engineerMobile/engineerMobileProductionMountCompositionAdapterBoundary.static.test.js
```

Result: PASS, 13/13.

Directly relevant existing Engineer Mobile route and injected mount tests:

```bash
node --test tests/engineerMobile/engineerMobileRoute.unit.test.js tests/engineerMobile/engineerMobileTaskDetailRoute.unit.test.js tests/engineerMobile/engineerMobileVisitActionRoute.unit.test.js tests/engineerMobile/engineerMobileVisitActionInjectedMountAdapter.unit.test.js tests/engineerMobile/engineerMobileVisitActionInjectedMountAdapterBoundary.static.test.js
```

Result: PASS, 44/44.

Expected final checks:

```bash
git diff --check
git status --short --branch
```

## Explicit Non-Goals

Task2165 did not perform:

- `src/app.js` changes
- `src/server.js` changes
- `public.routes.js` changes
- `src/routes/index.js` changes
- global route mount
- production mount activation
- server/listener startup
- smoke or endpoint probes
- DB execution
- DB connection creation
- migration apply or dry-run
- SQL execution
- `psql`, `DATABASE_URL`, env, Zeabur, or secrets inspection
- repository implementation changes
- provider sending
- admin frontend work
- AI/RAG/model calls
- billing/payment work
- package/package-lock changes
- Customer Access source/runtime changes

The 7 held historical docs remain out of scope and must remain untracked and untouched.

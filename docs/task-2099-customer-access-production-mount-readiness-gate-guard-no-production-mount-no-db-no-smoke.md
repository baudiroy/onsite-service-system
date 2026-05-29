# Task2099 - Customer Access Production Mount Readiness Gate Guard

## Scope

- Added tests-only readiness guards for a future Customer Access production mount.
- Added this documentation checkpoint.
- No production mount was added.
- No source, runtime, package, DB, migration, SQL, smoke, server, listener, network, Zeabur/env, provider, admin, AI, billing, settlement, payment, or invoice work was performed.
- The 7 held historical docs remain untracked and untouched.

## Guarded Readiness Behavior

The future production mount readiness guard now asserts that Customer Access route registration remains bounded to an injected mount target:

- The target must expose `get(path, handler)`.
- Registration uses only the injected target's `get`.
- Registration does not call `listen`, `post`, `use`, or any global mount helper.
- Registration does not execute an injected `dbClient.query`.
- Malformed mount targets return sanitized `mount_target_invalid`.
- Malformed explicit `dbClient` dependencies return sanitized `db_client_invalid`.
- Failure summaries omit `routes` and raw dependency details.

This task does not change the existing runtime behavior where registration without an explicit `dbClient` can still register safe-deny handlers. It documents and guards the production-ready path as explicit dependency injection without converting that behavior into a new runtime requirement.

## Route Contracts Guarded

Successful registration remains exactly:

```json
{
  "registered": true,
  "routes": [
    {
      "method": "GET",
      "path": "/customer-access/:caseId"
    },
    {
      "method": "GET",
      "path": "/customer-access/:caseId/service-report/:reportId"
    }
  ]
}
```

No internal test route is included in the public registration summary:

- `/__internal/customer-access/service-reports/:caseId/:reportId`

## Failure Summary Contract

Sanitized failure summaries remain:

```json
{
  "registered": false,
  "messageKey": "customerAccess.unavailable",
  "customerVisible": false,
  "reasonCode": "mount_target_invalid"
}
```

Accepted `reasonCode` values guarded by this task:

- `mount_target_invalid`
- `db_client_invalid`
- `route_registration_failed`

Failure summaries must not expose:

- raw target, router, route, handler, options, or dependency objects
- raw `dbClient`, query function source, projection service, or facade source
- env, Zeabur, provider, debug, SQL, token, internal, request, headers, cookies, body, query, user, or session details
- partial public route lists

## Static Forbidden Scope Guard

The static guard now checks the Customer Access route registration source for no direct dependency on:

- `src/app.js`
- `src/server.js`
- `public.routes.js`
- route index/global route registry imports
- DB connection or pool libraries
- env/Zeabur config
- provider, AI/RAG/model, billing, payment, settlement, LINE, SMS, or email modules

The same guard checks there is no direct route exposure in app, server, or public route bootstrap files for:

- `/customer-access/:caseId`
- `/customer-access/:caseId/service-report/:reportId`
- internal Customer Access test routes

## Explicit Non-Actions

- No production mount.
- No new route.
- No real smoke.
- No server/listener startup.
- No network endpoint probe.
- No global route mounting.
- No internal test route public registration.
- No `src/app.js`, `src/server.js`, or `public.routes.js` change.
- No DB execution.
- No DB connection or pool creation.
- No migration, SQL, seed, schema, index, psql, dry-run, or apply.
- No repository query text or parameter change.
- No facade/controller approved-source behavior change.
- No context middleware contract change.
- No HTTP adapter contract change.
- No Zeabur/env/secret inspection.
- No provider sending.
- No admin frontend.
- No AI/RAG/provider/model call.
- No billing/settlement/payment/invoice change.
- No package or package-lock change.

## Verification

Run targeted tests:

```sh
node --test tests/customerAccess/customerAccessRoutes.unit.test.js tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js
```

Run whitespace and status checks:

```sh
git diff --check
git status --short --branch
```

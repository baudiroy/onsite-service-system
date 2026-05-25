# Task 699 - Engineer Mobile Permission Middleware Skeleton

## Summary

Task 699 adds a reusable Engineer Mobile permission middleware skeleton for future
task-list route wiring.

This task does not mount the middleware into routes and does not modify app/server
wiring. It only creates the reusable permission boundary, unit tests, and this task
note.

## Permission Boundary

The middleware evaluates `req.auth`:

- `organizationId`
- `userId`
- `engineerId`
- `role`
- `permissions`

The first-phase task list requires an authenticated organization and engineer context.
Missing `organizationId`, `userId`, `engineerId`, `role`, or permissions fails closed.

Primary permission:

- `engineer_mobile.tasks.read`

Compatible future permissions supported in this skeleton:

- `engineer_mobile.tasks.read.assigned`
- `engineer_mobile.workbench.access`

## Role Behavior

- `engineer`: allowed only with organization, user, engineer id, and compatible permission.
- `supervisor`: allowed only with compatible permission and engineer id for this first-phase task list.
- `admin`: allowed only with compatible permission and engineer id for this first-phase task list.
- `dispatch_assistant`: allowed only with compatible permission and engineer id for this first-phase task list.
- `customer_service`: denied by default for Engineer Mobile task list.
- `ai`: denied even when permissions are present.

Allowed requests set `req.engineerMobilePermissionContext` with safe metadata only:

- `organizationId`
- `userId`
- `engineerId`
- `role`
- `permissions`

Denied requests return a generic 403 response:

```json
{
  "status": "deny",
  "messageKey": "engineerMobile.unavailable",
  "data": null
}
```

The denied response does not expose raw denial reason, raw phone, raw address, raw LINE
identifier, tokens, secrets, DB URL, internal notes, audit raw data, AI raw payloads,
or `finalAppointmentId`.

## Runtime Boundary

This task does not:

- modify `src/routes/engineerMobileRoutes.js`
- modify `src/controllers/engineerMobileController.js`
- modify `src/app.js`
- modify `src/server.js`
- connect to a database
- execute SQL
- add or apply migrations
- add real permission persistence
- write audit logs
- send LINE / SMS / email / app push notifications
- add AI / RAG runtime
- modify DTOs or projections
- add smoke or browser tests
- modify admin frontend
- modify `package.json`

## Regression Coverage

Added `tests/engineerMobile/engineerMobilePermissionMiddleware.unit.test.js` to verify:

- required exports and constants exist
- missing auth and required auth fields deny
- engineer with `engineer_mobile.tasks.read` passes
- compatible assigned/read/workbench permissions pass
- supervisor/admin/dispatch assistant require permission and engineer id
- customer service is denied by default
- AI role is denied
- denied response is generic and safe
- allowed path sets safe permission context and calls `next` once
- malformed `next` / response do not throw
- unrelated request fields are not mutated
- module source has no DB, repository, provider, AI, route, app, or server imports

## Future Tasks

- Wire this middleware into the Engineer Mobile task list route in a separately scoped
  route task.
- Add real authenticated request middleware before production route use.
- Add audit logging only in a separately scoped audit/runtime task.
- Add smoke coverage after route wiring and authenticated runtime are available.

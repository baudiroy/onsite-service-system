# Task 700 - Wire Engineer Mobile Permission Middleware Into Route

## Summary

Task 700 wires the Task 699 Engineer Mobile permission middleware into the Engineer
Mobile task list route module.

The route remains:

- `GET /engineer-mobile/tasks`

The route stack is now:

1. `engineerMobilePermissionMiddleware`
2. `engineerMobileTaskListHandler`

## Runtime Behavior

`src/routes/engineerMobileRoutes.js` now creates the permission middleware before the
controller handler. The controller still receives the same `options` object, so existing
injected `readModel` / `taskProvider` behavior remains intact.

Middleware options may be provided through `options.permission`; if omitted, the default
Task 699 fail-closed permission behavior is used.

The route path and method are unchanged.

## Permission Boundary

The first-phase task list route now requires:

- authenticated organization context
- authenticated user id
- engineer id
- allowed role
- compatible Engineer Mobile permission

Supported permissions:

- `engineer_mobile.tasks.read`
- `engineer_mobile.tasks.read.assigned`
- `engineer_mobile.workbench.access`

Role behavior:

- engineer, supervisor, admin, and dispatch assistant can pass with permission and engineer id
- customer service is denied by default
- AI role is denied

Denied requests return the generic middleware response before any injected read model or task
provider is called.

## Non-goals

This task does not:

- modify `src/routes/index.js`
- modify `src/app.js`
- modify `src/server.js`
- modify Engineer Mobile service, mapper, repository, adapter, or controller
- connect to a database
- execute SQL
- add or apply migrations
- add a real permission service
- write audit logs
- send LINE / SMS / email / app push notifications
- add AI / RAG runtime
- add smoke or browser tests
- modify admin frontend
- modify `package.json`

## Regression Coverage

Added `tests/engineerMobile/engineerMobileRoutePermissionMiddleware.unit.test.js`
to verify:

- the route registers `GET /engineer-mobile/tasks`
- middleware is before the controller handler
- missing auth and missing permissions deny before provider calls
- engineer with required permission passes and returns the task list
- compatible Engineer Mobile permissions pass
- supervisor/admin/dispatch assistant pass with permission and engineer id
- customer service and AI roles deny before provider calls
- wrong organization and wrong engineer tasks remain excluded by the service
- responses remain redacted
- missing router remains safe no-op
- route source imports only the controller and permission middleware

## Future Tasks

- Add real authentication middleware in a separately scoped runtime task.
- Add real permission/role resolution from persisted user context in a separately scoped task.
- Add DB-backed task repository wiring only after explicit DB/runtime authorization.
- Add smoke coverage after authenticated route wiring and runtime data are available.

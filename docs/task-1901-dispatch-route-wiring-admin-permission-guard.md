# Task1901 Dispatch Route Wiring / Admin Permission Guard

Status: implemented and verified locally without DB execution.

## Scope

Task1901 adds a bounded Admin Dispatch assignment route registry with an admin permission guard and injected assignment service boundary. The route is optional and is mounted by `createAppRouter` only when an assignment service is explicitly injected through router options.

Changed files:

- `src/routes/dispatchAssignment.routes.js`
- `src/routes/index.js`
- `tests/adminDispatch/dispatchAssignmentRoutePermissionGuard.unit.test.js`
- `tests/adminDispatch/dispatchAssignmentRoutePermissionGuardBoundary.static.test.js`
- `docs/task-1901-dispatch-route-wiring-admin-permission-guard.md`

## Route contract

Route:

- `PATCH /api/v1/admin/dispatch-assignments/:assignmentId/assignment-intent`

Permission:

- `dispatch.manage`

Registry:

- `registerDispatchAssignmentRoutes(router, options)`

Handler:

- `createDispatchAssignmentRouteHandler({ assignmentService })`

The route uses an injected assignment service only. It does not directly import a DB client, repository, app/server runtime, provider, billing, or AI integration.

## Implemented behavior

The route:

- Mounts only when `assignmentService` is injected.
- Uses `requirePermission('dispatch.manage')` before the service handler.
- Builds service input from authenticated request user/context and route/body data.
- Sets permission context for the Task1900 service after the permission guard has passed.
- Returns a normalized success response for accepted assignment intent.
- Fails closed for missing service dependency.
- Fails closed for service denied/not-found responses.
- Sanitizes thrown service failures.
- Avoids exposing raw DB rows, SQL text, stack traces, secrets, provider payloads, or internal failure payloads.

`createAppRouter` now calls the optional registry with:

- `options.dispatchAssignment`
- `options.adminDispatch`

With default options, the route is not mounted and no DB-backed runtime dependency is constructed.

## Safety properties

- Injected assignment service only.
- Permission guard before service handler.
- No direct DB client.
- No direct repository import.
- No real DB connection.
- No DATABASE_URL usage.
- No migration execution.
- No runtime start.
- No seed execution.
- No dispatch smoke.
- No Zeabur/deploy action.
- No provider sending.
- No billing, AI/RAG, LINE, SMS, email, webhook, or storage execution.
- No Completion Report / Field Service Report creation.
- No finalAppointmentId mutation.
- No customer-visible publication behavior.

## Failure behavior

Safe failure responses use:

- HTTP 400 for invalid assignment command shape.
- HTTP 403 for missing admin actor, organization context, or permission context after guard.
- HTTP 404 for not-found-or-denied assignment/service results.
- HTTP 409 for denied write results.
- HTTP 502 for unexpected service failure.
- HTTP 503 for missing injected service dependency.

The response body uses `DISPATCH_ASSIGNMENT_UNAVAILABLE` with a safe `reasonCode` and `requestId`.

## Verification

Targeted tests:

- `node --test tests/adminDispatch/dispatchAssignmentRoutePermissionGuard.unit.test.js tests/adminDispatch/dispatchAssignmentRoutePermissionGuardBoundary.static.test.js`

Related dispatch tests:

- `node --test tests/adminDispatch/dispatchAppointmentAssignmentService.unit.test.js tests/adminDispatch/dispatchAppointmentAssignmentServiceBoundary.static.test.js`
- `node --test tests/adminDispatch/dispatchAssignmentSqlRepositoryAdapter.unit.test.js tests/adminDispatch/dispatchAssignmentSqlRepositoryAdapterBoundary.static.test.js`
- `node --test tests/historicalDirtyStack/appointmentDispatchHistoricalSourceBaseline.unit.test.js tests/historicalDirtyStack/appointmentDispatchCreateAppointmentHistoricalSource.unit.test.js`

Static syntax/check fallback when npm is unavailable:

- `find src -name '*.js' -print0 | xargs -0 -n1 node --check`

Project check:

- `npm run check`

If `npm` is unavailable in the active shell, the npm check cannot run there; the static syntax fallback above is the documented replacement for this task.

## Next task recommendation

Task1902 can proceed only after PM acceptance. Any real DB execution, migration apply, seed, dispatch smoke, Zeabur/deploy, provider execution, billing, AI/RAG, Completion Report / Field Service Report behavior, finalAppointmentId mutation, or customer-visible publication behavior remains behind separate explicit approval gates.

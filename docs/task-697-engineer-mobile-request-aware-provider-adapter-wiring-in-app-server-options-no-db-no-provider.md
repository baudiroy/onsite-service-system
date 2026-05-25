# Task 697 - Engineer Mobile Request-aware Provider Adapter Wiring

## Summary

Task 697 wires the Engineer Mobile request-aware task list provider adapter into the
app/server option path behind an explicit opt-in flag.

When `createApp({ engineerMobile: { useRequestAwareProvider: true, repository } })`
is used, `src/app.js` creates the request-aware provider adapter from Task 695 and
passes a route-compatible provider shape into `createAppRouter`.

Without `useRequestAwareProvider: true`, existing direct `engineerMobile` options
continue to behave as before.

## Runtime Behavior

The opt-in path is:

1. `createApp(options)` receives `options.engineerMobile`.
2. `src/app.js` checks `engineerMobile.useRequestAwareProvider === true`.
3. The app creates `createEngineerMobileTaskListReadProvider(engineerMobileOptions)`.
4. The app exposes `readModel(input)` and `taskProvider(input)` wrappers to the router.
5. The wrapper maps the route/service input into provider request context:
   - `auth.organizationId`
   - `auth.engineerId`
   - `query.from`
   - `query.to`
6. The wrapper restores route filter fields for the existing service-level safe
   projection, while preserving the provider's request-time organization/engineer
   filtering.

App creation and server bootstrap do not call the repository, read model, or task
provider. Repository execution remains request-time only.

## Server Boundary

`src/server.js` continues to pass `options.engineerMobile` through to `createApp`.

The server does not import the Engineer Mobile provider adapter directly. This keeps
server bootstrap focused on app construction and preserves `options.app` priority for
tests or future host integrations.

## Security And Data Boundaries

The request-aware path keeps the authenticated request context as source of truth:

- route body `organizationId` is ignored
- route body `engineerId` is ignored
- repository rows remain filtered by organization and assigned engineer
- safe task projection still redacts raw phone, raw address, raw LINE identifiers,
  token/secret-like fields, internal notes, audit payloads, AI raw payloads, and
  `finalAppointmentId`

Customer Access and Data Correction route options remain compatible when passed
alongside Engineer Mobile options.

## Non-goals

This task does not:

- connect to a real database
- add a real provider package
- execute SQL
- add or apply migrations
- modify DB schema or indexes
- modify API contracts beyond app option wiring
- add auth middleware
- write audit logs
- send LINE / SMS / email / app push notifications
- add AI / RAG runtime
- add browser smoke coverage
- modify admin frontend
- modify `package.json`

## Regression Coverage

Added `tests/engineerMobile/engineerMobileRequestAwareProviderWiring.unit.test.js`
to verify:

- app opt-in provider wiring does not call the repository during app creation
- valid requests call the repository with mapped auth/query input
- body organization/engineer fields are ignored
- wrong-organization and wrong-engineer rows are excluded
- response output redacts sensitive fields and `finalAppointmentId`
- direct read model behavior remains when the flag is not enabled
- server bootstrap works without `listen`
- `options.app` priority bypasses Engineer Mobile provider creation/execution
- Customer Access and Data Correction options remain mounted alongside Engineer Mobile
- app/server source import boundaries avoid DB, repository, external provider, and AI

## Future Tasks

- Add a real DB-backed Engineer Mobile task repository only after explicit DB/runtime
  authorization.
- Add auth middleware and organization-scoped permission enforcement in a separately
  scoped runtime task.
- Add Engineer Mobile Workbench UI after backend read path is ready.
- Add smoke coverage only after a real authenticated route/runtime path exists.

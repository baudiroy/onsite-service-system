# Task 689 - Resume Engineer Mobile Route Mount / Central Router Integration

## Summary

Task 689 resumes the Engineer Mobile runtime branch by mounting the existing read-only
Engineer Mobile task list route into the central route index.

Mounted route:

- `GET /engineer-mobile/tasks`

The route remains injected and read-only. `createAppRouter({ engineerMobile })` now
passes the provided options into `registerEngineerMobileRoutes`, allowing tests and
future bootstrap wiring to provide an injected `readModel` or `taskProvider` without
creating a database client, provider client, notification sender, or AI runtime.

## Runtime Boundary

This task only wires the already-existing route into `src/routes/index.js`.

It does not:

- create a database client
- query a real database
- add or apply migrations
- create provider clients
- send LINE / SMS / email / app push notifications
- add AI / RAG runtime
- change Field Service Report completion behavior
- change appointment lifecycle behavior
- change customer-facing data policy

## Access And Data Safety

The mounted route preserves the existing Engineer Mobile task list behavior:

- missing auth returns a generic safe deny
- valid engineer auth only returns tasks assigned to that engineer
- tasks are filtered by `organizationId`
- wrong organization tasks are excluded
- wrong engineer tasks are excluded
- internal fields are stripped from responses
- raw phone, raw address, raw LINE identity, tokens, secrets, and `finalAppointmentId`
  are not returned

## Regression Coverage

Added `tests/engineerMobile/engineerMobileRouteMount.unit.test.js` to verify:

- the default central router still exports successfully
- `GET /engineer-mobile/tasks` is mounted
- missing auth returns a generic `403` safe deny
- `createAppRouter({ engineerMobile })` injects a synthetic read model
- valid auth returns only scoped assigned engineer tasks
- injected task provider works without database access
- customer access route remains mounted
- data correction governance route remains mounted
- data correction permission middleware remains first on its route
- route index does not import direct DB, repository, provider, RAG/vector, or server
  bootstrap modules

The central router already imports existing route-level AI routes. This task does not
modify or expand those existing AI routes, and the new Engineer Mobile mount does not
import AI or provider runtime.

## Future Tasks

- Wire `engineerMobile` options from app/server bootstrap using an injected repository
  or read model, without creating shared DB access inside the route index.
- Add a real Engineer Mobile read repository after an explicit DB/migration/runtime
  task is approved.
- Add authentication middleware integration for the Engineer Mobile route when the
  platform-wide engineer auth flow is ready.
- Build Engineer Mobile Workbench UI only in a separately scoped frontend/mobile task.

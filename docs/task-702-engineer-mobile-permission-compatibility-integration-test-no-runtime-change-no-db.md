# Task 702 - Engineer Mobile Permission Compatibility Integration Test

## Summary

Task 702 adds integration coverage for the current Engineer Mobile Phase 1 route,
app, and server option paths.

This task does not modify runtime source.

## Integration Path Covered

The test covers:

```text
route index / app factory / server factory
-> GET /engineer-mobile/tasks
-> permission middleware
-> controller
-> request-aware provider / repository
-> task list response
```

## Coverage

`tests/engineerMobile/engineerMobilePermissionCompatibility.integration.test.js`
verifies:

- route index path denies missing auth before provider calls
- route index path denies missing permission before provider calls
- engineer with `engineer_mobile.tasks.read` can read assigned tasks
- customer service and AI roles deny before provider calls
- compatible permissions pass:
  - `engineer_mobile.tasks.read.assigned`
  - `engineer_mobile.workbench.access`
- app factory request-aware provider maps auth/query to repository query spec
- app factory path ignores body `organizationId` and `engineerId`
- wrong-organization and wrong-engineer rows are excluded
- server factory path works without `listen`
- `options.app` priority bypasses Engineer Mobile provider/repository execution
- response output redacts raw phone, raw address, raw LINE identifiers, token/secret-like
  fields, DB URL, internal notes, audit raw data, AI raw payloads, and `finalAppointmentId`

The repository coverage uses an injected synthetic executor only. It does not connect to a
real database or execute SQL.

## Non-goals

This task does not:

- modify runtime source
- add a new route
- change API behavior
- connect to a database
- execute SQL
- add or apply migrations
- add real auth or permission persistence
- write audit logs
- send LINE / SMS / email / app push notifications
- add AI / RAG runtime
- modify smoke or browser tests
- modify admin frontend
- modify `package.json`
- modify guardrails, design docs, or task indexes

## Future Tasks

- Add real authenticated request middleware in a separately scoped task.
- Add real DB repository wiring only after explicit DB/runtime authorization.
- Add Engineer Mobile UI after the backend read path is ready.
- Add smoke coverage after authenticated runtime data is available.

# Task 704 - Engineer Mobile Task Detail Read-only Slice

## Summary

Task 704 adds an unmounted Engineer Mobile task detail read-only slice.

This task creates:

- task detail service
- task detail controller
- task detail route skeleton
- unit tests
- this task note

The new route skeleton is not mounted into the central route index, app, or server.

## Runtime Behavior

The task detail service accepts:

```js
{
  organizationId,
  engineerId,
  appointmentId
}
```

It reads from injected `tasks`, `readModel`, or `taskProvider` only. It does not connect
to a database and does not import a repository.

The service returns a detail only when all conditions match:

- `task.organizationId === organizationId`
- `task.assignedEngineerId === engineerId`
- `task.appointmentId === appointmentId`

Missing input, missing ids, wrong organization, wrong engineer, wrong appointment,
provider throw, and malformed provider result all fail closed.

## Safe Detail Projection

The safe detail can include:

- appointment id
- case id
- organization id
- assigned engineer id
- scheduled time
- status
- masked customer name / phone
- address summary
- product summary
- issue summary
- service type
- safe site note
- checklist summary
- safe evidence references

It strips raw/internal fields, including:

- internal notes
- audit raw data
- AI raw payloads
- billing / settlement internals
- raw phone
- raw address
- raw LINE identifiers
- token / secret-like fields
- DB URL
- `finalAppointmentId`
- full customer payloads
- unsafe evidence storage fields

## Controller And Route

`src/controllers/engineerMobileTaskDetailController.js` uses:

- `req.auth.organizationId`
- `req.auth.engineerId`
- `req.params.appointmentId`

It does not trust body organization or engineer values.

The unmounted route skeleton is:

- `GET /engineer-mobile/tasks/:appointmentId`

The route stack is:

1. Engineer Mobile permission middleware.
2. Engineer Mobile task detail controller handler.

## Non-goals

This task does not:

- mount the detail route into `src/routes/index.js`
- modify app/server wiring
- connect to a database
- execute SQL
- add or apply migrations
- import a repository
- add a real provider
- write audit logs
- send LINE / SMS / email / app push notifications
- add AI / RAG runtime
- mutate Case / Appointment / Field Service Report
- mutate `finalAppointmentId`
- add smoke or browser tests
- modify admin frontend
- modify `package.json`

## Regression Coverage

Added service tests to verify:

- missing input and required ids deny
- matching assigned task returns safe detail
- wrong organization / engineer / appointment deny
- `readModel` and `taskProvider` inputs are supported
- provider throw and malformed result fail closed
- input and source read model are not mutated
- service source has no DB, repository, notification, AI, route, app, or server imports

Added route/controller tests to verify:

- route exports path and register function
- route stack includes permission middleware before controller
- missing auth / permission deny before provider
- valid engineer permission returns HTTP 200 detail
- wrong organization / engineer / appointment returns generic unavailable
- customer service and AI roles deny before provider
- invalid router remains safe no-op
- route/controller import boundaries are safe

## Future Tasks

- Mount the detail route into the central router in a separately scoped task.
- Add app/server compatibility tests after route mounting.
- Add real auth/session integration separately.
- Add a real DB-backed task detail repository only after explicit DB/runtime authorization.
- Add Engineer Mobile UI detail page after the backend path is mounted and verified.

# Task 695 - Engineer Mobile Request-aware Read Provider Adapter

## Summary

Task 695 adds a request-aware Engineer Mobile read provider adapter.

The adapter maps request auth/query context into the repository input shape needed by
the Engineer Mobile task list read repository. It is not wired into the route, app, or
server in this task.

## Source Of Truth

The adapter treats `req.auth` as the source of truth:

- `auth.organizationId` becomes repository `organizationId`
- `auth.engineerId` becomes repository `engineerId`
- request body `organizationId` and `engineerId` are ignored
- date range comes only from `req.query.from` and `req.query.to`
- body date ranges are ignored

Missing auth, missing organization id, or missing engineer id fail-closes to
`{ tasks: [] }`.

## Provider Behavior

`createEngineerMobileTaskListReadProvider(options)` supports injected sources:

- `repository.getReadModel(input)`
- `repository.getTaskList(input)`
- direct `readModel(input)`
- direct `taskProvider(input)`

Provider creation does not call the injected source. The injected source is called only
when `readModel(request)` or `taskProvider(request)` is executed.

Provider throw or malformed results fail-close to `{ tasks: [] }` without leaking raw
errors. Valid provider rows are passed through the existing Engineer Mobile task list
service so organization/engineer filtering and safe output projection still apply.

## Runtime Boundary

This task only adds an adapter utility.

It does not:

- modify route/controller/app/server wiring
- execute SQL
- create a database client
- add or apply migrations
- modify API behavior
- modify permission middleware
- write audit logs
- send LINE / SMS / email / app push notifications
- add AI / RAG runtime
- add smoke tests

## Regression Coverage

Added `tests/engineerMobile/engineerMobileTaskListReadProviderAdapter.unit.test.js` to
verify:

- provider factory and request mapper exports
- auth organization/engineer are used as source of truth
- body organization/engineer are ignored
- query date range is mapped
- body date range is ignored
- missing auth, organization, or engineer fail-close
- provider creation does not call injected repository/read model/task provider
- repository `getReadModel` receives mapped input
- repository `getTaskList` receives mapped input
- direct read model receives mapped input
- direct task provider receives mapped input
- provider throw and malformed results fail-close safely
- output strips raw phone, raw address, raw LINE identity, tokens, secrets, database URL,
  internal note, audit log, AI raw payload, and `finalAppointmentId`
- input request object is not mutated
- module import boundary has no DB, repository, provider, AI, route, app, or server
  imports

## Future Tasks

- Wire this adapter into app/server Engineer Mobile options in a separately scoped task.
- Add a real DB-backed repository only after explicit DB/runtime authorization.
- Add executable query specs only after a separate bounded task.
- Add auth middleware and mobile UI in separate bounded tasks.

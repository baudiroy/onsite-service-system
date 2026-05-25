# Task 696 - Engineer Mobile Request-aware Provider Invocation Contract

## Summary

Task 696 updates the Engineer Mobile task list service invocation contract so injected
read models and task providers receive sanitized request input during request execution.

This enables future request-aware provider adapters to use authenticated organization and
engineer context without changing route, app, or server wiring in this task.

## Runtime Behavior

`buildEngineerMobileTaskList(input, options)` now passes `input` to injected providers:

- function `readModel(input)`
- object `readModel.listTasks(input)`
- function `taskProvider(input)`
- object `taskProvider.listTasks(input)`

Backward compatibility is preserved:

- `options.tasks` arrays still work
- static `readModel.tasks` arrays still work
- static `taskProvider.tasks` arrays still work
- provider results can be arrays or `{ tasks: [...] }`

Provider throw or malformed provider results still fail-close to
`{ status: 'deny', tasks: [] }`.

Service-level organization and engineer filtering remains in place, and safe output
projection remains unchanged.

## Controller Source Of Truth

The existing controller already builds request input from:

- `req.auth.organizationId`
- `req.auth.engineerId`
- `req.query.from`
- `req.query.to`

`req.body.organizationId` and `req.body.engineerId` are not used as source of truth for
the Engineer Mobile task list route.

## Runtime Boundary

This task does not:

- modify route/app/server wiring
- connect to a database
- execute SQL
- add or apply migrations
- modify API mounts
- add permission middleware
- write audit logs
- send LINE / SMS / email / app push notifications
- add AI / RAG runtime
- add smoke tests

## Regression Coverage

Added `tests/engineerMobile/engineerMobileRequestAwareProviderInvocation.unit.test.js`
to verify:

- service passes sanitized input to function read models
- service passes sanitized input to object read models
- service passes sanitized input to function task providers
- service passes sanitized input to object task providers
- static read model tasks remain backward compatible
- providers returning mixed tasks are still filtered by organization and engineer
- provider throw and malformed results fail-close safely
- controller builds input from `req.auth` and `req.query`
- controller ignores body organization/engineer fields
- controller missing auth does not call provider and returns generic safe forbidden
- sensitive fields and `finalAppointmentId` remain redacted
- request objects are not mutated
- service/controller import boundaries remain free of DB, repository, provider, AI,
  route, app, and server imports

## Future Tasks

- Wire Task 695 request-aware provider adapter into app/server Engineer Mobile options
  in a separately scoped task.
- Add a real DB-backed repository only after explicit runtime/DB authorization.
- Add auth middleware and Engineer Mobile UI in separate bounded tasks.

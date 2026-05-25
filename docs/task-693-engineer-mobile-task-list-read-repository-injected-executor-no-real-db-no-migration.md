# Task 693 - Engineer Mobile Task List Read Repository Skeleton

## Summary

Task 693 adds an injected-executor Engineer Mobile task list read repository skeleton.

The repository prepares the future DB read path without connecting to a real database.
It builds the Task 692 query spec, fail-closes by default because the spec is
`executable: false`, and maps executor-returned synthetic rows through the safe Task 692
mapper only when explicitly enabled for synthetic tests.

## Runtime Boundary

This task only adds a repository utility. It does not wire the repository into routes,
app factory, server bootstrap, or any database client.

It does not:

- execute SQL
- create a database client
- import DB modules
- add or apply migrations
- modify API behavior
- modify permission middleware
- write audit logs
- send LINE / SMS / email / app push notifications
- add AI / RAG runtime
- add smoke tests

## Repository Behavior

`createEngineerMobileTaskListReadRepository(options)` exposes:

- `getTaskList(input)`
- `getReadModel(input)`

Behavior:

- missing input, missing `organizationId`, or missing `engineerId` returns
  `{ tasks: [] }` and does not call the executor
- default mode returns `{ tasks: [] }` and does not call the executor because the query
  spec is non-executable
- `allowNonExecutableForTest: true` allows synthetic tests to call an injected executor
- executor may be a function or an object with `.execute(querySpec)`
- executor result may be `{ rows: [...] }` or a raw row array
- executor throw or malformed result returns `{ tasks: [] }` without leaking raw errors
- returned rows are mapped through the Task 692 safe mapper
- wrong organization and wrong engineer rows are excluded
- input object is not mutated
- query spec passed to executor is cloned and frozen
- no logging side effects are produced by failure paths

## Safety

The repository does not trust executor rows directly. Rows are always passed through the
safe mapper and filtered by organization and engineer before returning a read model.

Responses do not include:

- internal notes
- audit logs
- AI raw payload
- billing / settlement internal data
- raw phone
- raw address
- raw LINE identity
- tokens
- secrets
- database URL
- `finalAppointmentId`

## Regression Coverage

Added `tests/engineerMobile/engineerMobileTaskListReadRepository.unit.test.js` to
verify:

- repository factory and constants export
- repository exposes `getTaskList` and `getReadModel`
- missing input / missing required params fail-close and do not call executor
- default non-executable mode does not call executor
- synthetic function executor works with `allowNonExecutableForTest`
- object executor `.execute()` is supported
- executor throw or malformed result fail-closes
- rows map through the safe mapper
- wrong organization and wrong engineer rows are excluded
- sensitive fields and `finalAppointmentId` are stripped
- executor receives a safe frozen query spec
- query spec uses placeholders and does not interpolate raw values
- input and executor objects are not mutated by repository internals
- no logging side effects
- module import boundary has no DB, repository, provider, AI, route, app, or server
  imports

## Future Tasks

- Add a real query executor adapter in a separate no-real-DB task.
- Add DB dry-run only after explicit disposable local/test DB authorization.
- Wire repository into server/app bootstrap only in a separately scoped task.
- Add smoke coverage only after the runtime branch explicitly allows smoke execution.

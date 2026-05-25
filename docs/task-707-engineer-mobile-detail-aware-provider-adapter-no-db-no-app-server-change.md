# Task 707 - Engineer Mobile Detail-aware Provider Adapter / No DB / No App Server Change

## Summary

Task 707 added a detail-aware request provider adapter for Engineer Mobile task detail reads.

New adapter exports:

- `mapEngineerMobileTaskDetailRequest(request)`
- `createEngineerMobileTaskDetailReadProvider(options)`

The detail mapper uses these sources of truth:

- `req.auth.organizationId`
- `req.auth.engineerId`
- `req.params.appointmentId`
- `req.query.from` / `req.query.to` for optional date range

Body-provided organization, engineer, or appointment values are ignored.

## Provider Behavior

The detail-aware provider remains fully injected and supports:

- `repository.getTaskDetail(input)`
- `repository.getReadModel(input)`
- `repository.getTaskList(input)`
- direct `readModel(input)`
- `readModel.getTaskDetail(input)`
- `readModel.listTasks(input)`
- direct `taskProvider(input)`
- `taskProvider.getTaskDetail(input)`
- `taskProvider.listTasks(input)`

Provider results can be either:

- `{ task: {...} }`
- `{ tasks: [...] }`
- `[...]`

Provider throws, malformed results, or missing mapped input fail closed to `{ tasks: [] }`.

## Detail Service Compatibility

`buildEngineerMobileTaskDetail` now accepts provider/read-model results shaped as `{ task }` in addition to existing `{ tasks }` and array behavior.

It still enforces:

- same `organizationId`
- assigned `engineerId`
- requested `appointmentId`
- safe detail allow-list
- no `finalAppointmentId` output
- no internal note, audit log, AI raw payload, billing / settlement internals, raw phone/address/LINE id, token/secret, `DATABASE_URL`, or evidence token output

## Runtime Boundary

- No app/server change.
- No route/controller change.
- No DB, SQL, migration, schema, repository implementation, provider sending, AI/RAG/vector, smoke/browser, admin, package, guardrails, or design-doc change.
- This is a bounded runtime adapter/service compatibility slice only.

## Future Tasks

- Wire `createEngineerMobileTaskDetailReadProvider` through app/server route path in a separate bounded task.
- Add real DB detail repository / mapper only after a separate DB-approved task.
- Add Engineer Mobile UI detail page and browser smoke only after backend read provider and UI routes are approved.

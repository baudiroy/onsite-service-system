# Task 712 - Engineer Mobile Composite Read Repository / List and Detail / No Real DB

## Summary

Task 712 added a composite Engineer Mobile read repository utility.

Added:

- `createEngineerMobileReadRepository(options)`
- `ENGINEER_MOBILE_READ_REPOSITORY_NAME`
- `ENGINEER_MOBILE_READ_REPOSITORY_METHODS`

The composite repository combines:

- Task 693 list read repository
- Task 710 detail read repository

It exposes one repository surface:

- `getTaskList(input)`
- `getReadModel(input)`
- `getTaskDetail(input)`

## Executor Routing

`createEngineerMobileReadRepository(options)` supports:

- `listExecutor`
- `detailExecutor`
- shared `executor`
- `allowNonExecutableForTest`

Behavior:

- `listExecutor` is used for list reads.
- `detailExecutor` is used for detail reads.
- if only `executor` is provided, it is shared by both list and detail repositories.
- `allowNonExecutableForTest` is forwarded to both child repositories.

Default mode remains fail-closed because list and detail query specs are still `executable: false`.

## Read Methods

- `getTaskList(input)` delegates to the list repository.
- `getTaskDetail(input)` delegates to the detail repository.
- `getReadModel(input)` delegates by input shape:
  - with `appointmentId`: detail path, returning `{ task }` / `{ task: null }`
  - without `appointmentId`: list path, returning `{ tasks }`

This lets a future app/server request-aware provider inject one repository while keeping list/detail behavior separated internally.

## Safety Boundary

The composite repository imports only the existing list/detail read repositories. It does not import:

- DB / pool / transaction
- routes / controllers / app / server
- provider adapters
- LINE / SMS / Email / App push
- AI / RAG / vector code

It does not execute SQL, connect to a database, write files, log anything, or send provider messages.

Sensitive filtering remains owned by the child repositories and mappers:

- no raw phone / address / LINE id
- no token / secret / `DATABASE_URL`
- no internal note / audit raw / AI raw payload
- no billing / settlement internal data
- no `finalAppointmentId` / `final_appointment_id`

## Runtime Boundary

Task 712 is a small runtime utility only. It did not change:

- app / server / routes / controllers
- provider adapters
- services / repositories outside Engineer Mobile read repository composition
- real DB clients or SQL execution
- migrations / schema / indexes
- admin frontend
- smoke / browser scripts
- package files
- guardrails / design docs

## Future Tasks

- Wire the composite repository into app/server options only in a separate bounded task.
- Add real DB-backed executors only after explicit DB/runtime approval.
- Make query specs executable only in a bounded DB task.
- Add disposable DB dry-run coverage only after an approved local-only DB packet.

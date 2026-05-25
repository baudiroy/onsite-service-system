# Task 710 - Engineer Mobile Task Detail Read Repository / Injected Executor / No Real DB / No Migration

## Summary

Task 710 added the Engineer Mobile task detail read repository skeleton.

Added:

- `createEngineerMobileTaskDetailReadRepository(options)`
- `getTaskDetail(input)`
- `getReadModel(input)`
- `ENGINEER_MOBILE_TASK_DETAIL_READ_REPOSITORY_NAME`
- `ENGINEER_MOBILE_TASK_DETAIL_REPOSITORY_METHODS`

## Repository Boundary

The repository follows the Task 709 detail read model contract:

1. Build the static task detail query spec.
2. Fail closed when required request scope is missing.
3. Fail closed when the query spec is non-executable.
4. Only allow the synthetic executor path when `allowNonExecutableForTest` is explicitly true.
5. Pass a cloned and frozen query spec to the injected executor.
6. Map executor rows through the Task 709 safe detail mapper.
7. Return `{ task }` or `{ task: null }`.

The repository supports injected executors only:

- function executor: `executor(querySpec)`
- object executor: `executor.execute(querySpec)`

It does not connect to a database and does not execute SQL on its own.

## Safety Boundary

The repository does not trust executor output. Rows are always passed through the Task 709 mapper, which enforces:

- organization match
- assigned engineer match
- appointment match
- safe customer masking
- safe evidence references
- no raw phone, address, LINE id, token, secret, `DATABASE_URL`
- no internal note, audit log, AI raw payload, billing / settlement internal data
- no `finalAppointmentId` / `final_appointment_id`

Executor failures, malformed results, missing input, or non-executable query specs return `{ task: null }` without logging or leaking raw errors.

## Runtime Boundary

Task 710 did not change:

- routes / controllers / app / server
- provider adapters
- real DB client or repositories
- migration / schema / indexes
- admin frontend
- smoke / browser scripts
- AI / RAG / vector / notification providers

## Future Tasks

- Add a real DB client adapter only after explicit DB/runtime approval.
- Make the query spec executable only in a bounded DB-backed task.
- Add DB dry-run or integration coverage only after a disposable DB approval packet.
- Wire the detail read repository into app/server options in a separate bounded task.

# Task 679 — Query-backed Writer Downstream E2E Compatibility Test / No Runtime Change / No DB

## Scope

Task679 adds a focused integration test for the Task678 synchronous query-backed writer contract. It verifies the adapter through existing app/server route paths without changing runtime source.

This task does not connect to a database, does not execute SQL, does not add migrations, does not add routes, and does not send provider notifications.

## Coverage

The integration test covers:

- Default `allowNonExecutableForTest=false` does not call the executor and is treated downstream as writer failure, not success.
- Synthetic `allowNonExecutableForTest=true` allows synchronous executor calls.
- Pre-departure correction reaches `correction_application` and `audit`.
- Post-departure freeze reaches `contact_log`, `dispatch_note`, and `audit`.
- Unable-to-complete result reaches `appointment_result`, `evidence`, and `audit` when safe evidence refs are supplied.
- Follow-up proposal reaches `follow_up_draft`, `dispatch_note`, and `audit`.
- Phone correction returns re-verification and does not call `correction_application`.
- AI role is denied before executor calls.
- Executor throw returns safe failure without raw error leak.
- Async executor is rejected and not treated as success.
- Executor receives only safe parameterized query specs, with no raw phone/address/LINE id/token/secret/DB URL/internal note/AI raw/finalAppointmentId values.
- `createServerBootstrap({ dataCorrection: queryBackedWriterSet })` works without `listen`.
- `options.app` priority bypasses `dataCorrection` writers.

## Boundaries

- No runtime source change.
- No DB client.
- No real SQL execution.
- No migration.
- No API contract change.
- No permission runtime service change.
- No real audit log writer runtime.
- No smoke test.
- No admin frontend.
- No LINE/SMS/App provider sending.
- No AI/RAG runtime.

## Follow-up

Future tasks may introduce executable query specs, real repository adapters, DB client wiring, migration-backed tables, or smoke coverage, but those require a separate bounded task and explicit DB/migration scope.

# Task 680 — Data Correction Follow-up Query-backed Payload Compatibility Fix / No DB / No API

## Scope

Task680 fixes the payload compatibility issue discovered during Task679. The existing follow-up proposal service emits `sourceAppointmentId`, while the persistence record mapper expected `appointmentId` for query-backed persistence records.

This task makes a narrow mapper compatibility fix and finalizes the query-backed writer E2E test that was blocked under Task679.

## Runtime Decision

The persistence record mapper now normalizes safe `sourceAppointmentId` to persistence `appointmentId` when `appointmentId` is absent.

This keeps the follow-up service contract unchanged and keeps persistence translation in the mapper layer. It does not require route, app, server, API, DB, migration, or downstream service changes.

## Verification Coverage

The E2E integration test verifies:

- Follow-up proposal query-backed path calls synthetic executor for `follow_up_draft`, `dispatch_note`, and `audit`.
- `sourceAppointmentId` is normalized into persistence `appointmentId`.
- Default non-executable path still does not call executor.
- Synthetic sync executor path works only with `allowNonExecutableForTest=true`.
- Async executor is rejected safely.
- Executor receives safe query specs only.
- Phone correction does not write correction application.
- AI role is denied before executor.
- App/server bootstrap path works without `listen`.

## Boundaries

- No DB connection.
- No SQL execution.
- No migration.
- No API contract change.
- No route/app/server source change.
- No permission runtime service change.
- No real audit log writer runtime.
- No smoke test.
- No admin frontend.
- No LINE/SMS/App provider sending.
- No AI/RAG runtime.

## Follow-up

Future persistence work can introduce executable query specs, repository adapters, migration-backed tables, or DB client wiring only under a separate explicitly authorized task.

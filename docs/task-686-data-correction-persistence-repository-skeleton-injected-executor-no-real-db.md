# Task 686 — Data Correction Persistence Repository Skeleton / Injected Executor / No Real DB

## Scope

Task686 adds a Data Correction persistence repository skeleton that composes the existing query-backed writer set.

This task does not connect to a database, does not execute SQL, does not apply or dry-run a migration, and does not change API routes, app/server wiring, permission runtime, audit runtime, smoke tests, or provider sending.

## Repository Behavior

Added `src/dataCorrection/dataCorrectionPersistenceRepository.js`.

The repository exposes:

- `getWriterSet()`
- `writeAudit(payload)`
- `writeContactLog(payload)`
- `writeDispatchNote(payload)`
- `writeEngineerNotificationIntent(payload)`
- `writeAppointmentResult(payload)`
- `writeEvidence(payload)`
- `writeFollowUpDraft(payload)`
- `writeCorrectionApplication(payload)`

`getWriterSet()` returns app/server-compatible Data Correction writer keys:

- `auditWriter`
- `contactLogWriter`
- `dispatchNoteWriter`
- `engineerNotificationWriter`
- `appointmentResultWriter`
- `evidenceWriter`
- `followUpDraftWriter`
- `correctionWriter`

## Executor Boundary

The repository accepts an injected executor through the existing query-backed writer path.

Default behavior remains fail-closed:

- missing executor or non-executable query specs return safe failure
- no DB client is created
- no real SQL is executed
- no raw executor error is leaked

Synthetic test behavior is available only through `allowNonExecutableForTest=true` with a synchronous synthetic executor.

## Boundaries

- No real DB persistence.
- No DB client creation.
- No SQL execution.
- No migration apply or dry-run.
- No app/server route wiring.
- No API change.
- No permission runtime change.
- No real audit runtime change.
- No smoke test.
- No provider / AI sending.
- No sensitive data.

## Future Task

A future task may decide whether to wire this repository into app/server options with a real DB client. That future task must separately authorize executable query specs, DB client injection, migration status, and test coverage. This task does not authorize those steps.

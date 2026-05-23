# Task 684 — Data Correction Migration Draft Rollback and Completeness Static Guard / No DB Apply / No PSQL

## Scope

Task684 hardens the Data Correction migration draft with a documented rollback safety plan and adds a static guard.

This task does not connect to a database, does not execute SQL, does not apply or dry-run a migration, and does not change runtime source, API, route, permission runtime, audit runtime, provider sending, or smoke tests.

## Migration Draft Hardening

The migration draft now contains a documentation-only rollback plan.

The rollback plan:

- is explicitly not an executable down migration
- requires a separate explicit disposable DB task before any dry-run or apply
- forbids shared runtime / production rollback from this draft
- lists the 8 Data Correction tables in reverse create order
- keeps the draft inert until a future authorized task

The draft also preserves the safety boundary:

- no core table mutation
- no Field Service Report creation
- no finalAppointmentId storage or mutation
- no raw phone, raw address, raw LINE id, token, secret, or DB URL values
- no seed data
- no active destructive DDL

## Static Rollback Safety Guard

Added `tests/dataCorrection/dataCorrectionMigrationRollbackSafety.static.test.js`.

The test validates:

- migration draft exists
- authoring-only / not-applied comments remain present
- rollback documentation section exists
- rollback plan lists all 8 tables in reverse create order
- no active destructive DDL or seed data exists
- no core tables are altered or recreated
- every table includes `record_type`, `occurred_at`, and `created_at`
- no forbidden sensitive columns are defined
- no real-looking credentials or database URLs are embedded

## Boundaries

- No DB connection.
- No SQL execution.
- No migration apply.
- No migration dry-run.
- No runtime source change.
- No API change.
- No permission runtime change.
- No real audit runtime change.
- No smoke test.
- No provider / AI sending.
- No sensitive data.

## Follow-up

Future disposable DB dry-run, migration apply, rollback verification, or runtime writer integration still requires a separate explicit task and authorization.

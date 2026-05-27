# Task1770 Engineer Mobile Assigned Appointment Query Executor Contract Guard

Status: implemented locally / verified / pending PM review.

Scope: bounded runtime guard, tests, and documentation only.

## Goal

Add an injected-only query executor guard for the Engineer Mobile assigned appointment read-only DB-adjacent boundary.

The guard protects the boundary between:

- Task1760 DB repository adapter
- the injected query executor used for assigned appointment read-only access

This task remains no real DB, no SQL execution against a database, no migration, and no global mount.

## Files Changed

- `src/engineerMobile/engineerMobileAssignedAppointmentQueryExecutorGuard.js`
- `tests/engineerMobile/engineerMobileAssignedAppointmentQueryExecutorGuard.unit.test.js`
- `docs/task-1770-engineer-mobile-assigned-appointment-query-executor-contract-guard-injected-only-no-real-db.md`

## Runtime Behavior Added

`createEngineerMobileAssignedAppointmentQueryExecutorGuard({ delegateExecutor, auditLogger })` returns a callable guarded executor with an `execute` alias.

The guard:

- requires an injected `delegateExecutor`
- accepts only Task1758 assigned appointment query spec shapes
- accepts only the two read-only assigned appointment query names
- derives safe intent from accepted query names:
  - `engineerMobileAssignedAppointments.readOnlyList`
  - `engineerMobileAssignedAppointments.readOnlyDetail`
- requires SELECT-only SQL
- requires structured `params` and array `values`
- requires the accepted safe selected fields
- rejects raw string SQL input
- rejects malformed specs, unsafe SQL verbs, unsafe intent, and missing scope params
- strips unsafe top-level and params metadata before calling the delegate
- calls only the injected delegate executor
- normalizes delegate array / `{ rows }` results into `{ rows }`
- fails closed to empty rows on missing delegate, unsafe spec, or delegate throw
- emits optional safe audit metadata only

## Non-goals

- No real DB connection.
- No real SQL execution against a database.
- No migration / DDL / schema / index change.
- No psql or `db:migrate`.
- No smoke test.
- No global route mount.
- No provider sending.
- No LINE / SMS / email / webhook.
- No AI / RAG.
- No billing / settlement.
- No admin UI.
- No package change.
- No `src/app.js`, `src/server.js`, `src/routes/**`, `migrations/**`, or `admin/**` changes.

## Core Invariants

- One Case still has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not touched.
- `finalAppointmentId` remains system-owned except explicit admin override.
- A Case may still have multiple appointments / dispatch visits.
- The guard does not create, update, complete, submit, publish, or mutate workflow state.

## Verification

Local verification completed:

- `node --test tests/engineerMobile/engineerMobileAssignedAppointmentQueryExecutorGuard.unit.test.js`: PASS, 11 tests.
- `node --test tests/engineerMobile/engineerMobileAssignedAppointmentQueryExecutorGuard.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDbRepository.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.unit.test.js`: PASS, 36 tests.
- `npm run check`: PASS.
- `git diff --check -- src/engineerMobile tests/engineerMobile docs/task-1770-engineer-mobile-assigned-appointment-query-executor-contract-guard-injected-only-no-real-db.md`: PASS.
- credential scan on the Task1770 source, test, and doc: clean.

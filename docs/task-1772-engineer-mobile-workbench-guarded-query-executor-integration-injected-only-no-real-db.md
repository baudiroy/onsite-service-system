# Task1772 Engineer Mobile Workbench Guarded Query Executor Integration

Status: implemented locally / verified / pending PM review.

Scope: bounded runtime integration, targeted tests, and documentation only.

## Goal

Wire the accepted Task1770 query executor guard into the Engineer Mobile Workbench DB adapter path as an opt-in safety layer.

This keeps the future-safe read path injectable:

- synthetic request
- request context resolver
- Workbench read-only module
- optional repository guard
- DB repository adapter
- SQL query builder
- optional Task1770 query executor guard
- injected synthetic delegate executor
- DB row mapper
- projection normalizer
- safe response envelope

This task remains no real DB, no real SQL execution against a database, no migration, and no global route mount.

## Files Changed

- `src/engineerMobile/engineerMobileWorkbenchReadOnlyModule.js`
- `tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js`
- `tests/engineerMobile/engineerMobileWorkbenchDbAdapterSyntheticHttpAcceptance.unit.test.js`
- `docs/task-1772-engineer-mobile-workbench-guarded-query-executor-integration-injected-only-no-real-db.md`

## Runtime Behavior Added

`createEngineerMobileWorkbenchReadOnlyModule(...)` now accepts an opt-in query executor guard setting for the assigned appointment DB adapter path:

- `useQueryExecutorGuard: true`
- or `queryExecutorGuardEnabled: true`

When enabled, the module wraps the injected assigned appointment query executor with `createEngineerMobileAssignedAppointmentQueryExecutorGuard(...)` before passing it to the DB repository adapter.

Supported audit logger options:

- `queryExecutorGuardAuditLogger`
- `assignedAppointmentQueryExecutorGuardAuditLogger`
- fallback to `auditLogger`

Existing paths remain intact:

- direct injected `assignedAppointmentRepository`
- unguarded DB adapter path with injected query executor
- DB adapter path wrapped by Task1750 repository guard
- guarded query executor path wrapped by Task1750 repository guard

## Safety Behavior

The guarded path:

- requires an injected delegate query executor
- sends only Task1758 query specs into the Task1770 query executor guard
- sends only sanitized guarded query specs into the delegate executor
- preserves organization, engineer, and appointment scoped params
- keeps list and detail output behind DB row mapper, projection normalizer, and safe response envelope
- fails closed on missing executor by leaving the Workbench module unavailable
- fails closed on guarded detail delegate errors without leaking raw errors
- never calls mutation methods

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
- No commit or push.

## Core Invariants

- One Case still has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not touched.
- `finalAppointmentId` remains system-owned except explicit admin override.
- A Case may still have multiple appointments / dispatch visits.
- This integration does not create, update, complete, submit, publish, or mutate workflow state.

## Verification

Local verification completed:

- `node --test tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js`: PASS.
- `node --test tests/engineerMobile/engineerMobileWorkbenchDbAdapterSyntheticHttpAcceptance.unit.test.js`: PASS.
- `node --test tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js tests/engineerMobile/engineerMobileWorkbenchDbAdapterSyntheticHttpAcceptance.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentQueryExecutorGuard.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDbRepository.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.unit.test.js`: PASS.
- `npm run check`: PASS.
- `git diff --check -- src/engineerMobile tests/engineerMobile docs/task-1772-engineer-mobile-workbench-guarded-query-executor-integration-injected-only-no-real-db.md`: PASS.
- credential scan on Task1772 source, tests, and doc: clean.

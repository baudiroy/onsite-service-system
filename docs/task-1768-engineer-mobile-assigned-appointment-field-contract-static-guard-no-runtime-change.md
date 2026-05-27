# Task1768 Engineer Mobile Assigned Appointment Field Contract Static Guard

Status: implemented locally / verified / pending PM review.

Scope: tests and documentation only.

## Goal

Add a static guard for the Engineer Mobile assigned appointment DB-adjacent read-only field contract without runtime changes.

The guard locks the field alignment between:

- Task1748 projection normalizer
- Task1758 SQL query builder
- Task1766 DB row mapper
- Task1760 DB repository adapter
- Task1764 synthetic HTTP acceptance path

## Files Changed

- `tests/engineerMobile/engineerMobileAssignedAppointmentFieldContract.static.test.js`
- `docs/task-1768-engineer-mobile-assigned-appointment-field-contract-static-guard-no-runtime-change.md`

## Contract Covered

- SQL builder selected fields stay aligned with DB row mapper accepted input fields.
- DB row mapper output fields stay aligned with projection normalizer input fields.
- Projection output remains allowlist-oriented.
- List projection remains separate from detail-only fields.
- `scheduled_start` / `scheduled_end` and `scheduled_start_at` / `scheduled_end_at` stay mapped to `scheduledStart` / `scheduledEnd`.
- Repository adapter maps executor rows through the DB row mapper before returning rows.
- Synthetic HTTP acceptance coverage keeps snake_case DB executor rows and forbidden sentinel fields.
- Forbidden fields are not selected, mapped, or visible:
  - `finalAppointmentId`
  - `final_appointment_id`
  - raw phone / raw address
  - raw SQL / debug fields
  - raw DB rows
  - stack traces
  - internal notes
  - provider / debug / private fields
  - token / cookie / password / secret / authorization header

## Boundaries Preserved

- No `src/**` changes.
- No runtime behavior change.
- No API shape change.
- No DB connection.
- No SQL execution.
- No migration, DDL, psql, or `db:migrate`.
- No smoke test.
- No provider sending.
- No LINE / SMS / email / webhook.
- No AI / RAG.
- No billing / settlement.
- No admin UI.
- No package changes.

## Core Invariants

- One Case still has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not touched.
- `finalAppointmentId` remains system-owned except explicit admin override.
- A Case may still have multiple appointments / dispatch visits.
- Engineer Mobile assigned appointment reads must not create or imply a second formal Field Service Report.

## Verification

Local verification completed:

- `node --test tests/engineerMobile/engineerMobileAssignedAppointmentFieldContract.static.test.js`: PASS, 8 tests.
- `node --test tests/engineerMobile/engineerMobileAssignedAppointmentFieldContract.static.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDbRowMapper.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDbRepository.unit.test.js tests/engineerMobile/engineerMobileWorkbenchDbAdapterSyntheticHttpAcceptance.unit.test.js`: PASS, 33 tests.
- `npm run check`: PASS.
- `git diff --check -- tests/engineerMobile/engineerMobileAssignedAppointmentFieldContract.static.test.js docs/task-1768-engineer-mobile-assigned-appointment-field-contract-static-guard-no-runtime-change.md`: PASS.
- credential scan on the Task1768 test and doc: clean.

# Task1766 - Engineer Mobile Assigned Appointment DB Row Mapper / No DB Execution

## Scope

Task1766 adds a pure DB executor row mapper for the Engineer Mobile assigned appointment DB repository adapter path.

Allowed files touched:

- `src/engineerMobile/engineerMobileAssignedAppointmentDbRowMapper.js`
- `src/engineerMobile/engineerMobileAssignedAppointmentDbRepository.js`
- `tests/engineerMobile/engineerMobileAssignedAppointmentDbRowMapper.unit.test.js`
- `tests/engineerMobile/engineerMobileAssignedAppointmentDbRepository.unit.test.js`
- `tests/engineerMobile/engineerMobileWorkbenchDbAdapterSyntheticHttpAcceptance.unit.test.js`
- `tests/engineerMobile/engineerMobileActionIntentBoundary.unit.test.js`
- `tests/engineerMobile/engineerMobileReadModelBranchClosure.static.test.js`
- `docs/task-1766-engineer-mobile-assigned-appointment-db-row-mapper-no-db-execution.md`

No DB, migration, route mount, app/server bootstrap, smoke, provider, admin, AI, billing, settlement, package, or schema files were modified.

## Runtime Change

Added `engineerMobileAssignedAppointmentDbRowMapper` as a pure deterministic mapper for synthetic DB executor rows.

The mapper accepts only plain row objects and returns frozen internal row objects. Invalid inputs or rows without `appointment_id` / `appointmentId` return `undefined`.

The DB repository adapter now normalizes executor results through:

- `mapAssignedAppointmentListDbRow`
- `mapAssignedAppointmentDetailDbRow`

before returning list/detail rows to the existing repository guard and projection handlers.

## Field Mapping

The mapper supports DB snake_case and existing internal camelCase aliases:

- `appointment_id` -> `appointmentId`
- `organization_id` -> `organizationId`
- `engineer_user_id`, `assigned_engineer_id`, `engineer_id` -> `engineerUserId`
- `case_id` -> `caseId`
- `case_reference`, `case_display_id` -> `caseReference`
- `scheduled_start`, `scheduled_start_at` -> `scheduledStart`
- `scheduled_end`, `scheduled_end_at` -> `scheduledEnd`
- `appointment_status` -> `status`
- `service_type` -> `serviceType`
- `customer_display_name` -> `customerDisplayName`
- `location_label` -> `locationLabel`
- `priority_label` -> `priorityLabel`
- `service_summary` -> `serviceSummary`
- `public_customer_notes` -> `publicCustomerNotes`
- `checklist_preview` -> safe `checklistPreview`

`scheduled_start_at` and `scheduled_end_at` are intentionally normalized into the existing downstream projection contract names `scheduledStart` and `scheduledEnd`, because the accepted Engineer Mobile projection handlers currently expose and sort by those names.

## Sensitive Field Exclusion

The mapper is allowlist-based. It strips raw and forbidden fields including:

- `finalAppointmentId`
- `final_appointment_id`
- raw SQL/debug fields
- raw DB row fields
- stack traces
- internal notes
- provider/debug/private payloads
- token, cookie, password, secret, authorization markers
- raw phone and raw address markers

Checklist preview items are also remapped through an allowlist and keep only safe `label` and optional `status`.

## Compatibility

Existing repository behavior remains compatible:

- Array executor results still work.
- `{ rows: [...] }` executor results still work.
- Invalid executor results normalize safely.
- Missing query executor still fails closed.
- Query builder and query executor raw errors still do not leak.
- The projection normalizer remains the final visible-field allowlist.
- The Task1764 synthetic HTTP acceptance path still passes with snake_case DB executor rows and forbidden field markers.

## Static Boundary Updates

Two existing Engineer Mobile static boundary tests were updated to allow the Task1766 mapper import as the only additional DB-named adapter dependency:

- `tests/engineerMobile/engineerMobileActionIntentBoundary.unit.test.js`
- `tests/engineerMobile/engineerMobileReadModelBranchClosure.static.test.js`

They still reject write repositories, DB pools, provider sending, notifications, AI/RAG, admin, smoke, completion, FSR mutation, and workflow write dependencies.

## Non-Goals

Task1766 does not:

- connect to a real DB
- execute SQL
- use `psql`
- run `db:migrate`
- create, alter, dry-run, or apply migrations
- change DDL, indexes, unique constraints, or schema
- change API response shape
- mount global routes
- touch `src/app.js`, `src/server.js`, or `src/routes/**`
- modify provider sending, LINE, SMS, email, webhook, AI, RAG, billing, settlement, admin UI, package files, or smoke runtime
- mutate appointment, Case, Completion Report, Field Service Report, workflow state, or `finalAppointmentId`
- stage, clean, reset, stash, restore, remove, commit, or push held historical docs

## Core Invariants

Task1766 preserves the established service boundaries:

- A Case can have multiple appointments / dispatch visits.
- A Case can have at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not touched.
- `finalAppointmentId` remains excluded from Engineer Mobile DB row mapping and visible responses.
- No appointment / dispatch / FSR review behavior is introduced.
- No second formal FSR creation path is introduced.

## Verification

Executed after implementation:

```bash
/Users/global/.nvm/versions/node/v24.16.0/bin/node --test tests/engineerMobile/engineerMobileAssignedAppointmentDbRowMapper.unit.test.js # PASS, 6 tests
/Users/global/.nvm/versions/node/v24.16.0/bin/node --test tests/engineerMobile/engineerMobileAssignedAppointmentDbRepository.unit.test.js tests/engineerMobile/engineerMobileWorkbenchDbAdapterSyntheticHttpAcceptance.unit.test.js # PASS, 19 tests
/Users/global/.nvm/versions/node/v24.16.0/bin/node --test tests/engineerMobile/engineerMobileActionIntentBoundary.unit.test.js tests/engineerMobile/engineerMobileReadModelBranchClosure.static.test.js # PASS, 13 tests
/Users/global/.nvm/versions/node/v24.16.0/bin/node --test tests/engineerMobile/engineerMobileAssignedAppointmentDbRowMapper.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDbRepository.unit.test.js tests/engineerMobile/engineerMobileWorkbenchDbAdapterSyntheticHttpAcceptance.unit.test.js # PASS, 25 tests
/Users/global/.nvm/versions/node/v24.16.0/bin/node --test tests/engineerMobile/*.js # PASS, 900 tests
/Users/global/.nvm/versions/node/v24.16.0/bin/node /Users/global/.nvm/versions/node/v24.16.0/lib/node_modules/npm/bin/npm-cli.js run check # PASS
git diff --check -- src/engineerMobile tests/engineerMobile docs/task-1766-engineer-mobile-assigned-appointment-db-row-mapper-no-db-execution.md # PASS
git diff --check --no-index /dev/null src/engineerMobile/engineerMobileAssignedAppointmentDbRowMapper.js # PASS
git diff --check --no-index /dev/null tests/engineerMobile/engineerMobileAssignedAppointmentDbRowMapper.unit.test.js # PASS
git diff --check --no-index /dev/null docs/task-1766-engineer-mobile-assigned-appointment-db-row-mapper-no-db-execution.md # PASS
```

Credential-pattern scan over the Task1766 source, test, and documentation files was clean.

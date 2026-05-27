# Task1758 - Engineer Mobile Assigned Appointment Read-Only SQL Query Builder / No DB Execution

Status: completed locally / pure runtime query builder / no DB execution.

## Scope

Task1758 adds a pure read-only SQL query builder for the future Engineer Mobile assigned appointment repository. The builder returns query spec objects only. It does not execute SQL, connect to DB, create migrations, or change schema.

Modified files:

- `src/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.js`
- `tests/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.unit.test.js`
- `docs/task-1758-engineer-mobile-assigned-appointment-read-only-sql-query-builder-no-db-execution.md`

## Runtime Surface

The new runtime file exports:

- `buildEngineerMobileAssignedAppointmentListQuerySpec(input)`
- `buildEngineerMobileAssignedAppointmentDetailQuerySpec(input)`
- `ASSIGNED_APPOINTMENT_SAFE_SELECTED_FIELDS`
- query name constants for list and detail specs

Both builders are pure and deterministic. They return frozen query spec objects with:

- `ok`
- `executable: false`
- `name`
- `requiredParams`
- `params`
- `values`
- `fields`
- `sql`

The specs are intended for a future repository behind the accepted Task1750 repository guard or an equivalent scoped guard. Task1758 does not add that repository and does not run the specs.

## Required Scoping

List query specs fail closed unless all required scope exists:

- `organizationId`
- `engineerUserId`

Detail query specs fail closed unless all required scope exists:

- `organizationId`
- `engineerUserId`
- `appointmentId`

The detail builder rejects unsafe appointment ids and returns a fail-closed non-executable spec.

## Read-Only SQL Shape

The generated SQL is SELECT-only and parameterized:

- list query filters by `a.organization_id = $1`
- list query filters by `a.assigned_engineer_id = $2`
- list query uses optional parameterized date/status filters
- detail query filters by `a.organization_id = $1`
- detail query filters by `a.assigned_engineer_id = $2`
- detail query filters by `a.id = $3`
- raw input values are never interpolated into SQL text

The builder never generates mutation SQL such as INSERT, UPDATE, DELETE, UPSERT, MERGE, ALTER, DROP, CREATE, TRUNCATE, or workflow transition SQL.

## Safe Selected Fields

Selected fields align with the accepted Task1748 projection normalizer boundary:

- `appointment_id`
- `case_reference`
- `appointment_window`
- `scheduled_start`
- `scheduled_end`
- `service_type`
- `customer_display_name`
- `location_label`
- `appointment_status`
- `priority_label`
- `service_summary`
- `public_customer_notes`
- `checklist_preview`

The builder excludes forbidden selected fields:

- `finalAppointmentId`
- `final_appointment_id`
- raw phone
- raw address
- raw SQL/debug fields
- internal notes
- provider/debug/private fields
- token
- secret
- password
- cookie
- authorization header
- raw session
- raw user object

Unsafe filters are ignored. Safe filters remain limited to date range and status.

## Non-goals

- No DB connection.
- No SQL execution.
- No repository implementation.
- No migration creation.
- No migration apply.
- No DDL.
- No schema/index changes.
- No psql.
- No `db:migrate`.
- No smoke.
- No global route mount.
- No `src/app.js`.
- No `src/server.js`.
- No `src/routes/**`.
- No provider sending.
- No LINE / SMS / email / webhook.
- No AI / RAG.
- No billing / settlement.
- No admin UI.
- No package changes.
- No commit or push in this task.
- No cleanup of held historical docs.

## Preserved Core Boundaries

- One Case still has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not touched.
- `finalAppointmentId` remains system-owned except explicit admin override.
- A Case may still have multiple appointments and dispatch visits.
- This read-only query builder cannot create a second formal Field Service Report.
- This task does not create, update, submit, publish, or persist a Field Service Report.

## Verification

Commands run:

```bash
node --test tests/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.unit.test.js
npm run check
git diff --check -- src/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.js tests/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.unit.test.js docs/task-1758-engineer-mobile-assigned-appointment-read-only-sql-query-builder-no-db-execution.md
```

Results:

- Task1758 query builder test: PASS.
- `npm run check`: PASS.
- `git diff --check`: PASS.
- Credential scan on Task1758 changed files: clean.

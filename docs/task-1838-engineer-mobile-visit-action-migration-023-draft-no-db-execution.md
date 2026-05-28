# Task1838 Engineer Mobile Visit Action Migration 023 Draft / No DB Execution

## Status

Task1838 creates a migration draft file only, plus a static boundary test and this task note. The migration is not applied, dry-run, executed, or verified against any DB in this task.

## Source Contract

Task1838 follows the accepted Task1836 readiness contract. Task1836 translated the accepted Engineer Mobile visit action runtime envelopes into future DB persistence candidate fields while preserving appointment-level visit history, auditability, tenant boundaries, customer-visible filtering, Field Service Report boundaries, and the backend/system-owned `finalAppointmentId` rule.

## Files

- `migrations/023_engineer_mobile_visit_action_persistence_fields.sql`
- `tests/engineerMobile/engineerMobileVisitActionMigration023Draft.static.test.js`
- `docs/task-1838-engineer-mobile-visit-action-migration-023-draft-no-db-execution.md`

## Migration Draft Scope

The migration draft uses `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS` for the Engineer Mobile visit action persistence fields assigned by PM:

- `mobile_visit_status`
- `visit_result`
- `mobile_visit_status_updated_at`
- `mobile_visit_status_updated_by`
- `work_started_at`
- `work_finished_at`
- `arrived_at`
- `travel_started_at`

It also includes safe draft indexes using `CREATE INDEX IF NOT EXISTS` for appointment visit status lookup and a narrow existing-`audit_logs` entity/action lookup. The draft avoids adding duplicate generic identity or assignment fields such as `organization_id`, `appointment_id`, `case_id`, `assigned_engineer_id`, `updated_at`, or `updated_by`.

## Supported Values

`mobile_visit_status` values are documented in SQL comments only:

- `traveling`
- `arrived`
- `working`
- `work_finished`
- `visit_result_recorded`

`visit_result` values are documented in SQL comments only:

- `resolved`
- `follow_up_required`
- `parts_required`
- `cannot_repair`
- `customer_unavailable`
- `cancelled_on_site`

Task1838 does not add check constraints because this is a draft-only migration and existing data / convention verification is deferred to a future disposable DB dry-run authorization task.

## Boundary Statements

- Migration draft only
- No DB execution
- No psql
- No npm run db:migrate
- No migration apply
- No SQL dry-run
- No schema verification against shared DB
- No runtime code change
- No repository implementation
- No provider sending
- No Completion Report / Field Service Report creation
- No finalAppointmentId mutation
- No customer-visible publication
- Future disposable local/test DB dry-run requires separate explicit approval

## Guardrails Preserved

- One Case may have multiple appointments / dispatch visits.
- One Case ultimately has only one formal Field Service Report.
- `field_service_reports.case_id` uniqueness remains untouched.
- Engineer Mobile visit action fields remain appointment / dispatch visit layer state.
- Customer-visible outputs remain out of scope.
- Sensitive contact/provider/report/body payload fields are not added.

## Verification

Task1838 verification should run:

- `node --test tests/engineerMobile/engineerMobileVisitActionMigration023Draft.static.test.js`
- `git diff --check -- migrations/023_engineer_mobile_visit_action_persistence_fields.sql tests/engineerMobile/engineerMobileVisitActionMigration023Draft.static.test.js docs/task-1838-engineer-mobile-visit-action-migration-023-draft-no-db-execution.md`
- precise credential/sensitive scan limited to the three touched Task1838 files

Task1838 must not run `psql`, `npm run db:migrate`, migration apply, SQL dry-run, DB connection, smoke, or runtime execution.

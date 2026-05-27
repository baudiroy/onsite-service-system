# Task1780 - Engineer Mobile Read-Model SQL Query Builder Alignment / No DB Execution

Status: completed locally / runtime query-spec alignment only / no DB execution.

## Scope

Task1780 aligns the Engineer Mobile assigned appointment SQL query builder with the accepted Task1778 decision: read-model path first.

Modified files:

- `src/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.js`
- `tests/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.unit.test.js`
- `tests/engineerMobile/engineerMobileAssignedAppointmentFieldContract.static.test.js`
- `tests/engineerMobile/engineerMobileDbAdjacentRuntimeBoundary.static.test.js`
- `docs/task-1780-engineer-mobile-read-model-sql-query-builder-alignment-no-db-execution.md`

Runtime/source files changed:

- `src/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.js`

No app/server/route/global mount files changed.

## Alignment Summary

The query builder now targets the read-model table/contract first:

- `engineer_mobile_task_read_models em`
- `em.organization_id`
- `em.assigned_engineer_id`
- `em.appointment_id`
- `em.scheduled_start`
- `em.scheduled_end`
- `em.status`
- `em.customer_name_masked`
- `em.address_summary`
- `em.site_note_safe`
- `em.checklist_summary`

The selected aliases remain mapper-compatible and projection-compatible:

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

Direct base-table path remains deferred. The query builder no longer targets the prior direct `appointments` / `cases` join shape.

No migration/apply assumption is made. `migrations/022_create_engineer_mobile_read_model.sql` is still not assumed applied.

## Query Behavior

Query specs remain SELECT-only.

Query specs remain `executable:false`.

Query specs remain parameterized and do not interpolate raw user input into SQL.

List query scoping:

- organization id: `em.organization_id = $1`
- assigned engineer id / engineer user id: `em.assigned_engineer_id = $2`

Detail query scoping:

- organization id: `em.organization_id = $1`
- assigned engineer id / engineer user id: `em.assigned_engineer_id = $2`
- appointment id: `em.appointment_id = $3`

The existing safe selected field contract is preserved so Task1766 DB row mapper aliases and Task1748 projection normalizer continue to receive the same safe alias names.

## Forbidden Fields

The query builder does not select:

- `finalAppointmentId`
- `final_appointment_id`
- raw phone/address
- raw SQL/debug fields
- raw DB rows
- stack traces
- internal notes
- provider/debug/private fields
- token/cookie/password/secret/auth header

The read-model path uses masked/safe fields such as `customer_name_masked`, `address_summary`, `site_note_safe`, and `checklist_summary`.

## Tests Updated

Updated targeted tests verify:

- query builder references `engineer_mobile_task_read_models`
- query builder no longer references direct `appointments` / `cases` join text
- list query scopes by organization id and assigned engineer id
- detail query scopes by organization id, assigned engineer id, and appointment id
- selected columns remain read-model compatible and mapper-compatible
- query remains SELECT-only and `executable:false`
- query uses placeholders/params only
- forbidden fields are not selected
- static field contract guard remains aligned
- DB-adjacent boundary guard remains aligned

Existing DB repository adapter and synthetic HTTP acceptance tests remain compatible because the safe alias contract is unchanged.

## Non-goals

- No real DB connection.
- No real SQL execution.
- No migration changes.
- No migration creation.
- No migration apply.
- No DDL.
- No schema/index changes.
- No `psql`.
- No `db:migrate`.
- No smoke.
- No global route mount.
- No provider sending.
- No LINE / SMS / email / webhook.
- No AI / RAG.
- No billing / settlement.
- No admin UI.
- No package changes.
- No `src/app.js`.
- No `src/server.js`.
- No `src/routes/**`.
- No commit.
- No push.
- No staging of held historical docs.

## Verification

Targeted checks for this task:

- `node --test tests/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileAssignedAppointmentFieldContract.static.test.js`
- `node --test tests/engineerMobile/engineerMobileDbAdjacentRuntimeBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileAssignedAppointmentDbRepository.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileWorkbenchDbAdapterSyntheticHttpAcceptance.unit.test.js`
- `npm run check` when available and safe
- `git diff --check -- src/engineerMobile tests/engineerMobile docs/task-1780-engineer-mobile-read-model-sql-query-builder-alignment-no-db-execution.md`

No DB-backed checks and no smoke are part of Task1780.

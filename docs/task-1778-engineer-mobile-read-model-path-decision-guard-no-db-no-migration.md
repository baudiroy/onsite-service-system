# Task1778 - Engineer Mobile Read-Model Path Decision Guard / No DB Execution / No Migration

Status: completed locally / decision guard only / no runtime change / no DB execution / no migration.

## Scope

Task1778 records the bounded architecture decision for the next Engineer Mobile assigned appointment read-only DB-adjacent path.

Modified files:

- `docs/task-1778-engineer-mobile-read-model-path-decision-guard-no-db-no-migration.md`
- `tests/engineerMobile/engineerMobileReadModelPathDecision.static.test.js`

Runtime/source files changed: none.

Files inspected read-only:

- `docs/task-1776-engineer-mobile-assigned-appointment-existing-schema-compatibility-inventory-no-db-no-migration.md`
- `migrations/022_create_engineer_mobile_read_model.sql`
- `docs/design/engineer-mobile-read-model-schema-proposal.md`
- `src/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.js`
- `src/engineerMobile/engineerMobileAssignedAppointmentDbRowMapper.js`
- `src/engineerMobile/engineerMobileAssignedAppointmentProjection.js`

## Decision

Proceed with the read-model path first for Engineer Mobile assigned appointment read-only DB-adjacent work.

The direct base-table path remains a future option only.

## Reason

The read-model path is the safer next bounded path because Task1776 found the current Task1758 query-builder selected fields, mapper aliases, and projection contract align better with the read model draft than with direct base-table joins.

The direct base-table path is deferred because it has missing or uncertain display fields and would require a future join/query rewrite decision before it can safely become DB-backed runtime.

Key reasons:

- Task1776 found current Task1758 query-builder fields align better with the read model draft.
- Direct base-table path has missing/uncertain display fields.
- Direct base-table path would require a future join/query rewrite decision.
- The read model exposes organization and assigned-engineer scope directly through `organization_id` and `assigned_engineer_id`.
- The read model uses safe summary/masked field names such as `customer_name_masked`, `customer_phone_masked`, `address_summary`, `service_summary`, `site_note_safe`, and `checklist_summary`.

## Explicit Limitations

This decision guard does not authorize migration apply.

This decision guard does not authorize DB execution.

This decision guard does not authorize DDL.

This decision guard does not authorize `psql`.

This decision guard does not authorize `db:migrate`.

This decision guard does not claim `migrations/022_create_engineer_mobile_read_model.sql` is applied anywhere.

The read model migration is not assumed applied.

No disposable DB dry-run is authorized in this task.

## Future Runtime Implication

Query builder alignment requirement:

- Future Engineer Mobile assigned appointment query builder work should align with the read-model contract first.
- Future query text should not assume direct base-table fields that Task1776 found missing or uncertain.
- Future query text should preserve safe selected fields and avoid forbidden fields.

Future real repository wiring must still use:

- injected executor
- query executor guard
- repository guard
- organization-scoped parameters
- engineer-assigned parameters
- fail-closed missing-scope behavior

Repository guard / query executor guard requirement remains mandatory before any DB-backed read path is used.

## Future Migration Implication

Any read-model migration dry-run/apply requires separate explicit authorization.

No migration apply is authorized by this task.

No migration dry-run is authorized by this task.

No disposable DB dry-run is authorized in this task.

`migrations/022_create_engineer_mobile_read_model.sql` remains an unapplied migration authoring draft unless a separate PM-approved task authorizes dry-run or apply.

## Direct Base-Table Path

The direct base-table path remains a future option only.

If a future task selects the direct base-table path, it must first make a bounded query rewrite decision for joins across `appointments`, `dispatch_assignments`, `cases`, and approved safe projection sources.

It must not assume:

- `appointments.organization_id`
- `appointments.assigned_engineer_id`
- `appointments.scheduled_start`
- `appointments.scheduled_end`
- `appointments.status`
- `cases.case_reference`
- unsafe raw customer identity fields

## Core Boundary Confirmation

One Case / one formal FSR boundary remains untouched.

`field_service_reports.case_id` uniqueness remains untouched.

This decision cannot create a second formal FSR.

`finalAppointmentId` remains system-owned/admin override only and must not be exposed.

Task detail and assigned appointment reads are not Field Service Reports.

## Non-goals

- No source/runtime changes.
- No migration changes.
- No migration creation.
- No migration apply.
- No DDL.
- No schema/index changes.
- No real DB connection.
- No real SQL execution.
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
- No commit.
- No push.
- No staging of held historical docs.

## Verification

Targeted checks for this task:

- `node --test tests/engineerMobile/engineerMobileReadModelPathDecision.static.test.js`
- `npm run check` when available and safe
- `git diff --check -- docs/task-1778-engineer-mobile-read-model-path-decision-guard-no-db-no-migration.md tests/engineerMobile/engineerMobileReadModelPathDecision.static.test.js`

No DB-backed checks and no smoke are part of Task1778.

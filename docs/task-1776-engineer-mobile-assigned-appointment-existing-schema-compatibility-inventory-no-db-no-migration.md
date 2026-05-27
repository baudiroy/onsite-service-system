# Task1776 - Engineer Mobile Assigned Appointment Existing Schema Compatibility Inventory / No DB Execution / No Migration

Status: completed locally / static compatibility inventory / no DB execution / no migration.

## Scope

Task1776 performs a bounded static inventory between the accepted Engineer Mobile assigned appointment DB-adjacent runtime code and the existing schema/migration files.

Modified files:

- `docs/task-1776-engineer-mobile-assigned-appointment-existing-schema-compatibility-inventory-no-db-no-migration.md`
- `tests/engineerMobile/engineerMobileAssignedAppointmentExistingSchemaCompatibility.static.test.js`

Runtime/source files changed: none.

Schema/migration files inspected read-only:

- `migrations/001_create_base_tables.sql`
- `migrations/002_create_cases.sql`
- `migrations/006_create_dispatch_appointment_tables.sql`
- `migrations/008_create_field_service_tables.sql`
- `migrations/013_add_organization_scope.sql`
- `migrations/018_add_visit_result_fields_to_appointments.sql`
- `migrations/019_add_final_appointment_id_to_field_service_reports.sql`
- `migrations/022_create_engineer_mobile_read_model.sql`
- `docs/design/engineer-mobile-workbench.md`
- `docs/design/engineer-mobile-read-model-schema-proposal.md`
- `src/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.js`
- `src/engineerMobile/engineerMobileAssignedAppointmentDbRowMapper.js`
- `src/engineerMobile/engineerMobileAssignedAppointmentProjection.js`

No `schema/**` directory exists in this checkout at the time of this inventory.

## Current SQL Builder Expected Fields

The accepted Task1758 SQL query builder currently expects this safe selected field contract:

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

The builder also requires scoped parameters:

- list: `organizationId`, `engineerUserId`
- detail: `organizationId`, `engineerUserId`, `appointmentId`

The builder is query-spec-only and returns `executable: false`; it does not execute SQL.

## Current DB Row Mapper Accepted Aliases

The accepted Task1766 DB row mapper accepts these existing snake_case and camelCase aliases:

- `appointment_id` / `appointmentId` -> `appointmentId`
- `organization_id` / `organizationId` -> `organizationId`
- `engineer_user_id` / `assigned_engineer_id` / `engineer_id` / camelCase variants -> `engineerUserId`
- `case_id` / `caseId` -> `caseId`
- `case_reference` / `case_display_id` / camelCase variants -> `caseReference`
- `appointment_window` / `appointmentWindow` -> `appointmentWindow`
- `scheduled_start` / `scheduled_start_at` / camelCase variants -> `scheduledStart`
- `scheduled_end` / `scheduled_end_at` / camelCase variants -> `scheduledEnd`
- `service_type` / `serviceType` -> `serviceType`
- `customer_display_name` / `customerDisplayName` -> `customerDisplayName`
- `location_label` / `locationLabel` -> `locationLabel`
- `appointment_status` / `status` / camelCase variants -> `status`
- `priority_label` / `priorityLabel` -> `priorityLabel`
- `service_summary` / `serviceSummary` -> `serviceSummary`
- `public_customer_notes` / `publicCustomerNotes` -> `publicCustomerNotes`
- `checklist_preview` / `checklistPreview` -> safe checklist preview

## Existing Schema Field Inventory

### Appointment and Dispatch Assignment Sources

`migrations/006_create_dispatch_appointment_tables.sql` defines:

- `dispatch_assignments.id`
- `dispatch_assignments.case_id`
- `dispatch_assignments.dispatch_unit_id`
- `dispatch_assignments.assigned_engineer_id`
- `dispatch_assignments.dispatch_status`
- `dispatch_assignments.assignment_note`
- `dispatch_assignments.assigned_at`
- `appointments.id`
- `appointments.case_id`
- `appointments.dispatch_assignment_id`
- `appointments.scheduled_start_at`
- `appointments.scheduled_end_at`
- `appointments.appointment_status`
- `appointments.visit_type`
- `appointments.timezone`
- `appointments.reschedule_reason`
- `appointments.note`

`migrations/018_add_visit_result_fields_to_appointments.sql` later adds appointment visit result fields:

- `appointments.visit_sequence`
- `appointments.visit_result`
- `appointments.incomplete_reason`
- `appointments.next_action`
- `appointments.actual_arrival_at`
- `appointments.actual_finished_at`

### Organization Scope and Case Relationship Sources

`migrations/013_add_organization_scope.sql` adds:

- `cases.organization_id`
- `dispatch_units.organization_id`
- organization indexes for `cases`, `customers`, `dispatch_units`, and `user_organizations`

`migrations/002_create_cases.sql` defines existing case fields that can support safe display with mapping decisions:

- `cases.id`
- `cases.case_no`
- `cases.customer_id`
- `cases.priority`
- `cases.case_type`
- `cases.product_type`
- `cases.problem_description`
- `cases.service_region`
- `cases.dispatch_unit_id`
- `cases.dispatch_assignment_source`

`migrations/001_create_base_tables.sql` defines customers with raw identity/contact fields:

- `customers.customer_name`
- `customers.mobile`
- `customers.city`
- `customers.address`

These raw customer fields are not safe to expose directly in this Engineer Mobile DB-adjacent path without an explicitly approved projection/masking rule.

### Engineer Mobile Read Model Draft

`migrations/022_create_engineer_mobile_read_model.sql` defines the future read model table:

- `engineer_mobile_task_read_models.organization_id`
- `engineer_mobile_task_read_models.case_id`
- `engineer_mobile_task_read_models.appointment_id`
- `engineer_mobile_task_read_models.assigned_engineer_id`
- `engineer_mobile_task_read_models.scheduled_start`
- `engineer_mobile_task_read_models.scheduled_end`
- `engineer_mobile_task_read_models.status`
- `engineer_mobile_task_read_models.customer_name_masked`
- `engineer_mobile_task_read_models.customer_phone_masked`
- `engineer_mobile_task_read_models.address_summary`
- `engineer_mobile_task_read_models.product_summary`
- `engineer_mobile_task_read_models.issue_summary`
- `engineer_mobile_task_read_models.service_summary`
- `engineer_mobile_task_read_models.service_type`
- `engineer_mobile_task_read_models.site_note_safe`
- `engineer_mobile_task_read_models.checklist_summary`
- `engineer_mobile_task_read_models.evidence_refs`

This read model has the closest alignment with the current Engineer Mobile scoped read contract, but it remains a migration file only and was not executed in this task.

## Compatibility Summary

Fields aligned with existing base tables or read model draft:

- `appointment_id`: aligns with `appointments.id` or `engineer_mobile_task_read_models.appointment_id`.
- `organizationId`: aligns through `cases.organization_id` for base-table joins, or directly with `engineer_mobile_task_read_models.organization_id`.
- `engineerUserId`: aligns through `dispatch_assignments.assigned_engineer_id` for base-table joins, or directly with `engineer_mobile_task_read_models.assigned_engineer_id`.
- `appointmentId`: aligns with `appointments.id` and `engineer_mobile_task_read_models.appointment_id`.
- `scheduled_start`: aligns directly with the read model draft; base `appointments` uses `scheduled_start_at`, which the mapper already aliases.
- `scheduled_end`: aligns directly with the read model draft; base `appointments` uses `scheduled_end_at`, which the mapper already aliases.
- `appointment_status`: aligns with `appointments.appointment_status`; read model draft uses generic `status`, which the mapper already aliases.
- `service_type`: aligns with `engineer_mobile_task_read_models.service_type`; base cases use `case_type` / `product_type`, so a mapping decision is needed before base-table query adoption.
- `service_summary`: aligns with `engineer_mobile_task_read_models.service_summary`; base cases have `problem_description`, so a safe summary projection decision is needed before base-table query adoption.

Fields missing or uncertain for the current Task1758 SQL builder if pointed directly at base `appointments` / `cases`:

- `appointments.organization_id` is not present in inspected migrations.
- `appointments.assigned_engineer_id` is not present in inspected migrations.
- `appointments.appointment_window` is not present in inspected migrations.
- `appointments.scheduled_start` is not present; base schema uses `scheduled_start_at`.
- `appointments.scheduled_end` is not present; base schema uses `scheduled_end_at`.
- `appointments.status` is not present; base schema uses `appointment_status`.
- `appointments.priority_label` is not present in inspected migrations.
- `cases.case_reference` is not present; existing schema uses `case_no`.
- `cases.service_type` is not present as named; existing schema has `case_type`, `product_type`, and read-model `service_type`.
- `cases.customer_display_name` is not present as a safe projected field.
- `cases.location_label` is not present as a safe projected field.
- `cases.service_summary` is not present as named in base cases.
- `cases.public_customer_notes` is not present as named in base cases.
- `appointments.checklist_preview` is not present in inspected migrations; read model has `checklist_summary`.

Compatibility conclusion:

- The current DB-adjacent query builder is safer as a future read-model/read-projection contract than as a direct base-table SQL shape.
- A direct base-table repository must be a future bounded task that rewrites the query text to join `appointments`, `dispatch_assignments`, `cases`, and any approved safe projection sources.
- A read-model-backed repository can align more directly with the Task1758 selected fields, but it still requires a future task to authorize DB-backed runtime usage.

## Required Scope Fields

Future read-only queries can remain scoped by the required fields if they use one of these approaches:

- read-model path: `engineer_mobile_task_read_models.organization_id`, `assigned_engineer_id`, and `appointment_id`
- base-table path: `cases.organization_id`, `dispatch_assignments.assigned_engineer_id`, and `appointments.id`

Required scope fields remain:

- `organizationId`
- `engineerUserId`
- `appointmentId`

Any future query must fail closed if one of those required scope values is missing or ambiguous.

## Forbidden Fields and Sensitive Data

The inventory confirms these forbidden fields remain excluded from the current safe selected fields, row mapper output, and visible projection contract:

- `finalAppointmentId`
- `final_appointment_id`
- raw phone/address unless explicitly approved later through an existing safe projection rule
- raw SQL/debug fields
- raw DB rows
- internal notes
- provider/debug/private fields
- token/cookie/password/secret/auth header

Raw customer fields in `customers` must not be selected directly into Engineer Mobile responses without a future approved masking/projection task.

## Mismatch Handling Policy

All schema mismatch findings in this task are document-only future task candidates.

Task1776 does not fix mismatches, does not edit migrations, does not create migrations, does not execute DB, and does not execute SQL.

Future task candidates:

- Decide whether assigned appointment DB-backed reads should use the inert `engineer_mobile_task_read_models` draft or direct base-table joins.
- If direct base-table joins are chosen, rewrite the query builder to use existing fields such as `cases.organization_id`, `dispatch_assignments.assigned_engineer_id`, `appointments.scheduled_start_at`, `appointments.scheduled_end_at`, `appointments.appointment_status`, and `cases.case_no`.
- Define approved safe projection sources for `customer_display_name`, `location_label`, `appointment_window`, `priority_label`, `public_customer_notes`, and `checklist_preview`.
- Add a future static guard that prevents DB-backed query text from referencing nonexistent base-table columns.
- Only after a separate PM-approved task, consider DB-backed repository execution against a disposable DB or approved read model source.

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
- No broad staging.
- No commit.
- No push.
- No cleanup of held historical docs.

## Preserved Core Boundaries

- One Case / one formal FSR boundary remains untouched.
- `field_service_reports.case_id` uniqueness remains untouched.
- `finalAppointmentId` remains system-owned and admin-override-only.
- A Case may still have multiple appointments / dispatch visits.
- This inventory does not create, mutate, submit, publish, or persist a Field Service Report.
- This inventory cannot create a second formal FSR.

## Verification

Executed after implementation:

```bash
/Users/global/.nvm/versions/node/v24.16.0/bin/node --test tests/engineerMobile/engineerMobileAssignedAppointmentExistingSchemaCompatibility.static.test.js
/Users/global/.nvm/versions/node/v24.16.0/bin/node /Users/global/.nvm/versions/node/v24.16.0/lib/node_modules/npm/bin/npm-cli.js run check
git diff --check -- tests/engineerMobile/engineerMobileAssignedAppointmentExistingSchemaCompatibility.static.test.js docs/task-1776-engineer-mobile-assigned-appointment-existing-schema-compatibility-inventory-no-db-no-migration.md
git diff --check --no-index /dev/null tests/engineerMobile/engineerMobileAssignedAppointmentExistingSchemaCompatibility.static.test.js
git diff --check --no-index /dev/null docs/task-1776-engineer-mobile-assigned-appointment-existing-schema-compatibility-inventory-no-db-no-migration.md
```

Results:

- Task1776 static compatibility test: PASS, 7 tests.
- `npm run check`: PASS.
- `git diff --check` on Task1776 files: PASS.
- No-index whitespace checks on the two new Task1776 files: PASS; no output, expected exit 1 because files differ from /dev/null.
- Real secret/connection/key pattern scan on the two new Task1776 files: PASS, no matches.

No DB-backed checks and no smoke were run or authorized by this task.

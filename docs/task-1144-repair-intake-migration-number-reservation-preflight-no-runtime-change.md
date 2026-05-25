# Task1144 - Repair Intake Migration Number Reservation Preflight / No Runtime Change

## Status

Completed locally. Not staged.

This preflight is read-only for migration inventory and proposal-only for a future migration filename.

It does not authorize migration creation, migration modification, DB execution, SQL, migration dry-run, migration apply, `psql`, `db:migrate`, repository implementation, repository writer, staging, or commit.

## Accepted Baseline

Task1142 disposable DB authorization gate is accepted.

Task1143 schema decision packet is accepted.

Proposed migration name from Task1143:

`create_repair_intake_persistence_tables`

Exact migration number remains open because the current migration inventory has a numbering gap and untracked migration files.

## Migration Inventory Inspection

Read-only command used:

`ls -1 migrations`

Current migration filenames observed:

- `001_create_base_tables.sql`
- `002_create_cases.sql`
- `003_create_case_activity_tables.sql`
- `004_update_attachment_foundation.sql`
- `005_update_message_foundation.sql`
- `006_create_dispatch_appointment_tables.sql`
- `007_dispatch_assignment_auditability.sql`
- `008_create_field_service_tables.sql`
- `009_create_billing_settlement_tables.sql`
- `010_create_notification_tables.sql`
- `011_create_ai_jobs.sql`
- `012_create_line_integration_tables.sql`
- `013_add_organization_scope.sql`
- `014_add_ai_job_scope.sql`
- `015_update_audit_log_entity_type_constraint.sql`
- `016_add_cases_closed_at.sql`
- `017_update_audit_log_entity_type_constraint_user_role.sql`
- `018_add_visit_result_fields_to_appointments.sql`
- `019_add_final_appointment_id_to_field_service_reports.sql`
- `020_create_survey_intents_and_event_outbox.sql`
- `021_create_data_correction_persistence_schema.sql`
- `022_create_engineer_mobile_read_model.sql`
- `024_create_brand_referral_contact_events.sql`
- `025_create_data_correction_decision_audit_events.sql`
- `README.md`

## Current Numbering Pattern

Observed migration SQL files use a three-digit numeric prefix followed by a snake_case description:

`NNN_description.sql`

Example:

`019_add_final_appointment_id_to_field_service_reports.sql`

## Highest Existing Migration Number

Highest observed local migration filename number:

`025`

## Ambiguity / Manual Confirmation

The inventory is ambiguous for reservation because:

- `023` is missing from the local filename sequence.
- `020`, `021`, `022`, `024`, and `025` are currently untracked in the local worktree.
- `migrations/README.md` is currently tracked dirty and must not be modified by this task.

Therefore the migration number is proposal-only and needs manual confirmation before any migration file is created.

## Next Candidate Migration Number

Candidate only if the local `025` file is accepted as part of the active migration sequence:

`026`

If `023` is intentionally reserved elsewhere, the project should confirm that before creating `026`.

If the untracked migration files are not accepted into the branch, the candidate number must be recalculated from the accepted migration inventory.

## Candidate Future Migration Filename

Proposal-only filename:

`026_create_repair_intake_persistence_tables.sql`

Do not create this file in Task1144.

Do not include DDL or SQL body in Task1144.

## Safety Notes

- `migrations/README.md` is currently tracked dirty and must not be modified by Task1144.
- No DB command is authorized.
- No migration dry-run or apply is authorized.
- No production, staging, or shared DB may be used.
- No full `DATABASE_URL`, token, secret, or credential value may be printed.

## Future Bounded Task

A future migration file proposal task may create exactly the confirmed candidate migration file only after explicit PM assignment.

A future DB dry-run requires disposable local/test DB authorization and credential redaction rules.

Future repository implementation still requires a separate bounded task.

## Local Git Warning

Task1144 doc remains untracked and unstaged.

`git diff --cached --name-only` must remain empty.

Existing unrelated dirty and untracked migration stack remains untouched.

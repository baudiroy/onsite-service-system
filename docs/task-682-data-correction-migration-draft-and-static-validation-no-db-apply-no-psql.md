# Task 682 — Data Correction Migration Draft and Static Validation / No DB Apply / No PSQL

## Scope

Task682 adds a migration draft for Data Correction persistence tables and a static validation test.

This task creates a migration file as an authoring artifact only. It does not apply the migration, does not dry-run it, does not connect to a database, does not execute SQL, and does not run `psql`.

## Migration Draft Summary

The draft creates eight inert Data Correction tables:

- `data_correction_audit_events`
- `data_correction_contact_logs`
- `data_correction_dispatch_notes`
- `data_correction_engineer_notification_intents`
- `data_correction_appointment_results`
- `data_correction_evidence_refs`
- `data_correction_follow_up_drafts`
- `data_correction_application_records`

Each table includes:

- `id`
- `organization_id`
- `case_id`
- `appointment_id`
- `actor_user_id`
- `actor_role`
- `action_type`
- `decision`
- `reason_code`
- `safe_message_key`
- `safe_metadata`
- `created_at`

The draft uses scalar ids and organization-scoped indexes only. It does not add foreign keys to existing core tables in this task.

## Index Summary

Each table includes organization-scoped indexes for:

- `organization_id, case_id, created_at`
- `organization_id, appointment_id`
- `organization_id, action_type, created_at`
- `organization_id, created_at`

## Protection Summary

The migration draft does not add columns for raw sensitive values:

- no raw phone/full phone columns
- no full address columns
- no raw LINE id columns
- no token/secret/password/DB URL columns
- no raw before/after value columns
- no AI raw payload columns
- no request/response dump columns
- no `final_appointment_id`
- no `field_service_report_id`

The migration draft does not alter existing core tables:

- `field_service_reports`
- `appointments`
- `cases`
- `customers`
- `customer_channel_identities`

## Static Validation

The static test validates:

- migration draft exists
- all eight Data Correction tables are created
- every table includes required common fields
- every table includes `organization_id`
- every table includes `safe_metadata`
- organization-scoped indexes are present
- forbidden raw/sensitive columns are absent
- core tables are not altered
- destructive DDL is absent
- seed `INSERT` statements are absent
- real-looking credential and DB URL examples are absent
- authoring-only / no raw storage comments are present

## Boundaries

- No runtime source.
- No API change.
- No DB connection.
- No SQL execution.
- No migration apply.
- No migration dry-run.
- No `psql`.
- No permission runtime change.
- No real audit runtime.
- No smoke test.
- No provider sending.
- No sensitive data.

## Follow-up

A future task may authorize disposable DB dry-run, rollback review, or real migration apply. Shared DB and production DB remain forbidden unless separately and explicitly approved.

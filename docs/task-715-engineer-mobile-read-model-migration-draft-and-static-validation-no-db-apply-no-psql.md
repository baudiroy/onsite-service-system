# Task 715 - Engineer Mobile Read Model Migration Draft and Static Validation / No DB Apply / No psql

## Summary

Task 715 added an Engineer Mobile read model migration draft and static validation.

Added:

- `migrations/022_create_engineer_mobile_read_model.sql`
- `tests/engineerMobile/engineerMobileReadModelMigrationDraft.static.test.js`

## Migration Draft

The migration draft creates the inert read-side table:

- `engineer_mobile_task_read_models`

The draft follows the Task 714 schema proposal and includes:

- `id`
- `organization_id`
- `case_id`
- `appointment_id`
- `assigned_engineer_id`
- `scheduled_start`
- `scheduled_end`
- `status`
- `customer_name_masked`
- `customer_phone_masked`
- `address_summary`
- `product_summary`
- `issue_summary`
- `service_summary`
- `service_type`
- `site_note_safe`
- `checklist_summary`
- `evidence_refs`
- `created_at`
- `updated_at`

`checklist_summary` and `evidence_refs` are JSONB metadata arrays.

## Index Draft

The migration draft includes organization-scoped indexes for:

- `organization_id`, `assigned_engineer_id`, `scheduled_start`
- `organization_id`, `assigned_engineer_id`, `appointment_id`
- `organization_id`, `case_id`
- `organization_id`, `appointment_id`

## Safety Boundary

The migration draft is authoring-only and not applied.

It does not:

- connect to a DB
- execute SQL
- run psql
- run a migration dry-run
- apply to shared runtime, production, or staging
- add seed data
- modify existing core tables
- alter Case / Appointment / Field Service Report / Customer / customer channel identity tables

The draft intentionally avoids raw/sensitive/internal/final appointment columns, including:

- raw phone / raw address / raw LINE id
- token / secret / password / database URL
- internal note / audit log / AI raw payload
- billing / settlement internal data
- final appointment id
- field service report id
- full customer payload

## Static Guard

The static guard verifies:

- migration file exists
- authoring-only / not-applied safety comments exist
- read model table exists
- all required fields are present
- key scope ids are present
- JSONB metadata fields are present
- organization-scoped indexes are present
- forbidden columns are absent
- existing core tables are not altered
- no destructive DDL statements are present
- no seed data is present
- no real-looking credential or DB URL examples are present
- safety comments mention no shared/prod/staging DB and future explicit disposable DB authorization

## Future Tasks

- Request a disposable local DB dry-run approval packet before any DB execution.
- Add executable read model query specs only in a separate DB task.
- Add DB-backed read repository only after runtime/DB approval.
- Wire DB-backed executor into Engineer Mobile only after the read model is approved and applied in the correct environment.

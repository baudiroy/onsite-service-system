# Task2025 Migration Inventory and Applied-State Readiness / No DB

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 22 - Migration and Seed Authorization Planning
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2025-migration-inventory-and-applied-state-readiness-no-db.md`
- Current synced baseline before this task: `36657cd392372f18e1b51d8e44fbf226717eabf2`
- This task inspected local repository files only.
- No database was queried.
- No `DATABASE_URL` value, credential, token, password, private key, provider key, or Zeabur secret was inspected or printed.

## Inspection Sources

- `migrations/`
- `migrations/README.md`
- `package.json` script names and command labels only
- `docs/task-1838-engineer-mobile-visit-action-migration-023-draft-no-db-execution.md`
- `docs/task-1840-engineer-mobile-migration-023-disposable-db-dry-run-authorization-packet-no-db-execution.md`
- `docs/task-1867-migration-023-apply-authorization-packet-no-execution.md`
- `docs/task-1868-zeabur-db-migration-target-readiness-inspection-no-execution.md`
- `docs/task-1870-engineer-mobile-db-backed-runtime-smoke-readiness-no-smoke.md`
- `docs/task-1908-depot-workshop-repair-readiness-inspection.md`
- `docs/task-2007a-pre-2000-skipped-gate-inventory-no-execution.md`
- `docs/task-2011-db-migration-seed-target-approval-matrix-no-execution.md`

## Package Migration Scripts

| Script | Command label | Task2025 action |
| --- | --- | --- |
| `db:migrate` | `node src/db/migrate.js` | inspected by name only; not run |
| `db:seed` | `node src/db/seed.js` | inspected by name only; not run |

`npm start`, runtime server startup, migration commands, seed commands, DB-backed smoke, and endpoint probes were not run.

## Local Migration File Order

The current local `migrations/` directory contains these SQL files in lexicographic execution order:

| Order | File | Local inventory status |
| --- | --- | --- |
| 001 | `001_create_base_tables.sql` | present |
| 002 | `002_create_cases.sql` | present |
| 003 | `003_create_case_activity_tables.sql` | present |
| 004 | `004_update_attachment_foundation.sql` | present |
| 005 | `005_update_message_foundation.sql` | present |
| 006 | `006_create_dispatch_appointment_tables.sql` | present |
| 007 | `007_dispatch_assignment_auditability.sql` | present |
| 008 | `008_create_field_service_tables.sql` | present |
| 009 | `009_create_billing_settlement_tables.sql` | present |
| 010 | `010_create_notification_tables.sql` | present |
| 011 | `011_create_ai_jobs.sql` | present |
| 012 | `012_create_line_integration_tables.sql` | present |
| 013 | `013_add_organization_scope.sql` | present |
| 014 | `014_add_ai_job_scope.sql` | present |
| 015 | `015_update_audit_log_entity_type_constraint.sql` | present |
| 016 | `016_add_cases_closed_at.sql` | present |
| 017 | `017_update_audit_log_entity_type_constraint_user_role.sql` | present |
| 018 | `018_add_visit_result_fields_to_appointments.sql` | present |
| 019 | `019_add_final_appointment_id_to_field_service_reports.sql` | present |
| 020 | `020_create_survey_intents_and_event_outbox.sql` | present |
| 021 | `021_create_data_correction_persistence_schema.sql` | present |
| 022 | `022_create_engineer_mobile_read_model.sql` | present |
| 023 | `023_engineer_mobile_visit_action_persistence_fields.sql` | present |
| 024 | `024_create_brand_referral_contact_events.sql` | present |
| 025 | `025_create_data_correction_decision_audit_events.sql` | present |
| 026 | `026_create_repair_intake_persistence_tables.sql` | present |

## README Drift Noted

`migrations/README.md` says migration files run in lexicographic filename order and warns that applied migrations must not be edited in shared environments. It also says shared environments must apply new migrations incrementally.

The README order section appears stale relative to the current local file list:

- it still describes prefix `023` as absent and pending project-history confirmation,
- it lists through `025`,
- the current local directory now contains `023_engineer_mobile_visit_action_persistence_fields.sql`,
- the current local directory also contains `026_create_repair_intake_persistence_tables.sql`.

Task2025 does not modify the README. The safe conclusion is that the local directory file list is the current inventory, while README applied-state warnings remain valid.

## Known Paused / Gated Migrations

| Migration | Evidence | Current gate |
| --- | --- | --- |
| 020 | README marks it as SQL artifact only and not approved for apply/runtime writes | paused until explicit dry-run/apply approval |
| 021 | README marks it as SQL artifact only and not approved for apply/runtime writes | paused until explicit dry-run/apply approval |
| 022 | README marks it as SQL artifact only and not approved for apply/runtime read/write usage | paused until explicit dry-run/apply approval |
| 023 | Task1838 authored the draft; Task1840 created a future disposable dry-run packet; Task1867 created apply authorization; Task1868 says no Zeabur/shared/prod apply happened in that batch | Task1869 apply remains gated by explicit target approval |
| 024 | README marks it as SQL artifact only and not approved for apply/runtime writes/provider work | paused until explicit dry-run/apply approval |
| 025 | README marks it as SQL artifact only and not approved for apply/runtime writes/audit persistence | paused until explicit dry-run/apply approval |
| 026 | Task1908 identifies it as inert repair intake persistence schema and says it requires separate explicit dry-run/apply approval before DB use | paused until explicit dry-run/apply approval |

## Known Dry-Run Evidence

- PM runtime packet baseline and later docs record Task1864 migration 023 disposable local/test Docker PostgreSQL dry-run as PASS.
- Task1867 and Task1868 both state that the Task1864 dry-run evidence was not re-run in those tasks.
- Task2025 did not re-run or verify Task1864 dry-run evidence.
- Task2025 found no approved apply evidence for migration 023 to Zeabur/shared/staging/production.

## Applied-State Readiness

Applied state remains unknown for every concrete DB environment until an explicitly approved DB target is named and checked.

Task2025 did not:

- query `schema_migrations`,
- connect to any DB,
- inspect any `DATABASE_URL` value,
- inspect Zeabur env values,
- run `psql`,
- run `npm run db:migrate`,
- run migration dry-run,
- apply migration,
- run seed.

Therefore the only safe applied-state statement is:

- local repository migration files are inventoried,
- DB applied state is unknown unless confirmed by a separately approved target-specific task,
- Task1869 migration 023 apply remains gated by exact target approval.

## Recommendation

Proceed to Task2026 as a no-execution disposable DB dry-run plan. Do not run the dry-run, do not connect to DB, do not apply migration, and do not seed from Task2025.

## Non-Actions Confirmed

- No runtime source, package, lockfile, or admin frontend files were modified.
- No DB connection, SQL, `psql`, migration dry-run, migration apply, or seed was run.
- No smoke, endpoint probe, or `/healthz` call was run.
- No Zeabur env value was inspected or changed.
- No deploy, redeploy, restart, or rollback was performed.
- No provider, billing, or AI execution was performed.
- No secrets were printed.
- No `finalAppointmentId`, Completion Report / FSR, or customer-visible publication behavior was touched.
- The 7 held historical untracked docs were not touched.

# Migration Folder Convention

Migration files are plain PostgreSQL `.sql` files.

Rules:
- File names must begin with a zero-padded numeric prefix.
- Files run in lexicographic filename order.
- Each file is executed once and tracked in `schema_migrations`.
- Each file is wrapped in its own transaction by `src/db/migrate.js`.
- Do not edit a migration after it has been applied to a shared environment. Add a new migration instead.

Current repository migration file order:

```text
001_create_base_tables.sql
002_create_cases.sql
003_create_case_activity_tables.sql
004_update_attachment_foundation.sql
005_update_message_foundation.sql
006_create_dispatch_appointment_tables.sql
007_dispatch_assignment_auditability.sql
008_create_field_service_tables.sql
009_create_billing_settlement_tables.sql
010_create_notification_tables.sql
011_create_ai_jobs.sql
012_create_line_integration_tables.sql
013_add_organization_scope.sql
014_add_ai_job_scope.sql
015_update_audit_log_entity_type_constraint.sql
016_add_cases_closed_at.sql
017_update_audit_log_entity_type_constraint_user_role.sql
018_add_visit_result_fields_to_appointments.sql
019_add_final_appointment_id_to_field_service_reports.sql
020_create_survey_intents_and_event_outbox.sql
021_create_data_correction_persistence_schema.sql
022_create_engineer_mobile_read_model.sql
023_absent_pending_project_history_confirmation
024_create_brand_referral_contact_events.sql
025_create_data_correction_decision_audit_events.sql
```

Applied-state note:
- This file order documents migration files present in the repository. It is not proof that a database has applied every listed file.
- Current project handoff treats migration files `001` through `019` as the completed schema baseline unless a specific environment proves otherwise.
- Migration `020_create_survey_intents_and_event_outbox.sql` exists as a SQL file artifact only. It has not been locally dry-run, has not been applied, and must remain paused until a separate explicit local-only dry-run or apply approval is provided.
- Migration `021_create_data_correction_persistence_schema.sql` exists as a SQL file artifact only. It has not been locally dry-run, has not been applied, and must remain paused until a separate explicit local-only dry-run or apply approval is provided.
- Migration `022_create_engineer_mobile_read_model.sql` exists as a SQL file artifact only. It has not been locally dry-run, has not been applied, and must remain paused until a separate explicit local-only dry-run or apply approval is provided.
- Prefix `023` is absent in this local repository state. Do not fill, reuse, or describe it as intentionally skipped without project-history confirmation.
- Migration `024_create_brand_referral_contact_events.sql` exists as a SQL file artifact only. It has not been locally dry-run, has not been applied, and must remain paused until a separate explicit local-only dry-run or apply approval is provided.
- Migration `025_create_data_correction_decision_audit_events.sql` exists as a SQL file artifact only. It has not been locally dry-run, has not been applied, and must remain paused until a separate explicit local-only dry-run or apply approval is provided.
- Do not run `npm run db:migrate`, connect to DB, execute DDL, or apply Migration 020/021/022/024/025 against shared Zeabur / production from this README alone.
- General instructions such as "continue", "go ahead", or "do the next task" do not authorize DB connection, DDL, local dry-run, shared apply, runtime writes, survey sending, engineer mobile read model runtime, brand referral provider work, or data correction persistence writes.

Order rationale:
- `001_create_base_tables.sql` creates foundational admin/customer tables that `cases` references.
- `002_create_cases.sql` creates the case master table after `customers`, `dispatch_units`, and `users` exist.
- `003_create_case_activity_tables.sql` creates case activity tables after `cases` exists.
- `004` and `005` harden attachment/message foundations that depend on case activity tables.
- `006` and `007` create dispatch/appointment tables and dispatch auditability columns after `cases`, `dispatch_units`, and `users` exist.
- `008` creates field service reports and service parts after cases/dispatch foundations exist.
- `009` creates billing and settlement tables after cases and field service reports exist.
- `010` creates notification preferences/templates/logs without provider implementation.
- `011` creates AI job tracking.
- `012` creates organizations, LINE channels, customer LINE identities, and LINE events.
- `013` adds organization scope to customers, cases, dispatch units, and user organization membership after organizations exist.
- `014` adds organization/case/customer/channel scope to AI jobs after organizations and LINE channels exist.
- `015` updates the `audit_logs.entity_type` allowlist for Organization Admin, LINE, AI, Notification, Billing/Settlement, and Field Service audit events without changing audit log columns or data.
- `016` adds `cases.closed_at` for the explicit case close workflow.
- `017` extends the `audit_logs.entity_type` allowlist with `user_role` for User Admin role assignment audit events.
- `018` adds multi-visit result fields to `appointments`, including visit sequence, visit result, incomplete reason, next action, and actual arrival / finished timestamps.
- `019` adds `field_service_reports.final_appointment_id` so the Case-level formal report can reference the resolved final completed appointment.
- `020` authors future survey intent / event outbox tables for post-completion survey planning. It is inert schema only and is not approved for apply, runtime writes, workers, delivery, LINE / APP / SMS / email sending, survey response intake, AI runtime, Admin UI, or historical backfill.
- `021` authors future Data Correction persistence tables for audit events, contact logs, dispatch notes, engineer notification intents, appointment results, evidence refs, follow-up drafts, and application records. It is inert schema only and is not approved for apply, runtime writes, provider sending, Admin UI, AI runtime, or historical backfill.
- `022` authors a future Engineer Mobile read model table with organization-scoped task data and masked customer fields. It is inert schema only and is not approved for apply, runtime reads/writes, mobile UI, provider sending, AI runtime, or historical backfill.
- `023` is absent in this local repository state and remains pending project-history confirmation.
- `024` authors future brand referral contact event metadata for organization-scoped brand referral/contact traces. It is inert schema only and is not approved for apply, runtime writes, provider sending, LINE integration changes, Admin UI, AI runtime, or historical backfill.
- `025` authors future Data Correction decision audit event metadata. It is inert schema only and is not approved for apply, runtime writes, audit persistence wiring, provider sending, Admin UI, AI runtime, or historical backfill.

Known limitations:
- Existing shared environments that already ran earlier migrations must apply new migrations incrementally; do not edit applied files.
- `organization_id` is nullable during the transition period for legacy/dev data, but production create flows should provide organization context.
- Notification tables do not yet include direct `organization_id`; future provider work must add organization/channel routing before LINE/SMS/email sending.
- `audit_logs.action` is intentionally constrained only as non-blank; action names remain application-defined while `audit_logs.entity_type` stays bounded by an allowlist.
- Migration 020 cross-table same-organization / same-case consistency still requires future runtime guards or a separately approved DB constraint strategy before runtime writes.
- Survey runtime implementation still requires explicit approval, feature flags, no-send tests, and resolved Migration 020 apply status. Migration 020 file presence alone does not enable survey runtime.
- Migration 021/025 Data Correction persistence and decision audit runtime wiring still require separate bounded approval for repository/writer integration, permissions, audit visibility, retention, and DB apply status.
- Migration 022 Engineer Mobile read model usage still requires separate bounded approval for population strategy, read access permissions, masking validation, and DB apply status.
- Migration 024 Brand Referral contact event usage still requires separate bounded approval for contact/audit runtime integration, provider/channel boundaries, retention policy, and DB apply status.
- The absent `023` prefix should remain unchanged until project history confirms whether it is skipped, reserved, missing, or belongs to another branch.

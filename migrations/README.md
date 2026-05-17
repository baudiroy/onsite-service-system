# Migration Folder Convention

Migration files are plain PostgreSQL `.sql` files.

Rules:
- File names must begin with a zero-padded numeric prefix.
- Files run in lexicographic filename order.
- Each file is executed once and tracked in `schema_migrations`.
- Each file is wrapped in its own transaction by `src/db/migrate.js`.
- Do not edit a migration after it has been applied to a shared environment. Add a new migration instead.

Current fresh database order:

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
```

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

Known limitations:
- Existing shared environments that already ran earlier migrations must apply new migrations incrementally; do not edit applied files.
- `organization_id` is nullable during the transition period for legacy/dev data, but production create flows should provide organization context.
- Notification tables do not yet include direct `organization_id`; future provider work must add organization/channel routing before LINE/SMS/email sending.
- `audit_logs.action` is intentionally constrained only as non-blank; action names remain application-defined while `audit_logs.entity_type` stays bounded by an allowlist.

# Task 877 - Data Correction Decision Audit Events Migration File

Status: completed

## Goal

Create the approved SQL migration file for future `data_correction_decision_audit_events` persistence.

Task877 creates a migration file only. It does not connect to a database, execute DDL, run `psql`, dry-run, apply, implement repository/writer code, expose API behavior, or change runtime persistence.

## Created Migration File

Approved file:

- `migrations/025_create_data_correction_decision_audit_events.sql`

The file creates only:

- `data_correction_decision_audit_events`

## No Apply / No DB Boundary

Task877 keeps the migration inert:

- no DB connection
- no DDL execution
- no `psql`
- no dry-run
- no apply
- no `npm run db:migrate`
- no repository
- no audit writer / sink
- no transaction implementation
- no route/controller/API change
- no public response body change
- no permission runtime change
- no provider / LINE / SMS / App push / webhook change
- no AI / RAG runtime change
- no billing / settlement behavior
- no smoke/integration test

Future dry-run or apply requires a separate explicitly approved disposable local/test DB task. Shared, production, staging, or Zeabur apply remains forbidden without a separate explicit apply task.

## Safe Columns

The migration uses only the Task873 through Task876 approved safe columns:

- `id`
- `organization_id`
- `case_id`
- `appointment_id`
- `actor_id`
- `actor_role`
- `action`
- `field_key`
- `field_group`
- `event_type`
- `decision`
- `reason_code`
- `safe_message_key`
- `result_status`
- `request_id`
- `created_at`
- `retention_until`
- `deleted_at`

The table is intended to persist safe Data Correction decision audit event metadata only after a future runtime task explicitly implements a writer.

## Organization-scoped Indexes

The migration includes only organization-scoped indexes:

- `organization_id`, `created_at`
- `organization_id`, `case_id`, `created_at`
- `organization_id`, `actor_id`, `created_at`
- `organization_id`, `event_type`, `created_at`
- `organization_id`, `request_id`
- `organization_id`, `retention_until`
- `organization_id`, `deleted_at`

Cross-organization lookup indexes remain forbidden.

## Forbidden Stored Values

The migration does not add columns for:

- before / after values
- raw correction payload
- raw phone / mobile
- raw address
- raw LINE user id
- token
- secret
- credentials
- DB URL
- stack traces
- SQL input
- `finalAppointmentId`
- Field Service Report id / report id
- internal note
- audit raw payload
- AI raw payload
- billing / settlement internals
- full payload
- cross-organization data
- provider payload
- customer-visible report body
- photos
- signatures
- files
- file contents

## Rollback Documentation

The migration file includes documentation-only rollback guidance. It does not include executable rollback SQL.

Future rollback must:

- be a separately approved bounded rollback task.
- drop only objects created by the approved migration.
- avoid unrelated tables, indexes, constraints, functions, triggers, and data.
- avoid destructive cleanup of shared runtime data.
- stop if dependency or ownership risk is found.

Rollback guidance does not authorize rollback execution.

## Compatibility Updates

Task877 updates Task875/Task876 static guard tests only to allow the explicitly approved migration file:

- `025_create_data_correction_decision_audit_events.sql`

Those tests still reject any other matching `data_correction_decision_audit` migration file or unauthorized table reference.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditEventsMigration.static.test.js # PASS, 10 passed / 0 failed
test -f migrations/025_create_data_correction_decision_audit_events.sql # PASS
node --test tests/dataCorrection/dataCorrectionDecisionAuditMigrationAuthorization.static.test.js tests/dataCorrection/dataCorrectionDecisionAuditMigrationDraftPlan.static.test.js tests/dataCorrection/dataCorrectionDecisionAuditMigrationFileCreationPreflight.static.test.js # PASS, 31 passed / 0 failed
node --test tests/dataCorrection/*.js # PASS, 736 passed / 0 failed
npm run check # PASS
git diff --check -- migrations/025_create_data_correction_decision_audit_events.sql tests/dataCorrection/dataCorrectionDecisionAuditEventsMigration.static.test.js docs/task-877-data-correction-decision-audit-events-migration-file-no-apply-no-db.md tests/dataCorrection/dataCorrectionDecisionAuditMigrationAuthorization.static.test.js tests/dataCorrection/dataCorrectionDecisionAuditMigrationDraftPlan.static.test.js tests/dataCorrection/dataCorrectionDecisionAuditMigrationFileCreationPreflight.static.test.js # PASS
```

## Scope Confirmation

Task877 is migration-file authoring + static test + task note only:

- no `src/**` change
- no `admin/src/**` change
- no DB / psql / DDL / dry-run / apply
- no repository
- no audit writer / sink
- no API / route / controller / DTO change
- no permission runtime change
- no provider / LINE / SMS / App push / webhook change
- no AI / RAG runtime change
- no billing / settlement change
- no package change
- no smoke / integration test change
- no sensitive data, token, secret, LINE access token, channel secret, DB credential, or AI provider config touched

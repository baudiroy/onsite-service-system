# Task 875 - Data Correction Decision Audit Migration Draft Plan

Status: completed

## Goal

Create a non-executable migration draft plan for future `data_correction_decision_audit_events` persistence.

This task does not create or modify any migration file. It does not run DDL, `psql`, DB connection, dry-run, apply, repository, writer, transaction, smoke test, or runtime behavior.

## No Migration / No DB Boundary

Task875 is a draft plan only:

- no migration file is created.
- no migration file is modified.
- no DDL is executed.
- no `psql` is executed.
- no DB connection is opened.
- no dry-run is performed.
- no migration apply is performed.
- no repository is implemented.
- no audit writer / sink is implemented.
- no transaction behavior is implemented.
- no API / route / controller / DTO behavior is changed.
- no public response body is changed.
- no permission runtime is changed.
- no smoke/integration test is added.

Future migration-file creation requires separate explicit approval.

## Future Table Draft

Future table concept:

- `data_correction_decision_audit_events`

Future safe columns:

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

The table is intended for safe Data Correction `auditIntent` evidence metadata only.

## Future Index Draft

Future index direction:

- `organization_id`, `created_at`
- `organization_id`, `case_id`, `created_at`
- `organization_id`, `actor_id`, `created_at`
- `organization_id`, `event_type`, `created_at`
- `organization_id`, `request_id`
- `organization_id`, `retention_until`
- `organization_id`, `deleted_at`

All indexes should preserve organization scope and tenant isolation. Cross-organization lookup indexes are not allowed.

## Non-executable Pseudo-SQL

The following is a planning sketch only.

DO NOT RUN.

```sql
-- DO NOT RUN. Draft only. This is not a migration.
-- CREATE TABLE data_correction_decision_audit_events (
--   id uuid PRIMARY KEY,
--   organization_id uuid NOT NULL,
--   case_id uuid NULL,
--   appointment_id uuid NULL,
--   actor_id uuid NULL,
--   actor_role text NULL,
--   action text NOT NULL,
--   field_key text NULL,
--   field_group text NULL,
--   event_type text NOT NULL,
--   decision text NOT NULL,
--   reason_code text NULL,
--   safe_message_key text NULL,
--   result_status text NOT NULL,
--   request_id text NULL,
--   created_at timestamptz NOT NULL DEFAULT now(),
--   retention_until timestamptz NULL,
--   deleted_at timestamptz NULL
-- );
--
-- CREATE INDEX ... ON data_correction_decision_audit_events (organization_id, created_at);
-- CREATE INDEX ... ON data_correction_decision_audit_events (organization_id, case_id, created_at);
-- CREATE INDEX ... ON data_correction_decision_audit_events (organization_id, actor_id, created_at);
-- CREATE INDEX ... ON data_correction_decision_audit_events (organization_id, event_type, created_at);
-- CREATE INDEX ... ON data_correction_decision_audit_events (organization_id, request_id);
-- CREATE INDEX ... ON data_correction_decision_audit_events (organization_id, retention_until);
-- CREATE INDEX ... ON data_correction_decision_audit_events (organization_id, deleted_at);
```

This pseudo-SQL is intentionally commented and non-executable. A future migration task must rewrite it as an approved migration file only after separate explicit approval.

## Rollback Outline

Future rollback planning should:

- drop only approved-created indexes.
- drop only the approved-created table.
- avoid unrelated tables, indexes, constraints, functions, triggers, and data.
- avoid shared-data assumptions.
- avoid destructive cleanup.
- require separate approval for shared, production, staging, or Zeabur rollback.
- stop if an expected object was not created by the approved migration.
- stop if unexpected data or dependency risk is found.

Rollback outline does not authorize rollback execution.

## Forbidden Columns / Stored Values

Future migration must not include columns intended to store:

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

## Future Runtime Boundary

This draft plan does not authorize:

- migration creation
- migration apply
- repository implementation
- audit writer / sink implementation
- transaction wiring
- service writer injection
- route/controller/app exposure
- public API response body change
- smoke/integration test against DB
- Case / Appointment / Field Service Report mutation
- `finalAppointmentId` inference or update
- customer identity mutation
- phone / LINE / App binding change
- provider sending
- AI/RAG execution
- billing / settlement behavior

Each of those requires a separate bounded task and explicit approval.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditMigrationDraftPlan.static.test.js # PASS, 11 passed / 0 failed
test -f docs/task-875-data-correction-decision-audit-migration-draft-plan-no-migration-no-db.md # PASS
git diff --check -- docs/task-875-data-correction-decision-audit-migration-draft-plan-no-migration-no-db.md tests/dataCorrection/dataCorrectionDecisionAuditMigrationDraftPlan.static.test.js # PASS
```

## Scope Confirmation

Task875 is docs + static test only:

- no `src/**` change
- no `admin/src/**` change
- no migration file created or modified
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

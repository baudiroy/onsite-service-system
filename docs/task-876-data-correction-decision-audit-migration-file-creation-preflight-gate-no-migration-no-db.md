# Task 876 - Data Correction Decision Audit Migration File Creation Preflight Gate

Status: completed

## Goal

Define the final preflight gate before any future migration file may be created for `data_correction_decision_audit_events`.

Task876 does not create or modify migration files, run DB commands, implement repository/writer code, or change runtime behavior.

## No Migration / No DB Boundary

Task876 creates no migration file and performs no runtime work:

- no migration file creation
- no migration file modification
- no DDL
- no `psql`
- no DB connection
- no DB dry-run
- no migration apply
- no `npm run db:migrate`
- no repository implementation
- no audit writer / sink implementation
- no transaction implementation
- no route/controller/API change
- no public response body change
- no permission runtime change
- no provider / LINE / SMS / App push / webhook change
- no AI / RAG runtime change
- no billing / settlement behavior
- no smoke/integration test

## Future Migration File Task Requirements

Before Codex may create a future SQL migration file, the future task must explicitly state:

1. Migration filename / number
   - The exact migration filename must be provided.
   - The task must confirm no filename collision.

2. Table name
   - The task must name `data_correction_decision_audit_events`.

3. SQL file creation permission
   - The task must explicitly allow creating the SQL file.
   - SQL file creation does not authorize running SQL.

4. No-apply boundary
   - The task must state no DDL, no DB connection, no dry-run, and no apply.
   - If dry-run is requested, it must be a separate explicitly approved disposable local/test DB task.

5. Runtime disabled boundary
   - No repository.
   - No audit writer / sink.
   - No route/controller/app exposure.
   - No public API response body change.
   - No provider sending.
   - No AI/RAG execution.

## Safe Columns Restated

Future migration-file work may only use the safe column direction from Task873 through Task875:

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

Any additional column requires a new explicit review and must not store raw or sensitive values.

## Unsafe Columns / Stored Values Forbidden

Future migration-file work must not add columns for:

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

## Future Migration Acceptance Checklist

A future migration-file task must include all of the following:

- `CREATE TABLE data_correction_decision_audit_events`
- required `organization_id` tenant scope
- safe column list only
- safe organization-scoped indexes
- `retention_until`
- `deleted_at`
- no raw sensitive columns
- rollback section
- rollback limited to approved-created objects only
- no credential printing
- no `DATABASE_URL` printing
- no shared DB target
- no production DB target
- no staging DB target
- no Zeabur DB target
- explicit no-apply wording
- explicit no-dry-run wording unless separately approved
- explicit runtime-disabled wording

## Evidence Chain

Task876 depends on the prior evidence chain:

- Task873: schema proposal / no migration / no DB
- Task874: migration authorization packet / no migration / no DB
- Task875: migration draft plan / no migration / no DB

This preflight gate does not replace those documents; it is the final stop before any future migration-file creation task.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditMigrationFileCreationPreflight.static.test.js # PASS, 10 passed / 0 failed
test -f docs/task-876-data-correction-decision-audit-migration-file-creation-preflight-gate-no-migration-no-db.md # PASS
git diff --check -- docs/task-876-data-correction-decision-audit-migration-file-creation-preflight-gate-no-migration-no-db.md tests/dataCorrection/dataCorrectionDecisionAuditMigrationFileCreationPreflight.static.test.js # PASS
```

## Scope Confirmation

Task876 is docs + static test only:

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

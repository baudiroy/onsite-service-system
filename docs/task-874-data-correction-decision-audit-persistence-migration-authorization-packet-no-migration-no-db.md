# Task 874 - Data Correction Decision Audit Persistence Migration Authorization Packet

Status: completed

## Goal

Define the authorization packet required before any future migration for `data_correction_decision_audit_events`.

This task creates no migration file, runs no DDL, connects to no DB, performs no dry-run/apply, implements no repository/writer, and changes no runtime behavior.

## No Migration / No DB Boundary

Task874 does not:

- create or modify files under `migrations/`
- create a migration file
- run DDL
- run `psql`
- connect to DB
- run DB dry-run
- apply migration
- run `npm run db:migrate`
- implement repository code
- implement audit writer / sink code
- implement transaction code
- change route/controller/API response shape
- change app/server wiring
- change permission runtime
- change correction application behavior
- add smoke/integration test

Future DDL requires a separate explicit bounded task and approval.

## Task873 Reference

Task873 proposed the future concept/table name:

- `data_correction_decision_audit_events`

Task873 proposed safe columns only:

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

Task874 does not approve these columns for implementation. It records the minimum authorization requirements before a future migration can even be authored.

## Future Migration Creation Approval Requirements

Before a migration file may be created, the future task must explicitly provide:

1. Migration filename / number
   - Confirm the next migration filename and ordering.
   - Confirm no collision with existing migrations.

2. Final columns and types
   - Confirm every column name.
   - Confirm SQL types.
   - Confirm nullable / not-null policy.
   - Confirm default values.

3. Organization scope and indexes
   - Confirm `organization_id` is required.
   - Confirm tenant isolation.
   - Confirm organization-scoped indexes.
   - Confirm no cross-organization lookup.

4. Retention and deletion fields
   - Confirm `retention_until`.
   - Confirm `deleted_at`.
   - Confirm retention/deletion lookup strategy.

5. Redaction policy
   - Confirm stored data is safe metadata only.
   - Confirm forbidden raw values are not stored.
   - Confirm future viewer/export masking expectations.

6. DDL review
   - Review CREATE TABLE, constraints, indexes, comments, and rollback notes.
   - Confirm no seed data.
   - Confirm no runtime behavior is bundled into migration.

7. Rollback plan
   - Define rollback for approved-created objects only.
   - Avoid unrelated objects.
   - Avoid shared-data assumptions.

8. Disposable local/test DB dry-run approval
   - Future dry-run must target disposable local/test DB only.
   - No shared, production, staging, or Zeabur target.
   - No DB URL, credential, password, token, or secret may be printed.

9. Runtime disabled confirmation
   - Runtime audit writer disabled.
   - Provider sending disabled.
   - AI/RAG disabled.
   - API route/controller behavior unchanged.

## Dry-run Guard

Any future dry-run must satisfy all of the following:

- explicit user approval naming disposable local/test DB target
- no shared DB
- no production DB
- no staging DB
- no Zeabur DB
- no provider sending
- no AI/RAG call
- no audit writer runtime
- no `DATABASE_URL` printing
- no credential printing
- no customer data printing
- dry-run result summarized safely
- stop immediately on unexpected target, unsafe SQL, destructive statement, or credential exposure risk

Generic wording such as "continue", "go ahead", "approved", or "I agree" must not be treated as dry-run or apply approval unless the target and DDL permission are explicit.

## Rollback Requirements

Any future migration proposal must include rollback guidance that:

- drops only objects created by the approved migration
- avoids unrelated tables, indexes, constraints, functions, triggers, and data
- avoids destructive cleanup of shared runtime data
- requires separate approval for shared/prod/staging rollback
- documents how rollback was reviewed
- documents stop conditions if existing objects or unexpected data are found

Rollback guidance does not authorize executing rollback.

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
- SQL
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

A future migration file, even if created, must not authorize:

- repository implementation
- audit writer / sink implementation
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

Each of those requires a separate bounded runtime task.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditMigrationAuthorization.static.test.js # PASS, 10 passed / 0 failed
test -f docs/task-874-data-correction-decision-audit-persistence-migration-authorization-packet-no-migration-no-db.md # PASS
git diff --check -- docs/task-874-data-correction-decision-audit-persistence-migration-authorization-packet-no-migration-no-db.md tests/dataCorrection/dataCorrectionDecisionAuditMigrationAuthorization.static.test.js # PASS
```

## Scope Confirmation

Task874 is docs + static test only:

- no `src/**` change
- no `admin/src/**` change
- no migration file
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

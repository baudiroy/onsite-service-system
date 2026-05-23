# Task 878 - Data Correction Decision Audit Migration 025 Disposable DB Dry-run Authorization Packet

Status: completed

## Goal

Create an authorization packet for any future disposable local/test DB dry-run of:

- `migrations/025_create_data_correction_decision_audit_events.sql`

Task878 does not modify the migration file. It does not connect to a database, run `psql`, run `npm run db:migrate`, execute DDL, dry-run, apply, or execute SQL.

## No DB Execution Boundary

Task878 is docs + static test only:

- no DB execution
- no DB connection
- no `psql`
- no `npm run db:migrate`
- no DDL
- no dry-run
- no apply
- no SQL execution
- no migration file modification
- no repository
- no writer
- no audit writer / sink runtime
- no route/controller/API change
- no public response body change
- no permission runtime change
- no provider / LINE / SMS / App push / webhook / email traffic
- no AI / RAG runtime
- no billing / settlement behavior
- no Case / Appointment / Field Service Report mutation
- no `finalAppointmentId` inference or update
- no correction application creation
- no smoke/integration test

## Future Dry-run Approval Requirements

A future migration 025 dry-run task must include explicit user approval that:

1. The target is a disposable local/test DB only.
2. The target is not shared, production, staging, or Zeabur.
3. Printing or exposing `DATABASE_URL` is forbidden.
4. Printing or exposing credentials is forbidden.
5. Runtime traffic is disabled.
6. Provider sending is disabled.
7. LINE / SMS / App push / webhook / email delivery is disabled.
8. AI / RAG execution is disabled.
9. Audit writer / sink runtime is disabled.
10. Repository / writer runtime integration is disabled.
11. Case / Appointment / Field Service Report mutation is disabled.
12. `finalAppointmentId` mutation is disabled.
13. Correction application creation is disabled.
14. Billing / settlement behavior is disabled.

Generic wording such as "continue", "go ahead", "approved", "keep going", or "I agree" must not be treated as dry-run approval.

## Future Dry-run Command Boundary

Any future dry-run command must be bounded to migration 025 only.

Future dry-run must not:

- run all migrations.
- run shared/prod/staging/Zeabur targets.
- run runtime app servers against a DB.
- create seed data.
- create correction applications.
- create audit event rows from runtime traffic.
- run provider traffic.
- send LINE / SMS / App push / webhook / email notifications.
- run AI / RAG jobs.
- mutate cases, appointments, field service reports, customer identity, phone binding, channel identity, billing, or settlement data.

## Stop Conditions

Codex must stop before any future dry-run if any of the following is true:

- disposable local/test DB confirmation is missing.
- target could be shared, production, staging, or Zeabur.
- command attempts to run more than migration 025.
- command attempts to print or echo a DB URL.
- command attempts to print or echo credentials.
- command attempts to run provider traffic.
- command attempts to send LINE / SMS / App push / webhook / email notifications.
- command attempts to run AI / RAG.
- command attempts to enable audit writer / sink runtime.
- command attempts to enable repository / writer runtime.
- command attempts to mutate Case / Appointment / Field Service Report data.
- command attempts to mutate `finalAppointmentId`.
- command attempts to create correction applications.
- command attempts to touch billing / settlement behavior.
- logs would expose raw phone, address, LINE id, token, secret, credential, internal note, audit raw payload, AI raw payload, or full payload.

## Future Evidence Requirements

If a future dry-run is approved separately, its report must include only safe summaries:

- target classification: disposable local/test DB
- command class, without printing secrets or connection strings
- migration file name
- success/failure status
- safe error category if failed
- confirmation that no runtime traffic ran
- confirmation that no provider sending ran
- confirmation that no AI / RAG ran
- confirmation that no shared/prod/staging/Zeabur target was used

The report must not include credentials, DB URL, customer data, raw payloads, provider payloads, LINE access token, channel secret, AI provider config, phone, address, signatures, files, or photos.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditMigration025DryRunAuthorization.static.test.js # PASS, 11 passed / 0 failed
test -f docs/task-878-data-correction-decision-audit-migration-025-disposable-db-dry-run-authorization-packet-no-db-execution.md # PASS
node --test tests/dataCorrection/*.js # PASS, 747 passed / 0 failed
npm run check # PASS
git diff --check -- docs/task-878-data-correction-decision-audit-migration-025-disposable-db-dry-run-authorization-packet-no-db-execution.md tests/dataCorrection/dataCorrectionDecisionAuditMigration025DryRunAuthorization.static.test.js # PASS
```

## Scope Confirmation

Task878 is docs + static test only:

- no `src/**` change
- no `admin/src/**` change
- no migration file creation or modification
- no DB / psql / DDL / dry-run / apply / SQL execution
- no repository
- no audit writer / sink
- no API / route / controller / DTO change
- no permission runtime change
- no provider / LINE / SMS / App push / webhook / email change
- no AI / RAG runtime change
- no billing / settlement change
- no package change
- no smoke / integration test change
- no sensitive data, token, secret, LINE access token, channel secret, DB credential, or AI provider config touched

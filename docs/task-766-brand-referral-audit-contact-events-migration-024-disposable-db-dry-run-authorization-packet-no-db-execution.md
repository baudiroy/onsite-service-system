# Task766 - Brand Referral Audit Contact Events Migration 024 Disposable DB Dry-run Authorization Packet / No DB Execution

Status: completed

Scope: dry-run authorization packet only / no DB execution / no migration modification / no runtime change

## Summary

Task766 records the authorization requirements for any future disposable local/test DB dry-run of `migrations/024_create_brand_referral_contact_events.sql`.

This task does not connect to a DB, does not use psql, does not run `db:migrate`, does not run DDL, does not dry-run, does not apply, and does not execute SQL. It also does not modify `migrations/024_create_brand_referral_contact_events.sql`.

The SQL file remains unapplied until a separate future task explicitly approves a disposable local/test DB target and the exact dry-run command.

## Referenced Migration

Future dry-run authorization applies only to:

- `migrations/024_create_brand_referral_contact_events.sql`

Task766 does not authorize creating, editing, renumbering, dry-running, or applying any other migration.

## Required Future Approval

Before any dry-run can happen, a future task must explicitly approve all of the following:

- the exact migration file: `migrations/024_create_brand_referral_contact_events.sql`
- the exact command to run
- confirmation that the target is a disposable local/test DB only
- confirmation that the target is not shared, production, staging, or Zeabur shared runtime
- confirmation that no real customer data is present in the target
- confirmation that `DATABASE_URL` and credentials will not be printed
- confirmation that runtime traffic is disabled
- confirmation that provider sending is disabled
- confirmation that LINE, SMS, App push, webhook, and email sending are disabled
- confirmation that AI/RAG is disabled
- confirmation that audit/contact writer runtime is disabled
- confirmation that identity verification, Case Binding, repair intake, and Case creation runtime are disabled

Generic approval phrases are not enough. Examples that must not be treated as dry-run approval:

- continue
- go ahead
- do next
- approved
- I authorize all
- keep going
- execute the workflow
- continue runtime

Dry-run approval must explicitly say disposable local/test DB and name the target or safe environment boundary.

## Forbidden Targets

The future dry-run must stop before any DB command if the target appears to be:

- shared DB
- production DB
- staging DB
- Zeabur shared runtime DB
- any DB with unclear ownership
- any DB with production-like customer data
- any DB where credentials or `DATABASE_URL` would be printed

If Codex cannot prove the target is disposable local/test, it must stop.

## Stop Conditions

Any future dry-run task must stop before executing a DB command if it detects:

- missing disposable local/test DB confirmation
- unexpected migration target
- command tries to run more than migration 024
- unsafe logs
- credential printing
- `DATABASE_URL` printing
- token or secret output
- provider traffic
- LINE/SMS/App push/webhook/email sending
- AI/RAG runtime
- audit/contact writer runtime
- identity verification runtime
- Case Binding runtime
- repair intake or Case creation runtime
- shared, production, staging, or Zeabur target

## Runtime Boundary

Task766 authorizes no runtime behavior.

It does not implement:

- DB connection
- psql
- `db:migrate`
- DDL execution
- dry-run
- apply
- SQL execution
- migration file modification
- repository
- audit writer
- contact writer
- runtime persistence
- route behavior change
- public response body change
- permission runtime
- entitlement runtime
- identity verification
- Case Binding
- repair intake creation
- Case creation
- provider, LINE, SMS, App push, webhook, or email runtime
- AI/RAG runtime
- admin UI
- smoke or integration test
- package changes

## Sensitive Data Boundary

The future dry-run process must not print or persist:

- token
- secret
- LINE access token
- LINE channel secret
- binding token
- verification code
- full phone
- full address
- full customer name
- raw `line_user_id`
- raw provider payload
- AI payload
- full customer payload
- credential
- `DATABASE_URL`
- stack trace containing sensitive values
- customer case data
- internal note
- billing or settlement internal data
- cross-organization data

## Verification

Run:

```bash
node --test tests/brandChannel/brandReferralAuditContactEventsMigrationDryRunAuthorization.static.test.js
test -f docs/task-766-brand-referral-audit-contact-events-migration-024-disposable-db-dry-run-authorization-packet-no-db-execution.md
git diff --check -- docs/task-766-brand-referral-audit-contact-events-migration-024-disposable-db-dry-run-authorization-packet-no-db-execution.md tests/brandChannel/brandReferralAuditContactEventsMigrationDryRunAuthorization.static.test.js docs/design/brand-official-line-channel-integration.md
```

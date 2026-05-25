# Task762 - Brand Referral Audit Contact Persistence Migration Authorization Packet / No Migration No DB

Status: completed

Scope: docs and static guard only / authorization packet only / no migration / no DB

## Summary

Task762 records the authorization packet required before any future migration for `brand_referral_contact_events`. This task authorizes no migration creation, no DDL, no psql, no DB connection, no dry-run, and no apply.

Task762 does not create a migration file, does not run a migration, does not connect to any database, and does not implement a repository, audit writer, contact writer, or runtime persistence.

## Proposed Future Target

Task761 proposed a future concept named `brand_referral_contact_events`.

Any later migration proposal must be limited to safe metadata fields such as:

- `id`
- `organization_id`
- `brand_id`
- `source_channel`
- `referral_source`
- `entry_context`
- `line_channel_id`
- `event_type`
- `reason_key`
- `result_status`
- `request_id`
- `created_at`
- `retention_until`, if row-level retention is approved
- `deleted_at`, if soft deletion is approved

The migration must not introduce a trust boundary. Creating this table, if later approved, must not create a Case, create a repair intake draft, verify identity, bind a Case, grant customer access, call providers, call LINE/SMS/App/webhook, or call AI/RAG.

## Required Future Migration Approvals

Before any migration file is created, a future task must explicitly approve:

- migration filename and number
- final table name
- final column names and types
- organization scope and tenant isolation rule
- index list and index names
- retention and deletion fields
- redaction and forbidden-value policy
- DDL review
- rollback plan
- disposable local/test DB dry-run approval
- confirmation that no shared, production, or staging DB is the target
- confirmation that credentials and `DATABASE_URL` are never printed
- confirmation that runtime traffic is disabled
- confirmation that provider sending is disabled
- confirmation that AI/RAG is disabled
- confirmation that audit/contact writer runtime is disabled

General "continue", unrelated runtime approval, or docs approval must not be treated as migration creation, DDL, dry-run, apply, or DB access approval.

## Dry-run Guard

Any future dry-run must be separately approved and must be limited to a disposable local/test DB.

Dry-run rules:

- no shared DB
- no production DB
- no staging DB
- no Zeabur shared runtime DB
- no `npm run db:migrate` unless explicitly authorized for the disposable target
- no psql unless explicitly authorized for the disposable target
- `DATABASE_URL` must never be printed
- no runtime traffic
- no provider sending
- no LINE, SMS, App push, webhook, or email sending
- no AI/RAG provider calls
- no audit/contact writer runtime
- no repair intake, Case creation, identity verification, or Case Binding runtime

If a future dry-run cannot prove the target is disposable local/test, it must stop before any DB command.

## Rollback Requirements

Any future migration proposal must include rollback instructions before migration creation.

Rollback must:

- drop only objects created by the approved migration
- avoid destructive shared-data assumptions
- not run against shared, production, or staging DB without separate explicit approval
- avoid touching unrelated tables or indexes
- document whether rollback drops the table, drops indexes, or leaves retained audit evidence intact
- document any data retention impact

Rollback approval is separate from migration creation and separate from dry-run/apply approval.

## Forbidden Future Columns and Values

A future migration must not add columns intended to store:

- raw `line_user_id`
- token
- secret
- LINE access token
- LINE channel secret
- binding token
- verification code
- full phone
- full address
- full customer name
- raw provider payload
- AI payload
- full customer payload
- credential
- DB URL
- stack trace
- SQL
- customer case data
- internal note
- billing or settlement internal data
- cross-organization data

If a future incident or evidence workflow requires more data, it must be scoped as a separate task with redaction, retention, access control, and audit requirements.

## Non-effects

Future migration authorization must not be confused with runtime authorization.

Even if a future migration is approved, separate approval is still required for:

- repository
- audit writer
- contact writer
- transaction boundary
- route injection
- public route behavior
- permission runtime
- identity verification
- Case Binding
- repair intake creation
- provider integration
- AI/RAG integration
- smoke or integration testing

## Verification

Run:

```bash
node --test tests/brandChannel/brandReferralAuditPersistenceMigrationAuthorization.static.test.js
test -f docs/task-762-brand-referral-audit-contact-persistence-migration-authorization-packet-no-migration-no-db.md
git diff --check -- docs/task-762-brand-referral-audit-contact-persistence-migration-authorization-packet-no-migration-no-db.md tests/brandChannel/brandReferralAuditPersistenceMigrationAuthorization.static.test.js docs/design/brand-official-line-channel-integration.md
```

## Non-goals

Task762 does not implement:

- migration file creation
- DB schema change
- DDL
- DB connection
- psql
- dry-run
- migration apply
- repository
- audit/contact writer
- runtime persistence
- route behavior change
- identity verification
- Case Binding
- repair intake creation
- Case creation
- provider, LINE, SMS, App push, webhook, or email runtime
- AI/RAG runtime
- entitlement or billing runtime
- admin UI
- smoke or integration test
- package changes

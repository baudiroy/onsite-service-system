# Task765 - Brand Referral Audit Contact Events Migration File / No Apply No DB

Status: completed

Scope: migration file authoring only / no apply / no DB / no runtime change

## Summary

Task765 creates `migrations/024_create_brand_referral_contact_events.sql` only. It does not run DB commands, does not use psql, does not dry-run, does not apply, does not connect to a DB, and does not implement repository, writer, route behavior, audit/contact persistence, provider integration, AI/RAG, smoke, or runtime changes.

The migration file is inert until a future separately approved dry-run or apply task.

## Migration File

Created:

- `migrations/024_create_brand_referral_contact_events.sql`

The file creates only `brand_referral_contact_events`.

## Safe Columns

The migration contains only the approved safe metadata columns:

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
- `retention_until`
- `deleted_at`

The table includes blank-check constraints for `event_type` and `result_status`.

## Indexes

The migration includes organization-scoped indexes:

- `organization_id, created_at`
- `organization_id, brand_id, created_at`
- `organization_id, source_channel, created_at`
- `organization_id, request_id`
- `organization_id, retention_until`
- `organization_id, deleted_at`

All lookup-oriented indexes include `organization_id`.

## Rollback Boundary

The migration file includes rollback comments only. It does not include active DROP, TRUNCATE, DELETE, or ALTER statements outside comments.

Future rollback must be separately approved and must remove only objects created by the approved migration.

## Forbidden Values

The migration does not add columns for:

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
- SQL input
- customer case data
- internal note
- billing or settlement internal data
- cross-organization data

## Non-effects

Task765 does not implement:

- DB connection
- DDL execution
- psql
- dry-run
- apply
- repository
- audit writer
- contact writer
- runtime persistence
- route behavior change
- public response body change
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

Future dry-run or apply requires separate explicit disposable local/test DB approval.

## Verification

Run:

```bash
node --test tests/brandChannel/brandReferralAuditContactEventsMigration.static.test.js
test -f migrations/024_create_brand_referral_contact_events.sql
git diff --check -- migrations/024_create_brand_referral_contact_events.sql tests/brandChannel/brandReferralAuditContactEventsMigration.static.test.js docs/task-765-brand-referral-audit-contact-events-migration-file-no-apply-no-db.md docs/design/brand-official-line-channel-integration.md
```

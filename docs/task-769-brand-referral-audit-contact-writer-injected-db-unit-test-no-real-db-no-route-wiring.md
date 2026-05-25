# Task769 - Brand Referral Audit Contact Writer / Injected DB Unit Test / No Real DB No Route Wiring

Status: completed

Scope: bounded writer/repository implementation with injected fake DB unit tests / no real DB / no route wiring

## Summary

Task769 implements the first bounded `brand_referral_contact_events` repository/writer slice under `src/brandChannel`.

The implementation is intentionally narrow:

- repository and writer require injected `dbClient` or transaction objects
- unit tests use fake DB objects only
- no global DB import
- no real DB connection
- no psql
- no `db:migrate`
- no DDL
- no dry-run
- no migration apply
- no public route wiring
- no API response behavior change

## Added Runtime Files

- `src/brandChannel/brandReferralAuditContactRepository.js`
- `src/brandChannel/brandReferralAuditContactWriter.js`

## Repository Boundary

The repository exports:

- `BRAND_REFERRAL_AUDIT_CONTACT_TABLE`
- `BRAND_REFERRAL_AUDIT_CONTACT_COLUMNS`
- `insertBrandReferralAuditContactEvent(dbClient, row)`

It accepts only an injected `dbClient` with an `insert(table, row)` function. Missing injection fails safely and no write occurs.

The repository imports no global DB, env, config, network, provider, webhook, AI/RAG, API route, or server code.

## Writer Boundary

The writer exports:

- `ALLOWED_BRAND_REFERRAL_AUDIT_CONTACT_COLUMNS`
- `buildAuditContactRow(auditIntent)`
- `createBrandReferralAuditContactWriter(options)`

The writer consumes only safe `auditIntent` metadata from the Task757/758 side-channel and maps it to migration 024 safe fields only.

It does not:

- create Case
- create repair intake
- verify identity
- bind Case
- grant customer access
- call provider/webhook
- call AI/RAG
- change route responses

## Safe Insert Fields

Writer/repository persistence is limited to:

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

Generated DB fields such as `id` may be returned but are not required in insert payloads.

## Fail-closed Behavior

The writer fails safely for:

- missing injected DB client
- invalid intent
- missing `organization_id`
- missing or unsafe `event_type`
- missing or unsafe `result_status`
- unsafe extra fields
- duplicate write error
- timeout error
- generic DB/write error

Failure responses contain safe `reasonKey` values only and do not expose stack traces, SQL, credentials, tokens, provider payloads, AI payloads, customer case data, internal notes, or PII.

## Verification

Run:

```bash
node --test tests/brandChannel/brandReferralAuditContactWriter.unit.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- src/brandChannel/brandReferralAuditContactRepository.js src/brandChannel/brandReferralAuditContactWriter.js tests/brandChannel/brandReferralAuditContactWriter.unit.test.js docs/task-769-brand-referral-audit-contact-writer-injected-db-unit-test-no-real-db-no-route-wiring.md
```

# Task764 - Brand Referral Audit Contact Migration File Creation Preflight Gate / Static Only / No Migration No DB

Status: completed

Scope: docs and static guard only / preflight gate only / no migration / no DB

## Summary

Task764 adds the final preflight gate before any future migration file creation for `brand_referral_contact_events`.

This task creates no migration file, no DDL, no psql, no DB connection, no dry-run, and no apply. It does not implement repository, writer, route behavior, audit/contact persistence, provider integration, AI/RAG, smoke, or runtime changes.

## Relationship to Prior Tasks

Task761 defined the schema proposal and safe fields.

Task762 defined the migration authorization packet, dry-run guard, rollback expectations, and approval requirements.

Task763 defined the non-executable DO NOT RUN migration draft plan and pseudo-SQL shape.

Task764 does not supersede those gates. It closes the pre-migration planning path by requiring the next task to explicitly authorize the migration filename/number and no-apply boundary before any SQL file can be created.

## Next Migration-file Task Requirements

Any future migration-file creation task must explicitly state:

- migration filename
- migration number
- table name
- no DB connection
- no DDL execution
- no psql
- no dry-run
- no apply
- no shared DB target
- no production DB target
- no staging DB target
- no Zeabur shared runtime DB target
- no credential printing
- no `DATABASE_URL` printing
- no runtime traffic
- no provider sending
- no AI/RAG call
- no audit/contact writer runtime
- no identity verification
- no Case Binding
- no repair intake creation
- no Case creation

The future migration-file task may create a SQL file only if it says so explicitly. Creating the SQL file must still not authorize running that SQL.

## Safe Column Checklist

A future migration-file task may include only safe metadata columns from Task761-763:

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

All future lookup and write paths must remain tenant-isolated by `organization_id`.

## Forbidden Column Checklist

A future migration-file task must not add columns for:

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

## Future Migration Acceptance Checklist

The future migration-file task must include:

- `CREATE TABLE brand_referral_contact_events`
- `organization_id` tenant scope
- safe metadata columns only
- safe indexes with `organization_id`
- `retention_until` and/or `deleted_at` fields if retention/deletion is included
- no raw sensitive data columns
- rollback section
- no credential printing
- no `DATABASE_URL` printing
- no shared, production, staging, or Zeabur shared runtime DB target
- explicit no-apply wording
- explicit statement that SQL file creation does not run DDL

## No Runtime Effects

Task764 does not authorize or implement:

- migration file creation or modification
- DB schema change
- DDL
- psql
- DB connection
- dry-run
- migration apply
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

## Verification

Run:

```bash
node --test tests/brandChannel/brandReferralAuditMigrationFileCreationPreflight.static.test.js
test -f docs/task-764-brand-referral-audit-contact-migration-file-creation-preflight-gate-no-migration-no-db.md
git diff --check -- docs/task-764-brand-referral-audit-contact-migration-file-creation-preflight-gate-no-migration-no-db.md tests/brandChannel/brandReferralAuditMigrationFileCreationPreflight.static.test.js docs/design/brand-official-line-channel-integration.md
```

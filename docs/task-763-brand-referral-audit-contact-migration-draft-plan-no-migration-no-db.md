# Task763 - Brand Referral Audit Contact Migration Draft Plan / Static Guard / No Migration No DB

Status: completed

Scope: docs and static guard only / migration draft plan only / no migration / no DB

## Summary

Task763 records a draft plan for a future `brand_referral_contact_events` migration. It does not create or modify any migration file, run DDL, use psql, connect to a DB, dry-run a migration, apply a migration, add a repository, add a writer, or change runtime behavior.

This plan is a review artifact only. The SQL example below is non-executable documentation and is labeled DO NOT RUN.

## Future Table Intent

Future migration, if separately approved, may create `brand_referral_contact_events` to store safe Brand Referral audit/contact event metadata.

This table must remain:

- organization-scoped
- tenant-isolated
- redacted
- metadata-only
- not a customer identity table
- not a Case Binding table
- not a repair intake table
- not a provider payload table
- not an AI/RAG payload table

## Proposed Columns

Future migration may use safe columns only:

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

Suggested future type direction:

- `id`: UUID or project-standard primary key
- `organization_id`: UUID or project-standard organization key, required
- `brand_id`: UUID or project-standard brand key, nullable if unknown
- `source_channel`: short text or enum-like text
- `referral_source`: short text or enum-like text
- `entry_context`: short text or enum-like text
- `line_channel_id`: short text, nullable, never a secret
- `event_type`: short text or enum-like text
- `reason_key`: short text or enum-like text
- `result_status`: short text or enum-like text
- `request_id`: safe correlation id, nullable
- `created_at`: timestamp with timezone
- `retention_until`: timestamp with timezone, nullable
- `deleted_at`: timestamp with timezone, nullable

Exact types must follow existing repository and migration conventions in the future migration task.

## Proposed Indexes

Future migration may define indexes such as:

- `organization_id, created_at`
- `organization_id, brand_id, created_at`
- `organization_id, source_channel, created_at`
- `organization_id, brand_id, source_channel, created_at`
- `organization_id, request_id`, if request correlation is approved
- `organization_id, retention_until`, if retention sweep lookup is approved
- `organization_id, deleted_at`, if soft-deletion lookup is approved

All operational lookups must include `organization_id`. `brand_id`, `source_channel`, `line_channel_id`, and `request_id` must not substitute for tenant isolation.

## Non-executable SQL Shape

DO NOT RUN. This is documentation-only pseudo-SQL for future review.

```sql
-- DO NOT RUN. Draft shape only. No migration is created by Task763.
CREATE TABLE brand_referral_contact_events (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  brand_id UUID NULL,
  source_channel TEXT NULL,
  referral_source TEXT NULL,
  entry_context TEXT NULL,
  line_channel_id TEXT NULL,
  event_type TEXT NOT NULL,
  reason_key TEXT NULL,
  result_status TEXT NOT NULL,
  request_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  retention_until TIMESTAMPTZ NULL,
  deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_brand_referral_contact_events_org_created
  ON brand_referral_contact_events (organization_id, created_at);

CREATE INDEX idx_brand_referral_contact_events_org_brand_created
  ON brand_referral_contact_events (organization_id, brand_id, created_at);

CREATE INDEX idx_brand_referral_contact_events_org_source_created
  ON brand_referral_contact_events (organization_id, source_channel, created_at);
```

The future migration must decide naming, types, defaults, foreign keys, and indexes in a separate approved task.

## Rollback Outline

Future rollback should:

- drop only indexes created by the approved future migration
- drop only the table created by the approved future migration, if policy allows
- avoid touching unrelated tables or indexes
- avoid destructive shared-data assumptions
- not run against shared, production, or staging DB without separate explicit approval
- document retention and audit-evidence impact before execution

Rollback outline must be reviewed before migration creation and again before dry-run/apply.

## Forbidden Columns and Values

The future migration must not add columns for:

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

Any future need for incident evidence beyond safe metadata requires a separate task with redaction, retention, access control, and audit approval.

## Non-effects

Task763 does not authorize or implement:

- migration file creation or modification
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
node --test tests/brandChannel/brandReferralAuditPersistenceMigrationDraftPlan.static.test.js
test -f docs/task-763-brand-referral-audit-contact-migration-draft-plan-no-migration-no-db.md
git diff --check -- docs/task-763-brand-referral-audit-contact-migration-draft-plan-no-migration-no-db.md tests/brandChannel/brandReferralAuditPersistenceMigrationDraftPlan.static.test.js docs/design/brand-official-line-channel-integration.md
```

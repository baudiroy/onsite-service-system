# Task761 - Brand Referral Audit Contact Persistence Schema Proposal / No Migration No DB

Status: completed

Scope: docs and static guard only / schema proposal only / no migration / no DB / no runtime persistence

## Summary

Task761 proposes the future schema boundary for Brand Referral audit/contact event persistence. It does not create a migration file, run DDL, connect to a DB, add a repository, add an audit writer, add a contact writer, or change runtime behavior.

Task761 does not implement runtime persistence.

The proposal is intentionally one step before implementation. It records safe fields, forbidden values, tenant isolation, retention, redaction, and index expectations so a later migration task can be reviewed explicitly.

## Proposed Future Concept

Future persistence may use a table or concept named `brand_referral_contact_events`.

This future concept is for safe metadata about Brand Referral normalization, denial, malformed input, and unknown-source events. It is not a customer identity table, not a Case Binding table, not a repair intake table, not a provider webhook table, and not an AI/RAG evidence store.

## Proposed Safe Columns

Future schema may include:

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
- `retention_until`, if retention is implemented at row level
- `deleted_at`, if soft deletion is implemented

The existing in-memory intent names remain:

- `eventType`
- `reasonKey`
- `resultStatus`
- `createdAt`
- `requestId`

Any repository or migration task must map those intent keys to the future storage columns explicitly and safely.

## Tenant Isolation and Lookup

Every future row must be scoped by `organization_id`. Queries must include organization scope and must not use `brand_id`, `source_channel`, `line_channel_id`, or `request_id` as a substitute for tenant isolation.

Suggested future indexes:

- `organization_id, created_at`
- `organization_id, brand_id, created_at`
- `organization_id, source_channel, created_at`
- `organization_id, brand_id, source_channel, created_at`
- `organization_id, request_id`, if request correlation is approved and non-sensitive

Index names and exact database types must be decided in a later migration task. Task761 creates no index and no migration.

## Redaction Policy

Future persistence must store safe routing and outcome metadata only. It must not store raw customer identifiers, provider payloads, AI payloads, or customer case data.

Forbidden persisted values include:

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
- internal billing or settlement data
- cross-organization data

Error messages, audit summaries, and future contact-history summaries must also avoid these values.

## Retention and Deletion Expectations

Future persistence should define retention before launch. The likely default is time-bound operational evidence retention with organization-scoped deletion or soft deletion support.

Recommended future fields are:

- `retention_until` for policy-driven retention
- `deleted_at` for soft deletion or suppression, if needed

Retention must be compatible with audit needs, privacy obligations, customer-visible data policy, and tenant isolation. A future implementation must document whether deletion is hard delete, soft delete, or redaction-only.

## Non-effects

Persisting a future `brand_referral_contact_events` row must not:

- create a Case
- create a repair intake draft
- verify identity
- bind a Case
- grant customer access
- call a provider
- call LINE, SMS, App push, or webhook
- call AI/RAG
- change customer channel identity
- change notification routing
- expose customer case data

Persistence is evidence only. It does not imply trust, verification, Case Binding, customer access, or notification delivery.

## Required Future Implementation Gates

Before runtime persistence, a future task must separately approve:

- DB schema and column types
- migration file creation
- migration apply or dry-run authorization
- repository contract
- transaction boundary
- audit/contact writer contract
- permission and organization scope checks
- retention and redaction behavior
- safe failure behavior
- unit and integration tests
- smoke test scope, if any
- rollback plan

General continuation or unrelated runtime approval is not approval for DB, DDL, audit/contact persistence, migration apply, provider integration, or customer-data disclosure.

## Verification

Run:

```bash
node --test tests/brandChannel/brandReferralAuditPersistenceSchemaProposal.static.test.js
test -f docs/task-761-brand-referral-audit-contact-persistence-schema-proposal-no-migration-no-db.md
grep -Ei "organization_id|brand_id|source_channel|referral_source|entry_context|line_channel_id|eventType|reasonKey|resultStatus|createdAt|requestId|retention|redaction|no migration|no DB" docs/task-761-brand-referral-audit-contact-persistence-schema-proposal-no-migration-no-db.md
git diff --check -- docs/task-761-brand-referral-audit-contact-persistence-schema-proposal-no-migration-no-db.md docs/design/brand-official-line-channel-integration.md tests/brandChannel/brandReferralAuditPersistenceSchemaProposal.static.test.js
```

## Non-goals

Task761 does not implement:

- migration/schema/index
- DB connection or DDL
- repository
- audit writer
- contact writer
- runtime persistence
- API, route, controller, service, or repository behavior
- identity verification
- Case Binding
- repair intake creation
- Case creation
- provider, LINE, SMS, App push, or webhook runtime
- AI/RAG runtime
- entitlement or billing runtime
- admin UI
- smoke or integration test
- package changes

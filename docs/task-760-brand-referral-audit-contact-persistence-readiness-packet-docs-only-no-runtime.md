# Task760 — Brand Referral Audit Contact Persistence Readiness Packet / Docs Only / No Runtime

Status: completed

Scope: docs-only persistence readiness gate / no runtime change / no DB / no migration

## Summary

Task757-759 closed the Brand Referral audit/contact intent side-channel as intent-only. Task760 records the explicit readiness gate for any future audit/contact persistence of Brand Referral events.

This task does not implement an audit writer, contact writer, DB table, migration, repository, transaction boundary, smoke test, public response change, provider integration, identity verification, Case Binding, repair intake creation, entitlement service, or AI/RAG runtime.

## Required Future Approvals

Before Brand Referral audit/contact intent can be persisted, a future task must explicitly approve each relevant scope:

- DB schema design
- migration file creation
- migration apply / dry-run authorization
- repository design
- transaction boundary
- audit writer
- contact writer
- permission and organization scope enforcement
- retention policy
- redaction policy
- safe error and failure behavior
- unit and integration test scope
- smoke test scope
- rollback plan
- public route behavior confirmation

General continuation, "go ahead", or unrelated runtime approval must not be interpreted as approval for DB, DDL, audit/contact persistence, migration apply, smoke against shared runtime, provider integration, or customer-data disclosure.

## Persistence Boundary

Future persistence must remain:

- organization-scoped
- tenant-isolated
- permission-aware
- redacted
- auditable
- side-effect explicit
- fail-safe

The persistence layer must not create customer trust by itself. Persisting an audit/contact event must not:

- create a Case
- create a repair intake draft
- verify customer identity
- bind a customer to a Case
- grant customer access
- call LINE, SMS, App push, webhook, or provider adapters
- call AI/RAG
- expose customer case data

## Safe Persisted Fields

Future persisted audit/contact records may include only safe metadata such as:

- `eventType`
- `organization_id`
- `brand_id`
- `source_channel`
- `referral_source`
- `entry_context`
- `line_channel_id`
- `reasonKey`
- `resultStatus`
- `createdAt`, if generated safely
- `requestId`, if generated safely and non-sensitive

Future schema and repository tasks may add technical keys, timestamps, actor summaries, or request correlation fields only if they are non-sensitive, organization-scoped, and compatible with retention/redaction policy.

## Forbidden Persisted Values

Future audit/contact persistence must not store:

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

If a future incident/evidence workflow needs additional data, it must be separately approved with redaction, retention, access control, and audit requirements.

## Future Bounded Task Candidates

Recommended follow-up tasks:

1. Schema proposal / no migration
   - Define audit/contact event table shape, indexes, retention, redaction fields, and organization scope.

2. Migration authorization packet
   - Ask explicitly before creating or applying any DB migration.

3. Migration file / no apply
   - Create migration only after approval; do not run DDL unless separately approved.

4. Repository with injected DB only
   - Add repository contract using injected executor; no real DB connection in unit tests.

5. Writer with synthetic DB unit test
   - Add writer that persists only safe fields and fails closed on unsafe values.

6. Public route injected writer path
   - Wire optional writer as an injected dependency; keep public body unchanged.

7. Smoke / integration coverage
   - Run only after explicit DB and runtime approval, preferably first on disposable local/test DB.

## Verification

Run:

```bash
test -f docs/task-760-brand-referral-audit-contact-persistence-readiness-packet-docs-only-no-runtime.md
grep -Ei "audit|contact|persistence|DB|migration|repository|transaction|schema|retention|redaction|organization|permission|smoke|explicit approval" docs/task-760-brand-referral-audit-contact-persistence-readiness-packet-docs-only-no-runtime.md
git diff --check -- docs/task-760-brand-referral-audit-contact-persistence-readiness-packet-docs-only-no-runtime.md docs/design/brand-official-line-channel-integration.md docs/PROJECT_GUARDRAILS.md
```

## Non-goals

Task760 does not implement:

- audit/contact writer
- DB persistence
- migration/schema/index
- repository
- transaction
- smoke/integration test
- public route body changes
- identity verification
- Case Binding
- repair intake creation
- Case creation
- LINE/SMS/App provider runtime
- webhook runtime
- real entitlement or billing runtime
- Brand AI/RAG
- reports
- admin UI
- package changes

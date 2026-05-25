# Task733 - Brand Channel Referral Contact Audit Trail Static Guard

Status: completed.

Scope: docs-only static guard / no runtime change.

## Goal

Add a static documentation guard proving Basic brand referral / routing requires traceable source, contact, and audit records while still avoiding Brand official LINE webhook, provider runtime, or Enterprise add-on behavior.

## Changes

- Added `tests/docs/brandChannelReferralAuditBoundary.static.test.js`.
- Clarified `docs/design/brand-official-line-channel-integration.md`:
  - Basic platform capability may include entry link / context where applicable.
  - Audit and contact history should include customer access after verification.
  - Audit and contact history must remain organization-scoped and tenant-isolated.
  - Audit and contact history must not contain raw provider payloads, full addresses, or full customer payloads.
  - Brand referral / routing records do not by themselves verify identity or grant case-data access.
  - Future runtime tasks must explicitly mark API, DB / migration, permission, audit, provider, LINE, and AI/RAG scope before implementation.

## Static Guard Coverage

- Basic brand referral fields: `brand_id`, `source_channel`, `referral_source`, and entry link / context where applicable.
- Contact / audit trail for brand entry, verification, Case Binding, customer access, handoff, escalation, and complaint routing.
- Sensitive data redaction in contact / audit trails.
- Referral / routing is not identity proof and does not grant case-data access.
- Organization-scoped and tenant-isolated audit/contact history.
- Basic referral excludes deep Brand official LINE provider, AI/RAG, analytics, and routing add-ons.
- Future runtime scope declaration before implementation.

## Non-runtime Decision

This task does not implement referral tables, audit writer, webhook, LINE adapter, entitlement runtime, reports, provider runtime, or AI/RAG.

## Verification

Run:

```bash
node --test tests/docs/brandChannelReferralAuditBoundary.static.test.js
git diff --check -- tests/docs/brandChannelReferralAuditBoundary.static.test.js docs/task-733-brand-channel-referral-contact-audit-trail-static-guard-docs-only-no-runtime.md docs/design/brand-official-line-channel-integration.md docs/design/saas-plan-entitlement-and-add-ons.md
```

Expected:

- Static guard passes.
- Diff whitespace check passes.

## Future Tasks

- Brand referral source runtime records.
- Contact history writer for brand entry.
- Case Binding success / failure audit events.
- Brand channel complaint / escalation traceability.
- Brand channel usage analytics as an add-on feature.

# Task757 — Brand Referral Audit Contact Intent Builder / Pure Module / No Audit Write No DB

Status: completed

Scope: pure audit/contact intent builder / no audit write / no DB / no side effects

## Summary

Task757 adds a pure deterministic Brand Referral audit/contact intent builder for future audit and contact-history persistence.

The builder creates safe, redacted intent metadata only. It does not write audit logs, write contact logs, persist DB records, create Cases, create repair intake drafts, verify identity, bind Cases, call providers, call LINE/webhook, use entitlement runtime, or call AI/RAG.

## Added Module

- `src/brandChannel/brandReferralAuditIntentBuilder.js`

Exports:

- `BRAND_REFERRAL_AUDIT_EVENT_TYPES`
- `buildBrandReferralAuditIntent(input, options)`

Supported event types:

- `brand_referral_normalized`
- `brand_referral_denied`
- `brand_referral_malformed`
- `brand_referral_unknown_source`

## Safe Intent Fields

The intent may include only safe metadata:

- `eventType`
- `organization_id`
- `brand_id`
- `source_channel`
- `referral_source`
- `entry_context`
- `line_channel_id`
- `reasonKey`
- `resultStatus`
- `timestamp`, only when injected
- `auditWritten=false`
- `contactWritten=false`

The builder never includes raw identity or sensitive payload values such as:

- raw `line_user_id`
- token
- secret
- LINE access token
- LINE channel secret
- full phone
- full address
- raw provider payload
- AI payload
- full customer payload
- credential
- DB URL
- stack
- SQL
- customer case data

## Safety Behavior

The builder is fail-safe:

- malformed input returns `brand_referral_malformed`
- unknown source returns `brand_referral_unknown_source`
- access-denied envelopes return `brand_referral_denied`
- allowed normalized envelopes return `brand_referral_normalized`
- unsafe extras are ignored
- raw scoped LINE user values are not copied
- intent always marks `auditWritten=false` and `contactWritten=false`

## Changed Files

- `src/brandChannel/brandReferralAuditIntentBuilder.js`
- `tests/brandChannel/brandReferralAuditIntentBuilder.unit.test.js`
- `docs/task-757-brand-referral-audit-contact-intent-builder-no-audit-write-no-db.md`
- `docs/design/brand-official-line-channel-integration.md`

## Verification

Run:

```bash
node --test tests/brandChannel/brandReferralAuditIntentBuilder.unit.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- src/brandChannel/brandReferralAuditIntentBuilder.js tests/brandChannel/brandReferralAuditIntentBuilder.unit.test.js docs/task-757-brand-referral-audit-contact-intent-builder-no-audit-write-no-db.md docs/design/brand-official-line-channel-integration.md
```

## Non-goals

This task does not implement:

- audit/contact writer
- DB persistence
- migration/schema/index changes
- public API or route response changes
- repair intake creation
- Case creation
- identity verification
- Case Binding
- LINE/SMS/App provider runtime
- webhook runtime
- real entitlement or billing runtime
- Brand AI/RAG
- reports
- admin UI
- package changes
- smoke/integration tests

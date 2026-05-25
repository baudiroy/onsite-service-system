# Task747 - Brand Referral Runtime Adoption Readiness Packet

## Status

Docs-only / no runtime change.

Task735-746 are closed / paused as the Basic Brand Referral pure-policy branch. That branch contains deterministic source recognition, triage, multi-channel allowed-flow policy, request normalization, integration guards, and closure guards only.

It does not implement API, DB, migration, provider, LINE webhook, identity verification, Case Binding, repair intake creation, audit/contact persistence, entitlement, usage tracking, reports, admin UI, or AI/RAG runtime.

## Purpose

This packet defines what must be explicitly approved before any future runtime adoption slice begins.

Future runtime work must be split into bounded tasks. A general request to continue development is not enough to authorize API, DB, migration, provider, LINE webhook, identity verification, Case Binding, audit/contact persistence, entitlement, admin UI, smoke, or AI/RAG runtime.

## Future Runtime Candidates

Future runtime candidates should be separated into small slices:

1. Basic referral API normalization only.
   - Accept request input.
   - Call the pure normalizer.
   - Return safe metadata / reason / next step.
   - Do not create Case, verify identity, bind Case, write audit/contact log, or persist data unless separately authorized.

2. Referral/source contact-audit write.
   - Persist sanitized referral/contact attempt metadata.
   - Requires explicit audit/contact log schema and redaction approval.
   - Must not store raw provider payloads, raw LINE user id, full phone, token, secret, LINE access token, channel secret, or AI raw payload.

3. Repair intake draft handoff.
   - Create or update a repair intake draft from normalized referral metadata.
   - Must not directly create a formal Case without separate validation / dedupe / confirmation scope.

4. Verification + Case Binding handoff.
   - Start verification and Case Binding flow after safe referral normalization.
   - Must preserve `line_user_id` scope: `organization_id + line_channel_id + line_user_id`.
   - Must forbid unverified case-data access.

5. Entitlement-gated multi-channel / webhook add-on.
   - Brand official LINE webhook, provider adapter, channel-specific templates, channel-level usage tracking, channel audit, and Brand Knowledge AI/RAG are Professional / Enterprise / add-on capabilities.
   - Must not be enabled as Basic default.

## Explicit Approval Gates

Before each runtime adoption slice, PM / product scope must explicitly state whether the task may change:

- API / DTO / route behavior
- DB schema / migration / seed / psql / DDL
- permission / role / organization-scope logic
- audit log / contact log runtime
- repair intake creation runtime
- identity verification runtime
- Case Binding runtime
- provider / LINE / SMS / App push / webhook runtime
- LINE signature verification
- AI/RAG runtime
- entitlement / billing / usage tracking runtime
- admin UI
- smoke / integration tests
- package files

If a category is not explicitly allowed, it is forbidden for that task.

## First Runtime Slice Boundary

If later approved, the first runtime slice should be Basic referral API normalization only.

It should not:

- create a Case
- create a repair intake draft
- verify identity
- bind a Case
- grant customer access
- write audit/contact log
- call provider, LINE, SMS, App push, webhook, AI, or RAG runtime
- persist DB records
- check or mutate entitlement / billing runtime
- expose raw provider payloads
- expose raw `line_user_id`
- expose full phone / address or other sensitive values

The output should remain a safe envelope of metadata, no-runtime grants, `reasonKey`, and `requiredNextStep`.

## Identity and Data Boundaries

Future runtime adoption must preserve:

- `line_user_id` is not global identity.
- LINE identity scope is `organization_id + line_channel_id + line_user_id`.
- No cross-channel, cross-provider, cross-brand, or cross-organization silent identity merge.
- Identity merge requires verification, permission, conflict handling, and audit log.
- Unverified users cannot query case progress, appointment status, reschedule, missing information, completion report, issue reporting, dispute status, or other customer-facing case data.
- Brand product questions, repair intake, existing case inquiries, and complaint / dispute / high-risk issues remain separate routes.
- Product questions can route only to brand-authorized knowledge future path.
- Customer case data requires verification plus Case Binding and customer-visible data policy.

## SaaS and Add-on Boundary

Basic may include brand referral source recognition, safe request normalization, repair-intake link entry, and future basic verification / Case Binding handoff after explicit runtime approval.

Professional / Enterprise / add-on capabilities include:

- brand official LINE webhook
- LINE signature verification
- provider adapter customization
- multiple LINE channels
- channel-specific templates
- channel-specific Brand Knowledge AI/RAG
- channel-level usage tracking
- channel-level audit
- brand-specific reports
- deep customer-service routing
- entitlement-gated provider integrations

These must not be enabled for Basic by default.

## Verification Commands

Required for this docs-only packet:

```sh
test -f docs/task-747-brand-referral-runtime-adoption-readiness-packet-docs-only-no-runtime.md
grep -Ei "API|DB|migration|permission|audit|Case Binding|verification|repair intake|no webhook|no AI|no provider|explicit approval" docs/task-747-brand-referral-runtime-adoption-readiness-packet-docs-only-no-runtime.md
git diff --check -- docs/task-747-brand-referral-runtime-adoption-readiness-packet-docs-only-no-runtime.md docs/design/brand-official-line-channel-integration.md docs/design/saas-plan-entitlement-and-add-ons.md
```

## Non-goals

Task747 does not implement runtime.

It does not modify API, DB, migration, provider, LINE webhook, identity verification, Case Binding, repair intake creation, audit/contact persistence, AI/RAG, entitlement, billing, admin UI, smoke tests, package files, or any production behavior.

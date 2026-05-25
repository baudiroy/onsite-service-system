# Task745 - Brand Referral Normalizer + Channel Flow Integration Guard

## Goal

Add a pure integration-style unit guard proving the Task744 request normalizer composes safely with Task735 referral source policy, Task736 triage policy, and Task741 multi-LINE-channel allowed-flow policy.

Request-like input may influence safe routing metadata, but it must never grant identity, Case Binding, intake creation, audit writing, customer access, direct case-data access, webhook, provider, entitlement, or AI/RAG runtime.

## Changed Files

- `tests/brandChannel/brandReferralNormalizerChannelFlow.integration.test.js`
- `docs/task-745-brand-referral-normalizer-channel-flow-integration-guard-no-api-no-db.md`
- `docs/design/brand-official-line-channel-integration.md`

## Coverage

The integration guard verifies:

- It imports only pure brandChannel modules:
  - `brandReferralRequestNormalizer`
  - `brandReferralSourcePolicy`
  - `brandChannelTriagePolicy`
  - `multiLineChannelPolicy`
- Normalized `brand_line`, `platform_line`, `brand_website`, and `manual` request-like inputs remain metadata-only.
- Normalized grants remain:
  - `identityVerified: false`
  - `caseBinding: false`
  - `caseDataAccess: false`
  - `intakeCreated: false`
  - `auditWritten: false`
- Raw `line_user_id` is not returned; scoped LINE context remains metadata only.
- `repair_intake` and `service_status` case inquiry routes require verification plus Case Binding / customer-visible policy, never direct case data.
- `campaign`, `sales_membership`, and `dealer_channel` fail closed for direct case query / customer access.
- Product questions may route only to the brand-authorized knowledge future path.
- Channel-level Brand Knowledge AI requires `aiRagEnabled` plus `knowledge_base_id`, but does not invoke AI/RAG runtime.
- Unsafe extras are stripped or ignored across normalizer, referral, triage, and channel-flow composition.

## Non-goals

Task745 does not implement API routes, DTO behavior, repair intake creation, identity verification, Case Binding, audit/contact log writer, DB persistence, migration, webhook, provider adapter, entitlement, Brand AI/RAG, usage tracking, reports, admin UI, smoke tests, package changes, or any runtime side effect.

## Verification

Required commands:

```sh
node --test tests/brandChannel/brandReferralNormalizerChannelFlow.integration.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- tests/brandChannel/brandReferralNormalizerChannelFlow.integration.test.js docs/task-745-brand-referral-normalizer-channel-flow-integration-guard-no-api-no-db.md docs/design/brand-official-line-channel-integration.md src/brandChannel
```

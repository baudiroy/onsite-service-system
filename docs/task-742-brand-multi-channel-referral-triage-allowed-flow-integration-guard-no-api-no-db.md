# Task742 - Brand Multi-channel Referral Triage Allowed-flow Integration Guard

Status: completed.

Scope: pure unit / integration-style guard / no API / no DB.

## Goal

Add a pure integration-style unit guard proving Task735 referral source policy, Task736 triage policy, and Task741 multi-LINE-channel policy compose safely. Multi-channel config may influence routing, but it never grants identity, Case Binding, customer access, direct case-data access, webhook, provider, audit, entitlement, usage, or AI / RAG runtime.

## Files Changed

- `tests/brandChannel/brandMultiChannelReferralTriage.integration.test.js`
- `docs/task-742-brand-multi-channel-referral-triage-allowed-flow-integration-guard-no-api-no-db.md`
- `docs/design/brand-official-line-channel-integration.md`

## Guarded Composition

- The integration guard imports only pure policy modules:
  - `brandReferralSourcePolicy`
  - `brandChannelTriagePolicy`
  - `multiLineChannelPolicy`
- Brand LINE referral metadata remains metadata only.
- Raw `line_user_id` is not returned.
- Customer service product questions route only to a brand-authorized knowledge future path.
- Repair intake and service status case-related paths require verification plus Case Binding or customer-visible policy.
- Sales / membership, dealer, and campaign channels cannot become direct case-query or customer-access channels.
- Regional service can route regional intake but not direct case data.
- Paused, disabled, archived, and unknown channels fail closed.
- Unsafe extras are stripped or ignored across referral, channel, and triage composition.

## Not Implemented

- No runtime routing.
- No webhook.
- No LINE signature verification.
- No provider adapter.
- No identity verification.
- No Case Binding runtime.
- No customer access runtime.
- No audit persistence.
- No entitlement runtime.
- No AI / RAG runtime.
- No usage tracking.
- No reports.
- No admin UI.
- No DB / migration / API / package / smoke changes.

## Verification

Planned verification:

- `node --test tests/brandChannel/brandMultiChannelReferralTriage.integration.test.js`
- `node --test tests/brandChannel/*.js`
- `npm run check`
- `git diff --check -- tests/brandChannel/brandMultiChannelReferralTriage.integration.test.js docs/task-742-brand-multi-channel-referral-triage-allowed-flow-integration-guard-no-api-no-db.md docs/design/brand-official-line-channel-integration.md src/brandChannel`

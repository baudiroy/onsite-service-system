# Task737 - Brand Referral + Triage Policy Integration Guard

Status: completed.

Scope: pure integration-style unit guard / no API / no DB.

## Goal

Add a pure integration-style unit guard proving Task735 referral source metadata and Task736 triage policy compose safely. Referral metadata may inform routing, but it must never grant identity, Case Binding, or case-data access.

## Changes

- Added `tests/brandChannel/brandReferralTriagePolicy.integration.test.js`.

## Guard Coverage

- The integration test imports only the two pure policy modules:
  - `src/brandChannel/brandReferralSourcePolicy.js`
  - `src/brandChannel/brandChannelTriagePolicy.js`
- Brand LINE referral metadata can feed triage routing without identity, Case Binding, or case-data access grants.
- Scoped LINE metadata remains metadata only; raw `line_user_id` is not returned.
- Existing case inquiry before verification still requires verification plus Case Binding.
- Existing case inquiry after verification flags still requires customer-visible data policy rather than granting direct case-data access.
- Product question routes only to the future brand-authorized knowledge path and cannot read case data.
- Complaint / dispute / high-risk routes to human escalation / review and forbids AI final decisions.
- Unsafe extras are stripped or ignored across referral and triage composition.

## Non-runtime Decision

This task does not implement runtime routing, webhook, customer verification, Case Binding, customer access, audit persistence, entitlement, provider integration, AI/RAG, API, DB schema, migration, smoke test, or package changes.

## Verification

Run:

```bash
node --test tests/brandChannel/brandReferralTriagePolicy.integration.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- tests/brandChannel/brandReferralTriagePolicy.integration.test.js docs/task-737-brand-referral-triage-policy-integration-guard-no-api-no-db.md docs/design/brand-official-line-channel-integration.md src/brandChannel
```

Expected:

- Integration-style guard passes.
- Existing Task735-736 pure policy tests pass.
- Project syntax check passes.
- Diff whitespace check passes.

## Future Tasks

- Brand referral source runtime records.
- Brand channel runtime route composition.
- Customer verification and Case Binding integration.
- Brand channel contact / audit persistence.
- Brand channel entitlement and provider governance.

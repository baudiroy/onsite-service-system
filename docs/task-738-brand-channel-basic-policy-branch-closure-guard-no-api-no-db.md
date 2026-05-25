# Task738 - Brand Channel Basic Policy Branch Closure Guard

Status: completed.

Scope: pure static closure guard / no API / no DB.

## Goal

Close the current Brand Channel Basic pure-policy branch by adding a closure guard that documents and statically asserts Task735-737 boundaries before any future API / DB / runtime adoption slice.

## Branch Summary

Task735-737 established the following accepted boundaries:

- `brandReferralSourcePolicy` is a pure deterministic source recognition helper.
- `brandChannelTriagePolicy` is a pure deterministic triage helper.
- Referral metadata may inform routing, but it never grants identity, Case Binding, or case-data access.
- Scoped LINE metadata requires `organization_id + line_channel_id + line_user_id`.
- Raw `line_user_id` is not returned.
- Existing case inquiry routes to verification plus Case Binding or customer-visible case policy, never direct case-data access.
- Product questions route only to brand-authorized knowledge future path.
- Complaint / dispute / high-risk issues route to human escalation / review.
- Unsafe values and payloads are stripped or ignored.

## Changes

- Added `tests/brandChannel/brandChannelBasicPolicyBranchClosure.static.test.js`.
- Added the Task735-738 closure note to `docs/design/brand-official-line-channel-integration.md`.

## Non-runtime Decision

No runtime adoption was performed.

No API, DB, migration, provider, LINE, webhook, AI/RAG, entitlement, billing, admin, package, or smoke behavior was changed.

This task does not implement API, webhook, customer verification, Case Binding, customer access, audit persistence, entitlement, provider, Brand AI/RAG, reports, templates, or routing.

## Verification

Run:

```bash
node --test tests/brandChannel/brandChannelBasicPolicyBranchClosure.static.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- tests/brandChannel/brandChannelBasicPolicyBranchClosure.static.test.js docs/task-738-brand-channel-basic-policy-branch-closure-guard-no-api-no-db.md docs/design/brand-official-line-channel-integration.md src/brandChannel
```

Expected:

- Closure static guard passes.
- Existing pure policy tests pass.
- Project syntax check passes.
- Diff whitespace check passes.

## Future Tasks

- Brand channel API adapter proposal.
- Brand referral source persistence design.
- Customer verification and Case Binding runtime integration.
- Contact / audit persistence.
- Entitlement and provider governance.

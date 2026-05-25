# Task746 - Basic Brand Referral Pure-policy Branch Closure Guard

Status: completed

Scope: pure static closure guard / no API / no DB / no runtime

## Goal

Close the Basic Brand Referral pure-policy branch by adding a closure guard that documents and statically asserts Task735-745 boundaries before any future API, DB, provider, LINE webhook, identity verification, Case Binding, entitlement, audit, usage tracking, AI/RAG, admin UI, or runtime adoption slice.

## Changed Files

- `tests/brandChannel/basicBrandReferralPolicyBranchClosure.static.test.js`
- `docs/task-746-basic-brand-referral-policy-branch-closure-guard-no-runtime.md`
- `docs/design/brand-official-line-channel-integration.md`

## Closure Summary

Task735-746 close the Basic Brand Referral pure-policy branch. The accepted boundary includes:

- brand referral source recognition
- brand channel triage
- referral + triage composition guard
- multi-LINE-channel allowed-flow policy
- multi-channel referral triage integration guard
- brand referral request normalizer
- request normalizer + channel flow integration guard
- static closure guard

The branch is pure policy and static verification only. Request-like input may become safe routing metadata, but it never grants identity, Case Binding, customer access, case-data access, intake creation, contact/audit persistence, webhook, provider runtime, entitlement, usage tracking, report generation, admin UI, or AI/RAG runtime.

## Static Guard Coverage

The closure guard asserts:

- Task735-745 evidence docs and tests exist.
- Pure brandChannel modules have no DB, API, provider, LINE, webhook, AI/RAG, env, filesystem, network, config, entitlement, audit, contact, or runtime imports/calls.
- The request normalizer imports only `./brandReferralSourcePolicy`.
- Referral/request metadata never grants:
  - `identityVerified`
  - `caseBinding`
  - `caseDataAccess`
  - `intakeCreated`
  - `auditWritten`
- Raw `line_user_id` is not returned.
- Scoped LINE context remains metadata only.
- `campaign`, `sales_membership`, and `dealer_channel` cannot directly query case data or customer access.
- `repair_intake` and `service_status` case flows require verification plus Case Binding / customer-visible policy.
- Product questions route only to a brand-authorized knowledge future path.
- Brand Knowledge AI remains channel-level and does not invoke AI/RAG runtime.
- Unsafe extras are stripped or ignored in pure branch coverage.

## Verification

Required commands:

```sh
node --test tests/brandChannel/basicBrandReferralPolicyBranchClosure.static.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- tests/brandChannel/basicBrandReferralPolicyBranchClosure.static.test.js docs/task-746-basic-brand-referral-policy-branch-closure-guard-no-runtime.md docs/design/brand-official-line-channel-integration.md src/brandChannel
```

## No-runtime Decision

No runtime adoption was performed.

No API, DB, migration, provider, LINE, webhook, identity verification, Case Binding, repair intake creation, audit/contact persistence, AI/RAG, entitlement, billing, admin, package, or smoke behavior was changed.

Future runtime adoption must be split into explicit scoped tasks with separate approval for API, DB/migration, permission, audit, provider/LINE, identity verification, Case Binding, entitlement, usage tracking, admin UI, and smoke/integration coverage.

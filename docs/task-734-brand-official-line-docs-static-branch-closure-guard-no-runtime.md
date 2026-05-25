# Task734 - Brand Official LINE Docs-static Branch Closure Guard

Status: completed.

Scope: docs-only static guard / no runtime change.

## Goal

Close the Brand Official LINE / Brand Channel docs-static mini-branch by adding a closure guard that summarizes and statically asserts Task727-733 boundaries before any future runtime slice.

## Branch Summary

Task727-733 established the following accepted boundaries:

- Basic platform capability covers brand source recognition, referral / routing, repair intake link, verification, Case Binding, Customer Access after verification, contact history, and audit log.
- Professional / Enterprise / add-on capability covers brand official LINE webhook, LINE signature verification, provider adapter customization, Brand Knowledge AI/RAG, multiple LINE channels, deep customer-service routing, brand usage analytics, advanced reports, and advanced templates.
- Brand official LINE is a customer entry channel only, not case identity.
- `line_user_id` must be scoped by `organization_id + line_channel_id + line_user_id`.
- `customer_channel_identity` or equivalent binding must not be created from LINE id alone.
- Unverified users cannot query case data.
- Verified customer-facing case disclosure requires verification plus Case Binding.
- Brand product questions, repair intake, existing case inquiries, and complaint / dispute / high-risk issues are triaged separately.
- Brand Knowledge AI, Customer Case AI, and Internal Service AI remain separately bounded.
- Referral, contact, and audit trail requirements are documented and must not include raw sensitive values.
- Future runtime requires explicit API, DB / migration, permission, audit, provider, LINE, AI/RAG, and entitlement scope.

## Changes

- Added `tests/docs/brandOfficialLineBranchClosure.static.test.js`.
- Added the `Task727-734 Docs-static Branch Closure` section to `docs/design/brand-official-line-channel-integration.md`.

## Non-runtime Decision

No runtime implementation was performed.

No API, DB, migration, provider, LINE, AI/RAG, entitlement, billing, admin, package, or smoke behavior was changed.

This task does not implement webhook, identity binding runtime, Case Binding runtime, entitlement runtime, provider adapter, RAG, Brand AI, reports, templates, or routing.

## Verification

Run:

```bash
node --test tests/docs/brandOfficialLineBranchClosure.static.test.js
node --test tests/docs/brandOfficialLineChannelBoundary.static.test.js tests/docs/brandChannelIdentityScope.static.test.js tests/docs/brandChannelTriageAiBoundary.static.test.js tests/docs/brandOfficialLineEntitlementBoundary.static.test.js tests/docs/brandChannelReferralAuditBoundary.static.test.js
git diff --check -- tests/docs/brandOfficialLineBranchClosure.static.test.js docs/task-734-brand-official-line-docs-static-branch-closure-guard-no-runtime.md docs/design/brand-official-line-channel-integration.md docs/design/saas-plan-entitlement-and-add-ons.md
```

Expected:

- Closure static guard passes.
- Existing Brand Official LINE docs-static guards pass.
- Diff whitespace check passes.

## Future Tasks

- Brand source tracking / referral source runtime slice.
- Customer verification and Case Binding runtime.
- Brand channel identity scope runtime guard.
- Brand official LINE webhook adapter add-on.
- LINE signature verification and provider adapter governance.
- Brand Knowledge AI / RAG add-on.
- Brand channel entitlement and usage tracking.
- Brand referral / contact / audit runtime.

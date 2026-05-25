# Task728 — Brand Official LINE Add-on Boundary Static Guard

Status: completed.

Scope: docs/static test only. No runtime behavior change.

## Goal

Add a static guard for the Brand Official LINE / Brand Channel Integration baseline so future docs and code do not blur Basic platform capability with Professional / Enterprise add-ons, and do not treat LINE identity as case identity.

## Changes

- Added `tests/docs/brandOfficialLineChannelBoundary.static.test.js`.
- The static guard validates:
  - Basic platform capability includes brand source recognition, referral routing, repair intake link, verification, Case Binding, contact history, and audit log.
  - Brand official LINE webhook, Brand Knowledge AI / RAG, multiple LINE channels, brand templates / reports, usage tracking, and deep customer-service routing remain add-on / Enterprise capabilities, not Basic defaults.
  - Brand official LINE is a customer entry channel, not case identity.
  - `line_user_id` must be scoped by `organization_id + line_channel_id + line_user_id`.
  - Unverified customers cannot query case data.
  - Customer-visible case data requires verification and Case Binding.
  - Brand Knowledge AI, Customer Case AI, and Internal Service AI are separately bounded.
  - Unverified brand LINE users must not see internal notes, raw audit log content, AI raw payload, billing / settlement internals, engineer internal comments, supervisor review, unconfirmed appointment suggestions, or cross-organization data.

## Runtime Decision

No runtime implementation was performed.

This task did not implement webhook runtime, LINE signature verification, provider adapter, Brand AI / RAG, entitlement runtime, reports, templates, customer-service routing, API, DB schema, migration, smoke tests, or package changes.

## Verification

Required commands:

```sh
node --test tests/docs/brandOfficialLineChannelBoundary.static.test.js
git diff --check -- tests/docs/brandOfficialLineChannelBoundary.static.test.js docs/task-728-brand-official-line-add-on-boundary-static-guard-docs-only-no-runtime.md docs/design/brand-official-line-channel-integration.md docs/design/saas-plan-entitlement-and-add-ons.md
```

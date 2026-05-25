# Task730 - Brand Channel Identity Scope Static Guard

Status: completed.

Scope: docs-only static guard / no runtime change.

## Goal

Add a static documentation guard for Brand Official LINE / Brand Channel identity scope before any runtime work. The guard verifies that Brand Official LINE is only a customer entry channel, `line_user_id` is not global identity, and customer-visible case data requires verification plus Case Binding.

## Changes

- Added `tests/docs/brandChannelIdentityScope.static.test.js`.
- Clarified `docs/design/brand-official-line-channel-integration.md`:
  - `customer_channel_identity` or equivalent customer binding must not be created from LINE id alone.
  - Unverified customers cannot query case progress, appointments, missing information requests, customer-facing completion report, issue / dispute status, or other customer-visible case data.
  - Cross-organization and cross-tenant case access is forbidden.
  - Unverified brand LINE users must not see `finalAppointmentId` or full PII.

## Non-runtime Decision

This task does not implement LINE webhook, customer verification, Case Binding runtime, provider adapter, RAG, Brand AI, entitlement runtime, reports, API, DB schema, migrations, permissions runtime, audit runtime, or smoke tests.

## Verification

Run:

```bash
node --test tests/docs/brandChannelIdentityScope.static.test.js
git diff --check -- tests/docs/brandChannelIdentityScope.static.test.js docs/task-730-brand-channel-identity-scope-static-guard-docs-only-no-runtime.md docs/design/brand-official-line-channel-integration.md docs/PROJECT_GUARDRAILS.md
```

Expected:

- Static guard passes.
- Diff whitespace check passes.

## Future Tasks

- Brand source tracking / referral source runtime slice.
- Customer verification and Case Binding for brand entry.
- Brand channel identity scope guard runtime.
- Brand official LINE webhook adapter add-on.
- Brand Knowledge AI / RAG add-on.
- Brand referral report and usage tracking.

# Task732 - Brand Official LINE SaaS Entitlement Add-on Static Guard

Status: completed.

Scope: docs-only static guard / no runtime change.

## Goal

Add a static documentation guard proving Brand Official LINE / Brand Channel features are separated by plan and entitlement before runtime. Basic keeps referral, routing, verification, Case Binding, Customer Access after verification, contact history, and audit log. Webhook, RAG, Brand AI, multi-channel, deep routing, and advanced brand reports remain Professional / Enterprise / add-on capabilities.

## Changes

- Added `tests/docs/brandOfficialLineEntitlementBoundary.static.test.js`.
- Clarified `docs/design/saas-plan-entitlement-and-add-ons.md`:
  - Basic excludes brand official LINE webhook, Brand Knowledge AI/RAG, multiple LINE channels, deep routing, provider adapter customization, brand channel usage analytics, and brand-specific reports / templates beyond basic messaging.
  - Professional may include richer templates, reports, and categorization, but full webhook, Brand Knowledge AI/RAG, and multiple LINE channels remain add-on or Enterprise unless explicitly packaged otherwise.
  - Add-on features require entitlement, user permission, audit log, provider governance, and usage / cost attribution before runtime.
  - No plan may grant unverified case-data access.

## Static Guard Coverage

- Basic capability boundary.
- Basic exclusion boundary.
- Professional capability boundary.
- Enterprise / add-on capability boundary.
- Entitlement, permission, audit, provider governance, and usage attribution requirements.
- No unverified case-data access under any plan.
- Cross-document alignment with `docs/design/brand-official-line-channel-integration.md`.

## Non-runtime Decision

This task does not implement pricing runtime, billing runtime, invoice runtime, payment runtime, usage metering runtime, subscription runtime, plan entitlement runtime, seat billing runtime, LINE provider runtime, webhook runtime, AI/RAG runtime, API, DB schema, migrations, smoke tests, or package changes.

## Verification

Run:

```bash
node --test tests/docs/brandOfficialLineEntitlementBoundary.static.test.js
git diff --check -- tests/docs/brandOfficialLineEntitlementBoundary.static.test.js docs/task-732-brand-official-line-saas-entitlement-add-on-static-guard-docs-only-no-runtime.md docs/design/saas-plan-entitlement-and-add-ons.md docs/design/brand-official-line-channel-integration.md
```

Expected:

- Static guard passes.
- Diff whitespace check passes.

## Future Tasks

- Brand add-on entitlement resolver.
- Feature availability guard for brand official LINE webhook.
- Brand Knowledge AI entitlement and usage guard.
- Brand channel usage metering.
- Brand report entitlement guard.
- Enterprise add-on configuration audit log.

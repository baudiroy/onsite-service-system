# Task740 - Multi Official LINE Channel Identity Scope Static Guard

Status: completed.

Scope: docs-static guard / no runtime change.

## Goal

Add a static documentation guard for multi official LINE channel identity rules. The guard prevents future design drift back to a single-channel brand assumption, global `line_user_id` identity, silent cross-channel merge, or unverified case-data access.

## Files Changed

- `tests/docs/multiOfficialLineChannelIdentityScope.static.test.js`
- `docs/task-740-multi-official-line-channel-identity-scope-static-guard-docs-only-no-runtime.md`

## Guarded Rules

- One brand or organization may have multiple official LINE channels.
- The design forbids a brand-to-single-`line_channel_id` assumption.
- `line_user_id` is not global identity.
- LINE identity remains scoped by `organization_id + line_channel_id + line_user_id`.
- A LINE id alone never grants customer identity, Case Binding, or case-data access.
- Silent merge across channels, providers, brands, or organizations is forbidden.
- Any future customer identity merge requires verification, permission, conflict handling, and audit log.
- Each channel has purpose / allowed-flow boundaries.
- Campaign, sales, membership, and dealer channels cannot directly query case data.
- Unverified users cannot query case progress, appointments, reschedule, missing information, customer-facing completion report, issue / dispute status, or other customer-visible case data.
- The docs must not introduce concrete secrets, credential-like assignments, or API keys.

## Non-runtime Decision

No runtime adoption was performed.

This task did not implement brand channel tables, migrations, provider adapters, LINE webhook routing, identity binding, Case Binding, audit writer, entitlement runtime, Brand AI / RAG, usage tracking, reports, admin UI, smoke tests, or package changes.

## Verification

Planned verification:

- `node --test tests/docs/multiOfficialLineChannelIdentityScope.static.test.js`
- `git diff --check -- tests/docs/multiOfficialLineChannelIdentityScope.static.test.js docs/task-740-multi-official-line-channel-identity-scope-static-guard-docs-only-no-runtime.md docs/design/brand-official-line-channel-integration.md docs/PROJECT_GUARDRAILS.md`

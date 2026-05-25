# Task743 - Multi Official LINE Channel Branch Closure Guard

Status: completed.

Scope: docs + pure static closure guard / no runtime change.

## Goal

Close the current Multi Official LINE Channels per Brand docs / pure-policy branch by adding a closure guard that documents and statically asserts Task739-742 boundaries before any future API, DB, webhook, entitlement, provider, AI / RAG, or runtime adoption slice.

## Files Changed

- `tests/brandChannel/multiOfficialLineChannelBranchClosure.static.test.js`
- `docs/task-743-multi-official-line-channel-branch-closure-guard-no-runtime.md`
- `docs/design/brand-official-line-channel-integration.md`

## Closure Summary

Task739-743 established and guarded:

- A brand or organization may have multiple official LINE channels.
- The design forbids a brand-to-single-`line_channel_id` assumption.
- `line_user_id` is scoped by `organization_id + line_channel_id + line_user_id`.
- Raw LINE user id is not returned by pure policies.
- Silent identity merge across channels, providers, brands, or organizations is forbidden.
- Unverified users cannot access customer-facing case data.
- Campaign, sales / membership, and dealer channels cannot directly query case data or become customer-access channels.
- Repair intake and service status case flows require verification plus Case Binding / customer-visible policy.
- Brand Knowledge AI / RAG is channel-level and requires channel AI / RAG enablement plus `knowledge_base_id`.
- Multi-LINE-channel depth, webhook, channel-specific templates, channel-specific RAG / AI, usage tracking, channel audit, reports, and deep routing are not Basic defaults.

## Not Implemented

- No API.
- No DB / migration / DDL.
- No brand channel table.
- No LINE webhook.
- No LINE signature verification.
- No provider adapter.
- No identity binding runtime.
- No Case Binding runtime.
- No entitlement runtime.
- No audit writer.
- No usage tracking.
- No reports.
- No admin UI.
- No AI / RAG runtime.
- No smoke, package, config, token, or secret changes.

## Verification

Planned verification:

- `node --test tests/brandChannel/multiOfficialLineChannelBranchClosure.static.test.js`
- `node --test tests/brandChannel/*.js`
- `node --test tests/docs/multiOfficialLineChannelIdentityScope.static.test.js`
- `npm run check`
- `git diff --check -- tests/brandChannel/multiOfficialLineChannelBranchClosure.static.test.js docs/task-743-multi-official-line-channel-branch-closure-guard-no-runtime.md docs/design/brand-official-line-channel-integration.md docs/design/saas-plan-entitlement-and-add-ons.md src/brandChannel`

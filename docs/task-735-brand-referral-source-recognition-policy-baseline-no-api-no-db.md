# Task735 - Brand Referral Source Recognition Policy Baseline

Status: completed.

Scope: pure runtime module / no API / no DB.

## Goal

Create a pure deterministic brand referral / source recognition policy helper for future Basic brand referral runtime. The helper normalizes source metadata and validates safe referral context without creating identity, Case Binding, audit records, webhook handling, provider calls, or DB writes.

## Changes

- Added `src/brandChannel/brandReferralSourcePolicy.js`.
- Added `tests/brandChannel/brandReferralSourcePolicy.unit.test.js`.

## Runtime Boundary

The module is pure and deterministic:

- no DB import
- no repository import
- no API/router/controller/service wiring
- no provider / LINE / SMS / App push runtime
- no webhook adapter
- no AI/RAG runtime
- no env / fs / network / logger / config dependency

## Behavior

The helper normalizes:

- `brand_id`
- `organization_id`
- `source_channel`
- `referral_source`
- `entry_context`
- `line_channel_id`

Supported `source_channel` values:

- `brand_line`
- `brand_website`
- `platform_line`
- `platform_web`
- `sms`
- `manual`
- `unknown`

Blank or unsupported source values fail safe to `unknown` with `reasonKey = unknown_source_fails_safe`.

LINE context is metadata only. `line_user_id` alone is never treated as identity. A scoped LINE context requires `organization_id + line_channel_id + line_user_id`, and the raw `line_user_id` is never echoed in the normalized result.

The returned `grants` are always:

```json
{
  "identityVerified": false,
  "caseBinding": false,
  "caseDataAccess": false
}
```

## Non-goals

This task does not implement:

- webhook runtime
- customer verification
- Case Binding
- contact / audit persistence
- entitlement runtime
- provider adapter
- Brand AI/RAG
- API route
- DB schema
- migration
- smoke test

## Verification

Run:

```bash
node --test tests/brandChannel/brandReferralSourcePolicy.unit.test.js
npm run check
git diff --check -- src/brandChannel/brandReferralSourcePolicy.js tests/brandChannel/brandReferralSourcePolicy.unit.test.js docs/task-735-brand-referral-source-recognition-policy-baseline-no-api-no-db.md docs/design/brand-official-line-channel-integration.md
```

Expected:

- Unit tests pass.
- Project syntax check passes.
- Diff whitespace check passes.

## Future Tasks

- Brand referral source runtime records.
- Customer verification and Case Binding runtime.
- Brand channel identity scope guard runtime.
- Contact history / audit persistence.
- Entitlement guard for Brand official LINE add-on.

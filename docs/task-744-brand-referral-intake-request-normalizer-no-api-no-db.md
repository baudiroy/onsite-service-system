# Task744 - Brand Referral Intake Request Normalizer

## Goal

Create a pure request normalizer for future Basic brand referral intake. The normalizer composes with the Task735 `brandReferralSourcePolicy` to sanitize request-like input into safe referral metadata without verifying identity, binding a case, creating an intake draft, writing audit/contact logs, or accessing runtime services.

## Changed Files

- `src/brandChannel/brandReferralRequestNormalizer.js`
- `tests/brandChannel/brandReferralRequestNormalizer.unit.test.js`
- `docs/task-744-brand-referral-intake-request-normalizer-no-api-no-db.md`
- `docs/design/brand-official-line-channel-integration.md`

## Contract

`normalizeBrandReferralRequest(input)` accepts request-like objects with safe values in root, `body`, `query`, or `params`, and returns:

- safe normalized metadata:
  - `organization_id`
  - `brand_id`
  - `source_channel`
  - `referral_source`
  - `entry_context`
  - `line_channel_id`
  - scoped LINE context flags
- explicit no-runtime grants:
  - `identityVerified: false`
  - `caseBinding: false`
  - `caseDataAccess: false`
  - `intakeCreated: false`
  - `auditWritten: false`
- `reasonKey`
- `requiredNextStep`

## Safety Boundary

The module is pure and deterministic. It imports only `./brandReferralSourcePolicy`.

It does not import or call:

- DB, repository, query executor, migration, or schema code
- API route, controller, service, or Express code
- provider, LINE, SMS, App push, webhook, or signature verification code
- identity verification, Case Binding, repair intake creation, audit writer, contact log, notification, entitlement, billing, report, admin UI, AI, RAG, or usage tracking runtime
- `process.env`, network, filesystem, config, or logger code

## Sensitive Data Handling

The normalizer strips or ignores unsafe extras, including token, secret, LINE access token, channel secret, raw LINE id, full phone/address, raw provider payload, AI payload, full customer payload, credential-like values, and DB URL-like values.

Raw `line_user_id` is never returned. LINE context remains scoped metadata only, and `line_user_id` alone never becomes identity or case access.

## Verification

Required commands:

```sh
node --test tests/brandChannel/brandReferralRequestNormalizer.unit.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- src/brandChannel/brandReferralRequestNormalizer.js tests/brandChannel/brandReferralRequestNormalizer.unit.test.js docs/task-744-brand-referral-intake-request-normalizer-no-api-no-db.md docs/design/brand-official-line-channel-integration.md
```

## Non-goals

Task744 does not implement API routes, repair intake creation, identity verification, Case Binding, audit/contact log persistence, DB persistence, webhook, provider adapter, entitlement, Brand AI/RAG, usage tracking, reports, smoke tests, admin UI, package changes, or migration.

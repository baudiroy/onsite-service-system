# Task749 - Basic Brand Referral API Normalization Closure Guard

Status: completed

Scope: static closure guard / no DB / no route mount

## Goal

Close the Basic Brand Referral API normalization-only slice by documenting and statically asserting that Task748 remains a safe envelope adapter only.

## Changed Files

- `tests/brandChannel/brandReferralApiNormalizationClosure.static.test.js`
- `docs/task-749-basic-brand-referral-api-normalization-closure-guard-no-db-no-route-mount.md`
- `docs/design/brand-official-line-channel-integration.md`

## Closure Summary

Task748-749 close the Basic Brand Referral API normalization-only slice.

Task748 added a minimal synthetic app adapter that accepts request-like input, calls the pure `normalizeBrandReferralRequest`, and returns a safe normalized referral envelope only.

No public route was mounted.

No DB persistence, Case creation, repair intake draft creation, identity verification, Case Binding, audit/contact persistence, provider/webhook call, entitlement check, usage tracking, report generation, admin UI, or AI/RAG runtime was added.

## Static Guard Coverage

The closure guard asserts:

- Task748 evidence files exist.
- The design doc records the Task748-749 normalization-only closure.
- `brandReferralApp` imports only `./brandReferralRequestNormalizer`.
- `brandReferralApp` does not import or call DB, repository, server/listen, route mounting, provider, LINE/webhook, verification, Case Binding, repair intake/Case creation, audit/contact writer, entitlement, AI/RAG, env, filesystem, network, logger, or config runtime.
- The response envelope exposes only safe normalized referral metadata and no customer case data.
- Grants remain:
  - `identityVerified: false`
  - `caseBinding: false`
  - `caseDataAccess: false`
  - `intakeCreated: false`
  - `auditWritten: false`
- Raw `line_user_id`, token, secret, LINE access token, channel secret, full phone/address, raw provider payload, AI payload, full customer payload, credential, and DB URL-like values are not returned.

## Verification

Required commands:

```sh
node --test tests/brandChannel/brandReferralApiNormalizationClosure.static.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- tests/brandChannel/brandReferralApiNormalizationClosure.static.test.js docs/task-749-basic-brand-referral-api-normalization-closure-guard-no-db-no-route-mount.md docs/design/brand-official-line-channel-integration.md src/brandChannel/brandReferralApp.js
```

## No-runtime Decision

No API route, DB, migration, provider, LINE, webhook, identity verification, Case Binding, repair intake creation, audit/contact persistence, AI/RAG, entitlement, billing, admin, package, or smoke behavior was changed.

Future adoption of a public API route, DB persistence, audit/contact writer, verification, Case Binding, repair intake handoff, provider/webhook, entitlement, or smoke coverage must be separately scoped and approved.

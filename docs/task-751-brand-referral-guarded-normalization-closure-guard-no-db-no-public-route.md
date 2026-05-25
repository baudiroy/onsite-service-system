# Task751 - Brand Referral Guarded Normalization Closure Guard

Status: completed

Scope: static closure guard / no DB / no public route

## Goal

Close the guarded Brand Referral normalization slice by documenting and statically asserting that Task748 through Task750 remain guard-first, normalization-only, no public route mount, and no side effects.

## Changed Files

- `tests/brandChannel/brandReferralGuardedNormalizationClosure.static.test.js`
- `docs/task-751-brand-referral-guarded-normalization-closure-guard-no-db-no-public-route.md`
- `docs/design/brand-official-line-channel-integration.md`

No runtime source change was required for Task751.

## Closure Decision

Task748-751 close the Basic Brand Referral guarded API normalization slice.

The accepted boundary is:

- The synthetic app/API adapter returns a safe normalized referral envelope only.
- When `requireAccessGuard` is enabled, an injected guard must allow the request before the normalized referral output is trusted.
- Denied requests return a safe deny envelope and omit referral output.
- Allowed requests still only produce normalization metadata and no identity, Case Binding, case-data, intake, or audit grants.
- The app imports only the pure request normalizer and does not import a real permission service, entitlement service, DB, route, provider, webhook, Case, intake, audit, contact, or AI/RAG runtime.
- No public route was mounted.

No DB, migration, provider, LINE, webhook, identity verification, Case Binding, repair intake creation, audit/contact persistence, entitlement service, AI/RAG, admin, package, or smoke behavior was changed.

## Coverage

The closure guard asserts:

- Task748, Task749, and Task750 evidence docs/tests exist.
- The design doc records the Task748-751 guarded normalization closure.
- `brandReferralApp` imports only `./brandReferralRequestNormalizer`.
- `brandReferralApp` does not import/call DB, repository, server/listen, route mounting, provider, LINE/webhook, verification, Case Binding, repair intake/Case creation, audit/contact writer, entitlement service, AI/RAG, env, fs, network, logger, or config runtime.
- Denial occurs before normalized referral output is trusted.
- Denied envelopes do not echo raw LINE id, phone-like values, provider payload, AI payload, full customer payload, credentials, or DB URL-like values.
- Allowed envelopes remain normalization-only and keep `identityVerified`, `caseBinding`, `caseDataAccess`, `intakeCreated`, and `auditWritten` false.

## Verification

Required commands:

```sh
node --test tests/brandChannel/brandReferralGuardedNormalizationClosure.static.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- tests/brandChannel/brandReferralGuardedNormalizationClosure.static.test.js docs/task-751-brand-referral-guarded-normalization-closure-guard-no-db-no-public-route.md docs/design/brand-official-line-channel-integration.md src/brandChannel/brandReferralApp.js
```

## Explicit Non-goals

Task751 does not implement public route, DB, audit/contact persistence, verification, Case Binding, repair intake, webhook, provider adapter, real entitlement service, Brand AI/RAG, reports, admin UI, smoke tests, or package changes.

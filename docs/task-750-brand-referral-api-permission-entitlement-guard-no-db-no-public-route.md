# Task750 - Brand Referral API Permission and Entitlement Guard

## Goal

Add a bounded synthetic permission / entitlement guard around the existing Brand Referral normalization app path so future route mounting can fail closed.

This task does not mount a public route, write DB/audit, verify identity, bind Case, create intake, call provider, or call AI/RAG.

## Changed Files

- `src/brandChannel/brandReferralAccessGuard.js`
- `src/brandChannel/brandReferralApp.js`
- `tests/brandChannel/brandReferralAccessGuard.unit.test.js`
- `tests/brandChannel/brandReferralApiPermissionGuard.unit.test.js`
- `docs/task-750-brand-referral-api-permission-entitlement-guard-no-db-no-public-route.md`

## Runtime Boundary

The guard is synthetic and injected:

- `evaluateBrandReferralAccess({ request, context })`
- `buildBrandReferralAccessDeniedResponse(decision)`
- `normalizeBrandReferralApiRequest(request, { requireAccessGuard, accessGuard, accessContext })`

The guard requires:

- request organization scope
- context organization scope
- matching organization scope
- explicit synthetic permission flag
- explicit synthetic entitlement flag

The guard does not call a real permission service, entitlement service, billing service, DB, provider, webhook, AI/RAG, or audit/contact writer.

## Failure Behavior

Denied requests return a safe 403 envelope before normalized referral output is trusted.

Safe deny reasons include:

- `missing_organization_scope`
- `organization_scope_mismatch`
- `brand_referral_permission_denied`
- `brand_referral_entitlement_denied`
- `brand_referral_access_guard_missing`

Denied responses do not include raw permission internals, entitlement internals, tokens, secrets, raw LINE id, full phone/address, provider payload, AI payload, full customer payload, credentials, or DB URL-like values.

## Allowed Behavior

Allowed requests still return normalization-only envelopes. They do not grant:

- identity verification
- Case Binding
- case-data access
- intake creation
- audit writing

## Verification

Required commands:

```sh
node --test tests/brandChannel/brandReferralAccessGuard.unit.test.js tests/brandChannel/brandReferralApiPermissionGuard.unit.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- src/brandChannel/brandReferralAccessGuard.js src/brandChannel/brandReferralApp.js tests/brandChannel/brandReferralAccessGuard.unit.test.js tests/brandChannel/brandReferralApiPermissionGuard.unit.test.js docs/task-750-brand-referral-api-permission-entitlement-guard-no-db-no-public-route.md
```

## Non-goals

Task750 does not implement a real permission model, entitlement service, billing, public route mount, DB, audit/contact persistence, verification, Case Binding, repair intake, webhook, provider adapter, AI/RAG, reports, admin UI, smoke tests, or package changes.

# Task752 - Basic Brand Referral Route Adapter Contract

Status: completed

Scope: route-style adapter contract / no global mount / no DB

## Goal

Create a small route-style adapter for Basic Brand Referral guarded normalization that can be mounted in a future task, without mounting it to any public server or global router yet.

## Changed Files

- `src/brandChannel/brandReferralRouteAdapter.js`
- `tests/brandChannel/brandReferralRouteAdapter.unit.test.js`
- `docs/task-752-basic-brand-referral-route-adapter-contract-no-global-mount-no-db.md`

## Behavior

The adapter exports:

- `handleBrandReferralRouteRequest(request, options)`
- `createBrandReferralRouteAdapter(options)`

The route-style adapter:

- Accepts synthetic request-like objects only.
- Requires the existing guarded normalization path by default.
- Denies before normalized referral output is returned when the injected guard is missing, denies permission, denies entitlement, or detects organization scope mismatch.
- Returns safe malformed/error envelopes without stack traces or raw internals.
- Keeps allowed responses normalization-only and preserves `identityVerified`, `caseBinding`, `caseDataAccess`, `intakeCreated`, and `auditWritten` as false.
- Exposes `mounted: false` and `publicRouteMounted: false` metadata on the factory output to make the no-mount boundary explicit.

No global route/server/app mount was added.

## Explicit Non-goals

Task752 does not create intake, create Case, verify identity, bind Case, write audit/contact log, persist DB, call provider/webhook/LINE, call AI/RAG, implement entitlement service, add admin UI, change package files, add migrations, or add smoke tests.

## Verification

Required commands:

```sh
node --test tests/brandChannel/brandReferralRouteAdapter.unit.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- src/brandChannel/brandReferralRouteAdapter.js src/brandChannel/brandReferralApp.js tests/brandChannel/brandReferralRouteAdapter.unit.test.js docs/task-752-basic-brand-referral-route-adapter-contract-no-global-mount-no-db.md
```

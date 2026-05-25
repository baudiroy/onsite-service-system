# Task755 - Brand Referral Public Route Mount

Status: completed

Scope: public route mount / guarded normalization only / no DB / no Case creation

## Goal

Mount the Basic Brand Referral guarded-normalization route into the existing public router path while keeping the route guard-first, normalization-only, and side-effect-free.

## Changed Files

- `src/routes/public.routes.js`
- `tests/brandChannel/brandReferralPublicRouteMount.unit.test.js`
- `tests/brandChannel/brandReferralPublicRouteMount.static.test.js`
- `docs/task-755-brand-referral-public-route-mount-guarded-normalization-only-no-db-no-case-creation.md`

## Route

The route is mounted as:

- `POST /api/v1/public/brand-referral/normalize`

`src/routes/index.js` already mounts `publicRouter` at `/api/v1/public`; Task755 only adds the child route inside `src/routes/public.routes.js`.

## Behavior

- Default public router fails closed when no synthetic access guard is injected.
- `createPublicRouter({ brandReferral })` can inject the synthetic access guard and context for unit tests or future wiring.
- Denied responses omit referral output.
- Allowed responses return safe normalized referral metadata only.
- Allowed responses keep `identityVerified`, `caseBinding`, `caseDataAccess`, `intakeCreated`, and `auditWritten` false.
- Raw `line_user_id` is not returned.

## Explicit Non-goals

No DB, migration, provider, LINE, webhook, identity verification, Case Binding, repair intake creation, audit/contact persistence, entitlement service, AI/RAG, admin, package, or smoke behavior was changed.

Task755 does not create repair intake, create Case, verify identity, bind Case, write audit/contact log, persist DB, call provider/webhook/LINE, call AI/RAG, implement entitlement service, add admin UI, change package files, or add smoke tests.

## Verification

Required commands:

```sh
node --test tests/brandChannel/brandReferralPublicRouteMount.unit.test.js tests/brandChannel/brandReferralPublicRouteMount.static.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- src/brandChannel/brandReferralRouteAdapter.js src/routes/public.routes.js tests/brandChannel/brandReferralPublicRouteMount.unit.test.js tests/brandChannel/brandReferralPublicRouteMount.static.test.js docs/task-755-brand-referral-public-route-mount-guarded-normalization-only-no-db-no-case-creation.md
```

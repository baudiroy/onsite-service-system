# Task756 — Brand Referral Public Route Mount Closure Guard / No DB No Side Effects

Status: completed

Scope: static closure guard / guarded normalization only / public route mount boundary / no DB / no side effects

## Summary

Task756 closes the Task755 public route mount slice for Basic Brand Referral guarded normalization.

The accepted route is:

- `POST /api/v1/public/brand-referral/normalize`

The route remains:

- guard-first
- normalization-only
- synthetic/injected-access guarded
- fail-closed without an injected access guard
- free of customer case data disclosure
- free of side-effect runtimes

No DB, migration, repository, provider, LINE, SMS, App, webhook, identity verification, Case Binding, repair intake creation, audit/contact persistence, entitlement service, AI/RAG, admin, package, or smoke behavior was changed.

## Boundary

Task755 mounted the route under the existing public router only. Task756 verifies that the mounted route continues to delegate to the guarded Brand Referral adapter and does not expand into a customer identity, Case Binding, repair intake, provider, audit, entitlement, or AI flow.

The route may normalize request-like referral metadata after access is allowed, but it must not:

- create a Case
- create a repair intake draft
- verify customer identity
- bind a customer to a Case
- read customer case data
- write audit/contact records
- call LINE, SMS, App push, webhook, or provider adapters
- call AI/RAG
- persist to DB
- read DB, repository, env, config, filesystem, or network resources

## Closure Guard

The closure static test verifies:

- the public route file exists
- the route path appears once
- the route delegates to `handleBrandReferralRouteRequest`
- `requireAccessGuard: true` is set
- injected `accessGuard` and `accessContext` are passed through
- the default `publicRouter` is created without injected guard context
- existing unit coverage proves the default route fails closed
- existing unit coverage proves allowed responses remain normalization-only
- unsafe output is denied
- side-effect runtimes are not imported by `src/routes/public.routes.js`

## Safe Response Contract

Allowed responses remain normalization-only and must preserve these no-runtime grants:

- `identityVerified=false`
- `caseBinding=false`
- `caseDataAccess=false`
- `intakeCreated=false`
- `auditWritten=false`

Responses must not expose:

- token, secret, LINE access token, channel secret, raw LINE id, full phone, full address, provider payload, AI payload, full customer payload, credential, DB URL, stack, SQL

## Changed Files

- `tests/brandChannel/brandReferralPublicRouteMountClosure.static.test.js`
- `docs/task-756-brand-referral-public-route-mount-closure-guard-no-db-no-side-effects.md`
- `docs/design/brand-official-line-channel-integration.md`

## Verification

Run:

```bash
node --test tests/brandChannel/brandReferralPublicRouteMountClosure.static.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- tests/brandChannel/brandReferralPublicRouteMountClosure.static.test.js docs/task-756-brand-referral-public-route-mount-closure-guard-no-db-no-side-effects.md docs/design/brand-official-line-channel-integration.md src/routes/public.routes.js
```

## Non-goals

This task does not implement:

- DB persistence
- migration/schema/index changes
- repair intake creation
- Case creation
- identity verification
- Case Binding
- audit/contact writing
- LINE/SMS/App provider runtime
- webhook runtime
- real entitlement or billing runtime
- Brand AI/RAG
- admin UI
- package changes
- smoke/integration tests

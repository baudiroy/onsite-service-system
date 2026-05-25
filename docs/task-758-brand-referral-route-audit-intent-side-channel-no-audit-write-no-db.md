# Task758 — Brand Referral Route Audit Intent Side-channel / No Audit Write No DB

Status: completed

Scope: route-adapter internal audit intent side-channel / no public response shape change / no audit write / no DB

## Summary

Task758 composes the pure Brand Referral audit/contact intent builder with the Brand Referral route adapter.

The route adapter can now optionally return an internal top-level `auditIntent` when a test or future caller explicitly passes `includeAuditIntent: true`. The public response body remains unchanged. The existing mounted public route still returns only `response.body` and does not expose `auditIntent` to customers.

This task does not write audit logs, write contact logs, persist DB records, create Cases, create repair intake drafts, verify identity, bind Cases, call providers, call LINE/webhook, use entitlement runtime, or call AI/RAG.

## Internal Side-channel Contract

When `includeAuditIntent: true` is passed to `handleBrandReferralRouteRequest`, the returned route response may include:

- top-level `auditIntent`

The public `body` must not include `auditIntent`.

The intent supports route outcomes:

- allowed normalized result -> `brand_referral_normalized`
- denied guard result -> `brand_referral_denied`
- malformed request -> `brand_referral_malformed`
- unknown source result -> `brand_referral_unknown_source`

All intents keep:

- `auditWritten=false`
- `contactWritten=false`

## Safety Boundary

The internal intent must not include:

- raw `line_user_id`
- token
- secret
- LINE access token
- LINE channel secret
- full phone
- full address
- raw provider payload
- AI payload
- full customer payload
- credential
- DB URL
- stack
- SQL
- customer case data

The route adapter still does not import DB, repository, API route handlers, provider, LINE/webhook runtime, AI/RAG runtime, env, fs, network, logger, config, audit writer, contact writer, entitlement service, repair intake, Case service, verification, or Case Binding code.

## Changed Files

- `src/brandChannel/brandReferralRouteAdapter.js`
- `tests/brandChannel/brandReferralRouteAuditIntent.unit.test.js`
- `tests/brandChannel/brandReferralRouteAdapter.unit.test.js`
- `tests/brandChannel/brandReferralRouteAdapterClosure.static.test.js`
- `docs/task-758-brand-referral-route-audit-intent-side-channel-no-audit-write-no-db.md`

## Verification

Run:

```bash
node --test tests/brandChannel/brandReferralRouteAuditIntent.unit.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- src/brandChannel/brandReferralRouteAdapter.js src/brandChannel/brandReferralAuditIntentBuilder.js tests/brandChannel/brandReferralRouteAuditIntent.unit.test.js docs/task-758-brand-referral-route-audit-intent-side-channel-no-audit-write-no-db.md
```

## Non-goals

This task does not implement:

- audit/contact writer
- DB persistence
- public route response shape expansion
- public API behavior changes
- migration/schema/index changes
- repair intake creation
- Case creation
- identity verification
- Case Binding
- LINE/SMS/App provider runtime
- webhook runtime
- real entitlement or billing runtime
- Brand AI/RAG
- reports
- admin UI
- package changes
- smoke/integration tests

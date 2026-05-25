# Task759 — Brand Referral Audit Intent Side-channel Closure Guard / No Audit Write No DB

Status: completed

Scope: static closure guard / Task757-758 intent-only side-channel / no audit write / no DB

## Summary

Task759 closes the Brand Referral audit/contact intent side-channel slice.

Task757 added a pure intent builder. Task758 connected that builder to the route adapter as an optional top-level internal side-channel. Task759 verifies the boundary remains intent-only: the public response body remains unchanged, and there is still no audit/contact persistence, DB work, repair intake handoff, Case creation, identity verification, Case Binding, provider/webhook integration, entitlement runtime, or AI/RAG runtime.

No audit/contact writer, DB, migration, repository, provider, LINE, SMS, App, webhook, identity verification, Case Binding, repair intake creation, entitlement service, AI/RAG, admin, package, or smoke behavior was changed.

## Closure Assertions

The static guard verifies:

- Task757 and Task758 evidence docs/tests exist.
- `auditIntent` is optional and top-level only.
- `auditIntent` is returned only when `includeAuditIntent=true`.
- `auditIntent` is not added to `response.body`.
- the public route handler sends `response.body` only.
- side-channel unit tests cover allowed, denied, malformed, and unknown-source outcomes.
- side-channel unit tests prove unsafe values are not echoed.
- intent metadata always has `auditWritten=false` and `contactWritten=false`.
- route adapter and builder do not import or call side-effect runtimes.

## Unsafe Output Boundary

The closure guard preserves the prohibition against:

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

## Changed Files

- `tests/brandChannel/brandReferralAuditIntentSideChannelClosure.static.test.js`
- `docs/task-759-brand-referral-audit-intent-side-channel-closure-guard-no-audit-write-no-db.md`
- `docs/design/brand-official-line-channel-integration.md`

## Verification

Run:

```bash
node --test tests/brandChannel/brandReferralAuditIntentSideChannelClosure.static.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- tests/brandChannel/brandReferralAuditIntentSideChannelClosure.static.test.js docs/task-759-brand-referral-audit-intent-side-channel-closure-guard-no-audit-write-no-db.md docs/design/brand-official-line-channel-integration.md src/brandChannel/brandReferralRouteAdapter.js
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

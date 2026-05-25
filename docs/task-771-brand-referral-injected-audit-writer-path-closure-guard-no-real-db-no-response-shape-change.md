# Task771 - Brand Referral Injected Audit Writer Path Closure Guard / No Real DB No Response Shape Change

Status: completed.

Scope: docs/static closure guard only.

## Purpose

Task771 closes the Task770 injected audit/contact writer path by recording and testing the boundary that the writer remains optional, injected-only, test-inspectable only, and unable to change the public response body.

## Closed Boundary

The accepted Task770 path is:

- Optional injected `contactWriter` only.
- No default writer configured in the public router.
- Safe `auditIntent` metadata only.
- Public response body remains unchanged.
- Writer failure is redacted into safe internal metadata only.
- Real DB, global repository wiring, provider calls, LINE/SMS/App/webhook delivery, identity verification, Case Binding, repair intake creation, entitlement runtime, smoke tests, admin UI, package changes, and AI/RAG runtime remain forbidden.

## Public Response Rule

The public route must send `response.body` only. It must not expose:

- `auditIntent`
- `contactWriterResult`
- writer internals
- stack traces
- SQL
- database URL
- token
- secret
- raw LINE id
- full phone
- full address
- provider payload
- AI payload
- full customer payload

`includeContactWriterResult` is an internal test-inspection option only. It must not be added to the public response body.

## Verification

Required commands:

```bash
node --test tests/brandChannel/brandReferralInjectedWriterPathClosure.static.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- tests/brandChannel/brandReferralInjectedWriterPathClosure.static.test.js docs/task-771-brand-referral-injected-audit-writer-path-closure-guard-no-real-db-no-response-shape-change.md docs/design/brand-official-line-channel-integration.md src/brandChannel/brandReferralRouteAdapter.js src/routes/public.routes.js
```

## Future Tasks

- Real persistence wiring still requires separate explicit approval for DB target, repository wiring, route behavior, and safety tests.
- Migration 024 still must not be dry-run or applied without separate disposable local/test DB authorization.
- Provider delivery, identity verification, Case Binding, repair intake creation, entitlement integration, and AI/RAG runtime remain separate future tasks.

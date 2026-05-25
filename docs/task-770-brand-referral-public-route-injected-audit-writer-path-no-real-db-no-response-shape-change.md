# Task770 - Brand Referral Public Route Injected Audit Writer Path / No Real DB No Response Shape Change

Status: completed.

Scope: bounded runtime plumbing with injected fake writer tests only.

## Purpose

Task770 wires the future brand referral audit/contact writer path into the existing Brand Referral public route adapter as an optional injected side effect. The public response body remains unchanged.

This is not a persistence rollout. The route still does not connect to a real database, does not use the Migration 024 table, and does not perform identity verification, Case Binding, repair intake creation, provider calls, or AI/RAG calls.

## Changed Files

- `src/brandChannel/brandReferralRouteAdapter.js`
- `src/routes/public.routes.js`
- `tests/brandChannel/brandReferralRouteInjectedAuditWriter.unit.test.js`
- `docs/task-770-brand-referral-public-route-injected-audit-writer-path-no-real-db-no-response-shape-change.md`

## Runtime Boundary

The Brand Referral route adapter now accepts an optional injected `contactWriter` with a `write(auditIntent)` function.

The injected writer:

- Is optional.
- Is not required for default public route behavior.
- Receives only the safe `auditIntent` metadata already defined by the Task757/758 side channel.
- Runs after guard-first normalization has produced a safe route response.
- Must not change the public response body.
- May expose only a safe internal writer result in direct tests when `includeContactWriterResult` is explicitly enabled.

The public route handler passes the optional injected writer through `createPublicRouter({ brandReferral: { contactWriter } })` while preserving the same JSON response body.

## Public Response Contract

The public route response body must not include:

- `auditIntent`
- writer result
- raw LINE user id
- full phone
- full address
- token
- secret
- LINE access token
- LINE channel secret
- provider payload
- AI payload
- full customer payload
- stack trace
- SQL
- database URL

Writer success or failure must not add fields to the public response body.

## Writer Failure Handling

Injected writer failures are caught by the route adapter and converted into a safe internal result:

- `ok: false`
- `reasonKey: brand_referral_contact_writer_failed`

The error message, stack trace, SQL, database URL, credential, token, secret, provider payload, AI payload, or customer data must never be returned.

## Explicit Non-goals

Task770 does not:

- Connect to a real DB.
- Run `psql`.
- Run `db:migrate`.
- Run DDL.
- Dry-run or apply Migration 024.
- Change migrations.
- Add a real audit/contact persistence sink.
- Import a global DB, repository, config, provider, webhook, AI/RAG, or server runtime.
- Create Case records.
- Create repair intake records.
- Verify identity.
- Bind Case access.
- Grant customer access.
- Call LINE, SMS, App push, webhook, email, provider, or AI/RAG runtime.
- Change admin frontend.
- Change packages.
- Add smoke or integration tests.

## Verification

Required commands:

```bash
node --test tests/brandChannel/brandReferralRouteInjectedAuditWriter.unit.test.js tests/brandChannel/brandReferralPublicRouteMount.unit.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- src/brandChannel/brandReferralRouteAdapter.js src/routes/public.routes.js tests/brandChannel/brandReferralRouteInjectedAuditWriter.unit.test.js tests/brandChannel/brandReferralPublicRouteMount.unit.test.js docs/task-770-brand-referral-public-route-injected-audit-writer-path-no-real-db-no-response-shape-change.md
```

## Future Tasks

- Decide whether the injected writer should be enabled in a local test-only API harness.
- Decide when Migration 024 may be dry-run against a disposable local/test DB.
- Add integration coverage only after explicit approval for test DB or route integration scope.
- Keep real DB persistence, provider delivery, identity verification, Case Binding, and AI/RAG disabled until separately approved.

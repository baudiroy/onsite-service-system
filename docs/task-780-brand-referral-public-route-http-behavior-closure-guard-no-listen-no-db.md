# Task780 - Brand Referral Public Route HTTP Behavior Closure Guard / No Listen No DB

Status: completed.

Scope: docs/static closure guard only.

## Purpose

Task780 closes the Brand Referral public route HTTP behavior slice after Task779. It adds a static guard proving the new HTTP-style unit coverage remains no-listen, no-DB, no side effects, and public response body remains normalization-only.

## Files Changed

- `tests/brandChannel/brandReferralPublicRouteHttpBehaviorClosure.static.test.js`
- `docs/task-780-brand-referral-public-route-http-behavior-closure-guard-no-listen-no-db.md`
- `docs/design/brand-official-line-channel-integration.md`

## Task779 Accepted HTTP Behavior Boundary

Task779 accepted a synthetic app-like unit test for:

- `POST /api/v1/public/brand-referral/normalize`

The accepted boundary is:

- No `app.listen` or server start.
- No DB connection, psql, db:migrate, DDL, dry-run, or apply.
- No route response body/status shape expansion.
- No audit/contact writer runtime.
- No provider / LINE / SMS / App push / webhook.
- No identity verification, Case Binding, repair intake, Case creation.
- No AI/RAG runtime.
- No entitlement/billing runtime.
- No admin UI, package, smoke, token, secret, credential, or provider config changes.

## Closure Guard Coverage

The new static guard checks:

- Task779 evidence doc/test exists.
- Task779 test exercises the public route through an app-like handler mounted under `/api/v1/public`.
- Task779 test does not call `listen`, start a server, or use network test harnesses.
- Task779 covers default fail-closed behavior without an injected access guard.
- Task779 covers injected allow, injected deny, and malformed request cases.
- Task779 public response checks continue to deny-list:
  - `auditIntent`
  - `contactWriterResult`
  - writer internals
  - customer case data
  - raw `line_user_id`
  - token / secret / LINE access token / channel secret
  - full phone / full address
  - provider payload
  - AI payload
  - full customer payload
  - credential
  - DB URL
  - stack
  - SQL
- `src/routes/public.routes.js` remains mounted normalization-only and free of side-effect runtime hooks.

## Runtime Decision

No runtime behavior changed.

This task did not:

- modify `src/**`.
- modify API response shape.
- connect DB.
- run SQL.
- modify or run migrations.
- write audit/contact records.
- create Case / repair intake.
- verify identity.
- bind Case.
- call provider / LINE / SMS / App push / webhook.
- call AI/RAG.
- change entitlement / billing runtime.
- change admin UI.
- change package files.
- add smoke tests.

## Verification

Required verification:

```bash
node --test tests/brandChannel/brandReferralPublicRouteHttpBehaviorClosure.static.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- tests/brandChannel/brandReferralPublicRouteHttpBehaviorClosure.static.test.js docs/task-780-brand-referral-public-route-http-behavior-closure-guard-no-listen-no-db.md docs/design/brand-official-line-channel-integration.md
```

## Next Candidates

Future candidates still require explicit bounded approval:

- Brand Referral persistence promotion behind injected DB.
- Migration 024 disposable local/test DB dry-run.
- identity verification and Case Binding.
- repair intake handoff.
- provider / LINE webhook adapter.
- Brand Knowledge AI/RAG add-on.
- entitlement / usage guard.

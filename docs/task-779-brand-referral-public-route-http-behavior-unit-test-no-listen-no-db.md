# Task779 - Brand Referral Public Route HTTP Behavior Unit Test / No Listen No DB

Status: completed.

Scope: HTTP-style unit coverage only.

## Purpose

Task779 adds app-like HTTP behavior coverage for the mounted Brand Referral public normalization route:

- `POST /api/v1/public/brand-referral/normalize`

The test exercises the existing public router through an Express app-like handler without starting a server, connecting a DB, writing audit/contact records, or changing response shape.

## Files Changed

- `tests/brandChannel/brandReferralPublicRouteHttpBehavior.unit.test.js`
- `docs/task-779-brand-referral-public-route-http-behavior-unit-test-no-listen-no-db.md`

No source change was needed.

## Coverage Added

The new unit test verifies:

- The public route module does not start a server and does not import obvious DB/provider/webhook/AI/RAG runtime hooks.
- The default public router fails closed when no `accessGuard` is injected.
- An injected allow guard returns a normalization-only response body.
- The normalization-only body keeps `identityVerified`, `caseBinding`, `caseDataAccess`, `intakeCreated`, and `auditWritten` as `false`.
- An injected deny guard returns a safe deny body before referral output is trusted.
- Malformed HTTP-style input returns a safe non-sensitive envelope.
- Public response bodies do not expose `auditIntent`, `contactWriterResult`, writer internals, customer case data, raw `line_user_id`, token, secret, LINE access token, channel secret, full phone/address, provider payload, AI payload, full customer payload, credential, DB URL, stack, or SQL.

## Runtime Decision

No runtime behavior changed.

This task did not:

- start `app.listen` or a real server.
- connect to DB.
- run `psql`.
- run `db:migrate`.
- execute DDL or SQL.
- modify migrations.
- change route response body/status shape.
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
node --test tests/brandChannel/brandReferralPublicRouteHttpBehavior.unit.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- tests/brandChannel/brandReferralPublicRouteHttpBehavior.unit.test.js docs/task-779-brand-referral-public-route-http-behavior-unit-test-no-listen-no-db.md src/routes/public.routes.js
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

# Task 725 - Engineer Mobile Injected Detail Provider Redaction Boundary

Status: completed

## Goal

Add pure unit coverage proving injected Engineer Mobile task-detail provider results are normalized and redacted before response, including unsafe extra fields, provider metadata, wrong-scope rows, malformed results, and provider error paths.

## Scope

Changed files:

- `tests/engineerMobile/engineerMobileInjectedDetailProviderRedaction.unit.test.js`
- `docs/task-725-engineer-mobile-injected-detail-provider-redaction-boundary-no-db.md`

No source/runtime implementation file was changed.

## Coverage Added

`tests/engineerMobile/engineerMobileInjectedDetailProviderRedaction.unit.test.js` verifies:

- The test imports only Node built-ins and the existing app factory.
- The synthetic app detail path reaches an injected provider without `listen`, DB, repository, migration runner, provider sending, AI/RAG, or package changes.
- Injected detail provider tasks can include unsafe extra fields, but the response only returns the existing approved Engineer Mobile detail fields.
- Provider metadata wrappers are ignored and are not copied into response bodies.
- Wrong organization, wrong engineer, and wrong appointment rows return the existing safe task-detail unavailable envelope.
- Provider errors with unsafe messages return the existing safe unavailable envelope without leaking the error text.
- Empty provider results and malformed provider results fail closed with safe non-sensitive envelopes.
- Multi-appointment same-case rows remain allowed without implying multiple formal completion reports or exposing report ownership fields.
- Detail output contains no DB URL, token, secret, password, raw LINE id, full phone, full address, internal note, audit payload/log, AI raw payload, billing/settlement internals, provider metadata, storage path, formal report id, `finalAppointmentId`, or full payload.

## Accepted Boundaries

- This is pure unit test coverage.
- There is no production mapper behavior change because existing Engineer Mobile task-detail normalization and redaction already satisfy this contract.
- There is no DB access, repository access, migration runner, psql, DDL, provider sending, AI/RAG runtime, billing/settlement runtime, smoke test, browser test, admin frontend, or package change.
- There is no listen/server start; the test uses the existing app factory with a synthetic injected provider.
- There is no public API shape expansion.
- The Engineer Mobile task-detail path remains read-only, task-visible, organization/engineer/appointment scoped, and safe on denial.
- The task-detail response does not create or expose a Field Service Report, completion report, or `finalAppointmentId`.

## Non-goals

This task does not add or change:

- Runtime behavior.
- Source implementation.
- API/routes/controllers/DTO behavior.
- DB schema, migration, psql, DDL, repository, or real database connections.
- Permission or audit runtime.
- Admin frontend.
- Smoke/integration coverage.
- Provider, AI/RAG, billing, settlement, notification, LINE/SMS/email/push runtime.

If a future Engineer Mobile detail field is needed, it should be added through a separate bounded DTO/design task with explicit safe-field review.

## Verification

- `node --test tests/engineerMobile/engineerMobileInjectedDetailProviderRedaction.unit.test.js` - PASS, 7 passed / 0 failed.
- `node --test tests/engineerMobile/*.js` - PASS, 446 passed / 0 failed.
- `npm run check` - PASS.
- `git diff --check -- tests/engineerMobile/engineerMobileInjectedDetailProviderRedaction.unit.test.js docs/task-725-engineer-mobile-injected-detail-provider-redaction-boundary-no-db.md src/engineerMobile` - PASS.

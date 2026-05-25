# Task 724 - Engineer Mobile Injected Read Model Provider Redaction Contract

Status: completed

## Goal

Add pure unit coverage proving injected Engineer Mobile read-model provider results are normalized and redacted before response, including unsafe extra fields, provider metadata, and provider error paths.

## Scope

Changed files:

- `tests/engineerMobile/engineerMobileInjectedReadModelProviderRedaction.unit.test.js`
- `docs/task-724-engineer-mobile-injected-read-model-provider-redaction-contract-no-db.md`

No source/runtime implementation file was changed.

## Coverage Added

`tests/engineerMobile/engineerMobileInjectedReadModelProviderRedaction.unit.test.js` verifies:

- The test imports only Node built-ins and the existing app factory.
- Injected provider rows can include unsafe extra fields, but the response only returns the approved Engineer Mobile task-list fields.
- Provider metadata wrappers are ignored and are not copied into response bodies.
- Provider errors with unsafe messages return the existing safe deny envelope without leaking the error text.
- Empty provider results return a safe allow response with an empty task list.
- Malformed provider results fail closed with a safe deny envelope.
- Multi-appointment same-case rows remain allowed without implying multiple formal completion reports or exposing report ownership fields.
- Output contains no DB URL, token, secret, password, raw LINE id, full phone, full address, internal note, audit payload, AI raw payload, billing/settlement internals, provider metadata, formal report id, `finalAppointmentId`, or full payload.

## Accepted Boundaries

- This is pure unit test coverage.
- There is no production mapper behavior change because existing Engineer Mobile task-list normalization and redaction already satisfy this contract.
- There is no DB access, repository access, migration runner, psql, DDL, provider sending, AI/RAG runtime, billing/settlement runtime, smoke test, browser test, admin frontend, or package change.
- There is no listen/server start; the test uses the existing app factory with a synthetic injected read model.
- There is no public API shape expansion.
- The Engineer Mobile task-list path remains read-only, task-visible, and organization/engineer scoped.
- The task-list response does not create or expose a Field Service Report, completion report, or `finalAppointmentId`.

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

If a future injected provider exposes a new field that should be customer-visible or engineer-visible, it should be added through a separate bounded DTO/design task rather than broadening the task-list response implicitly.

## Verification

- `node --test tests/engineerMobile/engineerMobileInjectedReadModelProviderRedaction.unit.test.js` - PASS, 6 passed / 0 failed.
- `node --test tests/engineerMobile/*.js` - PASS, 439 passed / 0 failed.
- `npm run check` - PASS.
- `git diff --check -- tests/engineerMobile/engineerMobileInjectedReadModelProviderRedaction.unit.test.js docs/task-724-engineer-mobile-injected-read-model-provider-redaction-contract-no-db.md src/engineerMobile` - PASS.

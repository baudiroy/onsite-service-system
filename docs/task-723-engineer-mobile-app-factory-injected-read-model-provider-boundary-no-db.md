# Task 723 - Engineer Mobile App Factory Injected Read Model Provider Boundary

Status: completed

## Goal

Add pure unit coverage proving the Engineer Mobile app factory path can use an injected synthetic read-model provider without importing or using DB, repository, migration runner, provider sending, AI/RAG, package scripts, or runtime network listeners.

## Scope

Changed files:

- `tests/engineerMobile/engineerMobileAppFactoryInjectedReadModelProvider.unit.test.js`
- `docs/task-723-engineer-mobile-app-factory-injected-read-model-provider-boundary-no-db.md`

No source/runtime implementation file was changed.

## Coverage Added

`tests/engineerMobile/engineerMobileAppFactoryInjectedReadModelProvider.unit.test.js` verifies:

- The test imports only Node built-ins, the existing app factory, sanitized fixture rows, and the existing task-list read-model mapper.
- App factory creation does not call the injected read-model provider.
- A synthetic task-list request path reaches the injected provider and returns safe mapped output.
- Wrong organization and wrong engineer requests return empty safe results without leaking provider rows.
- Provider throw and empty result paths return safe non-sensitive envelopes.
- Output contains no DB URL, token, secret, raw LINE id, full phone, full address, internal note, raw audit payload, AI raw payload, billing/settlement internals, formal report id, `finalAppointmentId`, `final_appointment_id`, or full payload.
- Multi-appointment same-case output remains allowed without implying multiple formal completion reports.

## Accepted Boundaries

- This is pure unit test coverage.
- There is no production mapper behavior change.
- There is no new dependency-injection seam because the existing app factory `engineerMobile.readModel` seam is sufficient.
- There is no listen/server start, DB access, repository access, migration runner, psql, DDL, provider sending, AI/RAG runtime, billing/settlement runtime, smoke test, browser test, admin frontend, or package change.
- There is no public API shape expansion.
- The Engineer Mobile task-list app path remains read-only and task-visible.
- The task-list app path does not create a Field Service Report, completion report, or `finalAppointmentId`.

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

If a future app-factory provider boundary gap appears, it should be handled by a separate bounded runtime task.

## Verification

- `node --test tests/engineerMobile/engineerMobileAppFactoryInjectedReadModelProvider.unit.test.js` - PASS, 6 passed / 0 failed.
- `node --test tests/engineerMobile/*.js` - PASS, 433 passed / 0 failed.
- `npm run check` - PASS.
- `git diff --check -- tests/engineerMobile/engineerMobileAppFactoryInjectedReadModelProvider.unit.test.js docs/task-723-engineer-mobile-app-factory-injected-read-model-provider-boundary-no-db.md src/engineerMobile` - PASS.

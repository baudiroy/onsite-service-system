# Task 722 - Engineer Mobile Read Model Fixture Negative Boundary Unit Test

Status: completed

## Goal

Add pure unit coverage for sanitized Engineer Mobile read-model fixtures. The test proves existing mapper output does not expose customer-sensitive or internal fields and does not imply completion-report creation or `finalAppointmentId` ownership.

## Scope

Changed files:

- `tests/engineerMobile/engineerMobileReadModelFixtureNegativeBoundary.unit.test.js`
- `docs/task-722-engineer-mobile-read-model-fixture-negative-boundary-unit-test-no-db.md`

No source/runtime implementation file was changed.

## Coverage Added

`tests/engineerMobile/engineerMobileReadModelFixtureNegativeBoundary.unit.test.js` verifies:

- The test imports only Node built-ins, the sanitized fixture rows, and the existing list/detail mapper modules.
- The sanitized fixture list mapping exposes no DB URL, token, secret, raw LINE id, full phone, full address, internal note, audit log, AI raw payload, billing/settlement internals, full payload, or formal report identifiers.
- Locally augmented rows containing unknown sensitive fields are stripped by the existing list mapper allow-list.
- Detail mapper output does not expose Field Service Report id, service report id, completion report id, `finalAppointmentId`, or `final_appointment_id`.
- The multi-appointment same-case fixture remains valid and does not imply multiple formal completion reports.
- Mapping does not mutate the shared sanitized fixture rows.

## Accepted Boundaries

- This is read-only unit boundary coverage.
- The existing mapper/normalizer behavior is imported read-only.
- There is no DB access, repository access, migration, psql, DDL, provider sending, AI/RAG runtime, billing/settlement runtime, smoke test, browser test, or app/server bootstrap work.
- There is no API shape, route, controller, DTO, permission runtime, audit runtime, admin frontend, or package change.
- The Engineer Mobile read model remains a task-visible read projection, not a Field Service Report creator.
- `finalAppointmentId` remains backend/system-owned and is not decided by fixture or mapper output.
- A Case may have multiple appointments / dispatch visits, but this test does not authorize multiple formal completion reports.

## Non-goals

This task does not add or change:

- Production mapper behavior.
- Fixture source rows.
- Runtime behavior.
- API/routes/controllers/services/repositories.
- DB schema, migration, psql, DDL, or real database connections.
- Admin frontend.
- Smoke/integration coverage.
- Provider, AI/RAG, billing, settlement, notification, LINE/SMS/email/push runtime.

If a future negative boundary gap appears, it should be documented and handled by a separate bounded task before any runtime fix.

## Verification

- `node --test tests/engineerMobile/engineerMobileReadModelFixtureNegativeBoundary.unit.test.js` - PASS, 6 passed / 0 failed.
- `node --test tests/engineerMobile/*.js` - PASS, 427 passed / 0 failed.
- `npm run check` - PASS.
- `git diff --check -- tests/engineerMobile/engineerMobileReadModelFixtureNegativeBoundary.unit.test.js tests/engineerMobile/fixtures/engineerMobileReadModelRows.fixture.js docs/task-722-engineer-mobile-read-model-fixture-negative-boundary-unit-test-no-db.md` - PASS.

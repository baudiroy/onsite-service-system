# Task1748 - Engineer Mobile Workbench Safe Appointment Projection Normalizer

Status: completed locally.

## Scope

Task1748 adds a shared allowlist-based projection normalizer for Engineer Mobile Workbench assigned appointment read-only output.

The accepted Task1735 list handler and Task1737 detail handler now route repository rows through the same shared projection boundary before building their existing public response envelopes.

## Files Changed

- `src/engineerMobile/engineerMobileAssignedAppointmentProjection.js`
- `src/engineerMobile/engineerMobileAssignedAppointmentsHandler.js`
- `src/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.js`
- `tests/engineerMobile/engineerMobileAssignedAppointmentProjection.unit.test.js`
- `tests/engineerMobile/engineerMobileAssignedAppointmentsHandler.unit.test.js`
- `tests/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.unit.test.js`
- `docs/task-1748-engineer-mobile-workbench-safe-appointment-projection-normalizer-no-db-no-global-mount.md`

## Runtime Surface Changed

Added `src/engineerMobile/engineerMobileAssignedAppointmentProjection.js` with shared pure projection helpers:

- `projectEngineerMobileAssignedAppointmentListItem`
- `projectEngineerMobileAssignedAppointmentDetail`

The projection uses allowlisted output fields only. It does not mutate input rows, perform DB access, call providers, mount routes, resolve auth/session state, or perform workflow mutation.

## Required Behavior Covered

- List projection returns only safe allowlisted fields.
- Detail projection returns only safe allowlisted fields.
- Forbidden fields are stripped from both list and detail output.
- Input rows are not mutated.
- Missing or partial optional fields are handled safely.
- Existing list handler still returns safe output through the shared normalizer.
- Existing detail handler still returns safe output through the shared normalizer.
- Cross-organization, cross-engineer, and cross-appointment denial behavior remains unchanged in the handlers.
- Output does not leak raw phone, raw address, raw SQL, raw DB rows, stack traces, internal notes, private audit fields, provider debug fields, secrets, tokens, passwords, cookies, auth headers, Field Service Report ids, or `finalAppointmentId`.
- Projection and handler sources have no DB, app, server, route, listen, provider sending, or mutation dependency.

## Bounded Runtime, Not Production Rollout

This task centralizes the existing read-only appointment row projection inside the Engineer Mobile Workbench runtime boundary. It does not add a DB-backed repository, production route mount, shared route index change, API shape change, permission service, audit writer, provider sending, completion write, or Field Service Report persistence.

## Non-goals

- No DB.
- No migration.
- No psql.
- No `db:migrate`.
- No smoke.
- No global route mount.
- No production app/server/listen/bootstrap change.
- No shared route index or public route registry change.
- No real auth service.
- No real permission service.
- No real audit writer.
- No repository-backed writer.
- No workflow mutation.
- No appointment, Case, completion report, Field Service Report, or workflow state write.
- No start travel, arrive, complete, submit report, publish report, or Field Service Report write.
- No `finalAppointmentId` exposure, inference, or mutation.
- No provider sending.
- No LINE, SMS, email, webhook, AI/RAG, billing, settlement, admin UI, or package change.
- No staging, commit, push, cleanup, reset, stash, restore, or removal of held historical docs.

## Verification

- `node --test tests/engineerMobile/engineerMobileAssignedAppointmentProjection.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentsHandler.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.unit.test.js`: PASS, 29 tests.
- `node --test tests/engineerMobile/engineerMobileAssignedAppointmentProjection.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentsHandler.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.unit.test.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyHttpAdapter.unit.test.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js tests/engineerMobile/engineerMobileWorkbenchRequestContextResolver.unit.test.js`: PASS, 69 tests.
- `git diff --check -- src/engineerMobile/engineerMobileAssignedAppointmentsHandler.js src/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.js tests/engineerMobile/engineerMobileAssignedAppointmentsHandler.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.unit.test.js`: PASS.
- `git diff --no-index --check -- /dev/null src/engineerMobile/engineerMobileAssignedAppointmentProjection.js`: PASS.
- `git diff --no-index --check -- /dev/null tests/engineerMobile/engineerMobileAssignedAppointmentProjection.unit.test.js`: PASS.
- `git diff --no-index --check -- /dev/null docs/task-1748-engineer-mobile-workbench-safe-appointment-projection-normalizer-no-db-no-global-mount.md`: PASS.
- `npm run check`: PASS.

No DB-backed checks and no smoke were run for this task.

## Preserved Boundaries

- One Case still has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not touched.
- `finalAppointmentId` remains backend/system-owned except explicit admin override.
- A Case may still have multiple appointments and dispatch visits.
- Engineer Mobile Workbench projection normalization does not create or update Field Service Reports.
- No second formal Field Service Report can be produced by this projection boundary.
- Existing held historical untracked docs remain out of scope.

# Task1735 - Engineer Mobile Assigned Appointments Read-only Runtime Handler

Status: completed locally.

## Scope

Task1735 adds an isolated Engineer Mobile Workbench assigned appointments runtime handler.

The new runtime surface is injected-only and read-only. It accepts an `assignedAppointmentRepository` and optional `auditLogger`, reads organization and engineer identity from injected context, calls the repository with scoped read parameters, and returns a safe appointment list envelope.

## Files Changed

- `src/engineerMobile/engineerMobileAssignedAppointmentsHandler.js`
- `tests/engineerMobile/engineerMobileAssignedAppointmentsHandler.unit.test.js`
- `docs/task-1735-engineer-mobile-assigned-appointments-read-only-runtime-handler-injected-repository-no-db-no-global-mount.md`

## Runtime Surface Added

- `createEngineerMobileAssignedAppointmentsHandler({ assignedAppointmentRepository, auditLogger })`
- `getEngineerMobileAssignedAppointments({ assignedAppointmentRepository, auditLogger, context, filters })`

The handler:

- requires `organizationId`
- requires `engineerUserId` or equivalent engineer identity
- requires assigned appointment read permission or explicit injected read allowance
- calls only `assignedAppointmentRepository.findAssignedAppointments(...)`
- passes only organization-scoped, engineer-scoped, normalized filter parameters
- maps repository rows into a safe read-only appointment projection
- fails closed on missing context, missing repository, unauthorized context, or repository error
- emits only optional safe audit intent/result metadata if an audit logger is injected

## Bounded Runtime, Not Production Rollout

This task adds real runtime code, but does not mount it into production app/server/routes.

It is bounded because the new handler is only callable by direct import and injected dependencies. It does not create a global route, does not start a server, does not query a real DB, and does not wire into shared runtime bootstrap.

## Safe Output

Returned appointments are allowlisted to safe read-only fields such as:

- `appointmentId`
- `caseReference`
- `appointmentWindow`
- `scheduledStart`
- `scheduledEnd`
- `serviceType`
- `customerDisplayName`
- `locationLabel`
- `status`
- `priorityLabel`
- `canOpenDetails`

The output excludes raw phone, raw address, raw LINE ids, provider payload, token, secret, internal notes, raw SQL, stack traces, billing/settlement internals, AI raw payload, Field Service Report ids, and `finalAppointmentId`.

## Non-goals

- No DB.
- No migration.
- No psql.
- No `db:migrate`.
- No global route mount.
- No app/server/listen/bootstrap change.
- No real repository DB query.
- No smoke.
- No workflow mutation.
- No start travel, arrive, complete, submit report, publish report, or Field Service Report write.
- No `finalAppointmentId` exposure, inference, or mutation.
- No provider sending.
- No LINE, SMS, email, webhook, AI/RAG, billing, settlement, admin UI, or package change.
- No staging, commit, push, cleanup, reset, stash, restore, or removal of held historical docs.

## Verification

- `node --test tests/engineerMobile/engineerMobileAssignedAppointmentsHandler.unit.test.js`: PASS
- `npm run check`: PASS
- `git diff --check -- src/engineerMobile tests/engineerMobile docs/task-1735-engineer-mobile-assigned-appointments-read-only-runtime-handler-injected-repository-no-db-no-global-mount.md`: PASS

## Preserved Boundaries

- One Case still has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not touched.
- `finalAppointmentId` remains backend/system-owned except explicit admin override.
- A Case may still have multiple appointments and dispatch visits.
- Engineer Mobile assigned appointment reads do not create or update Field Service Reports.
- No second formal Field Service Report can be produced by this handler.
- Existing held historical untracked docs remain out of scope.

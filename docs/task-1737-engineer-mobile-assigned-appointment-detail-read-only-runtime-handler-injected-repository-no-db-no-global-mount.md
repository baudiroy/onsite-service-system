# Task1737 - Engineer Mobile Assigned Appointment Detail Read-only Runtime Handler

Status: completed locally.

## Scope

Task1737 adds an isolated Engineer Mobile Workbench assigned appointment detail runtime handler.

The new runtime surface is injected-only and read-only. It accepts an `assignedAppointmentRepository` and optional `auditLogger`, reads organization and engineer identity from injected context, requires a safe appointment identifier from input, calls the repository with scoped read parameters, and returns a safe single-appointment detail envelope.

## Files Changed

- `src/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.js`
- `tests/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.unit.test.js`
- `docs/task-1737-engineer-mobile-assigned-appointment-detail-read-only-runtime-handler-injected-repository-no-db-no-global-mount.md`

## Runtime Surface Added

- `createEngineerMobileAssignedAppointmentDetailHandler({ assignedAppointmentRepository, auditLogger })`
- `getEngineerMobileAssignedAppointmentDetail({ assignedAppointmentRepository, auditLogger, context, input })`

The handler:

- requires `organizationId`
- requires `engineerUserId` or equivalent engineer identity
- requires a safe `appointmentId`
- requires assigned appointment read permission or explicit injected read allowance
- calls only `assignedAppointmentRepository.findAssignedAppointmentDetail(...)`
- passes only organization-scoped, engineer-scoped, appointment-scoped parameters
- maps the repository row into a safe read-only appointment detail projection
- fails closed on missing context, missing appointment id, missing repository, unauthorized context, repository no-result, cross-scope row, or repository error
- emits only optional safe audit intent/result metadata if an audit logger is injected

## Bounded Runtime, Not Production Rollout

This task adds real runtime code, but does not mount it into production app/server/routes.

It is bounded because the new handler is only callable by direct import and injected dependencies. It does not create a global route, does not start a server, does not query a real DB, and does not wire into shared runtime bootstrap.

## Safe Output

Returned appointment detail is allowlisted to safe read-only fields such as:

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
- `serviceSummary`
- `publicCustomerNotes`
- `checklistPreview`
- `canOpenDetails`

The output excludes raw phone, raw address, raw LINE ids, provider payload, token, secret, internal notes, raw SQL, stack traces, billing/settlement internals, AI raw payload, private provider/debug fields, Field Service Report ids, and `finalAppointmentId`.

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
- No appointment, Case, completion report, Field Service Report, or workflow state write.
- No start travel, arrive, complete, submit report, publish report, or Field Service Report write.
- No `finalAppointmentId` exposure, inference, or mutation.
- No provider sending.
- No LINE, SMS, email, webhook, AI/RAG, billing, settlement, admin UI, or package change.
- No staging, commit, push, cleanup, reset, stash, restore, or removal of held historical docs.

## Verification

- `node --test tests/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.unit.test.js`: PASS
- `node --test tests/engineerMobile/engineerMobileAssignedAppointmentsHandler.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.unit.test.js`: PASS
- `git diff --check -- src/engineerMobile tests/engineerMobile docs/task-1737-engineer-mobile-assigned-appointment-detail-read-only-runtime-handler-injected-repository-no-db-no-global-mount.md`: PASS
- `npm run check`: PASS

## Preserved Boundaries

- One Case still has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not touched.
- `finalAppointmentId` remains backend/system-owned except explicit admin override.
- A Case may still have multiple appointments and dispatch visits.
- Engineer Mobile assigned appointment detail reads do not create or update Field Service Reports.
- No second formal Field Service Report can be produced by this handler.
- Existing held historical untracked docs remain out of scope.

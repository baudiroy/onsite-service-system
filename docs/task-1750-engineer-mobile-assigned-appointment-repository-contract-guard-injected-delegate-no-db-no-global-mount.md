# Task1750 - Engineer Mobile Assigned Appointment Repository Contract Guard

Status: completed locally.

## Scope

Task1750 adds a bounded repository contract guard for Engineer Mobile Workbench assigned appointments.

The guard sits between the accepted Workbench list/detail handlers and any future real repository implementation. It enforces scoped read-only delegate calls using injected dependencies only.

## Files Changed

- `src/engineerMobile/engineerMobileAssignedAppointmentRepositoryGuard.js`
- `src/engineerMobile/engineerMobileWorkbenchReadOnlyModule.js`
- `tests/engineerMobile/engineerMobileAssignedAppointmentRepositoryGuard.unit.test.js`
- `tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js`
- `docs/task-1750-engineer-mobile-assigned-appointment-repository-contract-guard-injected-delegate-no-db-no-global-mount.md`

## Runtime Surface Changed

Added `createEngineerMobileAssignedAppointmentRepositoryGuard({ delegateRepository, auditLogger })`.

The guarded repository exposes the same read-only repository methods currently expected by the accepted Task1735 and Task1737 handlers:

- `findAssignedAppointments`
- `findAssignedAppointmentDetail`

The guard requires `organizationId` and `engineerUserId` for every call. Detail calls also require a safe `appointmentId`.

## Required Behavior Covered

- Guard exposes both read-only repository methods.
- Valid list calls delegate with only `organizationId`, `engineerUserId`, and safe filters.
- Valid detail calls delegate with only `organizationId`, `engineerUserId`, and `appointmentId`.
- Missing scope fails closed before delegate access.
- Missing delegate methods fail closed.
- Delegate throws fail closed without raw error leakage.
- Unsafe or unrecognized input fields are not passed to the delegate.
- Optional audit metadata includes only safe method, outcome, reason, organization, engineer, and appointment identifiers.
- Existing list/detail handlers can use the guarded repository with a synthetic delegate.
- Workbench module can opt into wrapping a `delegateAssignedAppointmentRepository` through `useRepositoryGuard: true`.
- Existing direct `assignedAppointmentRepository` behavior remains supported.

## Bounded Runtime, Not Production Rollout

This is runtime-adjacent contract hardening only. It does not add a DB-backed repository, production route mount, app/server wiring, shared route index change, API shape change, permission service, audit writer, provider sending, completion write, Field Service Report persistence, or smoke coverage.

## Non-goals

- No DB.
- No migration.
- No psql.
- No `db:migrate`.
- No smoke.
- No global route mount.
- No production app/server/listen/bootstrap change.
- No shared route index or public route registry change.
- No real DB repository implementation.
- No real auth service.
- No real permission service.
- No real audit writer.
- No workflow mutation.
- No appointment, Case, completion report, Field Service Report, or workflow state write.
- No start travel, arrive, complete, submit report, publish report, or Field Service Report write.
- No `finalAppointmentId` exposure, inference, or mutation.
- No provider sending.
- No LINE, SMS, email, webhook, AI/RAG, billing, settlement, admin UI, or package change.
- No staging, commit, push, cleanup, reset, stash, restore, or removal of held historical docs.

## Verification

- `node --test tests/engineerMobile/engineerMobileAssignedAppointmentRepositoryGuard.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentsHandler.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.unit.test.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js`: PASS, 45 tests.
- `node --test tests/engineerMobile/engineerMobileAssignedAppointmentRepositoryGuard.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentProjection.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentsHandler.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.unit.test.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyHttpAdapter.unit.test.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js tests/engineerMobile/engineerMobileWorkbenchRequestContextResolver.unit.test.js`: PASS, 78 tests.
- `git diff --check -- src/engineerMobile/engineerMobileWorkbenchReadOnlyModule.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js`: PASS.
- `git diff --no-index --check -- /dev/null src/engineerMobile/engineerMobileAssignedAppointmentRepositoryGuard.js`: PASS.
- `git diff --no-index --check -- /dev/null tests/engineerMobile/engineerMobileAssignedAppointmentRepositoryGuard.unit.test.js`: PASS.
- `git diff --no-index --check -- /dev/null docs/task-1750-engineer-mobile-assigned-appointment-repository-contract-guard-injected-delegate-no-db-no-global-mount.md`: PASS.
- `npm run check`: PASS.
- Credential scan on Task1750 changed files: clean.

No DB-backed checks and no smoke were run for this task.

## Preserved Boundaries

- One Case still has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not touched.
- `finalAppointmentId` remains backend/system-owned except explicit admin override.
- A Case may still have multiple appointments and dispatch visits.
- The repository guard does not create or update Field Service Reports.
- No second formal Field Service Report can be produced by this guard boundary.
- Existing held historical untracked docs remain out of scope.

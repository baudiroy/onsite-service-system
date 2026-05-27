# Task1742 - Engineer Mobile Workbench Read-only Composition Factory

Status: completed locally.

## Scope

Task1742 adds a bounded Engineer Mobile Workbench read-only composition factory. The factory wires the accepted read-only pieces into one injectable module:

- Task1735 assigned appointment list handler
- Task1737 assigned appointment detail handler
- Task1739 / Task1740 HTTP adapter with canonical injected routes

The module remains injected-only. It does not mount routes globally, open a server, call a real DB, use a repository-backed writer, or mutate appointment / Case / Field Service Report state.

## Files Changed

- `src/engineerMobile/engineerMobileWorkbenchReadOnlyModule.js`
- `tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js`
- `docs/task-1742-engineer-mobile-workbench-read-only-composition-factory-injected-repository-no-db-no-global-mount.md`

## Runtime Surface Added

- `createEngineerMobileWorkbenchReadOnlyModule({ assignedAppointmentRepository, auditLogger, getContext })`

The factory creates:

- `assignedAppointmentsHandler`
- `assignedAppointmentDetailHandler`
- an injected HTTP adapter registration path via `module.register({ app, router, getContext })`

Supported canonical injected routes:

- `GET /engineer-mobile/appointments`
- `GET /engineer-mobile/appointments/:appointmentId`

Internal aliases remain controlled by the underlying Task1739 / Task1740 adapter and can be disabled through `includeInternalAliases: false`.

## Required Behavior Covered

- Requires an injected `assignedAppointmentRepository` with read methods only.
- Creates the accepted Task1735 list handler internally.
- Creates the accepted Task1737 detail handler internally.
- Uses the accepted Task1739 / Task1740 HTTP adapter internally.
- Registers only onto a caller-provided synthetic `app` or `router`.
- Uses injected `getContext` only for HTTP adapter usage.
- Preserves fail-closed behavior for missing repository, missing context, invalid input, and repository failure.
- Preserves safe projection and forbidden-field exclusion from the underlying handlers.
- Does not call mutation methods.
- Does not call `listen`.
- Does not import or mount `src/app.js`, `src/server.js`, or `src/routes/**`.

## Bounded Runtime, Not Production Rollout

This is real runtime composition code, but it is not production route rollout. The new module is only callable by direct import and explicit injection. It does not change API shape, shared app bootstrap, server startup, route indexes, DB clients, migrations, provider sending, smoke runtime, or admin UI.

## Non-goals

- No DB.
- No migration.
- No psql.
- No `db:migrate`.
- No smoke.
- No global route mount.
- No production app/server/listen/bootstrap change.
- No shared route index or public route registry change.
- No real repository DB query.
- No workflow mutation.
- No appointment, Case, completion report, Field Service Report, or workflow state write.
- No start travel, arrive, complete, submit report, publish report, or Field Service Report write.
- No `finalAppointmentId` exposure, inference, or mutation.
- No provider sending.
- No LINE, SMS, email, webhook, AI/RAG, billing, settlement, admin UI, or package change.
- No staging, commit, push, cleanup, reset, stash, restore, or removal of held historical docs.

## Verification

- `node --test tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js`: PASS
- `node --test tests/engineerMobile/engineerMobileAssignedAppointmentsHandler.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.unit.test.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyHttpAdapter.unit.test.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js`: PASS
- `git diff --check -- src/engineerMobile/engineerMobileWorkbenchReadOnlyModule.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js docs/task-1742-engineer-mobile-workbench-read-only-composition-factory-injected-repository-no-db-no-global-mount.md`: PASS
- `git diff --no-index --check -- /dev/null <new Task1742 file>` for each new Task1742 file: PASS
- `npm run check`: PASS

No DB-backed checks and no smoke were run for this task.

## Preserved Boundaries

- One Case still has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not touched.
- `finalAppointmentId` remains backend/system-owned except explicit admin override.
- A Case may still have multiple appointments and dispatch visits.
- Engineer Mobile Workbench read-only composition does not create or update Field Service Reports.
- No second formal Field Service Report can be produced by this module.
- Existing held historical untracked docs remain out of scope.

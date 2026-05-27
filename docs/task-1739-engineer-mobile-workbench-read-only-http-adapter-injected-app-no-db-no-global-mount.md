# Task1739 - Engineer Mobile Workbench Read-only HTTP Adapter

Status: completed locally.

## Scope

Task1739 adds an isolated Engineer Mobile Workbench read-only HTTP adapter for assigned appointment list and assigned appointment detail behavior.

The adapter is injected-only. It registers two GET handlers against a caller-provided synthetic `app` or `router`, obtains context only through injected `getContext`, and delegates to the already accepted Task1735 and Task1737 read-only handlers supplied by the caller.

## Files Changed

- `src/engineerMobile/engineerMobileWorkbenchReadOnlyHttpAdapter.js`
- `tests/engineerMobile/engineerMobileWorkbenchReadOnlyHttpAdapter.unit.test.js`
- `docs/task-1739-engineer-mobile-workbench-read-only-http-adapter-injected-app-no-db-no-global-mount.md`

## Runtime Surface Added

- `createEngineerMobileWorkbenchReadOnlyHttpAdapter({ app, router, assignedAppointmentsHandler, assignedAppointmentDetailHandler, getContext })`
- `mountEngineerMobileWorkbenchReadOnlyRoutes({ app, router, handlers, assignedAppointmentsHandler, assignedAppointmentDetailHandler, getContext, listPath, detailPath })`

Default canonical synthetic paths:

- `GET /engineer-mobile/appointments`
- `GET /engineer-mobile/appointments/:appointmentId`

Internal alias paths are also retained for safe synthetic compatibility:

- `GET /__internal/engineer-mobile/workbench/assigned-appointments`
- `GET /__internal/engineer-mobile/workbench/assigned-appointments/:appointmentId`

The adapter:

- registers canonical routes only on an injected synthetic app/router
- retains internal alias routes without global mounting
- delegates list reads to the injected Task1735 handler
- delegates detail reads to the injected Task1737 handler
- obtains context only through injected `getContext`
- extracts only a safe appointment id for detail reads
- preserves safe allow/deny envelope behavior
- returns safe deny responses when context, route input, handlers, or registration are unavailable
- catches handler failures without leaking raw errors, stack traces, SQL, provider payloads, tokens, internal notes, or debug data

## Bounded Runtime, Not Production Rollout

This is real runtime code, but it is not mounted into production bootstrap.

It does not import `src/app.js`, `src/server.js`, shared route indexes, route registries, DB clients, repositories, providers, sessions, auth middleware, or server listen behavior. It is callable only through direct import with injected dependencies.

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

- `node --test tests/engineerMobile/engineerMobileWorkbenchReadOnlyHttpAdapter.unit.test.js`: PASS
- `node --test tests/engineerMobile/engineerMobileAssignedAppointmentsHandler.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.unit.test.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyHttpAdapter.unit.test.js`: PASS
- `git diff --check -- src/engineerMobile tests/engineerMobile docs/task-1739-engineer-mobile-workbench-read-only-http-adapter-injected-app-no-db-no-global-mount.md`: PASS
- `npm run check`: PASS

## Preserved Boundaries

- One Case still has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not touched.
- `finalAppointmentId` remains backend/system-owned except explicit admin override.
- A Case may still have multiple appointments and dispatch visits.
- Engineer Mobile Workbench read-only HTTP adapter does not create or update Field Service Reports.
- No second formal Field Service Report can be produced by this adapter.
- Existing held historical untracked docs remain out of scope.

## Task1740 Correction

Task1740 aligns the Task1739 adapter route contract with PM-required canonical injected routes. The adapter now registers `GET /engineer-mobile/appointments` and `GET /engineer-mobile/appointments/:appointmentId` by default, while preserving the previous internal paths as aliases. The correction remains limited to the existing Task1739 runtime file, unit test file, and doc. No commit or push was performed.

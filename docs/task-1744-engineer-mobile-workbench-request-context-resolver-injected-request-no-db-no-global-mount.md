# Task1744 - Engineer Mobile Workbench Request Context Resolver

Status: completed locally.

## Scope

Task1744 adds a bounded Engineer Mobile Workbench request context resolver. The resolver converts a caller-provided synthetic request-like object into the safe context shape already expected by the accepted read-only list/detail handlers and Task1742 module.

This is injected-only runtime code. It does not perform real authentication, open a DB connection, mount routes, start a server, send providers, or wire itself into shared runtime.

## Files Changed

- `src/engineerMobile/engineerMobileWorkbenchRequestContextResolver.js`
- `tests/engineerMobile/engineerMobileWorkbenchRequestContextResolver.unit.test.js`
- `docs/task-1744-engineer-mobile-workbench-request-context-resolver-injected-request-no-db-no-global-mount.md`

## Runtime Surface Added

- `resolveEngineerMobileWorkbenchRequestContext({ request, now })`
- `createEngineerMobileWorkbenchRequestContextResolver({ clock, auditLogger })`

The direct resolver is pure and returns either:

- an allow envelope with `context.organizationId`, `context.engineerUserId`, `context.assignedAppointmentsReadAllowed`, `context.permissions`, and safe `requestMetadata`
- a deny envelope with a safe reason code and no raw request payload

The factory form can emit optional safe audit intent metadata through an injected logger. It does not require or create an audit writer, repository, DB client, provider client, route, server, or shared runtime object.

## Required Behavior Covered

- Accepts only injected request-like input.
- Reads organization identity from safe request context / auth / session locations.
- Reads engineer identity from safe request context / auth / session locations.
- Allows `request.user.id` only when explicit read allowance or engineer role evidence is present.
- Requires organization identity.
- Requires engineer identity.
- Requires explicit Engineer Mobile assigned appointment read permission or allowance.
- Produces normalized context compatible with Task1735, Task1737, and Task1742.
- Fails closed on missing request, missing organization, missing engineer identity, missing read permission, conflicting organization identities, conflicting engineer identities, unsupported role, and malformed nested request objects.
- Returns only safe metadata such as request id, trace id, correlation id, and optional resolved timestamp.
- Does not expose raw authorization header, cookie, token, password, secret, raw session object, raw user object, stack trace, SQL, DB row, internal note, or provider debug data.
- Does not mutate the input request.
- Does not call DB, provider, app/server/listen, route mount, appointment mutation, Case mutation, Completion Report mutation, Field Service Report mutation, or workflow mutation.

## Bounded Runtime, Not Production Rollout

This task creates the resolver only. It is not connected to the existing HTTP adapter or global routes. A future bounded task can decide whether to inject it as the `getContext(request)` implementation for the Task1742 module.

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

- `node --test tests/engineerMobile/engineerMobileWorkbenchRequestContextResolver.unit.test.js`: PASS
- `node --test tests/engineerMobile/engineerMobileAssignedAppointmentsHandler.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.unit.test.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyHttpAdapter.unit.test.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js tests/engineerMobile/engineerMobileWorkbenchRequestContextResolver.unit.test.js`: PASS
- `git diff --no-index --check -- /dev/null <new Task1744 file>` for each new Task1744 file: PASS
- `npm run check`: PASS

No DB-backed checks and no smoke were run for this task.

## Preserved Boundaries

- One Case still has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not touched.
- `finalAppointmentId` remains backend/system-owned except explicit admin override.
- A Case may still have multiple appointments and dispatch visits.
- Engineer Mobile Workbench request context resolution does not create or update Field Service Reports.
- No second formal Field Service Report can be produced by this resolver.
- Existing held historical untracked docs remain out of scope.

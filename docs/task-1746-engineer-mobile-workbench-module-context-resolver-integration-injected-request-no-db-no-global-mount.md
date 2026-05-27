# Task1746 - Engineer Mobile Workbench Module Context Resolver Integration

Status: completed locally.

## Scope

Task1746 wires the accepted Task1744 request context resolver into the accepted Task1742 Engineer Mobile Workbench read-only composition module.

This is still injected-only runtime code. It lets the module build `getContext(request)` from an injected request-like object when `requestContextResolver` is supplied, without adding real auth/session runtime, DB access, global route mounting, shared route registration, provider sending, or workflow mutation.

## Files Changed

- `src/engineerMobile/engineerMobileWorkbenchReadOnlyModule.js`
- `tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js`
- `docs/task-1746-engineer-mobile-workbench-module-context-resolver-integration-injected-request-no-db-no-global-mount.md`

## Runtime Surface Changed

`createEngineerMobileWorkbenchReadOnlyModule` still supports the existing explicit `getContext` path.

It now also supports a resolver-backed path through injected module options:

- `requestContextResolver: true`
- `useRequestContextResolver: true`
- `requestContextResolver: async ({ request }) => envelope`

When enabled, the module converts the resolver allow envelope into the same safe handler-compatible context already consumed by the read-only HTTP adapter and list/detail handlers. Deny, missing, malformed, or thrown resolver results fail closed before repository access.

## Required Behavior Covered

- Existing explicit `getContext` module creation and route registration still works.
- The module can use the accepted Task1744 resolver as a request-backed context source.
- Canonical list route flow remains:
  - synthetic request
  - resolver-backed context
  - HTTP adapter
  - list handler
  - injected repository
- Canonical detail route flow remains:
  - synthetic request
  - resolver-backed context
  - HTTP adapter
  - detail handler
  - injected repository
- Repository calls receive scoped `organizationId`, `engineerUserId`, and `appointmentId` for detail.
- Missing read permission from the resolver path fails closed before repository access.
- Resolver throw fails closed without leaking raw error text.
- Output excludes raw authorization header, cookie, token, password, secret, raw session, raw user, raw SQL, raw DB row, stack trace, internal note, provider debug data, and `finalAppointmentId`.
- Input request is not mutated.
- No mutation method is called.
- No app/server/listen/global route registration is added.

## Bounded Runtime, Not Production Rollout

This task connects two accepted injected-only pieces inside the Engineer Mobile Workbench read-only composition module. It does not mount the module into production bootstrap, expose a new public API surface, introduce real auth/session integration, create DB-backed repositories, or persist audit evidence.

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

- `node --test tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js`: PASS, 12 tests.
- `node --test tests/engineerMobile/engineerMobileAssignedAppointmentsHandler.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.unit.test.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyHttpAdapter.unit.test.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js tests/engineerMobile/engineerMobileWorkbenchRequestContextResolver.unit.test.js`: PASS, 64 tests.
- `git diff --check -- src/engineerMobile/engineerMobileWorkbenchReadOnlyModule.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js docs/task-1746-engineer-mobile-workbench-module-context-resolver-integration-injected-request-no-db-no-global-mount.md`: PASS.
- `git diff --no-index --check -- /dev/null docs/task-1746-engineer-mobile-workbench-module-context-resolver-integration-injected-request-no-db-no-global-mount.md`: PASS.
- `npm run check`: PASS.

No DB-backed checks and no smoke were run for this task.

## Preserved Boundaries

- One Case still has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not touched.
- `finalAppointmentId` remains backend/system-owned except explicit admin override.
- A Case may still have multiple appointments and dispatch visits.
- Engineer Mobile Workbench request context integration does not create or update Field Service Reports.
- No second formal Field Service Report can be produced by this integration.
- Existing held historical untracked docs remain out of scope.

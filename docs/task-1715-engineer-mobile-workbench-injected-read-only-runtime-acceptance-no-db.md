# Task1715 Engineer Mobile Workbench Injected Read-only Runtime Acceptance / No DB

Status: completed locally for PM review.

## Scope

Task1715 adds a focused acceptance closure for the existing Engineer Mobile Workbench injected read-only runtime path.

Allowed files:

- `tests/engineerMobileWorkbench/engineerMobileWorkbenchInjectedReadOnlyRuntimeAcceptance.test.js`
- `docs/task-1715-engineer-mobile-workbench-injected-read-only-runtime-acceptance-no-db.md`

No `src` runtime code was changed.

## Acceptance Target

The test verifies the existing mounted runtime route path:

- `GET /api/v1/engineer/mobile-workbench/context`
- `GET /api/v1/engineer/mobile-workbench/tasks`
- `GET /api/v1/engineer/mobile-workbench/tasks/:taskId`

With injected read-only providers, these routes return safe non-501 envelopes.

The same acceptance test verifies the write/action routes remain unchanged when no action/completion providers are injected:

- `POST /api/v1/engineer/mobile-workbench/tasks/:taskId/arrived`
- `POST /api/v1/engineer/mobile-workbench/tasks/:taskId/started`
- `POST /api/v1/engineer/mobile-workbench/tasks/:taskId/completion-submissions`

Those routes continue to return the existing safe skeleton `501` response unless a separate bounded task injects an approved operation provider.

## Boundaries

- No DB.
- No migration.
- No psql.
- No `npm run db:migrate`.
- No DDL dry-run or apply.
- No API shape change.
- No provider sending.
- No AI/RAG.
- No admin UI.
- No completion persistence.
- No Field Service Report write.
- No `field_service_reports.case_id` change.
- No formal FSR creation/update.
- No `finalAppointmentId` exposure, inference, or mutation.
- `finalAppointmentId` remains backend/system-owned.
- Plain-text guard phrase: finalAppointmentId remains backend/system-owned.

## Safety Assertions

The acceptance test confirms read-only provider output is filtered:

- wrong organization rows do not appear
- wrong engineer rows do not appear
- internal notes do not leak
- audit logs do not leak
- AI raw payload does not leak
- billing/settlement internals do not leak
- raw phone/address/LINE ids do not leak
- token/secret values do not leak
- `finalAppointmentId` does not leak

## Runtime Meaning

Task1715 does not create a repository-backed default runtime and does not connect to a real database.

It records that the existing server/app route path can already move beyond the default skeleton `501` only when explicit injected read-only providers are supplied. Without those providers, the default skeleton remains safe.

## Validation

Required validation:

- `node --test tests/engineerMobileWorkbench/*.js tests/engineerMobile/*.js`
- `npm run check`
- `git diff --check -- tests/engineerMobileWorkbench/engineerMobileWorkbenchInjectedReadOnlyRuntimeAcceptance.test.js docs/task-1715-engineer-mobile-workbench-injected-read-only-runtime-acceptance-no-db.md`

## Rollback

Rollback is limited to removing the two Task1715 files above. No runtime source rollback is required because no `src` file was changed.

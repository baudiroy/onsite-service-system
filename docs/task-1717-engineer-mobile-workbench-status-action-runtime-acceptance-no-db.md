# Task1717 Engineer Mobile Workbench Status Action Runtime Acceptance / No DB

Status: completed locally for PM review.

## Scope

Task1717 adds a focused no-DB runtime acceptance closure for Engineer Mobile Workbench action routes.

Allowed files:

- `tests/engineerMobileWorkbench/engineerMobileWorkbenchStatusActionRuntimeAcceptance.test.js`
- `docs/task-1717-engineer-mobile-workbench-status-action-runtime-acceptance-no-db.md`

No `src` runtime code was changed.

## Acceptance Target

The test verifies the existing mounted runtime route path:

- `POST /api/v1/engineer/mobile-workbench/tasks/:taskId/arrived`
- `POST /api/v1/engineer/mobile-workbench/tasks/:taskId/started`
- `POST /api/v1/engineer/mobile-workbench/tasks/:taskId/completion-submissions`

Without injected operation or completion providers, these routes remain protected by the existing safe skeleton `501` response.

With explicit injected no-DB providers, the same mounted route path reaches the provider boundary and returns safe accepted envelopes.

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

The acceptance test confirms:

- arrived/started/completion remain `501` without injected providers
- arrived/started route only passes scoped operation input to injected no-DB providers
- completion-submissions route only passes scoped source-data input to injected no-DB provider
- request body values for provider sending, formal FSR write, and finalAppointmentId are ignored
- provider-returned unsafe fields are not copied to public responses
- no sensitive token/secret/raw phone/address/internal/audit/AI payload fields leak

## Runtime Meaning

Task1717 does not create a repository-backed writer, default writer, DB-backed operation, completion persistence, provider sending path, or Field Service Report write.

It records that the current runtime route remains safe by default and only moves beyond skeleton responses when explicit injected no-DB providers are supplied by a bounded task.

## Validation

Required validation:

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchStatusActionRuntimeAcceptance.test.js`
- `node --test tests/engineerMobileWorkbench/*.js tests/engineerMobile/*.js`
- `npm run check`
- `git diff --check -- tests/engineerMobileWorkbench/engineerMobileWorkbenchStatusActionRuntimeAcceptance.test.js docs/task-1717-engineer-mobile-workbench-status-action-runtime-acceptance-no-db.md`

## Rollback

Rollback is limited to removing the two Task1717 files above. No runtime source rollback is required because no `src` file was changed.

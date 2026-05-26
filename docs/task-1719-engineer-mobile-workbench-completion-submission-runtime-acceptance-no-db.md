# Task1719 Engineer Mobile Workbench Completion Submission Runtime Acceptance / No DB

Status: completed locally for PM review.

## Scope

Task1719 adds a focused no-DB runtime acceptance closure for Engineer Mobile Workbench completion-submission source-data handling.

Allowed files:

- `tests/engineerMobileWorkbench/engineerMobileWorkbenchCompletionSubmissionRuntimeAcceptance.test.js`
- `docs/task-1719-engineer-mobile-workbench-completion-submission-runtime-acceptance-no-db.md`

No `src` runtime code was changed.

## Acceptance Target

The test verifies the existing mounted runtime route path:

- `POST /api/v1/engineer/mobile-workbench/tasks/:taskId/completion-submissions`

Without an injected completion provider, the route remains protected by the existing safe skeleton `501` response.

With an explicit injected no-DB completion provider, the same mounted route path can receive a completion-submission draft/source-data payload and return a safe accepted envelope.

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

- completion-submission remains `501` without an injected completion provider
- injected no-DB provider receives only scoped source-data input
- completion submission remains source-data only
- request body values for provider sending, formal FSR write, field service report ids, and finalAppointmentId are ignored
- provider-returned unsafe fields are not copied to public responses
- no token/secret/raw phone/address/LINE/internal/audit/AI payload fields leak

## Runtime Meaning

Task1719 does not create a repository-backed writer, default writer, DB-backed completion persistence, provider sending path, or Field Service Report write.

It records that completion submission can be accepted as a bounded source-data envelope only when an explicit no-DB provider is injected. Formal completion report creation remains a separate future task and must preserve one Case / one formal Field Service Report.

## Validation

Required validation:

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchCompletionSubmissionRuntimeAcceptance.test.js`
- `node --test tests/engineerMobileWorkbench/*.js tests/engineerMobile/*.js`
- `npm run check`
- `git diff --check -- tests/engineerMobileWorkbench/engineerMobileWorkbenchCompletionSubmissionRuntimeAcceptance.test.js docs/task-1719-engineer-mobile-workbench-completion-submission-runtime-acceptance-no-db.md`

## Rollback

Rollback is limited to removing the two Task1719 files above. No runtime source rollback is required because no `src` file was changed.

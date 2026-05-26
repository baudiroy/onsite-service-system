# Task1722 Engineer Mobile Workbench DB Read Provider Factory / No Migration

Status: local runtime slice, pending PM review.

## Scope

Task1722 adds an injected-only DB-backed Engineer Mobile Workbench read provider factory.

Allowed files:

- `src/engineerMobileWorkbench/engineerMobileWorkbenchDbReadProviderFactory.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbenchDbReadProviderFactory.test.js`
- `docs/task-1722-engineer-mobile-workbench-db-read-provider-factory-no-migration.md`

## Runtime Boundary

The factory composes Workbench provider options for:

- current context
- task list
- task detail

It uses injected dbClient.query only. It does not import the default DB pool, env config, BaseRepository, AppointmentRepository, FieldServiceReportRepository, app bootstrap, server bootstrap, provider sending modules, AI/RAG modules, billing, settlement, admin UI, smoke scripts, or migration runners.

## Safety Boundaries

- No default DB.
- No global pool.
- No repository-backed writer.
- No migration apply.
- No psql.
- No db:migrate.
- No DDL execution.
- No API shape change.
- No provider sending.
- No Field Service Report write.
- No completion persistence.
- No appointment mutation.
- No Field Service Report mutation.
- No finalAppointmentId mutation.
- finalAppointmentId remains backend/system-owned.
- No admin UI.
- No LINE/SMS/App/email/webhook sending.
- No AI/RAG.
- No billing/settlement.
- No Zeabur/shared smoke.

## DB Read Shape

Context read:

- verifies engineer and organization through safe read-only joins on `users`, `user_organizations`, and `organizations`;
- returns only safe Workbench context display fields;
- does not return email, phone, password hash, token, secret, audit logs, raw provider payloads, or internal notes.

Task list/detail reads:

- reuse the existing Engineer Mobile read-model repository boundary;
- read from `engineer_mobile_task_read_models`;
- scope by `organization_id`, `assigned_engineer_id`, and, for detail, `appointment_id`;
- map through existing safe read-model mappers.

## Preserved Core Invariants

- A Case still has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not touched.
- Case may still have multiple appointments / dispatch visits.
- The factory does not create or update a formal Field Service Report.
- The factory does not infer, expose, or mutate `finalAppointmentId`.
- Completion submissions remain source-data only unless a future bounded task explicitly adds persistence.

## Validation

Planned validation commands:

```sh
node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchDbReadProviderFactory.test.js
node --test tests/engineerMobileWorkbench/*.js tests/engineerMobile/*.js
npm run check
git diff --check -- src/engineerMobileWorkbench/engineerMobileWorkbenchDbReadProviderFactory.js tests/engineerMobileWorkbench/engineerMobileWorkbenchDbReadProviderFactory.test.js docs/task-1722-engineer-mobile-workbench-db-read-provider-factory-no-migration.md
```

Credential scan should cover the Task1722 source, test, and doc files and must remain clean.

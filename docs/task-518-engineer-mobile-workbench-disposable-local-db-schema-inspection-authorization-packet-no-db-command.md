# Task 518 - Engineer Mobile Workbench Disposable Local DB Schema Inspection Authorization Packet

## Branch Status

Task518 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only and authorization-packet-only.

There is no DB command, no SQL command, no DDL command, no migration, no migration dry-run, no migration apply, no runtime, no repository implementation, no test / fixture creation, no test execution, no provider sending, and no AI/RAG/vector database.

Task518 is not a DB inspection approval by itself.

Task518 is not a migration approval.

Task518 is not a runtime approval.

Task518 does not approve DB command.

Task518 does not approve migration.

Task518 does not approve runtime.

## Reference Handling

Task518 may use prior Engineer Mobile Workbench design decisions as context, but it does not modify any reference file.

Relevant references confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-516-engineer-mobile-workbench-schema-inspection-planning-no-db-command.md`
- `docs/task-517-engineer-mobile-workbench-file-only-schema-inspection-report-no-db-command.md`
- `docs/task-512-engineer-mobile-workbench-completion-submission-source-data-migration-decision-packet-no-apply.md`
- `docs/task-515-engineer-mobile-workbench-completion-submission-repository-contract-proposal-no-runtime.md`
- `migrations/`
- `src/db/`
- `src/repositories/`

Task518 does not create, rename, patch, normalize, inspect DB, or execute those references.

## Purpose

Task518 responds to Task517's conclusion: file-only inspection is useful, but actual applied schema remains unverified.

Purpose:

- define safe authorization conditions for future disposable local/test DB schema inspection.
- prevent accidental connection to shared / production / Zeabur DB.
- prevent output of secrets, `DATABASE_URL`, or customer data.
- prevent schema inspection from being mistaken for migration approval.
- prevent schema inspection from being mistaken for runtime approval.

This task does not execute any DB inspection.

## Required Preconditions Before Any Future DB Inspection

Before any future DB schema inspection task, all conditions must be true:

- user / PM explicitly approves disposable local/test DB schema inspection.
- the target is explicitly confirmed not to be production, shared, or Zeabur.
- `DATABASE_URL` is explicitly confirmed to point to a disposable local/test DB, without printing it.
- reports must not print `DATABASE_URL`.
- reports must not output token / secret values.
- task must not query or export real customer, engineer, or LINE data.
- only schema metadata inspection is allowed.
- data row inspection is not allowed.
- migration apply is not allowed.
- destructive command is not allowed.
- runtime server start is not allowed.
- provider sending is not allowed.
- AI provider call is not allowed.
- exact command scope and stop conditions must be approved in the future task.

## Future Allowed Inspection Scope Proposal

Future DB inspection may request permission for schema metadata only, such as:

- list tables.
- list columns.
- list indexes.
- list constraints.
- list foreign keys.
- inspect migration applied state if safe and explicitly approved.
- inspect schema metadata for `cases`.
- inspect schema metadata for `appointments`.
- inspect schema metadata for `dispatch_assignments`.
- inspect schema metadata for dispatch visits if present.
- inspect schema metadata for `field_service_reports`.
- inspect schema metadata for `users`.
- inspect schema metadata for `organizations`.
- inspect schema metadata for `user_organizations`.
- inspect schema metadata for `audit_logs`.
- inspect schema metadata for `case_attachments` / object refs.
- inspect schema metadata for completion submission candidate structures.

Only metadata is allowed.

Data row contents are not allowed.

## Explicit Forbidden Commands / Actions

Future DB inspection must not:

- connect to production / shared / Zeabur DB.
- run migration apply.
- run migration rollback.
- make DDL changes.
- run `INSERT`.
- run `UPDATE`.
- run `DELETE`.
- export data.
- select customer / engineer / LINE personal data rows.
- print `DATABASE_URL`.
- print tokens / secrets.
- start backend runtime server.
- run smoke / API / browser tests.
- send provider messages.
- call AI / RAG / vector DB.
- modify migration files.
- modify repository/runtime files.

## Safe Output Format

Future DB inspection report should include:

- target environment label only, such as disposable local/test DB.
- no raw connection string.
- no secret values.
- inspected metadata categories.
- table names found.
- column names found only if schema-level and non-sensitive.
- indexes / constraints found.
- unknowns.
- risks.
- repository implications.
- migration implications.
- next recommended PM task.

Future report must not include:

- raw `DATABASE_URL`.
- token / secret values.
- real customer, engineer, or LINE row data.
- provider payloads.
- AI raw payloads.
- full data exports.

## Schema Questions To Answer Later

Future disposable local/test DB metadata inspection should answer:

- whether actual applied schema contains the file-only found tables.
- whether `field_service_reports.case_id` uniqueness actually exists.
- actual `appointments` columns.
- actual `dispatch_assignments` columns.
- whether a dispatch visits table exists.
- whether `users` is sufficient as engineer identity.
- whether an `engineer_profiles` table exists or is needed.
- whether `organization_id` covers needed entities directly or indirectly.
- whether object reference pattern can be reused.
- whether idempotency convention exists.
- whether completion submission source-data needs a new table.
- whether audit / `created_by` / `updated_by` conventions are consistent.

## Decision Gates After Future Inspection

After a future approved metadata-only inspection, possible next decisions:

- continue docs-only contract refinement.
- migration draft authorization packet / no apply.
- repository runtime limited scope proposal / no runtime.
- synthetic fixture file touch plan.
- disposable DB dry-run authorization, only if separately approved.
- blocked due to schema mismatch.

## Guardrail Invariants

Future inspection and downstream tasks must preserve:

- one Case ultimately has one formal Field Service Report.
- multiple appointments / dispatch visits remain visit-level.
- completion submissions are source-data only.
- multiple submissions do not create multiple formal Field Service Reports.
- `field_service_reports.case_id` uniqueness must not be broken.
- `finalAppointmentId` remains system-owned.
- engineer cannot manually select `finalAppointmentId`.
- no survey / provider / billing / settlement / AI approval trigger.
- LINE is not global identity.
- every future repository method must be organization-scoped.

## Authorization Conclusion

READY TO REQUEST SEPARATE DISPOSABLE DB SCHEMA INSPECTION TASK — NO DB COMMAND IN TASK518.

Task518 does not approve DB command.

Task518 does not approve migration.

Task518 does not approve runtime.

Any actual DB inspection requires a separate PM-approved task with exact command scope and stop conditions.

## Future Sequencing

Future tasks, proposal only:

- Task519: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply.
- Task520: Synthetic Repository Fixture File Touch Plan / No Runtime.
- Task521: Completion Submission Repository Runtime Scope Proposal / No Runtime.
- Task522: Migration Draft Authorization Packet / No Apply.
- Task523: Repository Runtime Limited Scope Proposal / No Runtime.

Task518 does not execute these tasks.

## Non-goals

Task518 does not:

- modify `src/`.
- modify `admin/src/`.
- add or modify `fixtures/`.
- add or modify `tests/`.
- modify repositories / models / db runtime.
- add repository class / interface.
- add service class.
- add SQL.
- add migration.
- modify Migration020.
- execute DB / SQL / DDL / psql / migration / dry-run / apply.
- execute test / lint / smoke / browser / API commands.
- execute package scripts.
- modify `package.json` or lock files.
- call LINE / SMS / Email / App provider.
- call AI / RAG / vector DB.
- copy real personal data, token, secret, or `DATABASE_URL` into docs.
- modify inventory docs.
- implement repository runtime.
- implement completion persistence runtime.
- implement appointment state transition runtime.
- implement formal Field Service Report creation.
- implement survey / provider / billing / settlement / AI approval.
- become a DB inspection completed report.

## Verification Boundary

Task518 static verification should confirm:

- `git diff --check docs/task-518-engineer-mobile-workbench-disposable-local-db-schema-inspection-authorization-packet-no-db-command.md` passes.
- Task518 only adds or modifies the allowed markdown file.
- no `src/`, `admin/src/`, tests, fixtures, migrations, package, smoke, or runtime files are changed by Task518.
- this document explicitly states no DB command, no SQL, no DDL, no migration, no runtime, no repository implementation, no test execution, no provider, and no AI runtime.
- this document explicitly states Task518 does not approve DB command / migration / runtime.

No test, lint, smoke, browser, API, database, migration, provider, or AI command is required for Task518.

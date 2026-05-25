# Task 524 - Engineer Mobile Workbench Disposable DB Metadata Inspection Command Envelope

## Branch Status

Task524 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only and command-envelope-only.

No DB command.

No SQL execution.

No DDL.

No migration.

No migration dry-run.

No migration apply.

No runtime.

No repository implementation.

No repository interface implementation.

No service implementation.

No fixture/test creation.

No fixture/test modification.

No test execution.

No provider sending.

No AI/RAG/vector DB.

Task524 is not a DB inspection approval.

Task524 is not a migration approval.

Task524 is not a runtime approval.

Task524 does not approve DB command.

Task524 does not execute DB command.

Task524 does not approve migration.

Task524 does not approve runtime.

Actual DB inspection still requires explicit user approval and a separate PM task.

## Reference Handling

Task524 uses prior Engineer Mobile Workbench planning documents as read-only context.

References inspected or confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-517-engineer-mobile-workbench-file-only-schema-inspection-report-no-db-command.md`
- `docs/task-518-engineer-mobile-workbench-disposable-local-db-schema-inspection-authorization-packet-no-db-command.md`
- `docs/task-523-engineer-mobile-workbench-disposable-local-db-schema-inspection-readiness-gate-no-db-command.md`
- `docs/task-522-engineer-mobile-workbench-completion-submission-repository-runtime-scope-proposal-no-runtime.md`
- `docs/task-512-engineer-mobile-workbench-completion-submission-source-data-migration-decision-packet-no-apply.md`

Task524 does not modify, normalize, execute, or expand those references.

## Purpose

This document converts the Task523 readiness gate into a future command envelope for a possible disposable local/test DB metadata-only schema inspection.

Purpose:

- help PM and user approve or reject a future disposable local/test DB metadata-only inspection.
- prevent any unauthorized DB command.
- prevent accidental connection to production, shared, or Zeabur DB.
- prevent output of `DATABASE_URL`, token, secret, customer data, engineer data, or LINE data.
- prevent metadata inspection from being mistaken for migration approval.
- prevent metadata inspection from being mistaken for runtime approval.

Task524 does not inspect a database.

## Required User Approval Text For Future Task

Future Task525 or later may ask the user to confirm an approval checklist like this.

This is template text only. Task524 does not request or execute approval.

Required future user confirmation:

- I explicitly approve metadata-only DB schema inspection.
- The target DB is a disposable local/test DB.
- The target DB is not production.
- The target DB is not shared.
- The target DB is not Zeabur.
- Migration apply is not allowed.
- Migration rollback is not allowed.
- DDL is not allowed.
- `INSERT` / `UPDATE` / `DELETE` are not allowed.
- Querying business data rows is not allowed.
- Printing `DATABASE_URL` is not allowed.
- Printing token / secret is not allowed.
- Printing customer / engineer / LINE personal data is not allowed.
- Only schema metadata summary is allowed.
- If any condition is uncertain, Codex must stop.

## Future Allowed Command Categories Proposal

These are command categories only. Task524 approves no commands.

Future approved command envelope may include:

- identify DB client availability.
- verify target environment label without printing connection string.
- list table metadata.
- list column metadata.
- list index metadata.
- list constraint metadata.
- list foreign key metadata.
- inspect migration applied metadata if safe and explicitly approved.
- summarize metadata output into docs / PM report.

Rules:

- exact commands must be separately approved.
- no commands are approved by Task524.
- no command may print connection strings.
- no command may print environment variables.
- no command may return row data.
- no command may mutate schema.
- no command may mutate data.

## Future Forbidden Command Categories

Future DB inspection must not include:

- `SELECT *` from business tables.
- any query returning customer / engineer / LINE data rows.
- DDL.
- migration apply.
- migration rollback.
- destructive command.
- starting backend server.
- running smoke/API/browser tests.
- provider sending.
- AI/RAG/vector DB call.
- printing env vars.
- printing `DATABASE_URL`.
- printing tokens / secrets.
- modifying migration files.
- modifying repository/runtime files.

## Metadata Targets For Future Inspection

| Target | Why needed | Related repository / workflow | Metadata needed | Sensitive data risk | Stop condition if unsafe |
| --- | --- | --- | --- | --- | --- |
| `cases` | confirm Case linkage and organization scope | Case / completion source-data | table, columns, indexes, constraints, FK summary | high if row data is queried | stop if command would read rows |
| `appointments` | confirm task/visit linkage and state columns | appointment eligibility / final appointment context | table, columns, indexes, constraints, FK summary | high if customer/visit notes are queried | stop if command would read rows |
| `dispatch_assignments` | confirm engineer assignment linkage | assignment verification | table, columns, indexes, constraints, FK summary | medium if assignment rows are queried | stop if command would read rows |
| dispatch visit table if present | determine whether separate visit entity exists | optional dispatch visit linkage | table existence, columns, FK summary | medium if row data is queried | stop if table cannot be inspected metadata-only |
| `field_service_reports` | confirm one Case / one formal report constraints | formal FSR guardrail | columns, unique indexes, FK summary | high if report body rows are queried | stop if command would read report rows |
| `users` | confirm engineer identity basis | auth / engineer identity mapping | columns, indexes, constraints | high if user row data is queried | stop if command would read identities |
| `organizations` | confirm tenant scope | organization isolation | columns, indexes, constraints | medium if tenant rows are queried | stop if command would read tenant data |
| `user_organizations` | confirm membership mapping | org scope resolution | columns, indexes, constraints, FK summary | medium if row data is queried | stop if command would read memberships |
| `audit_logs` | confirm audit convention | future audit/evidence strategy | columns, indexes, constraints | high if audit rows are queried | stop if command would read audit values |
| `case_attachments` / object refs | confirm object metadata reference pattern | photos/signature/file refs | columns, indexes, constraints, FK summary | high if object paths or signed URLs appear | stop if output would expose object secrets |
| possible completion source-data tables | detect existing reusable structure | completion submission repository | table names, columns, indexes, constraints | high if source rows exist | stop if command would read rows |
| migration applied state metadata if safe | confirm applied migration baseline | migration decision | migration identifiers only | medium if metadata contains env info | stop if output would print secrets |

## Safe Output Redaction Rules

Future report may include only:

- table names.
- column names.
- index names.
- index definitions summary.
- constraint names.
- constraint summary.
- foreign key summary.
- migration applied metadata summary, if safe.

Future report must not include:

- row values.
- connection string.
- environment variable values.
- tokens.
- secrets.
- customer names.
- phone numbers.
- addresses.
- LINE ids.
- provider payload.
- AI payload.

If a secret-like value appears, future report may only state: secret-like value encountered but not copied.

If personal-data-like row data appears, the inspection must stop and the data must not be copied.

## Future DB Inspection Stop Conditions

Future DB inspection must stop if:

- target DB cannot be confirmed disposable local/test.
- target appears production / shared / Zeabur.
- command would print `DATABASE_URL`.
- command would inspect row data.
- command would mutate schema.
- command would mutate data.
- command requires migration apply / rollback.
- command output contains secret-like values.
- command output contains personal-data-like values.
- schema conflicts with one Case one formal FSR guardrail.
- organization isolation cannot be assessed safely.
- task requires runtime code changes.

## Future Inspection Report Template

Future Task525 or later report should include:

- approved scope.
- target environment label only.
- command categories executed.
- confirmation no DB URL printed.
- confirmation no row data queried.
- tables found.
- columns found summary.
- indexes / constraints found summary.
- FK summary.
- migration applied metadata summary, if inspected.
- unknowns.
- guardrail implications.
- migration implications.
- repository runtime implications.
- whether any stop condition occurred.
- next recommended PM task.

## Guardrail Invariants

Future inspection and downstream tasks must preserve:

- one Case ultimately has one formal Field Service Report.
- multiple appointments / dispatch visits remain visit-level.
- completion submissions are source-data only.
- multiple submissions do not create multiple formal Field Service Reports.
- `field_service_reports.case_id` uniqueness must not be broken.
- `finalAppointmentId` remains system-owned.
- engineer cannot manually select `finalAppointmentId`.
- completion submission does not mean Case completed.
- no survey / provider / billing / settlement / AI approval trigger.
- LINE is not global identity.
- every future repository method must be organization-scoped.

## Command Envelope Conclusion

READY TO REQUEST USER APPROVAL FOR METADATA-ONLY DB INSPECTION.

This conclusion only means the command envelope is ready for an approval request.

Task524 does not approve DB command.

Task524 does not execute DB command.

Task524 does not approve migration.

Task524 does not approve runtime.

Actual DB inspection still requires explicit user approval and separate PM task.

## Future Sequencing

Future tasks, proposal only:

- Task525: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply, only after explicit user approval.
- Task526: Migration Draft Authorization Packet / No Apply.
- Task527: Completion Submission Repository Runtime File Touch Plan / No Runtime.
- Task528: Repository Runtime Contract Test Plan / No Runtime.
- Task529: PM Continuation Handoff Summary / No Runtime Change.

Task524 does not execute these future tasks.

## Non-goals

Task524 does not:

- modify `src/`.
- modify `admin/src/`.
- modify fixtures.
- modify tests.
- add or modify repository / service / model code.
- add repository interface files.
- add SQL.
- add migrations.
- modify Migration020.
- execute DB / SQL / DDL / psql / migration / dry-run / apply.
- execute test / lint / smoke / browser / API commands.
- modify `package.json` or lock files.
- call LINE / SMS / Email / App providers.
- call AI / RAG / vector DB.
- copy real personal data, token, secret, or `DATABASE_URL` into docs.
- modify inventory docs.
- implement repository runtime.
- implement completion persistence runtime.
- implement appointment state transition runtime.
- implement formal Field Service Report creation.
- implement survey / provider / billing / settlement / AI approval.
- claim DB inspection was completed.

## Sensitive Data Statement

This document contains only non-sensitive planning text, file paths, task names, table/concept names, and guardrail summaries.

It does not contain actual token, secret, `DATABASE_URL`, customer personal data, raw LINE user id, LINE access token, provider payload, AI raw payload, or full request/response payload.

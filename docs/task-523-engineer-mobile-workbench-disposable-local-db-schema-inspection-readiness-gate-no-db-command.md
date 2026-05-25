# Task 523 - Engineer Mobile Workbench Disposable Local DB Schema Inspection Readiness Gate

## Branch Status

Task523 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only and readiness-gate-only.

No DB command.

No SQL.

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

Task523 is not a DB inspection approval.

Task523 is not a migration approval.

Task523 is not a runtime approval.

Task523 does not approve DB command.

Task523 does not execute DB command.

Task523 does not approve migration.

Task523 does not approve runtime.

Actual DB inspection still requires a separate PM task and explicit user approval.

## Reference Handling

Task523 uses prior Engineer Mobile Workbench planning documents as read-only context.

References inspected or confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-517-engineer-mobile-workbench-file-only-schema-inspection-report-no-db-command.md`
- `docs/task-518-engineer-mobile-workbench-disposable-local-db-schema-inspection-authorization-packet-no-db-command.md`
- `docs/task-522-engineer-mobile-workbench-completion-submission-repository-runtime-scope-proposal-no-runtime.md`
- `docs/task-512-engineer-mobile-workbench-completion-submission-source-data-migration-decision-packet-no-apply.md`
- `docs/task-515-engineer-mobile-workbench-completion-submission-repository-contract-proposal-no-runtime.md`

Task523 does not modify, normalize, execute, or expand those references.

## Gate Purpose

This document:

- summarizes the remaining unknowns from Task517 file-only inspection.
- summarizes the safe authorization conditions from Task518.
- summarizes the runtime blockers identified in Task522.
- decides whether the branch is ready to ask the user for explicit disposable local/test DB metadata-only inspection approval.
- prevents accidental connection to shared, production, or Zeabur DB.
- prevents DB inspection from being mistaken for migration approval.
- prevents DB inspection from being mistaken for runtime approval.

This task does not inspect a database.

## Current Evidence Summary

| Evidence item | Current evidence | Status |
| --- | --- | --- |
| `cases` table / repository evidence | Found in file-only inspection | partial |
| `appointments` table / repository evidence | Found in file-only inspection | partial |
| `dispatch_assignments` evidence | Found in file-only inspection | partial |
| `field_service_reports` evidence | Found in file-only inspection | partial |
| `users` / engineer-as-user evidence | Found in file-only inspection | partial |
| `organizations` evidence | Found in file-only inspection | partial |
| `user_organizations` evidence | Found in file-only inspection | partial |
| `field_service_reports.case_id` uniqueness | Evidence found in migration file | partial |
| separate `engineer_profiles` table | Not found in file-only inspection | unknown |
| reusable completion submission source-data table | Not found in file-only inspection | unknown / likely absent |
| separate dispatch visits table | Not found / unclear in file-only inspection | unknown |
| actual applied DB schema | Not verified | not satisfied |
| disposable DB metadata inspection | Not executed | future task required |
| migration approval | Not granted | not satisfied |
| repository runtime approval | Not granted | not satisfied |

## Required Authorization Checklist Before Actual DB Inspection

Every item must be satisfied or explicitly confirmed before any future DB metadata-only inspection command is run.

| Requirement | Current gate status |
| --- | --- |
| user explicitly approves actual DB metadata-only inspection | requires user confirmation |
| target DB is explicitly disposable local/test DB | requires user confirmation |
| target DB is explicitly not production / shared / Zeabur | requires user confirmation |
| migration apply is explicitly forbidden | satisfied as policy |
| migration rollback is explicitly forbidden | satisfied as policy |
| destructive command is explicitly forbidden | satisfied as policy |
| data row inspection is explicitly forbidden | satisfied as policy |
| exporting customer / engineer / LINE data is explicitly forbidden | satisfied as policy |
| printing `DATABASE_URL` is explicitly forbidden | satisfied as policy |
| printing token / secret is explicitly forbidden | satisfied as policy |
| provider sending is explicitly forbidden | satisfied as policy |
| AI/RAG/vector DB call is explicitly forbidden | satisfied as policy |
| output is limited to schema metadata summary | satisfied as policy |
| exact command scope is separately approved | future task required |
| stop conditions are restated in the future task | future task required |

## Proposed Allowed Metadata-only Inspection Scope For Future Task

This is proposal-only. Task523 does not execute it.

Future approved metadata-only inspection may inspect:

- table names.
- column names.
- index names / index definitions summary.
- constraint names / constraint summary.
- foreign key relationship summary.
- migration applied state metadata, if safe and explicitly approved.

Future approved metadata-only inspection must not inspect row data.

Target entities for metadata-only inspection:

- `cases`.
- `appointments`.
- `dispatch_assignments`.
- dispatch visit table if present.
- `field_service_reports`.
- `users`.
- `organizations`.
- `user_organizations`.
- `audit_logs`.
- `case_attachments` / object refs.
- possible completion source-data related tables if present.

## Explicitly Forbidden Future DB Inspection Actions

Future DB inspection must not:

- connect to production / shared / Zeabur DB.
- run `SELECT *` from business tables.
- read customer names.
- read customer phones.
- read customer addresses.
- read LINE IDs.
- print a connection string.
- run migration apply.
- run migration rollback.
- run DDL.
- run `INSERT`.
- run `UPDATE`.
- run `DELETE`.
- start backend runtime.
- run smoke/API/browser tests.
- send provider messages.
- call AI.
- modify migration files.
- modify runtime files.

## Safe Command Envelope Proposal

Task523 does not authorize any command.

Future task exact commands must be approved before execution.

Future safe command categories may include:

- schema metadata listing command category.
- index metadata listing command category.
- constraint metadata listing command category.
- foreign key metadata listing command category.
- migration metadata listing command category.

Future command output must be redacted and limited.

No secrets or connection strings may appear in output.

No data row contents may appear in output.

## Stop Condition Policy For Future DB Inspection

Future DB inspection must stop immediately if:

- DB target appears shared / production / Zeabur.
- `DATABASE_URL` would be printed.
- a command would inspect data rows.
- a command would modify schema.
- a command would modify data.
- a command would require migration apply / rollback.
- a command would expose secret / token.
- a command would expose customer / engineer / LINE personal data.
- command output includes unexpected sensitive values.
- schema appears inconsistent with guardrails.
- task scope requires runtime code changes.

## Decision Outcomes After Future Inspection

After a future separately approved metadata-only inspection, possible outcomes:

- ready for migration draft authorization packet / no apply.
- ready for completion submission repository file touch plan / no runtime.
- needs more file-only inspection.
- needs migration/data model redesign.
- blocked due to schema mismatch.
- blocked due to organization isolation gap.

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

## Readiness Gate Conclusion

READY TO ASK USER FOR EXPLICIT DISPOSABLE DB METADATA-ONLY INSPECTION APPROVAL.

This conclusion only means the branch is ready to ask for approval.

It does not approve any DB command.

It does not execute any DB command.

It does not approve migration.

It does not approve runtime.

It does not approve repository implementation.

Actual DB inspection still requires a separate PM task and explicit user approval.

## Future Sequencing

Future tasks, proposal only:

- Task524: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply, only after explicit user approval.
- Task525: Migration Draft Authorization Packet / No Apply.
- Task526: Completion Submission Repository Runtime File Touch Plan / No Runtime.
- Task527: Repository Runtime Contract Test Plan / No Runtime.
- Task528: PM Continuation Handoff Summary / No Runtime Change.

Task523 does not execute these future tasks.

## Non-goals

Task523 does not:

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

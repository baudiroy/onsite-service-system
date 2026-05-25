# Task 530 - Engineer Mobile Workbench Completion Submission Migration File Touch Plan Readiness Gate

## Branch Status

Task530 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only.

This task is migration-file-touch-readiness-gate-only.

No migration file creation.

No SQL.

No DB command.

No DDL.

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

This is not a migration approval.

This is not a schema approval.

This is not a DB inspection approval.

This is not a runtime approval.

Current Engineer Mobile Workbench runtime remains skeleton-only.

Current Engineer Mobile Workbench endpoints remain `501 Not Implemented`.

## Reference Handling

Task530 uses prior Engineer Mobile Workbench planning artifacts as read-only context.

References inspected or confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-510-engineer-mobile-workbench-completion-submission-data-model-decision-packet-no-migration.md`
- `docs/task-512-engineer-mobile-workbench-completion-submission-source-data-migration-decision-packet-no-apply.md`
- `docs/task-517-engineer-mobile-workbench-file-only-schema-inspection-report-no-db-command.md`
- `docs/task-523-engineer-mobile-workbench-disposable-local-db-schema-inspection-readiness-gate-no-db-command.md`
- `docs/task-524-engineer-mobile-workbench-disposable-db-metadata-inspection-command-envelope-no-db-command.md`
- `docs/task-525-engineer-mobile-workbench-db-inspection-approval-pending-branch-checkpoint-no-runtime-change.md`
- `docs/task-529-engineer-mobile-workbench-completion-submission-source-data-migration-draft-authorization-packet-no-apply.md`

Task530 does not modify, normalize, execute, or expand those references.

No reference was created to compensate for a missing file.

## Gate Purpose

Task530 reviews whether Engineer Mobile Workbench completion submission source-data is ready for a future migration file touch plan.

Purpose:

- follow Task529's conclusion: `DO NOT AUTHORIZE MIGRATION DRAFT YET`.
- confirm migration file touch remains blocked before actual DB metadata-only inspection.
- confirm actual DB metadata-only inspection still lacks explicit user approval.
- confirm applied schema must be verified before any migration file is added.
- define future gate conditions before any migration file touch plan.
- prevent migration file creation in this task.
- prevent DB command execution in this task.

This task does not authorize migration file creation.

This task does not authorize DB command.

This task does not authorize migration dry-run.

This task does not authorize migration apply.

This task does not authorize runtime.

## Current Blockers

| Blocker | Status | Why it blocks migration file touch |
| --- | --- | --- |
| actual applied DB schema | blocked | no metadata-only DB inspection has been approved or executed |
| disposable local/test DB metadata-only inspection | blocked | explicit user approval is still required |
| completion submission source-data table need | partial | file-only evidence suggests likely need, but actual schema is unverified |
| final table name | blocked | no table name has been approved |
| columns | blocked | no column set has been approved |
| indexes | blocked | no index strategy or uniqueness scope has been approved |
| FKs | blocked | hard FK vs application-level reference strategy is undecided |
| enum / status representation | blocked | no enum, lookup, check constraint, or text-status strategy is approved |
| rollback strategy | future task required | no migration exists and rollback policy is not designed |
| retention policy | future task required | completion source-data, photos, signatures, and drafts need policy decisions |
| migration draft | blocked | Task529 explicitly did not authorize migration draft |
| migration apply / dry-run | blocked | no dry-run or apply authorization exists |
| repository runtime | blocked | persistence runtime is not authorized |

## File-only Evidence Summary

Known from Task517 / Task529:

- `cases` evidence found.
- `appointments` evidence found.
- `dispatch_assignments` evidence found.
- `field_service_reports` evidence found.
- `field_service_reports.case_id` uniqueness evidence found in migration file.
- `users` table supports engineer as `user_type` in file-only evidence.
- no separate `engineer_profiles` table found in file-only inspection.
- `organizations` / `user_organizations` evidence found.
- no reusable completion submission source-data table found.
- `dispatch_visits` table unclear / not found.
- object ref convention found via `case_attachments`.
- `audit_logs` convention found.
- actual DB applied state remains unverified.

This file-only evidence is useful for planning.

This file-only evidence is not enough to touch a migration file.

## Future Migration File Touch Prerequisites

| Prerequisite | Status | Notes |
| --- | --- | --- |
| user explicitly approves DB metadata-only inspection | blocked | required before any DB metadata command |
| disposable local/test DB confirmed | blocked | must not be production / shared / Zeabur |
| production/shared/Zeabur excluded | blocked | must be explicitly confirmed before inspection |
| metadata-only inspection completed | blocked | no DB command executed |
| actual applied schema confirmed | blocked | file-only inspection cannot prove applied state |
| completion submission table need confirmed | partial | likely need based on files, not confirmed against DB |
| naming convention confirmed | partial | migration naming pattern exists, but future filename/table name unapproved |
| organization_id strategy confirmed | partial | tenant scope is mandatory; exact strategy unapproved |
| case / appointment linkage confirmed | partial | conceptual links exist; FK/index details unapproved |
| dispatch assignment / dispatch visit linkage confirmed | partial | dispatch assignment exists; separate visit table unclear |
| engineer identity mapping confirmed | partial | engineer-as-user evidence exists; profile strategy unresolved |
| object refs convention confirmed | partial | metadata refs found; future evidence linkage still needs design |
| idempotency strategy confirmed | partial | idempotency is required but exact key/scope unapproved |
| audit / timestamps / created_by / updated_by conventions confirmed | partial | conventions found in files; future table shape unapproved |
| soft delete convention confirmed | partial | `deleted_at` is common; retention/status policy unapproved |
| index / FK / constraint strategy confirmed | blocked | must wait for schema inspection and migration task |
| rollback strategy confirmed | future task required | must be defined in future migration task |
| migration file allowed path approved | blocked | no migration file touch approved |
| migration test / verification plan approved | partial | Task527 is plan-only; no migration tests approved |

## Future Allowed Migration File Proposal

This section is proposal-only.

No migration file is created.

No final filename is approved.

No final table name is approved.

No columns are approved.

No indexes are approved.

No constraints are approved.

No enum is approved.

No FKs are approved.

No DDL is approved.

| Future item | Purpose | Allowed future content | Forbidden content | Blocker | Separate PM approval required |
| --- | --- | --- | --- | --- | --- |
| possible future migration file under `migrations/` | create source-data table if needed | DDL for source-data only after schema inspection and PM approval | runtime code, seeds, provider triggers, formal FSR changes, unrelated schema | actual DB schema unverified | yes |
| possible naming pattern to be determined from existing migrations | preserve migration ordering and naming consistency | filename proposal only after applied migration state is known | assuming next number or touching Migration020 without approval | applied migration state unverified | yes |
| possible future migration verification doc | define dry-run / static checks before apply | no-apply verification plan, rollback notes, constraint checklist | executing DB commands, applying migration, reading row data | migration not drafted | yes |

## Explicit Non-goals

Task530 excludes:

- modifying `field_service_reports`.
- changing `field_service_reports.case_id` uniqueness.
- creating formal Field Service Report workflow.
- appointment state transition schema.
- Case status schema.
- billing / settlement schema.
- provider sending schema.
- survey schema.
- AI/RAG/vector DB schema.
- object storage implementation.
- repository runtime implementation.

## Migration Touch Risk Register

| Risk | Impact | Current mitigation | Remaining blocker | Future action |
| --- | --- | --- | --- | --- |
| migration file created before schema inspection | migration may target wrong applied schema | Task530 forbids migration file creation | applied schema unknown | inspect disposable local/test DB metadata after explicit approval |
| duplicate concept with existing table | redundant source-data storage or conflicting lifecycle | file-only search found no reusable table | actual DB may differ | confirm applied schema |
| source-data table mistaken as formal FSR | breaks one Case / one formal FSR invariant | source-data-only language repeated | future naming and runtime not designed | require explicit source-data naming and tests |
| missing organization_id causing tenant leak | cross-organization data exposure | organization scope is mandatory in docs | exact scope field/FK strategy unapproved | design organization-scoped schema and repository methods |
| wrong idempotency uniqueness scope | weak-network duplicates or false conflicts | Task527 identifies idempotency scenarios | final idempotency strategy unapproved | decide key/scope after schema inspection |
| raw binary stored in DB | privacy and storage risk | guardrails require object/file refs | future table design unapproved | allow metadata refs only |
| signature exception treated as customer consent | false approval / dispute risk | signature exception is documented as evidence only | future status fields unapproved | separate signature evidence from approval records |
| AI normalized draft treated as official result | AI output becomes official data without review | AI suggestion / official record separation is documented | future lifecycle not implemented | require human review state and audit boundary |
| rollback unclear | unsafe migration delivery | no migration file is created | rollback strategy missing | require rollback plan in future migration task |
| retention unclear | over-retention / privacy risk | docs mark retention as future task | source-data retention policy missing | define retention before migration approval |
| future runtime accidentally wired to migration draft | side effects before readiness | Task530 forbids runtime | repository/service not authorized | require separate runtime authorization packet |
| production/shared DB accidentally targeted | shared runtime damage / data exposure | DB command forbidden | future inspection needs target confirmation | require explicit disposable local/test DB approval |

## Guardrail Invariants

Task530 preserves these invariants:

- one Case ultimately has one formal Field Service Report.
- multiple appointments / dispatch visits remain visit-level.
- completion submissions are source-data only.
- multiple submissions do not create multiple formal FSRs.
- `field_service_reports.case_id` uniqueness must not be broken.
- `finalAppointmentId` remains system-owned.
- engineer cannot manually select `finalAppointmentId`.
- completion submission does not mean Case completed.
- no survey / provider / billing / settlement / AI approval trigger.
- LINE is not global identity.
- every future repository method must be organization-scoped.

## Readiness Conclusion

PARTIAL - NEEDS DB METADATA INSPECTION APPROVAL FIRST.

Rationale:

- file-only evidence supports continued planning.
- Task529 correctly refused migration draft authorization.
- actual applied schema remains unverified.
- DB metadata-only inspection still requires explicit user approval.
- migration file touch would be premature before table, column, index, FK, idempotency, retention, and rollback decisions.

Task530 does not approve migration file creation.

Task530 does not approve DB command.

Task530 does not approve migration dry-run.

Task530 does not approve migration apply.

Task530 does not approve runtime.

Future migration file touch requires separate PM task with exact allowed files.

Actual DB metadata-only inspection still requires explicit user approval.

## Future Sequencing

Future tasks, proposal only:

- Task531: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply, only after explicit user approval.
- Task532: Completion Submission Migration File Touch Plan / No Apply.
- Task533: Completion Submission Repository Runtime Authorization Packet / No Runtime.
- Task534: Contract Test File Touch Plan / No Runtime.
- Task535: PM Continuation Handoff Summary / No Runtime Change.

Task530 does not execute these future tasks.

## Non-goals

Task530 does not:

- modify `src/`.
- modify `admin/src/`.
- modify `fixtures/`.
- modify `tests/`.
- add or modify repository / service / model.
- add repository interface.
- add SQL.
- add migration.
- modify Migration020.
- execute DB / SQL / DDL / psql / migration / dry-run / apply.
- execute test / lint / smoke / browser / API commands.
- modify `package.json` / lock files.
- call LINE / SMS / Email / App provider.
- call AI / RAG / vector DB.
- copy real personal data, token, secret, or `DATABASE_URL` into docs.
- modify inventory docs.
- implement repository runtime.
- implement completion persistence runtime.
- implement appointment state transition runtime.
- implement formal Field Service Report creation.
- implement survey / provider / billing / settlement / AI approval.
- turn Task530 into migration approval / DB inspection approval / runtime approval.

## Verification Boundary

Task530 static verification should confirm:

- `git diff --check docs/task-530-engineer-mobile-workbench-completion-submission-migration-file-touch-plan-readiness-gate-no-apply.md` passes.
- Task530 only adds / modifies this allowed markdown file.
- no Task530 changes to `src/`, `admin/src/`, `tests/`, `fixtures/`, `migrations/`, package files, smoke files, or runtime files.
- this document clearly states no migration file creation / no DB command / no SQL / no DDL / no migration apply / no runtime / no repository implementation / no test execution / no provider / no AI.
- this document clearly states Task530 does not approve migration file creation / DB command / migration dry-run / migration apply / runtime.

No test run is needed.

No lint run is needed.

No DB connection is needed.

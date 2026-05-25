# Task 516 - Engineer Mobile Workbench Schema Inspection Planning

## Branch Status

Task516 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only and schema-inspection-planning-only.

There is no actual schema inspection required, no DB command, no SQL, no DDL, no migration, no migration dry-run, no migration apply, no runtime, no repository implementation, no repository interface implementation, no service implementation, no test file creation, no fixture file creation, no test execution, no provider sending, and no AI/RAG/vector database.

Task516 is not a schema approval.

Task516 is not a migration approval.

Task516 is not a runtime approval.

Task516 does not inspect schema.

## Reference Handling

Task516 may use prior Engineer Mobile Workbench design decisions as context, but it does not modify any reference file.

Relevant references confirmed present for future planning:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-510-engineer-mobile-workbench-completion-submission-data-model-decision-packet-no-migration.md`
- `docs/task-511-engineer-mobile-workbench-repository-runtime-authorization-decision-packet-no-runtime.md`
- `docs/task-512-engineer-mobile-workbench-completion-submission-source-data-migration-decision-packet-no-apply.md`
- `docs/task-513-engineer-mobile-workbench-repository-test-fixture-planning-no-runtime.md`
- `docs/task-514-engineer-mobile-workbench-appointment-state-transition-runtime-decision-packet-no-runtime.md`
- `docs/task-515-engineer-mobile-workbench-completion-submission-repository-contract-proposal-no-runtime.md`
- `src/repositories/`
- `src/db/`
- `migrations/`

Relevant optional reference path not found during path-presence check:

- `src/models/`
- `db/`

Task516 does not create, rename, patch, normalize, execute, or inspect schema content from those references.

## Planning Purpose

This document plans how a future Engineer Mobile Workbench schema inspection should safely examine existing schema, migration, repository, and model conventions.

Purpose:

- plan which files, migrations, and conventions future schema inspection should check.
- prevent direct connection to shared / production DB.
- prevent repository runtime before schema is confirmed.
- provide safe pre-work for completion submission source-data migration decision.
- provide safe pre-work for engineer profile, organization, assignment, and appointment repository runtime decisions.

This task does not authorize actual DB inspection or schema modification.

## Schema Inspection Scope Proposal

| Future inspection item | Why needed | Expected source to inspect later | DB command required later? | File-only inspection may be enough? | Risk if skipped | Related future task |
| --- | --- | --- | --- | --- | --- | --- |
| engineer profile table / linkage | resolve platform user to engineer identity | migrations, user/role repositories, future engineer docs | no for first pass | yes | wrong identity or cross-engineer access | Task517 / Task520 |
| platform user table / identity linkage | bind auth session to user and membership | migrations, `UserRepository`, `UserOrganizationRepository`, auth docs | no for first pass | yes | weak auth-to-tenant mapping | Task517 |
| organization table / status convention | enforce tenant status and active scope | migrations, `OrganizationRepository` | no for first pass | yes | suspended/deleted org leakage | Task517 |
| `organization_id` multi-tenant convention | ensure every repository is tenant-scoped | migrations, repositories | no for first pass | yes | cross-organization leakage | Task517 |
| appointment table exists / structure | support task detail and operation eligibility | migrations, `AppointmentRepository` | no for first pass | yes | runtime against wrong status fields | Task517 / Task519 |
| dispatch visit table exists / structure | determine if visit layer is separate from appointment | migrations, dispatch repositories | no for first pass | yes | wrong linkage or duplicated state | Task517 |
| case table linkage | preserve Case-level workflow | migrations, `CaseRepository` | no for first pass | yes | source-data cannot trace Case | Task517 |
| assignment model | decide independent table vs appointment fields | migrations, `DispatchRepository`, appointment/assignment docs | no for first pass | yes | assignment verification bypass | Task517 |
| Field Service Report table and `field_service_reports.case_id` uniqueness | preserve one Case / one formal FSR | migrations, `FieldServiceReportRepository` | no for first pass | yes | duplicate formal reports | Task517 |
| soft delete convention | know active/deleted filters | migrations, repositories | no for first pass | yes | deleted records become visible | Task517 |
| `created_at` / `updated_at` convention | consistent lifecycle metadata | migrations, repositories | no for first pass | yes | inconsistent auditability | Task517 |
| `created_by` / `updated_by` convention | actor traceability | migrations, repositories | no for first pass | yes | weak accountability | Task517 |
| audit log convention | future action traceability | migrations, `AuditLogRepository` | no for first pass | yes | untracked state changes | Task517 |
| JSON / structured snapshot storage convention | decide source-data snapshot pattern | migrations, repositories | no for first pass | yes | inconsistent payload storage | Task517 / Task521 |
| object/file storage reference convention | keep evidence as refs, not binary | migrations, attachment repositories | no for first pass | yes | raw file DB storage risk | Task517 |
| idempotency key convention | support weak-network retry | migrations, repositories | no for first pass | yes | duplicate submissions | Task517 / Task521 |
| migration naming convention | future migration consistency | `migrations/` files | no | yes | migration ordering errors | Task517 / Task521 |
| repository naming / transaction convention | future repository implementation consistency | `src/repositories/`, `src/db/transaction.js` | no | yes | inconsistent runtime pattern | Task517 / Task520 |

## Allowed Future Inspection Methods

Future inspection methods, proposal only:

- file-only inspection of migrations.
- file-only inspection of schema definitions if present.
- file-only inspection of repository conventions.
- file-only inspection of model conventions if present.
- disposable local/test DB inspection only if separately approved.
- migration dry-run only if separately approved.
- no shared production DB.
- no logging `DATABASE_URL`.
- no printing secrets.
- no `psql` / `db:migrate` unless a future task explicitly approves exact command scope and stop conditions.

## Explicitly Forbidden Inspection Methods

Future inspection must not:

- connect to production/shared DB.
- run `psql`.
- run migration apply.
- run migration dry-run.
- run application runtime connected to DB.
- print `DATABASE_URL`.
- read or expose token / secret.
- export real customer data.
- inspect real LINE identity data.
- use AI provider with raw schema plus secrets.
- change migration files.
- add schema files.
- add repository runtime code.

## Entity-to-Schema Question Map

| Entity / area | Schema questions | Likely source files to inspect later | DB object expected | Organization isolation requirement | Migration dependency | Runtime dependency | Blocker status | Future decision needed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `EngineerProfileRepository` | is there an engineer profile table or user-role convention? how is active status represented? | migrations, user/role repositories | unknown | required | unknown | yes | blocked | profile linkage model |
| `EngineerWorkbenchOrganizationScopeRepository` | how is organization active/suspended/deleted represented? | migrations, organization repository | organization-like table expected | required | likely existing | yes | blocked | safe-deny status policy |
| `EngineerAssignmentRepository` | where are engineer assignments stored? how are reassignment/cancellation represented? | dispatch/appointment migrations, dispatch repository | assignment or appointment fields unknown | required | unknown | yes | blocked | assignment verification source |
| `EngineerWorkbenchAppointmentRepository` | which status fields support arrived/started/visibility? | appointment migrations/repository | appointment table expected | required | likely existing plus unknown gaps | yes | blocked | operation eligibility mapping |
| `EngineerWorkbenchCompletionSubmissionRepository` | does a reusable source-data table exist or is a new table needed? | migrations, Task510/512/515 docs | likely new future table | required | likely future migration | yes | blocked | dedicated source-data decision |
| Field Service Report workflow | how is one Case / one formal FSR enforced? | field service migration/repository | FSR table expected | required | existing plus future guard tests | yes | partial | formal workflow boundary |
| Object/file storage references | are attachments/object refs modeled? | attachment migration/repository | attachment/ref table expected | required | existing or future extension | yes | partial | evidence ref convention |
| Audit/evidence logging | what audit event shape exists? | audit migrations/repository | audit table expected | required | existing or future extension | yes | partial | action audit and retention |

## Completion Submission Schema Inspection Checklist

| Checklist item | Status until inspection | Can be file-inspected? | May require disposable DB? | Requires future migration decision? | Phase 1 relevance |
| --- | --- | --- | --- | --- | --- |
| existing reusable source-data table | unknown until inspection | yes | maybe later | yes if absent | needed |
| need for dedicated source-data table | unknown until inspection | yes, via migrations/docs | maybe later | yes | needed |
| appointment outcome / visit outcome structure | unknown until inspection | yes | maybe later | maybe | needed for boundaries |
| idempotency convention | unknown until inspection | yes | maybe later | likely | needed |
| JSON snapshot convention | unknown until inspection | yes | maybe later | likely | needed |
| object ref convention | unknown until inspection | yes | maybe later | maybe | needed |
| status enum / lookup convention | unknown until inspection | yes | maybe later | likely | needed |
| soft delete convention | unknown until inspection | yes | maybe later | maybe | needed |
| retention policy convention | unknown until inspection | yes | maybe later | likely | may be Phase 1 policy |
| `created_by` / `updated_by` convention | unknown until inspection | yes | maybe later | maybe | needed |
| `organization_id + appointment_id` index | unknown until inspection | yes | maybe later | likely | needed |
| `organization_id + engineer_profile_id` index | unknown until inspection | yes | maybe later | likely | needed |
| `clientRequestId` / idempotency unique scope | unknown until inspection | yes | maybe later | likely | needed |
| FK or application-level reference strategy | unknown until inspection | yes | maybe later | likely | needed |

## Repository Runtime Blocker Map

| Repository | Schema blockers | Fixture/test blockers | Audit blockers | Permission / organization blockers | Runtime authorization blockers | Recommended next inspection step |
| --- | --- | --- | --- | --- | --- | --- |
| `EngineerProfileRepository` | profile/user linkage unknown | no implemented repository fixtures | suspicious lookup audit not finalized | active engineer + org membership policy | runtime not authorized | file-only inspect user/profile/membership conventions |
| `EngineerWorkbenchOrganizationScopeRepository` | organization status fields unknown | active/inactive org fixture not implemented | cross-scope deny audit not finalized | server-side org scope policy | runtime not authorized | file-only inspect organization schema/repository |
| `EngineerAssignmentRepository` | assignment source unknown | own/other engineer fixtures not implemented | denied assignment audit not finalized | assignment must be org-scoped | runtime not authorized | file-only inspect dispatch/appointment assignment model |
| `EngineerWorkbenchAppointmentRepository` | appointment/dispatch visit state mapping unknown | appointment state fixtures not implemented | operation-denied audit not finalized | assignment and org checks required first | runtime not authorized | file-only inspect appointment and dispatch visit migrations |
| `EngineerWorkbenchCompletionSubmissionRepository` | source-data table absent/unknown | source-data and idempotency fixtures not implemented | create/status/idempotency audit not finalized | organization-scoped write and read policy | runtime and migration not authorized | file-only inspect existing source-data/attachment/idempotency conventions |

## Safe Environment Policy

Future DB inspection must use disposable local/test DB only.

Shared / production / Zeabur runtime must remain off-limits unless separately and explicitly authorized.

`DATABASE_URL` must never be printed.

Secrets must never be copied into docs.

Real customer / engineer / LINE data must not be exported.

File-only inspection is preferred before any DB command.

Any DB command requires a separate PM task with exact command scope and stop conditions.

## Schema Inspection Output Format Proposal

Future schema inspection report should include:

- inspected files.
- not inspected files.
- schema facts found.
- unknowns.
- risks.
- migration implications.
- repository implications.
- test fixture implications.
- guardrail conflicts.
- whether any DB command was used.
- whether any secrets / personal data were encountered.
- recommendation for next PM task.

## Guardrail Invariants To Preserve

Future schema inspection must preserve:

- one Case ultimately has one formal Field Service Report.
- multiple appointments / dispatch visits are visit-level records.
- completion submissions are source-data only.
- multiple completion submissions do not create multiple formal Field Service Reports.
- `field_service_reports.case_id` uniqueness must not be broken.
- `finalAppointmentId` remains system-owned.
- engineer cannot manually select `finalAppointmentId`.
- completion submission does not mean Case completed.
- completion submission does not trigger survey / provider / billing / settlement / AI approval.
- LINE is not global identity.
- every future repository method must be organization-scoped.

## Planning Conclusion

READY FOR FILE-ONLY SCHEMA INSPECTION TASK — NO DB COMMAND.

Task516 does not inspect schema.

Task516 does not approve DB command.

Task516 does not approve migration.

Task516 does not approve runtime.

Future schema inspection requires a separate PM task with exact allowed files.

## Future Sequencing

Future tasks, proposal only:

- Task517: File-Only Schema Inspection Authorization / No DB Command.
- Task518: Synthetic Repository Fixture File Touch Plan / No Runtime.
- Task519: Appointment State Transition Limited Runtime Scope Proposal / No Runtime.
- Task520: Completion Submission Repository Runtime Scope Proposal / No Runtime.
- Task521: Migration Draft Authorization Packet / No Apply.

Task516 does not execute these tasks.

## Non-goals

Task516 does not:

- modify `src/`.
- modify `admin/src/`.
- add or modify `fixtures/`.
- add or modify `tests/`.
- modify routes, controllers, resolvers, guards, projections, or validators.
- modify repositories / models / db runtime.
- add repository classes.
- add repository interfaces.
- add service classes.
- add models.
- add SQL.
- add migrations.
- modify Migration020.
- execute DB / DDL / psql / migration / dry-run / apply.
- execute test / lint / smoke / browser / API commands.
- modify `package.json` or lock files.
- call LINE / SMS / Email / App providers.
- call AI / RAG / vector DB.
- use real personal data, token, secret, or `DATABASE_URL`.
- modify inventory docs.
- implement repository runtime.
- implement completion persistence runtime.
- implement appointment state transition runtime.
- implement formal Field Service Report creation.
- implement survey trigger / provider sending / billing / settlement / AI approval.
- write real or suspected-real customer data to docs.
- produce a schema inspection completion report.

## Verification Boundary

Task516 static verification should confirm:

- `git diff --check docs/task-516-engineer-mobile-workbench-schema-inspection-planning-no-db-command.md` passes.
- Task516 only adds or modifies the allowed markdown file.
- no `src/`, `admin/src/`, tests, fixtures, migrations, package, smoke, or runtime files are changed by Task516.
- this document explicitly states no runtime, no repository implementation, no SQL, no DB command, no migration, no fixture file creation, no test file creation, no test execution, no provider, and no AI runtime.
- this document explicitly states Task516 does not inspect schema.

No test, lint, smoke, browser, API, database, migration, provider, or AI command is required for Task516.

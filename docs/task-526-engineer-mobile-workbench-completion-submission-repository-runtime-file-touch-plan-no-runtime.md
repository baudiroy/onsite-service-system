# Task 526 - Engineer Mobile Workbench Completion Submission Repository Runtime File Touch Plan

## Branch Status

Task526 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only and file-touch-plan-only.

No runtime.

No repository implementation.

No repository interface implementation.

No service implementation.

No SQL.

No DB command.

No DDL.

No migration.

No migration dry-run.

No migration apply.

No fixture/test creation.

No fixture/test modification.

No test execution.

No provider sending.

No AI/RAG/vector DB.

Task526 is not a runtime approval.

Task526 is not a DB inspection approval.

Task526 is not a migration approval.

Task526 does not approve runtime.

Task526 does not approve repository implementation.

Task526 does not approve DB access.

Task526 does not approve migration.

Any future file touch requires a separate PM task with exact allowed files.

## Reference Handling

Task526 uses prior Engineer Mobile Workbench planning documents and existing repository/db directories as read-only context.

References inspected or confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-515-engineer-mobile-workbench-completion-submission-repository-contract-proposal-no-runtime.md`
- `docs/task-517-engineer-mobile-workbench-file-only-schema-inspection-report-no-db-command.md`
- `docs/task-522-engineer-mobile-workbench-completion-submission-repository-runtime-scope-proposal-no-runtime.md`
- `docs/task-523-engineer-mobile-workbench-disposable-local-db-schema-inspection-readiness-gate-no-db-command.md`
- `docs/task-524-engineer-mobile-workbench-disposable-db-metadata-inspection-command-envelope-no-db-command.md`
- `docs/task-525-engineer-mobile-workbench-db-inspection-approval-pending-branch-checkpoint-no-runtime-change.md`
- `fixtures/engineerMobileWorkbench/repositorySynthetic.fixture.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.repositorySyntheticFixture.test.js`
- `src/repositories/`
- `src/db/`

Task526 does not modify, normalize, execute, or expand those references.

## Purpose

This document converts the Task515 contract proposal, Task522 runtime scope proposal, and Task525 approval-pending checkpoint into a future file touch plan.

Purpose:

- define which files could be added or modified if a future PM task approves repository runtime.
- define which files must remain out of scope.
- record current blockers: DB inspection not approved, actual schema unverified, and migration not approved.
- prevent a future runtime task from crossing into formal Field Service Report creation, appointment state mutation, Case status mutation, survey/provider/billing triggers, settlement workflow, or AI approval.

This task does not authorize runtime implementation.

## Current Blocker Summary

| Blocker | Status |
| --- | --- |
| actual DB metadata-only inspection | not explicitly approved by user |
| actual applied schema | unverified |
| completion submission source-data table | not approved |
| migration draft | not approved |
| migration apply / dry-run | not approved |
| repository runtime | not approved |
| completion persistence runtime | not approved |
| appointment state transition runtime | not approved |
| formal Field Service Report creation | not approved |
| provider trigger | not approved |
| survey trigger | not approved |
| billing trigger | not approved |
| AI approval trigger | not approved |

## Future Allowed Runtime Files Proposal

These files are proposal-only. Task526 does not create or modify them.

| Future file | Purpose | Why needed | Allowed future content | Forbidden content | DB dependency | Migration dependency | Test dependency | Separate PM approval required |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `src/repositories/EngineerWorkbenchCompletionSubmissionRepository.js` | source-data repository runtime | persist and retrieve engineer completion submission source-data after upstream checks | organization-scoped create/find/list/lifecycle source-data methods | formal FSR creation, Case mutation, appointment completed mutation, provider/survey/billing/AI trigger, raw binary storage | yes | likely yes if no existing table | yes | yes |
| `tests/engineerMobileWorkbench/engineerMobileWorkbench.completionSubmissionRepository.contract.test.js` | repository contract coverage | verify repository behavior before broader runtime integration | synthetic-only organization scope, idempotency, safe-deny, forbidden fields, no side effects | real PII, shared DB, provider/AI calls, full-suite execution by default | maybe, only if separately approved | depends on schema decision | yes | yes |
| possible future fixture extension file | additional source-data fixtures | add scenarios not covered by Task520 if runtime tests need them | synthetic-only source-data, idempotency, safe-deny, evidence metadata refs | real customer/engineer/LINE data, tokens, secrets, raw binary, provider payload, AI raw payload | no for pure fixture | no unless DB fixture requires it later | yes | yes |
| possible future migration file | source-data table if needed | support dedicated completion submission persistence | table/columns/indexes/constraints only after migration authorization | migration apply, runtime implementation, unrelated schema changes, Migration020 changes | yes | yes | future migration tests only if approved | yes |

## Future Repository File Minimal Scope

If a future task approves `EngineerWorkbenchCompletionSubmissionRepository.js`, the minimum scope may only include proposal-level source-data behavior:

- create source-data completion submission record.
- find submission by id within organization.
- find submission by idempotency key within organization / appointment scope.
- list submissions for verified appointment.
- mark `needs_review` only if separately approved.
- mark `superseded` only if separately approved.
- mark `accepted_as_source` only if separately approved.

The future repository must explicitly exclude:

- formal Field Service Report creation.
- updating `field_service_reports`.
- Case status mutation.
- appointment completed mutation.
- `finalAppointmentId` selection / inference.
- survey trigger.
- provider sending.
- billing / settlement trigger.
- AI approval.
- raw binary storage.
- customer-facing report publication.

## Required Preconditions Before Any File Touch

| Precondition | Current status |
| --- | --- |
| user/PM explicitly approves repository runtime file touch | future task required |
| DB metadata inspection completed or explicitly deferred with rationale | blocked |
| schema confirmed or migration approved | blocked |
| organization scope fields confirmed | partial |
| case / appointment linkage confirmed | partial |
| engineer identity mapping confirmed | partial |
| idempotency strategy confirmed | blocked |
| object refs convention confirmed | partial |
| audit / evidence strategy confirmed | future task required |
| synthetic fixture baseline available | ready |
| contract test plan approved | future task required |
| safe-deny behavior approved | ready for planning only |
| no provider/survey/billing/AI trigger path verified | future task required |

## Future Test File Plan

Future repository tests are proposal-only. Task526 does not create tests.

Future test file should:

- use `node:test` / `node:assert` where possible.
- use synthetic-only fixture data.
- avoid real DB unless separately approved.
- avoid production / shared / Zeabur DB.
- avoid provider calls.
- avoid AI calls.
- avoid full-suite execution unless separately approved.

Future coverage proposal:

- organization-scoped create.
- idempotency duplicate detection.
- list submissions for verified appointment.
- safe-deny for cross-org submission.
- forbidden client authority fields never persisted.
- no raw binary persisted.
- no formal FSR created.
- no appointment state mutation.
- no survey/provider/billing/AI trigger.

## Forbidden Future Shortcuts

Future runtime must not:

- let controller directly call repository without resolver/guard/boundary.
- trust client `organizationId`.
- trust client `engineerProfileId`.
- trust client `finalAppointmentId`.
- use LINE id as global identity.
- write to FieldServiceReport table.
- mutate Case status.
- mutate appointment completed state.
- store raw file/photo/signature binary.
- store AI raw payload as official result.
- return internal notes / audit / billing data.
- leak cross-organization existence through errors.

## Data And Visibility Guardrails

Every future repository method must be organization-scoped.

No global lookup.

No cross-organization fallback.

No cross-engineer fallback.

Customer-facing report must use customer-visible filtered data only.

Completion submission remains source-data.

Multiple submissions do not create multiple formal Field Service Reports.

No raw binary in DB.

Object/file refs metadata only.

No full customer personal data beyond minimal future need.

## Guardrail Invariants

Future file touches and downstream tasks must preserve:

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

## File Touch Plan Conclusion

PARTIAL - NEEDS DB METADATA INSPECTION APPROVAL FIRST.

Task526 does not approve runtime.

Task526 does not approve repository implementation.

Task526 does not approve DB access.

Task526 does not approve migration.

Any future file touch requires separate PM task with exact allowed files.

## Future Sequencing

Future tasks, proposal only:

- Task527: Repository Runtime Contract Test Plan / No Runtime.
- Task528: Migration Draft Authorization Packet / No Apply.
- Task529: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply, only after explicit user approval.
- Task530: Completion Submission Repository Runtime Authorization Packet / No Runtime.
- Task531: PM Continuation Handoff Summary / No Runtime Change.

Task526 does not execute these future tasks.

## Non-goals

Task526 does not:

- modify `src/`.
- modify `admin/src/`.
- modify fixtures.
- modify tests.
- add or modify repository / service / model code.
- add repository interface files.
- add SQL.
- add migration files.
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
- claim runtime implementation is approved.

## Sensitive Data Statement

This document contains only non-sensitive planning text, file paths, task names, table/concept names, and guardrail summaries.

It does not contain actual token, secret, `DATABASE_URL`, customer personal data, raw LINE user id, LINE access token, provider payload, AI raw payload, or full request/response payload.

# Task 522 - Engineer Mobile Workbench Completion Submission Repository Runtime Scope Proposal

## Branch Status

Task522 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only and runtime-scope-proposal-only.

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

No fixture/test file creation.

No fixture/test modification.

No test execution.

No provider sending.

No AI/RAG/vector database.

Task522 is not a runtime approval.

Task522 is not a migration approval.

Task522 is not a DB inspection approval.

Task522 itself does not approve runtime.

Task522 itself does not approve DB access.

Task522 itself does not approve migration.

Task522 itself does not approve repository implementation.

Future runtime requires a separate PM task with exact allowed files.

## Reference Handling

Task522 uses prior Engineer Mobile Workbench documents and synthetic fixture artifacts as read-only context.

References inspected or confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-515-engineer-mobile-workbench-completion-submission-repository-contract-proposal-no-runtime.md`
- `docs/task-517-engineer-mobile-workbench-file-only-schema-inspection-report-no-db-command.md`
- `docs/task-518-engineer-mobile-workbench-disposable-local-db-schema-inspection-authorization-packet-no-db-command.md`
- `docs/task-519-engineer-mobile-workbench-synthetic-repository-fixture-file-touch-plan-no-runtime.md`
- `fixtures/engineerMobileWorkbench/repositorySynthetic.fixture.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.repositorySyntheticFixture.test.js`

Task522 does not modify, normalize, execute, or expand those references.

## Purpose

This document connects:

- Task515 repository contract proposal.
- Task517 file-only schema findings.
- Task518 disposable DB inspection authorization packet.
- Task520 synthetic fixture baseline.
- Task521 static fixture contract test baseline.

The purpose is to define the minimum possible future runtime scope for an `EngineerWorkbenchCompletionSubmissionRepository`, list current blockers, and prevent a future runtime task from crossing into formal Field Service Report creation, appointment completed mutation, Case status mutation, survey/provider/billing triggers, settlement workflow, or AI approval.

This task does not authorize any runtime implementation.

## Current Readiness Summary

| Area | Current state | Status |
| --- | --- | --- |
| Repository contract proposal | Task515 defines proposed responsibilities, methods, trusted inputs, untrusted inputs, safe return shape, and forbidden behavior | ready for planning only |
| File-only schema inspection | Task517 found likely existing Case, appointment, dispatch assignment, Field Service Report, user, organization, audit, transaction, and object-ref conventions | partial |
| Actual applied schema | Not inspected through DB metadata | blocked |
| Disposable DB inspection | Task518 is an authorization packet only and did not execute inspection | future task required |
| Completion source-data table | No reusable table found by file-only inspection | blocked until schema/migration decision |
| Migration | No completion source-data migration approved | blocked |
| Repository runtime | Not approved | blocked |
| Synthetic fixture | Task520 added `repositorySynthetic.fixture.js` | ready as synthetic baseline |
| Static fixture contract test | Task521 added one pure Node fixture contract test and it passed | ready as static baseline |
| Provider / survey / billing / AI triggers | No approved runtime path | blocked and forbidden for this branch |

## Minimum Future Runtime Scope Proposal

If a future PM task explicitly approves runtime, the minimum repository scope should be limited to source-data persistence and retrieval.

Proposal-only methods:

- create source-data completion submission record.
- find submission by id within organization.
- find submission by idempotency key within organization / appointment scope.
- list submissions for a verified appointment.
- mark submission as `needs_review` only if separately approved.
- mark submission as `superseded` only if separately approved.
- mark submission as `accepted_as_source` only if separately approved.

The repository may only persist engineer completion source-data after upstream auth, organization scope, assignment, appointment eligibility, payload validation, forbidden field rejection, metadata-ref validation, and idempotency scope checks have already succeeded.

The repository must not become the formal completion workflow.

## Explicitly Excluded From Future Repository Runtime

The future repository must not:

- create formal Field Service Report records.
- update `field_service_reports`.
- mutate Case status.
- mutate Case completed timestamps.
- mutate appointment completed state.
- infer or set `finalAppointmentId`.
- trigger survey intent.
- send provider notifications.
- trigger billing.
- trigger settlement.
- trigger AI approval.
- store raw file/photo/signature binary.
- publish customer-facing reports.
- expose internal notes, audit logs, billing data, settlement data, provider payload, or AI raw payload.

## Required Preconditions Before Runtime

| Precondition | Current status | Notes |
| --- | --- | --- |
| disposable local/test DB schema inspection completed | future task required | Task518 only defines authorization conditions |
| actual applied schema confirmed | blocked | file-only inspection cannot prove runtime DB state |
| completion submission table / schema migration approved if needed | blocked | no table is approved |
| migration applied only in approved environment if needed | blocked | no apply / dry-run approval exists |
| repository allowed files approved | future task required | exact file list must come from PM |
| transaction convention confirmed | partial | Task517 found `withTransaction` / BaseRepository conventions, but runtime use is not approved |
| organization scope fields confirmed | partial | direct/indirect scope must be verified in actual schema |
| appointment / case linkage confirmed | partial | file-only linkage found, actual schema still unverified |
| engineer identity mapping confirmed | partial | `users.user_type` and dispatch assignment mapping found; separate profile table not found |
| idempotency strategy confirmed | blocked | completion source-data idempotency is not approved |
| object ref convention confirmed | partial | object metadata pattern exists, but completion evidence linkage is not approved |
| audit / evidence strategy confirmed | future task required | no audit runtime is approved |
| fixture/test implementation scope approved | ready | Task520/521 provide synthetic static baseline |
| safe-deny behavior approved | ready for planning only | must still be implemented in future runtime if approved |
| no provider/survey/billing/AI trigger path verified | future task required | must be enforced by tests before runtime |

## Allowed Future Files Proposal

These files are proposal-only. Task522 does not authorize touching them.

| Future file | Purpose | Why needed | Guardrails | Blockers | Separate PM approval required |
| --- | --- | --- | --- | --- | --- |
| `src/repositories/EngineerWorkbenchCompletionSubmissionRepository.js` | source-data repository implementation | persist and query completion submission source-data after upstream checks | no formal FSR creation, no Case mutation, no appointment completed mutation, no provider/survey/billing/AI trigger | schema inspection, migration decision, allowed file task | yes |
| possible future unit/contract test file | repository contract coverage | verify source-data writes, idempotency, organization isolation, safe-deny, no forbidden side effects | synthetic data only; no real PII; no provider/AI/DB unless explicitly authorized | runtime test scope and fixture scope approval | yes |
| possible future fixture extension file | additional source-data scenarios | cover edge cases not in Task520 baseline | synthetic-only; no secrets; no real customer/engineer/LINE data | PM file touch approval | yes |
| possible future migration file | source-data table if needed | support dedicated completion submission persistence | no apply; no dry-run; no shared DB; no runtime | schema inspection and migration authorization packet | yes |

## Forbidden Future Shortcuts

Future repository design must explicitly forbid:

- repository creates formal FSR.
- repository updates FieldServiceReport table.
- repository mutates Case status.
- repository mutates appointment completed state.
- repository trusts client `organizationId`.
- repository trusts client `engineerProfileId`.
- repository trusts client `finalAppointmentId`.
- repository bypasses assignment verification.
- repository stores raw file/photo/signature binary.
- repository stores AI raw payload as official result.
- repository stores provider payload.
- repository uses LINE id as global identity.
- repository returns internal notes / audit log / billing data.
- repository returns different errors that enumerate cross-org resources.

## Test Requirements Before Runtime

Future runtime must not start until tests are separately approved and planned.

Future test requirements:

- synthetic fixture baseline must remain synthetic-only.
- static fixture contract test must remain passing.
- future repository tests must use synthetic data.
- organization isolation tests.
- idempotency duplicate tests.
- safe-deny / non-enumeration tests.
- forbidden field rejection tests.
- no raw binary storage tests.
- no formal FSR creation tests.
- no provider/survey/billing/AI trigger tests.

Task522 does not create tests.

Task522 does not execute tests.

Future test implementation requires separate PM approval.

## Runtime Authorization Conclusion

DO NOT AUTHORIZE COMPLETION SUBMISSION REPOSITORY RUNTIME YET.

Reason:

- actual schema is still unverified.
- no completion source-data table is approved.
- no migration is approved.
- no DB inspection has been executed.
- no runtime allowed files have been approved.
- future idempotency, object refs, audit, and transaction semantics remain design-only.

Future runtime may only be reconsidered after schema inspection and migration decision.

Task522 itself does not approve runtime.

Task522 itself does not approve DB access.

Task522 itself does not approve migration.

Task522 itself does not approve repository implementation.

Future runtime requires a separate PM task with exact allowed files.

## Future Sequencing

Future tasks, proposal only:

- Task523: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply.
- Task524: Migration Draft Authorization Packet / No Apply.
- Task525: Completion Submission Repository Runtime File Touch Plan / No Runtime.
- Task526: Repository Runtime Contract Test Plan / No Runtime.
- Task527: PM Continuation Handoff Summary / No Runtime Change.

Task522 does not execute these future tasks.

## Non-goals

Task522 does not:

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

## Sensitive Data Statement

This document contains only non-sensitive planning text, file paths, task names, table/concept names, and guardrail summaries.

It does not contain actual token, secret, `DATABASE_URL`, customer personal data, raw LINE user id, LINE access token, provider payload, AI raw payload, or full request/response payload.

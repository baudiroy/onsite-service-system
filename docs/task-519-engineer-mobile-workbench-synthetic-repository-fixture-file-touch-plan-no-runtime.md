# Task 519 - Engineer Mobile Workbench Synthetic Repository Fixture File Touch Plan

## Branch Status

Task519 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only and fixture-file-touch-plan-only.

There is no fixture file creation, no fixture file modification, no test file creation, no test file modification, no test execution, no DB command, no SQL, no DDL, no migration, no migration dry-run, no migration apply, no runtime, no repository implementation, no service implementation, no provider sending, and no AI/RAG/vector database.

Task519 is not a fixture implementation approval.

Task519 is not a runtime approval.

Task519 is not a DB inspection approval.

## Reference Handling

Task519 may use prior Engineer Mobile Workbench design decisions as context, but it does not modify any reference file.

Relevant references confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-513-engineer-mobile-workbench-repository-test-fixture-planning-no-runtime.md`
- `docs/task-517-engineer-mobile-workbench-file-only-schema-inspection-report-no-db-command.md`
- `docs/task-518-engineer-mobile-workbench-disposable-local-db-schema-inspection-authorization-packet-no-db-command.md`
- `fixtures/engineerMobileWorkbench/syntheticEngineerMobileWorkbench.fixture.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.skeleton.test.js`

Task519 does not create, rename, patch, normalize, or execute those references.

## Purpose

This document converts Task513 fixture planning into a future file touch plan.

Purpose:

- define which files could be created or modified in a future synthetic repository fixture task.
- keep future fixture implementation synthetic-only.
- prohibit real customer, engineer, LINE, address, phone, token, or `DATABASE_URL` data.
- prepare future repository tests, organization isolation tests, safe-deny tests, and completion submission source-data tests.

This task does not authorize adding fixture files or test files.

## Future Allowed Fixture / Test Files Proposal

These files are proposal-only. Task519 does not create or modify them.

| Future file | Purpose | Synthetic data type | Scenarios covered | Forbidden data | DB required later? | Runtime required later? | Separate PM approval required? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `fixtures/engineerMobileWorkbench/repositorySynthetic.fixture.js` | shared repository contract fixture data | organizations, users, engineer mapping, cases, assignments, appointments | org isolation, assignment, appointment visibility, safe-deny | real PII, real LINE ids, tokens, provider/AI payloads | no for pure contract fixtures; yes for DB-backed fixtures | no for pure fixtures; yes for runtime assertions | yes |
| `fixtures/engineerMobileWorkbench/completionSubmissionSynthetic.fixture.js` | completion submission source-data scenarios | source submissions, object refs metadata, forbidden payload samples | valid source-data, signature exception, review, supersede, idempotency, forbidden fields | raw binary, finalAppointmentId authority, formal FSR flags, real data | no for pure fixtures; yes for DB-backed fixtures | no for pure fixtures; yes for repository runtime | yes |
| `tests/engineerMobileWorkbench/engineerMobileWorkbench.repository.contract.test.js` | future repository contract assertions | synthetic repository inputs/outputs | profile/org/assignment/appointment repository contracts | real DB data, secrets, full PII | maybe, depending on mock vs DB strategy | yes if runtime repositories are tested | yes |
| `tests/engineerMobileWorkbench/engineerMobileWorkbench.safeDeny.contract.test.js` | future safe-deny assertion coverage | negative scenarios and expected safe output | non-enumeration, forbidden fields, cross-org denial | internal details, real identifiers | maybe | yes if runtime path is tested | yes |
| `tests/engineerMobileWorkbench/engineerMobileWorkbench.completionSubmission.contract.test.js` | future source-data contract coverage | valid/invalid completion submissions | metadata refs, signature exception, idempotency, no formal FSR | raw files, provider payload, AI raw payload, real data | maybe | yes if repository/runtime path is tested | yes |

## Existing Fixture / Test Relationship

Existing `fixtures/engineerMobileWorkbench/syntheticEngineerMobileWorkbench.fixture.js` is the skeleton fixture baseline.

Existing `tests/engineerMobileWorkbench/engineerMobileWorkbench.skeleton.test.js` is the skeleton test baseline.

Task519 does not modify either file.

Future fixture implementation should avoid breaking skeleton tests.

Future repository contract fixtures should be separated from skeleton fixtures or clearly layered so skeleton behavior remains stable.

## Synthetic Fixture Data Model Proposal

| Data group | Minimum fake fields | Relationship to other groups | Organization scope requirement | Sensitive data forbidden | Why needed | Phase 1 priority |
| --- | --- | --- | --- | --- | --- | --- |
| organizations | fake id, code, status | owns cases, users, assignments through scope | required | real org name, billing data, secrets | tenant isolation | high |
| platform users | fake user id, role/user type, status | linked to org membership and engineer mapping | via membership | real name, phone, email, auth secret | auth context | high |
| engineer users | fake user id, engineer marker/status | may act as engineer profile if no separate profile exists | required | real engineer PII | assignment ownership | high |
| engineer profile or engineer-as-user mapping | fake profile id or fake user mapping | links auth identity to assignment | required | real profile info | contract flexibility after Task517 | high |
| user_organizations linkage | fake membership id, user id, org id | connects user to org | required | real membership data | org scope resolution | high |
| cases | fake case id, status, org id | owns appointments and formal report scenario | required | real customer issue text, phone, address | Case-level invariant tests | high |
| appointments | fake appointment id, case id, status/state | linked to case and assignment | via case/org | real notes/address/contact info | task visibility and eligibility | high |
| dispatch assignments | fake assignment id, case id, engineer id | links engineer to task | via case/org | internal notes with PII | assignment verification | high |
| dispatch visits if applicable | fake visit id, appointment id | optional visit-layer fixture | required if used | real route details | optional future schema path | medium |
| field service reports existing formal report scenario | fake report id, case id, status | protects one Case / one FSR invariant | via case/org | full report body, internal notes | safe-deny when formal FSR exists | high |
| completion submission source-data | fake submission id, appointment/case/org ids, status | source-data only | required | raw input with PII, raw binary | future repository contract | high |
| object/file refs metadata | fake object ref id, type, checksum placeholder | linked to source submission | required | raw file bytes, signed URL, real bucket/object path | evidence metadata boundary | high |
| forbidden payload examples | fake payload keys and harmless fake values | validator/boundary scenarios | required | real ids or secrets | safe rejection tests | high |
| safe-deny scenario fixtures | scenario ids and expected safe output | spans all groups | required | real resource values | non-enumeration tests | high |

## Required Synthetic Organizations

| Organization | Purpose | Notes |
| --- | --- | --- |
| `org_alpha_service` | primary happy-path tenant | no real organization name; same fake appointment/customer-like shape can be mirrored in beta to catch cross-org leakage |
| `org_beta_service` | cross-organization isolation tenant | org A engineer must not see org B task; fake labels may intentionally overlap without identity collapse |
| `org_suspended` optional | safe-deny for inactive/suspended tenant | should trigger safe-deny without leaking operational details |
| `org_deleted` optional | safe-deny for deleted tenant | should exercise deleted/inactive filtering if future fixtures implement it |

## Required Synthetic Users / Engineers

| User / engineer | Purpose | Required guardrails |
| --- | --- | --- |
| active engineer in org A | happy-path assignment and appointment visibility | fake stable id, no real name, no real phone, no real email, no real LINE id |
| active engineer in org B | cross-org denial and mirror scenarios | fake stable id, no real identity data |
| user without engineer profile | safe-deny for auth user lacking engineer linkage | no real profile data |
| inactive engineer | safe-deny for inactive engineer identity | no real reason text with PII |
| admin/support user proposal only | future admin read/review fixtures | not Phase 1 unless separately approved |
| cross-org contractor proposal only | future multi-org contractor edge case | Phase 1 excluded unless future task approves |

LINE identity is not a global identity.

All user ids must be fake stable IDs.

## Required Appointment / Assignment Scenarios

| Scenario | Future fixture setup | Expected visibility | Safe-deny or allowed | Operation eligibility implication | Invariant protected |
| --- | --- | --- | --- | --- | --- |
| assigned visible confirmed appointment | org A engineer, org A case, assigned appointment | visible to assigned engineer | allowed | can check arrived eligibility | assignment and org scope |
| assigned appointment already arrived | assigned appointment with arrived-like state | visible | operation-denied for duplicate arrived | started may be eligible later | idempotent operation handling |
| assigned appointment in progress | assigned appointment with started-like state | visible | allowed for completion source-data if future policy permits | arrived/start not repeated | state order |
| assigned appointment waiting parts | assigned terminal/incomplete outcome | visible summary | operation-denied for normal completion | may need follow-up flow | visit outcome separation |
| assigned appointment quote needed | assigned quote-needed outcome | visible summary | operation-denied for completion | quote workflow separation | no premature completion |
| assigned appointment customer not available | assigned no-access outcome | visible summary | operation-denied for completion | may need reschedule | visit outcome separation |
| assigned appointment cancelled | cancelled appointment | not actionable | safe-deny / operation-denied | no arrived/start/completion | no mutation after terminal |
| assigned appointment reassigned | originally assigned then reassigned | no longer visible to old engineer | safe-deny | no action by old engineer | assignment ownership |
| hidden / unconfirmed appointment | appointment not visible | hidden or unavailable | safe-deny | no action | customer confirmation boundary |
| appointment assigned to another engineer | org A appointment assigned to peer | not visible | safe-deny | no action | no assignment leak |
| appointment in another organization | org B appointment | not visible to org A | generic safe-deny | no action | tenant isolation |
| case already has formal FSR | case with active formal report | maybe visible depending role, not actionable for source-data | operation-denied / review needed | no duplicate formal report | one Case / one FSR |
| multiple appointments under same case | two or more visit records | assigned-only visibility | allowed only for assigned/current task | finalAppointmentId remains system-owned | multi-visit / one FSR |

## Completion Submission Fixture Scenarios

Future source-data fixtures should include:

- valid minimal source-data submission.
- valid submission with photo metadata refs.
- valid submission with signature exception reason.
- submission needing review.
- rejected source-data proposal.
- superseded source-data proposal.
- duplicate `clientRequestId`.
- weak network retry.
- forbidden `finalAppointmentId` field.
- forbidden `caseCompleted` field.
- forbidden formal FSR approval field.
- forbidden raw binary.
- forbidden provider payload.
- forbidden AI raw payload.

Required guardrails:

- source-data only.
- not formal Field Service Report.
- not Case completed.
- multiple submissions do not create multiple formal Field Service Reports.
- no survey / provider / billing / settlement / AI approval trigger.

## Safe-deny Assertion Fixture Plan

Future assertions should cover:

- generic safe-deny for non-enumeration.
- operation-denied for ineligible state where safe.
- no appointment existence leak.
- no organization existence leak.
- no engineer assignment ownership leak.
- no Case formal Field Service Report existence leak to unauthorized user.
- no internal note.
- no audit log.
- no billing / settlement.
- no AI raw payload.
- no provider payload.
- no raw binary.
- no full customer personal data.
- exact allowed DTO keys.

## Future Fixture Implementation Guardrails

Future fixture files must be synthetic-only.

Fixture IDs must be fake and stable.

Do not use real customer / engineer / organization data.

Do not use token / secret / `DATABASE_URL`.

Do not use real LINE id.

Do not use real phone / address / email.

Do not use provider payload.

Do not use AI raw payload.

Do not use billing / settlement internal data.

Do not use raw file / photo / signature binary.

Fixture implementation requires a separate PM task with exact allowed files.

Test execution requires separate PM approval.

## Runtime / DB Boundary

Task519 does not approve repository runtime.

Task519 does not approve DB access.

Task519 does not approve disposable DB inspection.

Task519 does not approve migration.

Task519 does not approve fixture/test file creation.

Task519 does not approve test execution.

DB-backed repository tests require schema inspection / migration decision first.

## File Touch Plan Conclusion

READY FOR FUTURE SYNTHETIC FIXTURE IMPLEMENTATION TASK — NO RUNTIME.

Task519 itself does not create or modify fixture/test files.

Future fixture implementation requires a separate PM task.

Future test execution requires separate PM approval.

## Future Sequencing

Future tasks, proposal only:

- Task520: Synthetic Repository Fixture Implementation / No Runtime / No Test Execution.
- Task521: Completion Submission Repository Runtime Scope Proposal / No Runtime.
- Task522: Migration Draft Authorization Packet / No Apply.
- Task523: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply.
- Task524: Repository Runtime Limited Scope Proposal / No Runtime.

Task519 does not execute these tasks.

## Non-goals

Task519 does not:

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

## Verification Boundary

Task519 static verification should confirm:

- `git diff --check docs/task-519-engineer-mobile-workbench-synthetic-repository-fixture-file-touch-plan-no-runtime.md` passes.
- Task519 only adds or modifies the allowed markdown file.
- no `src/`, `admin/src/`, tests, fixtures, migrations, package, smoke, or runtime files are changed by Task519.
- this document explicitly states no fixture file creation, no fixture file modification, no test file creation, no test execution, no DB command, no migration, no runtime, no provider, and no AI runtime.

No test, lint, smoke, browser, API, database, migration, provider, or AI command is required for Task519.

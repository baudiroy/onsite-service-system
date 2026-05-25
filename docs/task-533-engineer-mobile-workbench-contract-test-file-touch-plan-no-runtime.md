# Task 533 - Engineer Mobile Workbench Contract Test File Touch Plan

## Branch Status

Task533 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only.

This task is contract-test-file-touch-plan-only.

No test file creation.

No test file modification.

No fixture modification.

No test execution.

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

No provider sending.

No AI/RAG/vector DB.

This is not a test implementation approval.

This is not a runtime approval.

This is not a DB inspection approval.

This is not a migration approval.

Current Engineer Mobile Workbench runtime remains skeleton-only.

Current Engineer Mobile Workbench endpoints remain `501 Not Implemented`.

## Reference Handling

Task533 uses prior Engineer Mobile Workbench planning artifacts as read-only context.

References inspected or confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-519-engineer-mobile-workbench-synthetic-repository-fixture-file-touch-plan-no-runtime.md`
- `docs/task-527-engineer-mobile-workbench-repository-runtime-contract-test-plan-no-runtime.md`
- `docs/task-532-engineer-mobile-workbench-completion-submission-repository-runtime-authorization-packet-no-runtime.md`
- `fixtures/engineerMobileWorkbench/repositorySynthetic.fixture.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.repositorySyntheticFixture.test.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.skeleton.test.js`
- `fixtures/engineerMobileWorkbench/syntheticEngineerMobileWorkbench.fixture.js`

Task533 does not modify, normalize, execute, or expand those references.

No reference was created to compensate for a missing file.

## Purpose

Task533 converts the Task527 contract test plan into a future file touch plan.

Purpose:

- define which future test files may be added or modified if PM separately approves contract tests.
- distinguish pure fixture/static tests, no-DB contract tests, and DB-backed tests.
- prevent future tests from accidentally importing runtime, DB, provider, or AI code.
- prevent future test planning from being mistaken for test implementation approval.

This task does not authorize test file creation.

This task does not authorize fixture modification.

This task does not authorize test execution.

## Current Test Baseline

| Baseline item | Current state | Notes |
| --- | --- | --- |
| skeleton test baseline | exists as `tests/engineerMobileWorkbench/engineerMobileWorkbench.skeleton.test.js` | imports skeleton modules and synthetic fixture; runtime remains 501 skeleton |
| skeleton fixture baseline | exists as `fixtures/engineerMobileWorkbench/syntheticEngineerMobileWorkbench.fixture.js` | synthetic-only baseline |
| Task520 repository synthetic fixture | exists as `fixtures/engineerMobileWorkbench/repositorySynthetic.fixture.js` | synthetic-only repository planning fixture |
| Task521 static fixture contract test | exists as `tests/engineerMobileWorkbench/engineerMobileWorkbench.repositorySyntheticFixture.test.js` | imports only Task520 fixture |
| Task521 result | passed with 8 passed / 0 failed during Task521 | historical result only; not rerun in Task533 |
| repository runtime tests | do not exist | blocked |
| DB-backed tests | do not exist | blocked |
| smoke/API/browser tests | not authorized | blocked |

## Future Allowed Test Files Proposal

This section is proposal-only.

No test file is created.

No test file is modified.

| Future file | Purpose | Allowed imports | Forbidden imports | Fixture dependency | Runtime dependency | DB dependency | Test execution policy | Blocker | Separate PM approval required |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `tests/engineerMobileWorkbench/engineerMobileWorkbench.repositorySafeDeny.contract.test.js` | assert safe-deny scenarios and non-enumeration behavior | synthetic fixture only, Node test/assert | controllers, DB connection, provider clients, AI clients | Task520 fixture | none for pure static variant | none | single-file execution only if explicitly approved | needs future test task | yes |
| `tests/engineerMobileWorkbench/engineerMobileWorkbench.repositoryOrganizationIsolation.contract.test.js` | assert organization isolation scenario coverage | synthetic fixture only, Node test/assert | DB connection, runtime repository, provider clients, AI clients | Task520 fixture | none for pure static variant | none | single-file execution only if explicitly approved | needs future test task | yes |
| `tests/engineerMobileWorkbench/engineerMobileWorkbench.completionSubmissionContract.test.js` | assert completion submission source-data, forbidden fields, and invariant markers | synthetic fixture only, Node test/assert | formal FSR runtime, DB connection, provider clients, AI clients | Task520 fixture | none for pure static variant | none | single-file execution only if explicitly approved | needs future test task | yes |
| `tests/engineerMobileWorkbench/engineerMobileWorkbench.completionSubmissionRepository.contract.test.js` | test repository behavior after runtime approval | repository under test, synthetic fixture, Node test/assert, approved fake adapter if scoped | production DB utilities, controllers, providers, AI clients | Task520 fixture or approved extension | yes | no for fake adapter, yes for DB-backed variant | only after explicit runtime/test approval | repository runtime not approved | yes |
| possible DB-backed integration test file | verify real schema/repository behavior in disposable DB | approved repository, approved DB test helper, synthetic seed only | production/shared/Zeabur DB, row-data exports, provider clients, AI clients | synthetic DB seed only | yes | yes | only after explicit DB and migration/test approval | DB metadata inspection and migration decision blocked | yes |

## Pure Fixture / Static Tests Allowed Later

Future no-runtime / no-DB tests may cover:

- safe-deny scenario fixture shape.
- organization isolation scenario fixture shape.
- completion submission forbidden payload fixture shape.
- invariant notes fixture shape.
- allowed / forbidden DTO key lists from fixture metadata.
- no sensitive string scan over synthetic fixture.

Important limits:

- still requires separate PM task.
- can import fixture only.
- cannot import backend runtime.
- cannot call DB.
- cannot call provider / AI.
- can execute a single test file only if the future task explicitly approves execution.

## No-DB Contract Tests Requiring Fake Adapter Later

Future no-DB tests may be planned but are not implemented here:

- repository interface-like behavior with fake in-memory adapter.
- idempotency duplicate behavior with synthetic data.
- safe-deny mapping with fake results.
- forbidden output filtering with fake DTOs.
- mutation guard assertions using fake adapter.

Important limits:

- no actual repository implementation in Task533.
- no repository interface skeleton in Task533.
- future fake adapter must not mimic DB side effects too broadly.
- separate PM approval required.

## DB-backed Tests Blocked

DB-backed tests remain blocked:

- create source-data submission against real table.
- find by id within organization.
- find by idempotency key.
- list submissions for appointment.
- index / unique constraint behavior.
- FK behavior.
- transaction behavior.
- migration verification.

Reasons:

- actual DB metadata inspection not approved.
- actual schema unverified.
- migration not approved.
- repository runtime not approved.
- disposable local/test DB not confirmed.

## Forbidden Future Test Shortcuts

Future tests must not:

- import controller / resolver / guard unless the task explicitly scopes it.
- import DB connection.
- import provider clients.
- import AI clients.
- start backend server.
- run smoke/API/browser tests.
- run full suite without approval.
- connect production/shared/Zeabur DB.
- query business data rows.
- print `DATABASE_URL`.
- use real customer/engineer/LINE data.
- assert internal notes / audit / billing data in customer-facing output.

## Future Assertion Categories

Future assertions may cover:

- exact fixture groups present.
- exact safe-deny scenario keys present.
- organization A cannot see organization B.
- client `organizationId` not trusted.
- client `engineerProfileId` not trusted.
- client `finalAppointmentId` forbidden.
- completion submission source-data only.
- no formal FSR creation.
- no Case completed mutation.
- no appointment completed mutation.
- no survey/provider/billing/AI trigger.
- no raw binary.
- no AI raw payload.
- no provider payload.
- no token / secret / `DATABASE_URL`.
- no full customer PII.
- no cross-organization leakage.

## Test File Touch Readiness Conclusion

READY FOR FUTURE PURE STATIC CONTRACT TEST FILE TOUCH.

Important limits:

- DB-backed tests remain blocked.
- repository runtime tests remain blocked.
- Task533 does not approve test file creation.
- Task533 does not approve test execution.
- Task533 does not approve DB access.
- Task533 does not approve runtime.
- any future test file touch requires separate PM task with exact allowed files.

## Future Sequencing

Future tasks, proposal only:

- Task534: Pure Static Contract Test Implementation / No Runtime.
- Task535: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply, only after explicit user approval.
- Task536: Completion Submission Repository No-DB Interface Skeleton Authorization Packet / No Runtime.
- Task537: Completion Submission Migration File Touch Plan / No Apply.
- Task538: PM Continuation Handoff Summary / No Runtime Change.

Task533 does not execute these future tasks.

## Non-goals

Task533 does not:

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
- turn Task533 into test implementation approval.

## Verification Boundary

Task533 static verification should confirm:

- `git diff --check docs/task-533-engineer-mobile-workbench-contract-test-file-touch-plan-no-runtime.md` passes.
- Task533 only adds / modifies this allowed markdown file.
- no Task533 changes to `src/`, `admin/src/`, `tests/`, `fixtures/`, `migrations/`, package files, smoke files, or runtime files.
- this document clearly states no test file creation / no test file modification / no fixture modification / no test execution / no runtime / no repository implementation / no DB command / no migration / no provider / no AI.
- this document clearly states Task533 does not approve test file creation / test execution / DB access / runtime.

No test run is needed.

No lint run is needed.

No DB connection is needed.

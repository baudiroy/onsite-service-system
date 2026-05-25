# Task 532 - Engineer Mobile Workbench Completion Submission Repository Runtime Authorization Packet

## Branch Status

Task532 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only.

This task is runtime-authorization-packet-only.

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

This is not a runtime approval.

This is not a DB inspection approval.

This is not a migration approval.

Current Engineer Mobile Workbench runtime remains skeleton-only.

Current Engineer Mobile Workbench endpoints remain `501 Not Implemented`.

## Reference Handling

Task532 uses prior Engineer Mobile Workbench planning artifacts as read-only context.

References inspected or confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-531-pm-continuation-handoff-after-completion-submission-migration-touch-gate-no-runtime-change.md`
- `docs/task-522-engineer-mobile-workbench-completion-submission-repository-runtime-scope-proposal-no-runtime.md`
- `docs/task-526-engineer-mobile-workbench-completion-submission-repository-runtime-file-touch-plan-no-runtime.md`
- `docs/task-527-engineer-mobile-workbench-repository-runtime-contract-test-plan-no-runtime.md`
- `docs/task-529-engineer-mobile-workbench-completion-submission-source-data-migration-draft-authorization-packet-no-apply.md`
- `docs/task-530-engineer-mobile-workbench-completion-submission-migration-file-touch-plan-readiness-gate-no-apply.md`
- `docs/task-517-engineer-mobile-workbench-file-only-schema-inspection-report-no-db-command.md`
- `docs/task-523-engineer-mobile-workbench-disposable-local-db-schema-inspection-readiness-gate-no-db-command.md`
- `docs/task-524-engineer-mobile-workbench-disposable-db-metadata-inspection-command-envelope-no-db-command.md`
- `docs/task-525-engineer-mobile-workbench-db-inspection-approval-pending-branch-checkpoint-no-runtime-change.md`
- `fixtures/engineerMobileWorkbench/repositorySynthetic.fixture.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.repositorySyntheticFixture.test.js`

Task532 does not modify, normalize, execute, or expand those references.

No reference was created to compensate for a missing file.

## Authorization Purpose

Task532 reviews whether completion submission repository runtime can be authorized.

Purpose:

- use Task522 / Task526 / Task527 / Task529 / Task530 / Task531 as planning input.
- confirm actual DB metadata-only inspection still lacks explicit user approval.
- confirm actual applied schema remains unverified.
- confirm migration draft and migration file touch remain unauthorized.
- prevent repository runtime implementation before schema and migration decisions are ready.
- prevent source-data persistence from mutating formal Field Service Report, Case, appointment, provider, survey, billing, settlement, or AI workflows.

This task does not authorize any runtime.

## Current Evidence Summary

| Evidence item | Current evidence | Status |
| --- | --- | --- |
| Task515 completion submission repository contract proposal | proposed method responsibilities, trusted/untrusted inputs, safe return shape, and forbidden behaviors | ready for planning only |
| Task520 synthetic repository fixture | fixture exists and is synthetic-only | ready as fixture baseline |
| Task521 static fixture contract test | passed when run during Task521; imports only fixture | ready as static baseline |
| Task522 runtime scope proposal | concluded `DO NOT AUTHORIZE COMPLETION SUBMISSION REPOSITORY RUNTIME YET` | blocked |
| Task526 repository runtime file touch plan | concluded partial / needs DB metadata inspection approval first | blocked |
| Task527 contract test plan | concluded partial / needs DB metadata inspection approval first | blocked |
| Task529 migration draft authorization packet | concluded `DO NOT AUTHORIZE MIGRATION DRAFT YET` | blocked |
| Task530 migration file touch readiness gate | concluded `PARTIAL - NEEDS DB METADATA INSPECTION APPROVAL FIRST` | blocked |
| Task531 handoff | DB metadata-only inspection remains pending explicit user approval | blocked |
| actual repository runtime | not implemented / not authorized | blocked |

## Runtime Authorization Prerequisite Checklist

| Prerequisite | Status | Reason / blocker |
| --- | --- | --- |
| user explicitly approved DB metadata-only inspection | blocked | explicit approval has not been given |
| disposable local/test DB confirmed | blocked | target DB has not been confirmed |
| production/shared/Zeabur excluded | blocked | must be explicitly confirmed before DB metadata inspection |
| actual applied schema inspected | blocked | no DB command has been authorized or executed |
| completion source-data table need confirmed | partial | file-only evidence suggests likely need, not confirmed against DB |
| migration decision completed if new table needed | blocked | migration draft and file touch are not authorized |
| migration file touch approved if needed | blocked | Task530 says needs DB metadata inspection approval first |
| migration apply/dry-run explicitly approved if needed | blocked | no dry-run/apply approval exists |
| repository allowed files approved | blocked | no runtime file touch task approved |
| transaction convention confirmed | partial | file-only evidence found conventions, but runtime use is not approved |
| organization scope fields confirmed | partial | scope is mandatory, actual schema strategy unverified |
| case / appointment linkage confirmed | partial | file-only evidence exists, applied schema unverified |
| engineer identity mapping confirmed | partial | engineer-as-user evidence exists; profile strategy unresolved |
| idempotency strategy confirmed | partial | required but exact scope not approved |
| object refs convention confirmed | partial | metadata ref pattern exists, completion evidence linkage unapproved |
| audit / evidence strategy confirmed | future task required | audit runtime is not implemented or approved |
| contract test file touch plan approved | future task required | Task527 is plan-only |
| synthetic fixture baseline remains valid | ready | Task520/521 baseline exists |
| safe-deny / non-enumeration behavior approved | partial | concept is planned, implementation not approved |
| no provider/survey/billing/AI trigger path verified | future task required | needs future tests if runtime is authorized |

## Runtime Authorization Options

### Option A - Do Not Authorize Runtime Yet

Reason:

- actual applied schema is unknown.
- DB metadata inspection is not approved.
- completion source-data table is not approved.
- migration draft and migration file touch are not approved.
- repository runtime would need schema, transaction, organization scope, idempotency, audit, and evidence decisions that are still incomplete.

Benefits:

- avoids writing repository code against unverified schema.
- preserves one Case / one formal FSR boundary.
- avoids accidental Case/appointment/formal FSR mutations.
- avoids unauthorized DB/runtime side effects.
- keeps future runtime, migration, and DB approval gates separate.

Risks:

- completion submission persistence remains unimplemented.
- future contract tests remain planning-only.
- Mobile Workbench remains source-data skeleton without persistence.

Required next step:

- obtain explicit DB metadata-only inspection approval, or continue docs-only planning with no runtime implementation.

### Option B - Authorize No-DB Repository Interface Skeleton Only

Reason:

- a pure interface skeleton could document method names without DB writes.

Benefits:

- may help future implementation consistency.
- can remain no-DB if carefully scoped.

Risks:

- can be mistaken for runtime approval.
- may add code that suggests implementation readiness before DB/schema facts exist.
- can drift from actual schema once metadata inspection happens.

Why this is still not recommended unless separately scoped:

- Task532 exact allowed file is this markdown document only.
- any no-DB interface skeleton would need a separate PM task with exact allowed files and strict non-runtime language.

Why Task532 does not implement it:

- Task532 forbids repository implementation and repository interface implementation.

### Option C - Authorize DB-backed Repository Runtime After DB Metadata Inspection And Migration Decision

Reason:

- DB-backed runtime is eventually needed only if persistence is approved.

Required preconditions:

- explicit disposable local/test DB metadata-only inspection approval.
- actual schema inspected.
- source-data table need confirmed.
- migration decision completed if new table is required.
- migration file touch and migration verification tasks approved if needed.
- repository allowed files approved.
- contract tests approved.
- no provider/survey/billing/AI side-effect tests planned.

Risks:

- premature DB-backed runtime can leak cross-organization data.
- wrong idempotency scope can create duplicates or false conflicts.
- repository may accidentally mutate formal Field Service Report, Case, or appointment state.

Why Task532 does not implement it:

- Task532 is docs-only and cannot access DB or write runtime.

### Option D - Authorize Pure Contract Tests Only

Reason:

- pure tests could further formalize fixture-only behavior without DB.

Benefits:

- reinforces guardrails before runtime.
- can check safe-deny / forbidden field assumptions.

Risks:

- tests may duplicate Task521 without improving runtime readiness.
- repository contract tests require repository code that does not exist.
- DB-backed tests remain blocked by DB approval and schema/migration decisions.

Dependency on runtime / fixture / DB:

- pure fixture tests depend only on synthetic fixture.
- repository tests depend on future repository implementation or fake adapter.
- DB-backed tests require disposable local/test DB and explicit approval.

Why Task532 does not implement it:

- Task532 forbids fixture/test creation, fixture/test modification, and test execution.

## Minimum Future Runtime Scope If Later Authorized

This section is proposal-only.

Future repository runtime, if separately approved, may include only:

- create completion submission source-data record.
- find submission by id within organization.
- find submission by idempotency key within organization / appointment scope.
- list submissions for verified appointment.
- mark `needs_review` only if separately approved.
- mark `superseded` only if separately approved.
- mark `accepted_as_source` only if separately approved.

Future repository runtime must explicitly exclude:

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

## Forbidden Runtime Shortcuts

Future runtime must not:

- let controller directly call repository without resolver / guard / boundary.
- trust client `organizationId`.
- trust client `engineerProfileId`.
- trust client `finalAppointmentId`.
- trust client Case completed flag.
- use LINE id as global identity.
- bypass assignment verification.
- write to `field_service_reports`.
- mutate Case status.
- mutate appointment completed state.
- store raw file/photo/signature binary.
- store AI raw payload as official result.
- return internal notes / audit / billing data.
- leak cross-organization existence through errors.

## Test And Fixture Readiness

- Task520 fixture baseline exists.
- Task521 static test passed with 8 passed / 0 failed during Task521.
- No runtime repository tests exist.
- No DB-backed tests exist.
- Task527 test plan exists but did not authorize tests.
- Future contract tests require separate PM task.
- DB-backed tests require disposable local/test DB and explicit approval.
- Full test suite / smoke / API / browser tests remain unauthorized for this task.

## DB / Migration Blocker Map

| Blocker | Status | Runtime impact |
| --- | --- | --- |
| actual applied schema unknown | blocked | repository cannot safely target tables/columns |
| DB metadata inspection not approved | blocked | no schema metadata can be confirmed |
| completion source-data table not approved | blocked | persistence target does not exist / is not approved |
| migration draft not approved | blocked | no schema proposal can become SQL |
| migration file touch not approved | blocked | no new migration file can be created |
| migration dry-run / apply not approved | blocked | no DB verification path exists |
| organization_id strategy unverified against actual DB | partial | repository isolation strategy uncertain |
| idempotency strategy unverified | partial | duplicate/retry behavior uncertain |
| object refs convention unverified against actual DB | partial | evidence persistence shape uncertain |
| audit / evidence strategy not implemented | future task required | traceability not ready |
| transaction convention needs runtime implementation review | partial | future writes must be transaction-aware but no runtime is approved |

## Guardrail Invariants

Task532 preserves these invariants:

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

## Runtime Authorization Conclusion

DO NOT AUTHORIZE COMPLETION SUBMISSION REPOSITORY RUNTIME.

Rationale:

- actual applied schema remains unverified.
- DB metadata-only inspection still requires explicit user approval.
- migration draft and migration file touch remain unauthorized.
- persistence target, table shape, idempotency scope, organization scope strategy, object refs, and audit strategy remain incomplete.
- runtime code before schema/migration decision would be premature.

Task532 does not approve runtime.

Task532 does not approve repository implementation.

Task532 does not approve DB access.

Task532 does not approve migration.

Future runtime requires separate PM task with exact allowed files.

Actual DB metadata-only inspection still requires explicit user approval.

## Future Sequencing

Future tasks, proposal only:

- Task533: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply, only after explicit user approval.
- Task534: Contract Test File Touch Plan / No Runtime.
- Task535: Completion Submission Repository No-DB Interface Skeleton Authorization Packet / No Runtime.
- Task536: Completion Submission Migration File Touch Plan / No Apply.
- Task537: PM Continuation Handoff Summary / No Runtime Change.

Task532 does not execute these future tasks.

## Non-goals

Task532 does not:

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
- turn Task532 into runtime approval / DB inspection approval / migration approval.

## Verification Boundary

Task532 static verification should confirm:

- `git diff --check docs/task-532-engineer-mobile-workbench-completion-submission-repository-runtime-authorization-packet-no-runtime.md` passes.
- Task532 only adds / modifies this allowed markdown file.
- no Task532 changes to `src/`, `admin/src/`, `tests/`, `fixtures/`, `migrations/`, package files, smoke files, or runtime files.
- this document clearly states no runtime / no repository implementation / no DB command / no SQL / no migration / no test execution / no provider / no AI.
- this document clearly states Task532 does not approve runtime / repository implementation / DB access / migration.

No test run is needed.

No lint run is needed.

No DB connection is needed.

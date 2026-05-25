# Task 529 - Engineer Mobile Workbench Completion Submission Source-Data Migration Draft Authorization Packet

## Branch Status

Task529 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only.

This task is migration-draft-authorization-packet-only.

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

Task529 uses prior Engineer Mobile Workbench planning artifacts as read-only context.

References inspected or confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-510-engineer-mobile-workbench-completion-submission-data-model-decision-packet-no-migration.md`
- `docs/task-512-engineer-mobile-workbench-completion-submission-source-data-migration-decision-packet-no-apply.md`
- `docs/task-517-engineer-mobile-workbench-file-only-schema-inspection-report-no-db-command.md`
- `docs/task-518-engineer-mobile-workbench-disposable-local-db-schema-inspection-authorization-packet-no-db-command.md`
- `docs/task-523-engineer-mobile-workbench-disposable-local-db-schema-inspection-readiness-gate-no-db-command.md`
- `docs/task-524-engineer-mobile-workbench-disposable-db-metadata-inspection-command-envelope-no-db-command.md`
- `docs/task-525-engineer-mobile-workbench-db-inspection-approval-pending-branch-checkpoint-no-runtime-change.md`
- `docs/task-526-engineer-mobile-workbench-completion-submission-repository-runtime-file-touch-plan-no-runtime.md`
- `docs/task-527-engineer-mobile-workbench-repository-runtime-contract-test-plan-no-runtime.md`
- `docs/task-528-pm-continuation-handoff-after-engineer-mobile-workbench-db-repository-design-branch-checkpoint-no-runtime-change.md`
- `fixtures/engineerMobileWorkbench/repositorySynthetic.fixture.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.repositorySyntheticFixture.test.js`

Task529 does not modify, normalize, execute, or expand those references.

No reference was created to compensate for a missing file.

## Purpose

Task529 reviews whether the Engineer Mobile Workbench completion submission source-data model is ready for a future migration draft.

Purpose:

- use the Task510 / Task512 dedicated source-data table direction as planning input.
- use Task517 file-only schema inspection as current evidence.
- list schema facts still missing before any future migration draft.
- use Task523 through Task525 to confirm actual DB metadata-only inspection still lacks explicit user approval.
- prevent migration file creation before actual applied schema is verified.
- prevent DB command execution in this task.
- prevent migration planning from being mistaken for migration approval.
- prevent source-data persistence from becoming formal Field Service Report runtime.

This task does not authorize migration file creation.

This task does not authorize DB command.

This task does not authorize migration dry-run.

This task does not authorize migration apply.

This task does not authorize runtime.

## Current Evidence Summary

| Evidence item | Current evidence | Status | Migration implication |
| --- | --- | --- | --- |
| Task510 dedicated source-data table direction | Task510 recommends a future dedicated source-data table and explicitly says no migration approved | ready as conceptual direction | useful input only, not schema approval |
| Task512 migration decision packet | Task512 recommends future dedicated source-data table but says no migration approved and needs schema decisions | partial | migration candidate exists conceptually but cannot become SQL yet |
| `cases` evidence | Task517 found table / repository evidence | partial | Case linkage remains required but actual applied schema is unverified |
| `appointments` evidence | Task517 found table / repository evidence and Task018 visit-result fields in files | partial | appointment linkage likely needed, exact columns still unverified |
| `dispatch_assignments` evidence | Task517 found dispatch assignment evidence | partial | dispatch assignment linkage may be useful, exact schema still unverified |
| separate `dispatch_visits` table | Task517 found unclear / not found | blocked | keep any dispatch visit linkage optional until actual schema is confirmed |
| `field_service_reports` evidence | Task517 found table / repository evidence | partial | source-data must remain separate from formal FSR workflow |
| `field_service_reports.case_id` uniqueness | Task517 found file-level migration evidence | partial | reinforces one Case / one formal FSR invariant, but applied DB remains unverified |
| reusable completion submission source-data table | Task517 did not find one | partial / likely absent | suggests future dedicated source-data table may be needed |
| `users` / engineer-as-user evidence | Task517 found `users.user_type` and engineer assignment references | partial | engineer identity may map to users, but final mapping is unverified |
| separate `engineer_profiles` table | Task517 did not find one | blocked | future migration must not assume engineer profiles exist |
| `organizations` / `user_organizations` evidence | Task517 found organization and membership evidence | partial | organization scope is mandatory for future repository methods |
| object reference convention | Task517 found `case_attachments` metadata/object reference pattern | partial | future evidence should use object refs, not raw binary |
| audit convention | Task517 found `audit_logs` convention | partial | future writes should plan audit without exposing audit internals |
| idempotency convention | Task517 only found migration 020 outbox-style artifact; not completion submission | partial | completion submission idempotency still needs its own design |
| actual applied DB schema | not inspected | blocked | migration draft cannot be authorized safely |
| DB metadata-only inspection | prepared by Task518/523/524/525 but not approved | blocked | requires explicit user approval first |

## Migration Draft Readiness Checklist

| Readiness item | Status | Reason / blocker |
| --- | --- | --- |
| actual applied schema inspected | blocked | no DB metadata-only inspection has been approved or executed |
| disposable local/test DB confirmed | blocked | user has not explicitly confirmed a disposable local/test DB target |
| user approved metadata-only DB inspection | blocked | broad future development approval is not sufficient for this DB gate |
| completion submission table need confirmed | partial | file-only evidence suggests likely need, but applied schema is unverified |
| table naming convention confirmed | partial | project patterns are visible in files, but exact new table name is not approved |
| organization_id convention confirmed | partial | organization scope evidence exists, exact coverage for workbench persistence remains unverified |
| case_id linkage confirmed | partial | Case concept exists, applied FK/index strategy remains unverified |
| appointment_id linkage confirmed | partial | appointments exist in files, applied columns and constraints remain unverified |
| dispatch assignment / dispatch visit linkage confirmed | partial | dispatch assignments exist; separate dispatch visits are unclear / not found |
| engineer identity mapping confirmed | partial | engineer-as-user evidence exists; separate profile table not found |
| platform user mapping confirmed | partial | users table evidence exists; final actor field convention needs schema confirmation |
| object refs convention confirmed | partial | case attachment metadata pattern exists; future evidence linkage still needs decision |
| idempotency convention confirmed | partial | outbox idempotency artifact exists, completion submission idempotency not confirmed |
| audit / created_by / updated_by convention confirmed | partial | conventions found in files; future source-data audit fields still need decision |
| soft delete convention confirmed | partial | common `deleted_at` pattern found; exact future table policy not approved |
| index strategy confirmed | blocked | no future index names, expressions, or uniqueness scopes are approved |
| FK strategy confirmed | blocked | hard FK vs application-level reference strategy not approved |
| retention policy confirmed | future task required | source-data, photos, signatures, and drafts need explicit retention policy |
| rollback strategy confirmed | future task required | no migration rollback strategy can exist before migration scope approval |
| synthetic fixture baseline exists | ready | Task520 fixture exists |
| future migration test strategy exists | partial | Task527 defines test planning, but migration tests are not implemented or approved |

## Migration Draft Authorization Options

### Option A - Do Not Authorize Migration Draft Yet

Reason:

- actual applied DB schema has not been inspected.
- explicit disposable local/test DB metadata-only inspection approval has not been given.
- completion submission source-data table need is likely but not proven against actual schema.
- table name, column set, indexes, FK strategy, idempotency scope, retention, and rollback strategy are not final.

Benefits:

- avoids drafting SQL against stale or incomplete file-only evidence.
- avoids accidental conflict with existing applied schema.
- preserves one Case / one formal Field Service Report guardrail.
- keeps migration, runtime, and DB inspection approvals separate.
- reduces risk of cross-organization leakage from premature schema design.

Risks:

- delays completion submission persistence work.
- keeps repository runtime blocked.
- requires another PM/user approval step before migration planning can advance.

Required next step:

- obtain explicit user approval for disposable local/test DB metadata-only inspection, or continue docs-only planning without migration file touch.

### Option B - Authorize Only Migration Draft Planning After DB Metadata Inspection

Reason:

- a migration draft could become reasonable only after actual schema metadata confirms current tables, constraints, indexes, and conventions.

Benefits:

- allows future SQL planning to be based on the applied schema rather than file-only inference.
- can validate whether a new dedicated source-data table is truly necessary.
- can refine organization, Case, appointment, dispatch assignment, engineer, object ref, and idempotency linkage safely.

Risks:

- DB metadata inspection itself requires strict target confirmation and output redaction.
- even after metadata inspection, migration draft still needs a separate task and exact allowed files.

Required approvals:

- explicit user approval for disposable local/test DB metadata-only inspection.
- confirmation target is not production, shared, or Zeabur.
- no data rows, no DDL, no migration apply, no migration rollback, no `DATABASE_URL` output, no token/secret output, no customer/engineer/LINE personal data output.
- separate PM task for any later migration file creation.

Why Task529 does not execute it:

- Task529 is docs-only and not a DB inspection approval.
- Task529 exact allowed file is this markdown document only.
- Task529 cannot run DB commands or create migration files.

### Option C - Authorize Migration File Creation Now

Why this is not recommended:

- actual applied schema remains unverified.
- file-only inspection cannot prove migration order, constraints, indexes, or existing tables in the target DB.
- `engineer_profiles` and `dispatch_visits` remain unclear.
- completion source-data idempotency convention is not confirmed.

Risks:

- migration conflicts with existing schema.
- wrong table or column names become sticky.
- source-data table could be mistaken for formal Field Service Report.
- missing organization scope could create tenant leakage.
- wrong idempotency scope could create duplicate or over-blocked submissions.
- rollback strategy could be unsafe.

Guardrail conflicts:

- premature migration can weaken one Case / one formal Field Service Report boundaries.
- premature migration can blur completion submission source-data with formal completion runtime.
- premature migration can imply unauthorized runtime or repository implementation.

Missing facts:

- actual table names / columns / constraints.
- applied migration state.
- organization scope coverage.
- dispatch visit existence.
- engineer identity mapping.
- object ref convention details.
- idempotency strategy.
- retention and rollback policy.

## Candidate Migration Scope - Proposal Only

This section is proposal-only.

No SQL.

No schema approval.

No migration file approval.

Future candidate scope may include:

- dedicated completion submission source-data table.
- organization scope field.
- Case linkage.
- appointment linkage.
- optional dispatch visit / dispatch assignment linkage.
- engineer identity linkage.
- platform user linkage.
- submission lifecycle status.
- idempotency fields.
- evidence object refs metadata.
- validation / normalization snapshots.
- `created_at` / `updated_at` / `deleted_at`.
- `created_by` / `updated_by`.
- indexes / constraints to be decided later.

Explicit limits:

- no table name approved.
- no column approved.
- no index approved.
- no FK approved.
- no enum approved.
- no migration file approved.
- final schema requires future explicit migration task.

## Explicitly Excluded From Migration Draft

Task529 excludes:

- formal Field Service Report schema changes.
- customer-facing service report schema.
- appointment state transition schema unless separately approved.
- billing / settlement schema.
- survey schema.
- provider sending schema.
- AI/RAG/vector DB schema.
- object storage implementation.
- audit log runtime implementation.
- repository runtime implementation.

## Migration Risk Register

| Risk | Impact | Current mitigation | Remaining blocker | Future action |
| --- | --- | --- | --- | --- |
| migration drafted before actual schema inspection | SQL may target wrong tables or constraints | Task529 does not authorize migration | actual applied schema unverified | run approved metadata-only inspection on disposable local/test DB |
| duplicate table concept conflicts with existing schema | redundant or conflicting source-data storage | Task517 file-only inspection searched for reusable table | actual DB could differ from files | confirm applied schema before SQL |
| source-data table mistaken as formal FSR | breaks one Case / one formal FSR boundary | docs repeatedly mark source-data only | future naming / UI / repository may blur semantics | require source-data naming and tests |
| multiple submissions causing multiple formal FSRs | duplicate official reports | formal FSR remains separate and unique by Case | future runtime must enforce separation | add mutation guard tests before runtime |
| missing organization_id causing tenant leak | cross-tenant data exposure | organization scope is a hard guardrail | exact field / FK strategy unapproved | require organization-scoped schema and repository methods |
| wrong idempotency constraint scope | duplicate weak-network submissions or false conflicts | Task510/512/527 identify idempotency need | final key scope unknown | decide after schema inspection and retry contract |
| raw binary accidentally stored in DB | privacy/storage/security risk | guardrails require object/file storage refs | evidence table design unapproved | enforce object refs only |
| AI normalized draft treated as official result | AI suggestion becomes formal record | AI output / official record separation documented | future runtime may mishandle statuses | add explicit lifecycle and review gates |
| signature exception treated as customer consent | false customer authorization | signature exception is evidence only | future schema/status wording unapproved | separate signature evidence from approval records |
| provider / survey / billing trigger accidentally connected | unintended outbound or financial side effect | Task529 forbids runtime and triggers | future runtime integration unapproved | require side-effect guard tests |
| migration rollback unclear | unsafe DDL release | no migration file created | rollback not designed | include rollback plan in future migration task |
| production/shared DB accidentally targeted | shared runtime damage / data risk | DB command forbidden in Task529 | future DB inspection still needs approval | require disposable local/test confirmation and stop conditions |

## Guardrail Invariants

Task529 preserves these invariants:

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

## Authorization Conclusion

DO NOT AUTHORIZE MIGRATION DRAFT YET.

Rationale:

- actual applied schema is still unverified.
- disposable local/test DB metadata-only inspection is still pending explicit user approval.
- file-only evidence is enough for planning but not enough for migration file creation.
- repository runtime and completion persistence remain unauthorized.
- final migration scope still needs table, column, index, FK, idempotency, retention, and rollback decisions.

Task529 does not approve migration file creation.

Task529 does not approve DB command.

Task529 does not approve migration dry-run.

Task529 does not approve migration apply.

Task529 does not approve runtime.

Future migration draft requires separate PM task with exact allowed files.

Actual DB metadata-only inspection still requires explicit user approval.

## Future Sequencing

Future tasks, proposal only:

- Task530: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply, only after explicit user approval.
- Task531: Completion Submission Migration File Touch Plan / No Apply.
- Task532: Completion Submission Repository Runtime Authorization Packet / No Runtime.
- Task533: Contract Test File Touch Plan / No Runtime.
- Task534: PM Continuation Handoff Summary / No Runtime Change.

Task529 does not execute these future tasks.

## Non-goals

Task529 does not:

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
- turn Task529 into migration approval / DB inspection approval / runtime approval.

## Verification Boundary

Task529 static verification should confirm:

- `git diff --check docs/task-529-engineer-mobile-workbench-completion-submission-source-data-migration-draft-authorization-packet-no-apply.md` passes.
- Task529 only adds / modifies this allowed markdown file.
- no Task529 changes to `src/`, `admin/src/`, `tests/`, `fixtures/`, `migrations/`, package files, smoke files, or runtime files.
- this document clearly states no migration file creation / no DB command / no SQL / no DDL / no migration apply / no runtime / no repository implementation / no test execution / no provider / no AI.
- this document clearly states Task529 does not approve migration file creation / DB command / migration dry-run / migration apply / runtime.

No test run is needed.

No lint run is needed.

No DB connection is needed.

# Task 512 - Engineer Mobile Workbench Completion Submission Source-Data Migration Decision Packet

## Branch Status

Task512 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only and migration-decision-packet-only.

There is no migration file, no migration apply, no migration dry-run, no DB command, no SQL, no DDL, no schema change, no runtime, no repository implementation, no provider sending, and no AI/RAG/vector database.

This document is not a migration approval.

This document is not schema finalization.

Current Engineer Mobile Workbench runtime remains skeleton-only and current endpoints still return `501 Not Implemented`.

## Reference Handling

Task512 may use prior Engineer Mobile Workbench design decisions as context, but it does not modify any reference file.

Relevant references inspected or confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-510-engineer-mobile-workbench-completion-submission-data-model-decision-packet-no-migration.md`
- `docs/task-511-engineer-mobile-workbench-repository-runtime-authorization-decision-packet-no-runtime.md`
- `docs/task-507-engineer-mobile-workbench-completion-submission-persistence-design-no-migration.md`
- `docs/task-508-engineer-mobile-workbench-repository-contract-integration-map-no-runtime.md`
- `docs/task-509-engineer-mobile-workbench-assignment-appointment-state-readiness-review-no-runtime.md`
- `docs/task-498-engineer-mobile-workbench-completion-submission-payload-validation-rule-design-no-runtime-change.md`
- `src/boundaries/EngineerMobileWorkbenchCompletionSubmissionBoundary.js`
- `src/validators/EngineerMobileWorkbenchCompletionSubmissionValidator.js`

Task512 does not rename, create, patch, or normalize those references.

## Decision Packet Purpose

Task512 converts the Task510 dedicated source-data table recommendation into a future migration decision checklist.

Purpose:

- identify table / field / index / foreign key / retention / audit / idempotency questions for a future migration.
- identify decisions that require actual DB schema inspection.
- identify what must not become formal schema in this task.
- provide PM review material for a future migration task.

This task does not authorize any migration or runtime.

## Recommended Migration Direction

RECOMMEND FUTURE DEDICATED SOURCE-DATA TABLE — NO MIGRATION APPROVED.

Important limits:

- this is not formal table name approval.
- this is not column approval.
- this is not index approval.
- this is not foreign key approval.
- this is not enum approval.
- this is not migration approval.
- future migration still requires a separate PM-approved migration task.
- future migration task still requires exact allowed files.
- future migration dry-run / apply requires separate explicit authorization.

## Migration Candidate Scope

Proposal-only future migration candidate scope:

- possible dedicated source-data table.
- organization scope linkage.
- Case linkage.
- appointment linkage.
- optional dispatch visit linkage.
- engineer profile linkage.
- platform user linkage.
- lifecycle status.
- idempotency fields.
- evidence object reference metadata.
- validation snapshot / normalized draft metadata.
- soft delete / timestamps / created_by / updated_by.
- retention / archive considerations.

Explicitly excluded:

- formal Field Service Report schema.
- customer-facing service report schema.
- billing / settlement schema.
- provider sending schema.
- survey schema.
- AI/RAG/vector DB schema.
- object storage implementation.
- audit log runtime implementation.
- appointment state transition runtime.

## Schema Decision Checklist

| Decision item | Proposed direction | Status | Risk if skipped |
| --- | --- | --- | --- |
| final table name | dedicated source-data table, exact name TBD | unknown / needs schema inspection | premature naming can conflict with existing conventions |
| primary key strategy | stable internal id | requires migration decision later | weak identity makes dedupe/review difficult |
| organization_id requirement | required first-class scope | requires migration decision later | cross-organization leakage risk |
| case_id linkage | required conceptual link | requires migration decision later | source-data cannot be traced to Case |
| appointment_id linkage | required conceptual link | requires migration decision later | source-data cannot be tied to visit |
| dispatch_visit_id optional strategy | optional only if model has distinct dispatch visits | unknown / needs schema inspection | broken linkage if visits are separate |
| engineer_profile_id linkage | required conceptual link | unknown / needs schema inspection | cannot verify submitter relationship |
| platform_user_id linkage | likely required for actor traceability | unknown / needs schema inspection | weak audit/evidence trail |
| submission status representation | lifecycle proposal only | requires migration decision later | ambiguous review state |
| idempotency key strategy | client + server key proposal | requires migration decision later | retry duplicates |
| duplicate detection strategy | needs future unique/index design | requires migration decision later | repeated tap duplicate rows |
| JSON / structured snapshot storage convention | follow existing convention if any | unknown / needs schema inspection | inconsistent storage |
| evidence refs storage convention | object storage refs only | unknown / needs schema inspection | raw binary risk |
| soft delete convention | follow project convention | unknown / needs schema inspection | retention and traceability gaps |
| timestamps convention | follow project convention | unknown / needs schema inspection | poor lifecycle tracing |
| created_by / updated_by convention | follow audit actor convention | unknown / needs schema inspection | weak accountability |
| retention policy | future policy needed | requires migration decision later | over-retention / privacy risk |
| foreign key strategy | decide after schema inspection | requires migration decision later | integrity or deployment mismatch |
| index strategy | decide after query plan and schema inspection | requires migration decision later | slow or unsafe lookups |
| unique constraint strategy | decide after idempotency policy | requires migration decision later | duplicates or over-strict writes |
| enum vs lookup table vs text status | decide with project convention | requires migration decision later | brittle lifecycle model |
| migration rollback strategy | required in future migration packet | future task required | unsafe DDL rollback |
| seed / fixture strategy | no production seed; test fixtures later | future task required | runtime tests lack coverage |
| audit evidence strategy | source-data writes should be auditable later | future task required | poor traceability |

## Proposed Conceptual Table Shape

This table is conceptual only. It is not SQL and not a migration.

| Field group | Why needed | Source of truth | Sensitivity level | Customer-visible? | Future index need | Migration decision needed |
| --- | --- | --- | --- | --- | --- | --- |
| Identity / scope | tenant isolation and linkage | server-side organization, Case, appointment, engineer context | medium | no | yes / unknown | yes |
| Lifecycle | review and supersede workflow | backend workflow | medium | no | unknown | yes |
| Engineer input summary | source-data for future report draft | engineer submission after validation | medium to high | no by default | no / unknown | yes |
| Evidence refs | link object storage evidence | future file/object storage service | high | no by default | unknown | yes |
| Validation / normalization | trace validator and future draft normalization | validator / future human-confirmed workflow | medium | no | no / unknown | yes |
| Idempotency | retry / duplicate control | client request id and server key design | medium | no | likely | yes |
| System metadata | auditability and maintenance | backend system | medium | no | likely | yes |
| Soft delete / retention | lifecycle and privacy policy | backend policy | medium | no | yes / unknown | yes |

## Index / Constraint Decision Points

Future decision points, not approved indexes:

- `organization_id + engineer_profile_id`.
- `organization_id + appointment_id`.
- `organization_id + case_id`.
- `client_request_id` uniqueness scope.
- `server_idempotency_key` uniqueness scope.
- `duplicate_of_submission_id` linkage.
- `superseded_by_submission_id` linkage.
- `submitted_at` / `received_at` query needs.
- soft delete filtering.
- retention / archive query needs.

Important limits:

- no index is created.
- no constraint is created.
- no migration file is created.
- final indexes require actual schema inspection and migration approval.

## FK / Referential Integrity Decision Points

Future decision points, not approved foreign keys:

- organization reference.
- Case reference.
- appointment reference.
- dispatch visit reference.
- engineer profile reference.
- platform user reference.
- object storage reference pattern.
- whether hard foreign key or application-level reference is preferred.
- handling deleted / archived appointments.
- handling reassigned engineers.
- handling superseded submissions.

Important limits:

- no foreign key is created.
- no DDL is written.
- no schema is finalized.

## Status / Lifecycle Decision Points

Proposal-only statuses:

- `draft`
- `submitted`
- `needs_review`
- `rejected`
- `superseded`
- `accepted_as_source`
- `archived`

Important limits:

- no enum is created.
- no lookup table is created.
- no runtime transition is implemented.
- `accepted_as_source` is not formal Field Service Report approval.
- `submitted` is not Case completed.
- `rejected` is not appointment cancelled.
- `superseded` preserves traceability.

## Guardrail Invariants

Task512 preserves these invariants:

- completion submission is source-data.
- Field Service Report is Case-level formal report.
- one Case ultimately has only one formal Field Service Report.
- multiple completion submissions do not equal multiple formal Field Service Reports.
- multiple appointments / dispatch visits can have multiple source submissions.
- `field_service_reports.case_id` uniqueness must not be broken.
- `finalAppointmentId` remains system-owned.
- engineer cannot manually select `finalAppointmentId`.
- completion submission persistence should not directly mutate appointment state.
- completion submission does not trigger survey / provider / billing / settlement / AI approval.

## Sensitive Data / Forbidden Storage

Future source-data table must not store:

- raw file binary.
- raw photo binary.
- raw signature image binary.
- token / secret / `DATABASE_URL`.
- LINE channel secret / access token.
- unnecessary full customer personal data.
- full internal note.
- full audit log.
- AI raw payload.
- provider raw payload.
- billing / settlement internal data.
- customer channel identity internals.
- unconfirmed AI dispatch suggestion payload.
- formal Field Service Report approval decision.
- customer-facing report published content.
- cross-organization data.

## Migration Risk Register

| Risk | Impact | Mitigation in Task512 proposal | Remaining gap | Future action |
| --- | --- | --- | --- | --- |
| migration mistaken as runtime approval | unauthorized code or DB changes | explicit no runtime / no apply wording | future task discipline | keep separate PM approval |
| table name finalized too early | convention conflicts | no formal table name approval | schema inspection missing | schema inspection planning |
| source-data mistaken as formal FSR | breaks report invariant | source-data-only guardrail | runtime not implemented | future tests and review workflow |
| multiple submissions break one Case / one FSR | duplicate formal reports | formal FSR separation | formal workflow missing | future FSR workflow guard |
| idempotency constraint scope wrong | duplicate or blocked submissions | decision point listed | exact policy missing | idempotency design before migration |
| organization_id index omitted | cross-scope or slow queries | index decision point listed | schema unknown | migration decision packet |
| cross-organization data leakage | tenant breach | organization scope required | runtime tests missing | isolation tests |
| raw binary stored in DB | storage/privacy risk | raw binary forbidden | object storage convention unknown | object storage design alignment |
| AI normalized draft treated official | AI auto-decision risk | normalized draft remains draft | AI workflow missing | AI governance tests |
| signature exception treated as customer consent | dispute risk | exception evidence only | review policy missing | admin/supervisor review design |
| provider / survey / billing trigger wired | external side effects | explicit no-trigger guardrail | no-send tests missing | future no-send fixtures |
| rollback strategy undefined | unsafe migration | rollback listed as required | no migration file yet | future migration packet |
| retention policy undefined | privacy and storage risk | retention listed as required | policy missing | future retention design |

## Decision Conclusion

PARTIAL — NEEDS SCHEMA INSPECTION BEFORE MIGRATION DESIGN — NO APPLY.

This means:

- Task512 may support future schema inspection planning.
- a future migration design task should wait until existing schema conventions are inspected.

This does not mean:

- migration file approved.
- migration apply approved.
- migration dry-run approved.
- DB command approved.
- runtime approved.
- repository implementation approved.
- formal table / column / index / enum / FK schema approved.

Future migration requires a separate PM task and exact allowed files.

## Future Sequencing

Future tasks, proposal only:

- Task513: Repository Test Fixture Planning / No Runtime.
- Task514: Appointment State Transition Runtime Decision Packet / No Runtime.
- Task515: Completion Submission Repository Contract Proposal / No Runtime.
- Task516: Schema Inspection Planning / No DB Command.
- Task517: Migration Draft Authorization Packet / No Apply.

Task512 does not execute these tasks.

## Non-goals

Task512 does not:

- modify `src/`.
- modify `admin/src/`.
- modify routes, controllers, resolvers, guards, projections, or validators.
- add repository classes.
- add repository interfaces.
- add service classes.
- add models.
- add SQL.
- add migrations.
- modify Migration020.
- execute DB / DDL / psql / migration / dry-run / apply.
- add or modify tests / fixtures / smoke tests.
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
- create a migration file.
- write formal table / column / index / enum / foreign key schema.
- turn the Task512 conclusion into migration approval.

## Verification Boundary

Task512 static verification should confirm:

- `git diff --check docs/task-512-engineer-mobile-workbench-completion-submission-source-data-migration-decision-packet-no-apply.md` passes.
- Task512 only adds or modifies the allowed markdown file.
- no `src/`, `admin/src/`, tests, fixtures, migrations, package, smoke, or runtime files are changed by Task512.
- this document explicitly states no migration file, no apply, no dry-run, no DB command, no runtime, no repository implementation, no provider, and no AI runtime.
- this document conclusion includes `NO APPLY` / no apply wording.

No test, lint, smoke, browser, API, database, migration, provider, or AI command is required for Task512.

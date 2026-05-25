# Task 517 - Engineer Mobile Workbench File-Only Schema Inspection Report

## Branch Status

Task517 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is a file-only schema inspection report.

There is no DB command, no SQL command, no DDL command, no migration, no migration dry-run, no migration apply, no runtime, no repository implementation, no service implementation, no test file creation, no fixture file creation, no test execution, no provider sending, and no AI/RAG/vector database.

Task517 is not a schema approval.

Task517 is not a migration approval.

Task517 is not a runtime approval.

Task517 does not approve DB command.

Task517 does not approve migration.

Task517 does not approve runtime.

Task517 does not approve repository implementation.

## Inspection Method

File-only inspection was performed with read-only shell commands.

Inspected files / directories:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-516-engineer-mobile-workbench-schema-inspection-planning-no-db-command.md`
- `docs/task-510-engineer-mobile-workbench-completion-submission-data-model-decision-packet-no-migration.md`
- `docs/task-512-engineer-mobile-workbench-completion-submission-source-data-migration-decision-packet-no-apply.md`
- `docs/task-515-engineer-mobile-workbench-completion-submission-repository-contract-proposal-no-runtime.md`
- `migrations/`
- `src/repositories/`
- `src/db/`

Additional path checks:

- `src/models/`: path not found / not inspected.
- `db/`: path not found / not inspected.

Commands used:

- `rg` over allowed directories.
- `sed` on selected migration and repository files.
- `find` / `ls` for path presence checks.
- `git diff --check` for Task517 doc verification.
- `git status --short` for allowed-file status check.

No DB command was used.

No SQL / DDL / migration command was run.

No package script, test, lint, smoke, browser, API, provider, or AI command was run.

No secret / `DATABASE_URL` / token value was printed into this report.

No real customer / engineer / LINE data was copied into this report.

This report only uses file paths, symbol names, table/concept names, and non-sensitive summaries.

## Schema Facts Found

| Inspection item | Status | Evidence file path | Short summary | Impact on Engineer Mobile Workbench repository design | Future DB inspection still needed? |
| --- | --- | --- | --- | --- | --- |
| existing case table / repository naming | found | `migrations/002_create_cases.sql`, `src/repositories/CaseRepository.js` | `cases` table and `CaseRepository` exist; cases include lifecycle/status fields and `organization_id` is added later by migration 013 | Engineer workbench should link through verified Case context and preserve Case-level invariants | yes, to verify applied DB state |
| existing appointment table / repository naming | found | `migrations/006_create_dispatch_appointment_tables.sql`, `migrations/018_add_visit_result_fields_to_appointments.sql`, `src/repositories/AppointmentRepository.js` | `appointments` table exists; later migration adds visit result, visit sequence, actual arrival/finished timestamps | Appointment repository can likely be the visit/task source, but operation state semantics need runtime mapping | yes |
| existing dispatch visit concept | unclear | `migrations/006_create_dispatch_appointment_tables.sql`, `src/repositories/DispatchRepository.js` | `dispatch_assignments` exists; no separate `dispatch_visits` table found in file-only inspection | Task design should keep `dispatchVisitId` optional / schema-dependent | yes |
| field service report table / repository references | found | `migrations/008_create_field_service_tables.sql`, `migrations/019_add_final_appointment_id_to_field_service_reports.sql`, `src/repositories/FieldServiceReportRepository.js` | `field_service_reports` table and repository exist; final appointment linkage added in migration 019 | Completion submissions must stay separate from formal Field Service Report workflow | yes |
| `field_service_reports.case_id` uniqueness | found | `migrations/008_create_field_service_tables.sql` | active unique index exists on `field_service_reports(case_id)` where not deleted | confirms one Case / one formal FSR invariant at file level | yes, to verify applied DB state |
| existing user / platform user table references | found | `migrations/001_create_base_tables.sql`, `src/repositories/UserRepository.js` | `users` table has `user_type`, status, auth provider fields; `engineer` appears as a user type | future engineer identity may initially map to `users`, but no separate engineer profile was found | yes |
| existing organization table references | found | `migrations/012_create_line_integration_tables.sql`, `migrations/013_add_organization_scope.sql`, `src/repositories/OrganizationRepository.js`, `src/repositories/UserOrganizationRepository.js` | `organizations` and `user_organizations` exist; organization scope is added to customers/cases/dispatch units | workbench repositories must derive server-side organization scope through membership / case linkage | yes |
| existing engineer / technician profile references | unclear / not found as separate table | `migrations/001_create_base_tables.sql`, `migrations/006_create_dispatch_appointment_tables.sql` | `users.user_type` includes engineer and `dispatch_assignments.assigned_engineer_id` references users; no `engineer_profiles` table found | `EngineerProfileRepository` contract needs refinement or future migration if separate profiles are required | yes |
| existing assignment references | found | `migrations/006_create_dispatch_appointment_tables.sql`, `migrations/007_dispatch_assignment_auditability.sql`, `src/repositories/DispatchRepository.js` | `dispatch_assignments` links Case, dispatch unit, and assigned engineer user; auditability columns were later added | assignment verification can likely start from dispatch assignments, but org scope is indirect via Case/dispatch unit | yes |
| soft delete convention | found | many migrations and repositories | many tables include `deleted_at` and repository filters use `deleted_at IS NULL` | all future workbench queries must include active/not-deleted filters | yes |
| timestamp convention | found | many migrations | `created_at`, `updated_at`, and triggers are common | future source-data table should align with project timestamp convention | yes |
| `created_by` / `updated_by` convention | found | `migrations/002_create_cases.sql`, `006`, `008`, `010`, repositories | major business tables often reference users for actor metadata | future source-data rows likely need actor fields, but exact convention needs schema decision | yes |
| JSON / structured payload storage convention | found | `migrations/002_create_cases.sql`, `003`, `011`, `012` | `jsonb` is used for metadata, AI classification, raw payload, and checklist-like structures | source-data snapshots can follow jsonb conventions, but sensitive payload boundaries must be strict | yes |
| object/file reference convention | found | `migrations/003_create_case_activity_tables.sql`, `004_update_attachment_foundation.sql`, `src/repositories/AttachmentRepository.js` | `case_attachments` stores object metadata such as provider/bucket/object key/checksum; no raw binary columns observed | future completion evidence should reference attachment/object metadata, not binary payloads | yes |
| idempotency key convention | found only for survey/outbox migration artifact | `migrations/020_create_survey_intents_and_event_outbox.sql` | event outbox has an idempotency key pattern; Task517 does not treat migration 020 as applied | completion submission idempotency still needs its own decision | yes |
| audit log convention | found | `migrations/003_create_case_activity_tables.sql`, `015`, `017`, `src/repositories/AuditLogRepository.js` | `audit_logs` table exists with action/entity/actor metadata and JSON before/after data | future workbench state/source-data changes should plan audit events without exposing audit logs to clients | yes |
| transaction / repository convention | found | `src/db/transaction.js`, `src/repositories/BaseRepository.js`, `src/db/migrate.js` | `withTransaction` and BaseRepository query helpers exist | future runtime should reuse existing repository/transaction style if approved | yes |

## Completion Submission Source-Data Implications

| Question | File-only result | Impact |
| --- | --- | --- |
| reusable completion submission / visit outcome / evidence table exists? | not found in file-only inspection | dedicated completion source-data table still appears necessary if persistence is approved |
| appointment outcome structure exists? | partial | appointments have `appointment_status` and Task018 visit result fields, but no separate source-data lifecycle table found |
| dispatch visit outcome structure exists? | unclear / not found as separate table | keep dispatch visit linkage optional until schema is formally confirmed |
| object ref pattern exists? | found | `case_attachments` supports metadata/object references; future evidence should reuse or align with this pattern |
| idempotency pattern exists? | partial | event outbox idempotency exists in migration 020 file, but completion source-data idempotency is not found |
| JSON snapshot convention exists? | found | jsonb is used in multiple tables; future snapshots need strict redaction and allow-listing |
| status enum / lookup convention exists? | found as text check constraints | migrations frequently use text columns with check constraints rather than separate lookup tables |
| dedicated completion source-data table still appears necessary? | yes, based on file-only inspection | no existing table clearly satisfies Task510/512/515 source-data lifecycle and idempotency needs |
| migration blockers still remaining? | yes | table name, columns, indexes, FK strategy, lifecycle statuses, retention, idempotency, audit linkage, object ref linkage |

Important limits:

- no table is approved.
- no column is approved.
- no index is approved.
- no foreign key is approved.
- no enum is approved.
- no migration is approved.

## Repository Readiness Implications

| Repository | File-only schema evidence found | Schema gaps | Runtime blockers | Migration blockers | Fixture/test blockers | Audit blockers | Readiness recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `EngineerProfileRepository` | `users.user_type` includes engineer; assignments reference `users` | no separate engineer profile table found; profile concept may need mapping to users | auth/session and profile resolution runtime not approved | possible future profile table if user-type mapping is insufficient | engineer/user/org synthetic fixtures not implemented | suspicious profile lookup audit not finalized | READY FOR CONTRACT REFINEMENT ONLY |
| `EngineerWorkbenchOrganizationScopeRepository` | `organizations` and `user_organizations` exist; cases/customers/dispatch units get organization scope | appointment and dispatch assignment org scope is indirect | runtime not approved | likely no new table, but exact constraints unknown | active/inactive org fixtures not implemented | cross-scope denial audit not finalized | READY FOR CONTRACT REFINEMENT ONLY |
| `EngineerAssignmentRepository` | `dispatch_assignments` includes assigned engineer user and case linkage | no direct `organization_id` on dispatch assignments found; org must be derived via case/dispatch unit | runtime not approved | unclear if indexes are enough for workbench queries | own/other engineer fixtures not implemented | denied assignment audit not finalized | READY FOR CONTRACT REFINEMENT ONLY |
| `EngineerWorkbenchAppointmentRepository` | `appointments` table exists with dispatch assignment linkage and visit result fields | no direct `organization_id` on appointments found; no separate dispatch visit table found | runtime not approved | state mapping for arrived/started may need schema or convention changes | appointment state fixtures not implemented | operation-denied audit not finalized | READY FOR CONTRACT REFINEMENT ONLY |
| `EngineerWorkbenchCompletionSubmissionRepository` | no reusable completion source-data table found | dedicated source-data table likely required | runtime not approved | NEEDS MIGRATION DECISION FIRST | source-data/idempotency fixtures not implemented | create/status/idempotency audit not finalized | NEEDS MIGRATION DECISION FIRST |

## Guardrail Invariant Check

| Invariant question | File-only result | Evidence / note |
| --- | --- | --- |
| any evidence that breaks one Case / one formal FSR? | not found in file-only inspection | no conflicting schema found in inspected files |
| `field_service_reports.case_id` uniqueness evidence? | found | `migrations/008_create_field_service_tables.sql` defines active unique index on case id |
| appointment / dispatch visit multi-visit layer evidence? | found / partial | appointments table exists and Task018 adds visit sequence/result fields; no separate dispatch visits table found |
| finalAppointmentId / final appointment inference evidence? | found | migration 019 adds `final_appointment_id`; AppointmentRepository has eligible-final-appointment query |
| completion submission triggers survey / provider / billing / AI existing path? | not found in file-only inspection | no completion submission runtime table/path exists in inspected files |

## Sensitive Data And Security Check

No actual secret / token / `DATABASE_URL` values were copied into this report.

File-only inspection encountered schema field names related to secrets/tokens in migration files, but no actual values were copied.

No real phone, address, LINE id, customer personal data, provider payload, or AI raw payload was copied into this report.

This report intentionally uses only file paths, symbol names, table/concept names, and non-sensitive summaries.

## File-only Inspection Limitations

File-only inspection cannot prove actual DB schema.

File-only inspection cannot prove production/shared runtime state.

File-only inspection cannot replace a migration decision packet.

File-only inspection cannot authorize DB-backed repository runtime.

File-only inspection cannot authorize migration apply or migration dry-run.

Disposable local/test DB inspection, if needed, must be approved by a separate explicit task.

## Risk Register

| Risk | Impact | Evidence / unknown | Mitigation | Future action |
| --- | --- | --- | --- | --- |
| file-only evidence stale vs actual DB | migration/runtime decisions may target wrong schema | actual DB not inspected | do not approve runtime/apply from Task517 | disposable local/test DB inspection if needed |
| migration files incomplete | missing real schema facts | file-only only | treat conclusions as planning evidence | future schema inspection task |
| naming convention misleading | wrong repository/table mapping | repositories may use raw SQL names | verify before runtime | contract refinement |
| repository convention inconsistent | future repository may bypass patterns | BaseRepository convention found but not exhaustive | require runtime file touch plan | future runtime proposal |
| hidden schema dependency | implementation can fail later | services not exhaustively inspected | keep runtime blocked | future targeted inspection |
| missing organization_id on needed entity | cross-org leakage risk | appointments/dispatch assignments appear org-indirect | enforce org via Case/dispatch unit or migration | future design decision |
| missing assignment model | engineer cannot be verified safely | dispatch assignment exists, but engineer profile model unclear | keep assignment contract conservative | future contract refinement |
| missing dispatch visit model | dispatchVisitId may be impossible | no separate table found | keep optional | future schema decision |
| missing idempotency convention | duplicate submissions | only outbox pattern found | design source-data idempotency explicitly | migration decision |
| missing object ref convention | raw binary risk | attachment refs exist but source-data evidence linkage not designed | reuse metadata refs only | future evidence design |
| accidental secret copying | security incident | secret-like schema field names exist | never copy values; only cite field names | continue redaction discipline |
| accidental runtime implementation after inspection | scope expansion | no runtime approved | keep Task517 as report only | separate PM approval |

## Inspection Conclusion

PARTIAL — NEEDS DISPOSABLE DB SCHEMA INSPECTION APPROVAL.

Rationale:

- file-only evidence is enough to refine contracts and confirm likely gaps.
- file-only evidence suggests no existing dedicated completion submission source-data table.
- actual DB schema and applied migration state remain unverified.
- DB-backed repository runtime or migration drafting should not proceed from file-only evidence alone.

Task517 does not approve DB command.

Task517 does not approve migration.

Task517 does not approve runtime.

Task517 does not approve repository implementation.

Future task requires separate PM approval and exact allowed files.

## Future Sequencing

Future tasks, proposal only:

- Task518: Synthetic Repository Fixture File Touch Plan / No Runtime.
- Task519: Appointment State Transition Limited Runtime Scope Proposal / No Runtime.
- Task520: Completion Submission Repository Runtime Scope Proposal / No Runtime.
- Task521: Migration Draft Authorization Packet / No Apply.
- Task522: Disposable Local DB Schema Inspection Authorization / No Apply, only if needed.

Task517 does not execute these tasks.

## Non-goals

Task517 does not:

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
- execute package scripts.
- modify `package.json` or lock files.
- call LINE / SMS / Email / App providers.
- call AI / RAG / vector DB.
- copy real personal data, token, secret, or `DATABASE_URL` into docs.
- modify inventory docs.
- implement repository runtime.
- implement completion persistence runtime.
- implement appointment state transition runtime.
- implement formal Field Service Report creation.
- implement survey trigger / provider sending / billing / settlement / AI approval.
- turn this report into schema approval, migration approval, or runtime approval.

## Verification Boundary

Task517 static verification should confirm:

- `git diff --check docs/task-517-engineer-mobile-workbench-file-only-schema-inspection-report-no-db-command.md` passes.
- Task517 only adds or modifies the allowed markdown file.
- no `src/`, `admin/src/`, tests, fixtures, migrations, package, smoke, or runtime files are changed by Task517.
- this document explicitly states no DB command, no SQL, no DDL, no migration, no runtime, no repository implementation, no test execution, no provider, and no AI runtime.
- this document explicitly states Task517 does not approve DB command / migration / runtime.

No test, lint, smoke, browser, API, database, migration, provider, or AI command is required for Task517.

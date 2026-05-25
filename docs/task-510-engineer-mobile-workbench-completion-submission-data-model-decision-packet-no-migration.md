# Task 510 - Engineer Mobile Workbench Completion Submission Data Model Decision Packet

## Branch Status

Task510 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only and data-model-decision-packet-only.

There is no runtime, no repository implementation, no service implementation, no SQL, no DB command, no database command, no DDL, no migration, no test execution, no provider sending, and no AI/RAG/vector database.

This document is not a migration approval.

This document is not schema finalization.

Current Engineer Mobile Workbench runtime remains skeleton-only and current endpoints still return `501 Not Implemented`.

## Reference Handling

Task510 may use prior Engineer Mobile Workbench design decisions as context, but it does not modify any reference file.

Relevant references inspected or confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-507-engineer-mobile-workbench-completion-submission-persistence-design-no-migration.md`
- `docs/task-508-engineer-mobile-workbench-repository-contract-integration-map-no-runtime.md`
- `docs/task-509-engineer-mobile-workbench-assignment-appointment-state-readiness-review-no-runtime.md`
- `docs/task-498-engineer-mobile-workbench-completion-submission-payload-validation-rule-design-no-runtime-change.md`
- `docs/task-506-engineer-mobile-workbench-appointment-repository-contract-proposal-no-runtime.md`
- `src/boundaries/EngineerMobileWorkbenchCompletionSubmissionBoundary.js`
- `src/validators/EngineerMobileWorkbenchCompletionSubmissionValidator.js`
- `src/resolvers/EngineerMobileWorkbenchResolver.js`
- `src/guards/EngineerMobileWorkbenchPermissionGuard.js`

Task510 does not rename, create, patch, or normalize those references.

## Decision Packet Purpose

This document organizes future data model options for Engineer Mobile Workbench completion submission source-data.

Purpose:

- compare storage model options for completion submission source-data.
- identify source-data, metadata, evidence reference, validation snapshot, and future AI normalized draft groups.
- identify data that must not be stored.
- provide input for a future migration decision packet.
- keep source-data separate from formal Field Service Report.

This document does not authorize migration, runtime, repository implementation, or DB commands.

## Scope Definition

In scope:

- engineer completion submission source-data.
- appointment / dispatch visit linkage.
- Case linkage.
- engineer profile linkage.
- organization scope.
- validation snapshot.
- file / photo / signature metadata references.
- idempotency / duplicate detection proposal.
- review / supersede / rejected / needs-review lifecycle proposal.

Out of scope:

- formal Field Service Report schema.
- customer-facing service report schema.
- billing / settlement schema.
- survey schema.
- provider sending schema.
- AI/RAG/vector DB schema.
- object storage implementation.
- audit log implementation.
- appointment state transition runtime.
- formal Case completion workflow.

## Data Model Options

### Option A - Dedicated Completion Submissions Table

Concept name examples:

- `engineer_workbench_completion_submissions`
- `appointment_completion_submissions`
- `field_completion_source_submissions`

Description:

- Create a dedicated future source-data table for engineer mobile completion submissions.
- Link each submission to organization, Case, appointment / dispatch visit, engineer profile, and platform user.
- Store validation snapshots, metadata references, idempotency keys, and lifecycle status independently from formal Field Service Report.

Pros:

- cleanly separates source-data from formal Field Service Report.
- supports multiple submissions for one Case / appointment without creating multiple formal reports.
- supports idempotency and weak-network retry design.
- supports review, supersede, rejected, and needs-review lifecycle.
- supports exception evidence and admin/supervisor review.
- easier to permission-gate internal source-data separately from customer-facing report.

Cons:

- likely requires a future migration.
- requires repository and review workflow design.
- requires clear retention policy and sensitive data minimization.
- requires careful integration so it does not become a second formal report.

Migration needs later:

- likely yes, but not approved by Task510.

Organization isolation impact:

- strong, if every row is scoped by `organizationId` and linked entities are verified in the same organization.

One Case / one formal Field Service Report impact:

- low risk if explicitly source-data-only and never treated as formal Field Service Report.

Idempotency support:

- strong, if future schema includes client request id / server idempotency key strategy.

Audit / review support:

- strong, because source-data lifecycle can be reviewed without rewriting formal report state.

Recommendation status:

- recommended direction for future design, with no migration approved.

### Option B - Appointment Outcome Extension

Description:

- Store completion submission source-data as an extension of appointment / dispatch visit outcome data.

Pros:

- closer to visit-level outcome.
- may reduce number of future tables if existing appointment outcome model is extensible.
- intuitive for appointment-driven engineer mobile workflow.

Cons:

- risks mixing raw engineer source-data with official appointment outcome.
- may confuse visit outcome with formal Field Service Report source-data.
- harder to support repeated submissions, weak-network retries, rejected drafts, and superseded records cleanly.
- can make appointment table too broad if evidence snapshots and validation metadata grow.

Migration needs later:

- likely yes if existing appointment schema lacks source-data fields.

Multi-visit support:

- good at visit level, but must not create multiple formal Field Service Reports.

Risk of confusing visit outcome with formal FSR:

- medium to high unless boundaries are strict.

Idempotency support:

- weaker unless separate child records or unique keys are added.

Recommendation status:

- not recommended as primary direction for Phase 1 source-data persistence; may still be useful for official appointment outcome summaries later.

### Option C - Generic Service Event / Evidence Table

Description:

- Store engineer completion submission as generic service event / evidence records shared with other future workflows.

Pros:

- highly extensible for multiple workflow types.
- may support audit-like evidence patterns across onsite, depot, workshop, and future workflows.
- can support event sourcing or generic evidence collection.

Cons:

- higher complexity.
- data visibility and permission boundaries are more difficult.
- generic payloads can hide sensitive data and make validation weaker.
- harder to enforce completion-submission-specific idempotency and lifecycle.
- may blur source-data, audit event, and official business record concepts.

Migration needs later:

- likely yes and likely more complex.

Future extensibility:

- high, but with stronger governance requirements.

Data visibility risk:

- medium to high if payloads are too generic.

Recommendation status:

- not recommended for first implementation; can be revisited after core source-data model is stable.

## Recommended Direction

RECOMMEND DEDICATED SOURCE-DATA TABLE — NO MIGRATION APPROVED.

Reason:

- source-data stays separate from formal Field Service Report.
- one Case can have multiple appointment / dispatch visit submissions without multiple formal Field Service Reports.
- idempotency and weak-network retry are easier to model.
- review / supersede / rejected / needs-review lifecycle is clearer.
- organization scope can be first-class.
- sensitive data minimization can be enforced at a specific source-data boundary.
- file / photo / signature evidence can stay as object storage metadata references.

Important limits:

- recommendation is design-only.
- recommendation is not schema approval.
- recommendation is not migration approval.
- recommendation must be revalidated against actual DB schema later.
- final table / column / index / enum names require a future migration decision packet.

## Proposed Conceptual Fields

These are conceptual field groups, not formal columns.

### Identity / Scope Group

- `completionSubmissionId`
- `organizationId`
- `caseId`
- `appointmentId`
- `dispatchVisitId`, proposal only
- `engineerProfileId`
- `platformUserId`

### Lifecycle Group

- `submissionStatus`
- `draft` / `submitted` / `needsReview` / `rejected` / `superseded`, proposal only
- `submittedAt`
- `receivedAt`
- `reviewedAt`, proposal only
- `supersededBySubmissionId`, proposal only

### Engineer Input Group

- `workPerformedSummary`
- `faultCategory`
- `faultDescription`
- `resolutionSummary`
- `partsUsedSummary`
- `customerSignatureStatus`
- `signatureExceptionReason`

### Evidence Reference Group

- `photoEvidenceRefs`, metadata only
- `signatureEvidenceRef`, metadata only
- `attachmentRefs`, metadata only
- `objectStorageProviderRef`, proposal only
- no raw binary

### Validation / Normalization Group

- `validationResultSnapshot`
- `rejectedClientAuthorityFieldsSnapshot`
- `rawEngineerInputSnapshot`, minimized
- `normalizedDraftSnapshot`, proposal only
- `aiAssistedNormalizationFlag`, proposal only
- `humanConfirmedAt`, proposal only

### Idempotency Group

- `clientRequestId`, proposal
- `serverIdempotencyKey`, proposal
- `retryWindow`, proposal
- `duplicateOfSubmissionId`, proposal

### System Metadata Group

- `createdAt`
- `updatedAt`
- `deletedAt` / soft delete proposal
- `createdBy`
- `updatedBy`
- `sourceChannel = engineer_mobile_workbench`, proposal

## Forbidden Data

Future completion submission source-data must not store:

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

## Lifecycle / Status Proposal

Proposal-only statuses:

- `draft`
- `submitted`
- `needs_review`
- `rejected`
- `superseded`
- `accepted_as_source`
- `archived`

Important limits:

- status names are proposal-only.
- no enum is added.
- no DB field is added.
- no runtime transition is added.
- `accepted_as_source` does not mean formal Field Service Report approved.
- `submitted` does not mean Case completed.
- `rejected` does not mean appointment cancelled.
- `superseded` must not delete audit / evidence traceability.

## Relationship To Formal Field Service Report

Completion submission is source-data.

Field Service Report is the Case-level formal report.

Rules:

- one Case ultimately has only one formal Field Service Report.
- multiple completion submissions do not equal multiple formal Field Service Reports.
- multiple appointments / dispatch visits can have multiple visit-level submissions / outcomes.
- formal Field Service Report creation / approval / publishing is a future workflow.
- `field_service_reports.case_id` uniqueness must not be broken.
- `finalAppointmentId` remains system-owned.
- engineer cannot manually select `finalAppointmentId`.

## Relationship To Appointment State

Completion submission persistence should not directly mutate appointment state.

Rules:

- appointment state transition runtime requires a future explicit task.
- submitted source-data does not mean appointment completed.
- operation eligibility check must happen before submission persistence.
- appointment outcome may be recorded at appointment / dispatch visit layer in a future workflow.
- Case status mutation is not part of Task510.
- survey / provider / billing / settlement triggers are not part of Task510.

## Idempotency / Duplicate Handling Decision Points

Future decisions needed:

- should `clientRequestId` be required?
- how should `serverIdempotencyKey` be generated?
- how long is the retry window?
- how many submitted source-data records are allowed for the same appointment?
- should repeated tap return the existing submission result?
- can weak-network draft be resubmitted?
- should superseded submission remain in the evidence trail?
- does duplicate detection require a future unique index?

Task510 does not implement idempotency and does not approve indexes.

## Data Access / Visibility Policy

Future repository read/write must be organization-scoped.

Rules:

- engineer can only create submissions for appointments assigned to that engineer.
- admin / customer service future reads require explicit permission.
- customer-facing report can only use customer-visible filtered data.
- `rawEngineerInputSnapshot` must be minimized and masked if sensitive.
- `normalizedDraftSnapshot` must not be treated as official result.
- AI-assisted normalized content must be human-confirmed, auditable, permission-aware, tenant-isolated, and data-minimized.

## Migration Readiness Questions

| Question | Current status | Decision note |
| --- | --- | --- |
| suitable appointment / dispatch visit table exists? | unknown | must inspect DB schema later |
| engineer profile linkage exists? | unknown | must inspect DB schema later |
| organization_id exists on related entities? | unknown | must inspect DB schema later |
| object storage reference pattern exists? | unknown | requires design/schema inspection later |
| soft delete convention exists? | unknown | must inspect DB schema later |
| audit created_by / updated_by convention exists? | unknown | must inspect DB schema later |
| JSON / structured payload storage convention exists? | unknown | requires migration decision later |
| idempotency key convention exists? | unknown | requires migration decision later |
| new table needed? | likely, based on recommendation | requires migration decision later |
| indexes needed? | likely, but not approved | requires migration decision later |
| unique constraints needed? | likely for idempotency, but not approved | requires migration decision later |
| foreign keys needed? | likely, but not approved | requires migration decision later |
| enum / lookup table needed? | unknown | avoid deciding in Task510 |
| retention policy needed? | yes, policy/design later | requires future policy task |

## Risk Register

| Risk | Impact | Mitigation in proposed design | Remaining gap | Future action |
| --- | --- | --- | --- | --- |
| source-data is mistaken for formal FSR | breaks report invariant | dedicated source-data boundary | runtime not implemented | future repository contract and formal workflow guard |
| multiple submissions break one Case / one FSR | duplicate official reports | source-data separate from FSR | formal promotion workflow not designed | future FSR workflow decision |
| appointment state changes hidden in persistence | unexpected state mutation | persistence is read/write source-data only | state runtime not scoped | appointment state transition decision packet |
| idempotency insufficient | duplicate rows / poor UX | idempotency group proposed | no index/schema approved | migration decision packet |
| weak-network retry creates duplicates | duplicate source records | client/server idempotency proposed | runtime not implemented | repository test fixture planning |
| raw binary stored in DB | storage and privacy risk | object refs only | storage pattern unknown | object storage design alignment |
| customer PII over-stored | privacy risk | data minimization and forbidden data | projection/persistence runtime missing | masking policy and tests |
| AI normalized draft treated official | AI auto-decision risk | normalized draft is not formal result | AI workflow not implemented | AI governance and human-confirm review |
| signature exception treated as customer consent | dispute risk | exception is source evidence only | review workflow missing | supervisor/admin review policy |
| provider / survey / billing accidentally triggered | external side effects | no-trigger boundary | runtime integration missing | no-send tests before runtime |
| migration implemented without decision packet | unsafe schema drift | Task510 says no migration approved | migration packet pending | Task512 before schema changes |

## Decision Conclusion

RECOMMEND DEDICATED SOURCE-DATA TABLE — NO MIGRATION APPROVED.

This conclusion means:

- a dedicated source-data table is the preferred future design direction.
- the recommendation must be validated against actual DB schema later.
- future migration decision packet is required before any schema change.

This conclusion does not mean:

- migration approved.
- runtime approved.
- repository implementation approved.
- DB command approved.
- formal table name approved.
- columns, indexes, enum values, constraints, or foreign keys approved.

## Future Sequencing

Future tasks, proposal only:

- Task511: Repository Runtime Authorization Decision Packet / No Runtime.
- Task512: Migration Decision Packet / No Apply.
- Task513: Repository Test Fixture Planning / No Runtime.
- Task514: Appointment State Transition Runtime Decision Packet / No Runtime.
- Task515: Completion Submission Repository Contract Proposal / No Runtime.

Task510 does not execute these tasks.

## Non-goals

Task510 does not:

- modify `src/`.
- modify `admin/src/`.
- modify routes, controllers, resolvers, guards, projections, or validators.
- add repository classes.
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
- decide formal table names, fields, indexes, enums, or migration schema.
- turn this recommendation into migration approval.

## Verification Boundary

Task510 static verification should confirm:

- `git diff --check docs/task-510-engineer-mobile-workbench-completion-submission-data-model-decision-packet-no-migration.md` passes.
- Task510 only adds or modifies the allowed markdown file.
- no `src/`, `admin/src/`, tests, fixtures, migrations, package, smoke, or runtime files are changed by Task510.
- this document explicitly states no runtime, no repository implementation, no SQL, no DB, no database, no migration, no provider, and no AI runtime.
- this document conclusion explicitly includes `NO MIGRATION APPROVED`.

No test, lint, smoke, browser, API, database, migration, provider, or AI command is required for Task510.

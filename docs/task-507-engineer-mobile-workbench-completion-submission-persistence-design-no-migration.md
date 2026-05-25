# Task 507 - Engineer Mobile Workbench Completion Submission Persistence Design

## Branch Status

Task507 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only.

There is no runtime, no repository implementation, no service implementation, no SQL, no DB command, no database command, no DDL, no migration, no test execution, no provider sending, and no AI/RAG/vector database.

Current Engineer Mobile Workbench runtime remains skeleton-only and current endpoints still return `501 Not Implemented`.

## Reference Handling

Task507 may use prior Engineer Mobile Workbench design decisions as context, but it does not modify any reference file.

Relevant references inspected or confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-502-engineer-mobile-workbench-db-repository-design-branch-entry-no-migration.md`
- `docs/task-503-engineer-mobile-workbench-engineer-profile-repository-contract-proposal-no-runtime.md`
- `docs/task-504-engineer-mobile-workbench-organization-scope-repository-contract-proposal-no-runtime.md`
- `docs/task-505-engineer-mobile-workbench-assignment-lookup-repository-contract-proposal-no-runtime.md`
- `docs/task-506-engineer-mobile-workbench-appointment-repository-contract-proposal-no-runtime.md`
- `docs/task-497-engineer-mobile-workbench-appointment-state-operation-rule-design-no-runtime-change.md`
- `docs/task-498-engineer-mobile-workbench-completion-submission-payload-validation-rule-design-no-runtime-change.md`
- `src/boundaries/EngineerMobileWorkbenchCompletionSubmissionBoundary.js`
- `src/validators/EngineerMobileWorkbenchCompletionSubmissionValidator.js`

Task507 does not rename, create, patch, or normalize those references.

## Persistence Design Purpose

Future completion submission persistence should store field completion source-data submitted from Engineer Mobile Workbench.

Intended purpose:

- save concise on-site completion information submitted by the engineer.
- provide source-data for future Field Service Report draft assembly.
- support customer service / admin review, cleanup, and missing-data follow-up.
- support future audit / evidence traceability without implementing audit runtime in this task.
- preserve mobile weak-network retry and duplicate-submission design space.

Non-purpose:

- it is not a formal Field Service Report.
- it is not Case completion.
- it is not appointment final completion.
- it does not trigger survey.
- it does not trigger provider sending.
- it does not trigger billing / settlement.
- it does not trigger AI approval.
- it does not publish customer-facing report content.

## Proposed Persistence Entity Concept

Future persistence may use a neutral source-data entity name such as:

- `engineer_workbench_completion_submissions`
- `appointment_completion_submissions`
- `field_completion_source_submissions`

These names are proposal-only.

Task507 does not choose the final table name.

Task507 does not add a table.

Task507 does not modify schema.

Task507 does not create a migration.

Formal naming and schema must wait for a future data model / migration decision packet.

## Proposed Minimal Fields

Future persistence fields may include:

- `completionSubmissionId`
- `organizationId`
- `caseId`
- `appointmentId`
- `dispatchVisitId`, optional / proposal only
- `engineerProfileId`
- `platformUserId`
- `submissionStatus`
- `submittedAt`
- `receivedAt`
- `workPerformedSummary`
- `faultCategory`
- `faultDescription`
- `resolutionSummary`
- `partsUsedSummary`
- `customerSignatureStatus`
- `signatureExceptionReason`
- `photoEvidenceRefs`, metadata only / future object storage references
- `rawEngineerInputSnapshot`
- `normalizedDraftSnapshot`
- `validationResultSnapshot`
- `createdAt`
- `updatedAt`
- `deletedAt` or soft delete proposal

The field list is a proposal only and is not current runtime behavior.

Forbidden persistence data:

- raw file binary.
- raw photo binary.
- raw signature image binary.
- token / secret.
- full audit log.
- AI raw payload.
- billing / settlement internal data.
- provider raw payload.
- unnecessary full customer personal data.
- raw LINE user id.
- channel secret or access token values.

## Source-data vs Formal Report Boundary

Completion submission is source-data.

Field Service Report is the Case-level formal report.

Design constraints:

- one Case ultimately has only one formal Field Service Report.
- one Case can have multiple appointments / dispatch visits.
- multiple appointments / dispatch visits can produce multiple visit-level submission / outcome records.
- multiple submissions do not mean multiple formal Field Service Reports.
- `field_service_reports.case_id` uniqueness must not be broken.
- `finalAppointmentId` remains system-owned.
- engineer cannot manually select `finalAppointmentId`.
- future completion submission may reference the current appointment context internally, but it is not final appointment authority.
- formal Field Service Report creation, approval, completion, and publishing are future workflow decisions, not Task507.

Completion submission should be treated as field evidence and draft input until a future authorized workflow decides how it is reviewed and promoted.

## Relationship To Appointment State

Completion submission persistence must require prior layers:

1. authenticated engineer identity.
2. active organization scope.
3. assignment verification.
4. appointment / dispatch visit operation eligibility.
5. payload validation and forbidden-field rejection.

Persistence itself must not mutate appointment state unless a future task explicitly scopes that runtime behavior.

Design constraints:

- arrived / started / completed appointment transitions remain separate future runtime decisions.
- appointment outcome can be recorded at appointment / dispatch visit layer in a future authorized workflow.
- Case status mutation is not part of Task507.
- formal completion is not part of Task507.
- survey trigger, provider sending, billing / settlement, and AI approval are not part of Task507.

## Validation And Normalization Boundary

Future validation and persistence should remain layered.

Responsibilities:

- `EngineerMobileWorkbenchCompletionSubmissionValidator` validates payload shape, required fields, conditional fields, and forbidden client-owned authority fields.
- `EngineerMobileWorkbenchCompletionSubmissionBoundary` rejects client authority fields and keeps mobile submission separate from formal completion.
- future persistence layer saves only already-validated source-data proposal.
- future review / normalization may produce a draft summary for Field Service Report workflows.

AI boundary:

- AI may later help produce `normalizedDraftSnapshot`.
- AI output must remain a suggestion / draft.
- AI must not automatically approve completion, Field Service Report content, billing, settlement, survey, provider sending, or customer-facing report publication.
- If AI is used later, it must be permission-aware, auditable, human-confirmed, tenant-isolated, and aligned with PROJECT_GUARDRAILS.
- Task507 does not implement AI.

## File / Photo / Signature Boundary

Photos, signatures, and attachments should use future object / file storage.

Design constraints:

- persistence table should save metadata / object reference proposals only.
- persistence table should not save raw binary.
- raw photo / signature data must not be written to audit log.
- raw photo / signature data must not be sent to AI by default.
- signature is important evidence but not an absolute completion requirement.
- signature exception must store structured reason / evidence metadata proposal.
- refused signature, unavailable signature, representative signature, remote completion, and similar exceptions are source evidence only.
- signature exception does not automatically mean formal customer consent.
- customer-facing report must not directly expose internal evidence, raw notes, internal review, or unapproved drafts.

## Failure / Duplicate / Idempotency Design

Future persistence runtime should consider these design needs, but Task507 does not implement them:

- duplicate submission detection.
- repeated tap / weak network retry idempotency.
- client request id proposal.
- server-generated idempotency key proposal.
- draft vs submitted status.
- rejected / needs review / superseded status.
- concurrent submission handling.
- supervisor / admin review requirement for exception cases.
- bounded retry behavior that avoids duplicate source-data rows.

Possible future status concepts:

- `draft`
- `submitted`
- `needs_review`
- `rejected`
- `superseded`
- `accepted_for_report_draft`

These statuses are proposal-only and do not create schema or runtime behavior.

## Sensitive Data And Visibility Boundary

Engineer submission persistence must follow data minimization.

Rules:

- do not save unnecessary full customer personal data.
- do not save internal note full text unless explicitly scoped in a future task.
- do not save full audit log content.
- do not save AI raw payload.
- do not save billing / settlement internal data.
- do not save provider raw payload.
- do not write across organization boundaries.
- do not expose source submissions directly as customer-facing report content.
- customer-facing service report can only use customer-visible filtered data.
- internal review data must remain permission-gated.

Future reads and writes must remain organization-scoped and must not use client-provided organization or engineer authority.

## Future Repository Candidate

Future runtime may introduce a repository such as:

- `EngineerWorkbenchCompletionSubmissionRepository`

Task507 does not:

- create the repository.
- define a JavaScript class.
- write SQL.
- implement persistence.
- create a migration.
- change routes, controllers, guards, resolvers, validators, projections, or boundaries.

The repository candidate must remain downstream of identity, organization scope, assignment verification, appointment eligibility, and payload validation.

## Future Sequencing

Future tasks, proposal only:

- Task508: Repository Contract Integration Map / No Runtime.
- Task509: Assignment and Appointment State Readiness Review / No Runtime.
- Task510: Completion Submission Data Model Decision Packet / No Migration.
- Task511: Migration Decision Packet / No Apply.
- Task512: Repository Runtime Authorization Decision Packet / No Runtime.

Task507 does not execute these tasks.

## Non-goals

Task507 does not:

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
- implement completion persistence runtime.
- implement appointment state transition runtime.
- implement formal Field Service Report creation.
- implement survey trigger / provider sending / billing / settlement / AI approval.
- design completion submission as the formal Field Service Report itself.

## Verification Boundary

Task507 static verification should confirm:

- `git diff --check docs/task-507-engineer-mobile-workbench-completion-submission-persistence-design-no-migration.md` passes.
- Task507 only adds or modifies the allowed markdown file.
- no `src/`, `admin/src/`, tests, fixtures, migrations, package, smoke, or runtime files are changed by Task507.
- this document explicitly states no runtime, no repository implementation, no SQL, no DB, no database, no migration, no provider, and no AI runtime.

No test, lint, smoke, browser, API, database, migration, provider, or AI command is required for Task507.

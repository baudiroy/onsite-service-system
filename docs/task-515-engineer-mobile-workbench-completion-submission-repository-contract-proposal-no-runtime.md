# Task 515 - Engineer Mobile Workbench Completion Submission Repository Contract Proposal

## Branch Status

Task515 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only and repository-contract-proposal-only.

There is no runtime, no repository implementation, no repository interface implementation, no service implementation, no SQL, no DB command, no DDL, no migration, no migration dry-run, no migration apply, no test file creation, no fixture file creation, no test execution, no provider sending, and no AI/RAG/vector database.

Task515 is not a runtime approval.

Task515 is not a migration approval.

Task515 is not a schema approval.

Current Engineer Mobile Workbench runtime remains skeleton-only and current endpoints still return `501 Not Implemented`.

## Reference Handling

Task515 may use prior Engineer Mobile Workbench design decisions as context, but it does not modify any reference file.

Relevant references inspected or confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-507-engineer-mobile-workbench-completion-submission-persistence-design-no-migration.md`
- `docs/task-508-engineer-mobile-workbench-repository-contract-integration-map-no-runtime.md`
- `docs/task-510-engineer-mobile-workbench-completion-submission-data-model-decision-packet-no-migration.md`
- `docs/task-512-engineer-mobile-workbench-completion-submission-source-data-migration-decision-packet-no-apply.md`
- `docs/task-513-engineer-mobile-workbench-repository-test-fixture-planning-no-runtime.md`
- `docs/task-514-engineer-mobile-workbench-appointment-state-transition-runtime-decision-packet-no-runtime.md`
- `docs/task-498-engineer-mobile-workbench-completion-submission-payload-validation-rule-design-no-runtime-change.md`
- `src/boundaries/EngineerMobileWorkbenchCompletionSubmissionBoundary.js`
- `src/validators/EngineerMobileWorkbenchCompletionSubmissionValidator.js`
- `src/resolvers/EngineerMobileWorkbenchResolver.js`
- `src/guards/EngineerMobileWorkbenchPermissionGuard.js`

Task515 does not create, rename, patch, normalize, or execute those references.

## Repository Purpose

Future `EngineerWorkbenchCompletionSubmissionRepository` responsibility proposal:

- save completion submission source-data.
- support idempotency / duplicate detection.
- support querying source-data for a verified appointment / dispatch visit.
- support providing source-data to future admin / Field Service Report draft workflow.
- support source-data lifecycle markers such as needs-review, rejected, superseded, and accepted-as-source.

The repository is not responsible for:

- payload validation.
- rejecting client authority fields.
- appointment state transition.
- Case status mutation.
- formal Field Service Report creation, approval, or publishing.
- survey trigger / provider sending / billing / settlement / AI approval.

## Proposed Contract Methods

These methods are proposal-only. Task515 does not create JavaScript implementation or repository interface files.

### `createCompletionSubmissionSourceData(...)`

- Purpose: persist validated engineer completion source-data after all prior authorization and eligibility checks.
- Required input: trusted server-side organization, platform user, engineer profile, case, appointment, optional dispatch visit, validation result, metadata refs, lifecycle seed, idempotency context.
- Trusted input: server-resolved identity and resource context only.
- Untrusted input: raw request body, route `taskId` before verification, client authority fields.
- Dependency on prior checks: auth, engineer profile, organization scope, assignment, appointment visibility, operation eligibility, payload validation, forbidden-field rejection, metadata-only evidence handling.
- Organization scope requirement: required for every write and every uniqueness/dedupe decision.
- Idempotency behavior: should use organization-scoped and appointment-scoped idempotency policy in future runtime.
- Return shape proposal: safe submission DTO only.
- Null / not found behavior: not applicable for create; failure should be safe operation-denied or validation error.
- Forbidden behavior: no formal FSR creation, no Case completion, no appointment completed mutation, no provider/survey/billing/AI trigger.
- Future audit required: yes, create action and idempotency outcome.

### `findSubmissionByIdWithinOrganization(...)`

- Purpose: find one source-data submission only inside server-side organization scope.
- Required input: organization id and submission id from trusted context.
- Trusted input: server-side organization scope.
- Untrusted input: client-provided organization id or global submission id assumptions.
- Dependency on prior checks: caller must verify user permission and allowed scope.
- Organization scope requirement: mandatory.
- Idempotency behavior: none, read-only.
- Return shape proposal: safe DTO or internal source-data record for authorized workflow.
- Null / not found behavior: return null / safe not found without enumeration.
- Forbidden behavior: no cross-organization lookup, no customer phone/address lookup, no global lookup.
- Future audit required: maybe, depending on internal/admin read policy.

### `findSubmissionByIdempotencyKey(...)`

- Purpose: find prior submission for retry / duplicate handling.
- Required input: organization id, appointment id or equivalent verified scope, server idempotency key or accepted client request id.
- Trusted input: server-side idempotency scope.
- Untrusted input: client request id before validation and scope binding.
- Dependency on prior checks: organization, assignment, appointment context, payload validation policy.
- Organization scope requirement: mandatory.
- Idempotency behavior: repeated tap / weak-network retry should return the same safe result proposal when safe.
- Return shape proposal: idempotency result plus safe submission DTO.
- Null / not found behavior: return null if no scoped duplicate.
- Forbidden behavior: no cross-appointment or cross-organization dedupe.
- Future audit required: yes for retry/conflict.

### `listSubmissionsForAppointment(...)`

- Purpose: list source-data submissions for a verified appointment / dispatch visit.
- Required input: organization id, appointment id, optional dispatch visit id, caller permission context.
- Trusted input: verified appointment context.
- Untrusted input: client-selected appointment/org scope.
- Dependency on prior checks: assignment or admin permission, organization scope, appointment visibility.
- Organization scope requirement: mandatory.
- Idempotency behavior: none, read-only.
- Return shape proposal: minimal safe source-data summaries.
- Null / not found behavior: empty list / safe not found according to caller policy.
- Forbidden behavior: no internal note, audit log, raw evidence binary, full PII, provider/AI payload.
- Future audit required: maybe for admin reads; likely yes for sensitive internal reads.

### `markSubmissionSuperseded(...)`

- Purpose: preserve traceability when a newer submission supersedes a prior source-data record.
- Required input: organization id, submission id, superseding submission id, actor context, reason.
- Trusted input: server-side lifecycle decision.
- Untrusted input: client-provided supersede authority.
- Dependency on prior checks: admin/supervisor or future workflow authorization, same organization, same case/appointment compatibility.
- Organization scope requirement: mandatory.
- Idempotency behavior: repeated supersede should be stable and not delete evidence.
- Return shape proposal: safe lifecycle DTO.
- Null / not found behavior: safe not found / operation-denied.
- Forbidden behavior: no deletion of evidence traceability, no formal FSR mutation.
- Future audit required: yes.

### `markSubmissionNeedsReview(...)`

- Purpose: mark source-data as requiring human review for exception, missing evidence, signature exception, or policy concern.
- Required input: organization id, submission id, actor context, reason code, optional safe note.
- Trusted input: server-side workflow or authorized reviewer.
- Untrusted input: client-selected review state.
- Dependency on prior checks: permission and organization scope.
- Organization scope requirement: mandatory.
- Idempotency behavior: repeated mark should be stable.
- Return shape proposal: safe lifecycle DTO.
- Null / not found behavior: safe not found / operation-denied.
- Forbidden behavior: no customer-facing exposure of internal review reason unless explicitly filtered later.
- Future audit required: yes.

### `markSubmissionAcceptedAsSource(...)`

- Purpose: mark source-data as accepted for use by a future Field Service Report draft workflow.
- Required input: organization id, submission id, actor context, accepted timestamp, review context.
- Trusted input: authorized human/admin or future approved workflow.
- Untrusted input: client-submitted accepted flag.
- Dependency on prior checks: permission, organization scope, review policy, formal workflow boundary.
- Organization scope requirement: mandatory.
- Idempotency behavior: repeated accept should be stable or operation-denied according to future policy.
- Return shape proposal: safe lifecycle DTO with `acceptedAsSourceAt`.
- Null / not found behavior: safe not found / operation-denied.
- Forbidden behavior: accepted-as-source must not approve formal FSR, complete Case, select finalAppointmentId, or publish customer-facing report.
- Future audit required: yes.

## Required Prior Checks

Future repository write must occur only after:

- authenticated platform user context.
- active engineer profile resolved.
- valid organization scope resolved.
- assignment verified.
- appointment visible.
- appointment operation eligibility checked.
- completion payload validated.
- forbidden client authority fields rejected.
- file/photo/signature handled as metadata/object refs only.
- idempotency context resolved or generated.

The repository must not trust:

- client identity.
- client `organizationId`.
- client `engineerProfileId`.
- client `finalAppointmentId`.
- client Case completion flags.
- client formal Field Service Report flags.

## Input Contract Boundary

Trusted server-side inputs proposal:

- `platformUserId`
- `engineerProfileId`
- `organizationId`
- `caseId` from verified appointment context.
- `appointmentId` from verified assignment / appointment context.
- `dispatchVisitId` from verified appointment context, if applicable.
- `validationResult` from validator.
- rejected-client-authority-fields result from boundary.
- idempotency key generated / accepted server-side.
- object refs from future object storage flow.

Untrusted inputs proposal:

- request body.
- route `taskId` before assignment verification.
- client `organizationId`.
- client `engineerProfileId`.
- client `finalAppointmentId`.
- client Case completed flag.
- client formal Field Service Report fields.
- raw binary payloads.
- provider payloads.
- AI raw payloads.
- LINE identity as global key.

## Return Shape Proposal

Minimal safe DTO proposal:

- `completionSubmissionId`
- `organizationId`
- `caseId`
- `appointmentId`
- `dispatchVisitId` optional.
- `engineerProfileId`
- `submissionStatus`
- `submittedAt`
- `receivedAt`
- `idempotencyResult`
- `needsReview`
- `supersededBySubmissionId` optional.
- `acceptedAsSourceAt` optional.
- `safeSummary`

Forbidden response fields:

- raw engineer input snapshot if sensitive or unfiltered.
- internal notes.
- audit log.
- AI raw payload.
- provider raw payload.
- billing / settlement internal data.
- customer channel identity internals.
- raw photo / signature / file binary.
- full customer personal data.
- formal Field Service Report approval decision.
- customer-facing report published content.
- cross-organization data.

## Idempotency / Duplicate Handling Contract

Proposal:

- `clientRequestId` may be future input after validation and scope binding.
- `serverIdempotencyKey` should be generated or validated server-side.
- idempotency must be organization-scoped.
- duplicate handling should be appointment-scoped or otherwise bound to verified task context.
- repeated tap should return the same safe result proposal when safe.
- weak-network retry should not create duplicate source-data.
- `duplicateOfSubmissionId` may preserve duplicate traceability.
- superseded submission should preserve evidence traceability.
- idempotency does not imply formal Field Service Report creation.
- idempotency does not bypass validation, assignment verification, or organization scope.

## Lifecycle Contract

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
- no DB field is created.
- no runtime transition is created.
- status names are proposal-only.
- `accepted_as_source` is not formal Field Service Report approval.
- `submitted` is not Case completed.
- `rejected` is not appointment cancelled.
- `superseded` does not delete evidence traceability.
- `archived` does not remove audit requirements.

## Relationship To Formal Field Service Report Workflow

Required boundary:

- completion submission is source-data.
- formal Field Service Report is the Case-level final summary.
- one Case ultimately has only one formal Field Service Report.
- multiple completion submissions do not equal multiple formal Field Service Reports.
- repository must not create formal Field Service Report.
- repository must not update `field_service_reports`.
- repository must not break `field_service_reports.case_id` uniqueness.
- `finalAppointmentId` remains system-owned.
- engineer cannot manually select `finalAppointmentId`.
- future Field Service Report draft workflow must be independent and require human/admin review.

## Relationship To Appointment State

Required boundary:

- completion submission repository must not directly mutate appointment state.
- arrived / started / completed transitions are separate future explicit runtime.
- submitted source-data does not mean appointment completed.
- `accepted_as_source` does not mean appointment completed unless a future workflow explicitly decides.
- appointment outcome can be recorded at appointment / dispatch visit layer in future.
- Case status mutation is not part of this repository contract.

## Data Access / Visibility Boundary

Required boundary:

- every method must be organization-scoped.
- engineer can only create/read own assigned appointment submissions, if future read is allowed.
- admin / customer service read requires future permission.
- customer-facing service report can only use customer-visible filtered data.
- no cross-organization lookup.
- no global submission lookup.
- no lookup by customer phone/address.
- no LINE user id as global key.
- unauthorized reads must use generic safe-deny / non-enumeration behavior.

## Audit / Evidence Requirements

Future requirements, not implemented by Task515:

- create action audit.
- status change audit.
- idempotency retry audit.
- supersede audit.
- needs-review reason audit.
- signature exception evidence metadata.
- photo / object refs metadata.
- internal failure reason.
- retention policy.
- no audit log exposure to engineer/client.

## Schema / Migration Dependency

Repository cannot be implemented before schema inspection / migration decision.

Task512 conclusion was `PARTIAL — NEEDS SCHEMA INSPECTION BEFORE MIGRATION DESIGN — NO APPLY`.

Current boundary:

- no table approved.
- no columns approved.
- no index approved.
- no foreign key approved.
- no enum approved.
- no migration approved.
- future implementation requires a separate PM-approved task.

## Failure Behavior Proposal

| Failure scenario | Internal reason proposal | External response style | Deny type | What must not be leaked | Future audit need |
| --- | --- | --- | --- | --- | --- |
| no organization scope | missing server-side organization context | generic forbidden / unavailable | generic safe-deny | tenant existence or selection details | yes |
| no assignment | assignment verification failed | generic unavailable | generic safe-deny | assigned engineer identity | yes |
| appointment invisible | appointment hidden/unconfirmed/not visible | generic unavailable | operation-denied | hidden reason internals | maybe |
| appointment state ineligible | operation not allowed for current state | safe operation denied | operation-denied | internal state machine details | yes |
| invalid payload | validation failed | safe validation error keys | operation-denied | raw submitted sensitive values | maybe |
| forbidden client authority fields | client attempted server-owned authority | safe validation error keys | operation-denied | referenced resource existence | yes |
| duplicate `clientRequestId` | repeated request | same safe idempotent result or conflict style | operation-denied | prior payload content | yes |
| idempotency conflict | same key with incompatible payload/scope | generic conflict | operation-denied | existing submission details | yes |
| submission superseded | lifecycle blocks action | safe unavailable / superseded style | operation-denied | superseding payload internals | yes |
| submission not found | no scoped record | generic not found | generic safe-deny | whether id exists in another org | maybe |
| organization mismatch | scoped lookup mismatch | generic not found / forbidden | generic safe-deny | other org existence | yes |
| Case already has formal FSR | formal workflow already completed | safe unavailable | operation-denied | formal report internals | yes |

## Repository Contract Conclusion

REPOSITORY CONTRACT PROPOSAL READY — NO RUNTIME.

The future `EngineerWorkbenchCompletionSubmissionRepository` contract can be used as planning input, but implementation remains blocked by schema inspection, migration decision, exact allowed files, fixture/test implementation authorization, audit strategy, and runtime approval.

Task515 does not approve repository runtime.

Task515 does not approve repository interface implementation.

Task515 does not approve DB access.

Task515 does not approve migration.

## Future Sequencing

Future tasks, proposal only:

- Task516: Schema Inspection Planning / No DB Command.
- Task517: Migration Draft Authorization Packet / No Apply.
- Task518: Synthetic Repository Fixture File Touch Plan / No Runtime.
- Task519: Appointment State Transition Limited Runtime Scope Proposal / No Runtime.
- Task520: Completion Submission Repository Runtime Scope Proposal / No Runtime.

Task515 does not execute these tasks.

## Non-goals

Task515 does not:

- modify `src/`.
- modify `admin/src/`.
- add or modify `fixtures/`.
- add or modify `tests/`.
- modify routes, controllers, resolvers, guards, projections, or validators.
- add repository classes.
- add repository interfaces.
- add service classes.
- add models.
- add SQL.
- add migrations.
- modify Migration020.
- execute DB / DDL / psql / migration / dry-run / apply.
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
- write real or suspected-real customer data to docs.

## Verification Boundary

Task515 static verification should confirm:

- `git diff --check docs/task-515-engineer-mobile-workbench-completion-submission-repository-contract-proposal-no-runtime.md` passes.
- Task515 only adds or modifies the allowed markdown file.
- no `src/`, `admin/src/`, tests, fixtures, migrations, package, smoke, or runtime files are changed by Task515.
- this document explicitly states no runtime, no repository implementation, no SQL, no DB, no migration, no fixture file creation, no test file creation, no test execution, no provider, and no AI runtime.

No test, lint, smoke, browser, API, database, migration, provider, or AI command is required for Task515.

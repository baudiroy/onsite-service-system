# Task 506 - Engineer Mobile Workbench Appointment Repository Contract Proposal

## Branch Status

Task506 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only.

There is no runtime, no repository implementation, no service implementation, no SQL, no DB command, no database command, no DDL, no migration, no test execution, no provider sending, and no AI/RAG/vector database.

Current Engineer Mobile Workbench runtime remains skeleton-only and current endpoints still return `501 Not Implemented`.

## Reference Handling

Task506 may use prior Engineer Mobile Workbench design decisions as context, but it does not modify any reference file.

Relevant references inspected or confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-502-engineer-mobile-workbench-db-repository-design-branch-entry-no-migration.md`
- `docs/task-503-engineer-mobile-workbench-engineer-profile-repository-contract-proposal-no-runtime.md`
- `docs/task-504-engineer-mobile-workbench-organization-scope-repository-contract-proposal-no-runtime.md`
- `docs/task-505-engineer-mobile-workbench-assignment-lookup-repository-contract-proposal-no-runtime.md`
- `docs/task-497-engineer-mobile-workbench-appointment-state-operation-rule-design-no-runtime-change.md`
- `src/repositories/`
- `src/resolvers/EngineerMobileWorkbenchResolver.js`
- `src/guards/EngineerMobileWorkbenchPermissionGuard.js`
- `src/projections/EngineerMobileWorkbenchProjection.js`
- `src/boundaries/EngineerMobileWorkbenchCompletionSubmissionBoundary.js`
- `src/validators/EngineerMobileWorkbenchCompletionSubmissionValidator.js`

Reference not found under PM shorthand name:

- `docs/task-498-engineer-mobile-workbench-completion-payload-validation-rule-design-no-runtime-change.md`

Closest existing reference found and treated as the likely matching prior task:

- `docs/task-498-engineer-mobile-workbench-completion-submission-payload-validation-rule-design-no-runtime-change.md`

Task506 does not rename, create, patch, or normalize those references.

## Repository Purpose

Future `EngineerWorkbenchAppointmentRepository` should provide appointment / dispatch visit detail and operation eligibility lookup for Engineer Mobile Workbench after identity, organization scope, and assignment verification are already complete.

Responsibilities:

- query appointment / dispatch visit details after engineer profile, organization scope, and assignment relationship have been verified.
- provide the data source for today / recent task detail projection.
- provide state eligibility facts before future `arrive`, `start_work`, and `submit_completion` operations.
- provide minimal customer contact, address, product, and reported issue projection source for workbench use.
- enforce minimum necessary data boundaries for engineer mobile projection source data.
- avoid directly deciding HTTP status.

Non-responsibilities:

- it does not perform login.
- it does not validate sessions.
- it does not link platform users to engineer profiles.
- it does not resolve organization scope.
- it does not decide the engineer assignment relationship.
- it does not assemble final projection DTOs.
- it does not mutate appointment state.
- it does not persist completion submissions.
- it does not create a formal Field Service Report.
- it does not complete a Case.
- it does not trigger survey, provider sending, billing, settlement, or AI approval.

## Proposed Contract Methods

These are proposal-only method contracts. Task506 does not implement JavaScript code.

### `findWorkbenchAppointmentDetail(...)`

Purpose:

- Find one appointment / dispatch visit detail for the Engineer Mobile Workbench after assignment verification has passed.

Required input:

- validated engineer profile context.
- validated organization scope context.
- assignment verification result from future `EngineerAssignmentRepository` or guard.
- appointment id / task id candidate from request path.

Trusted input:

- `platformUserId` from authenticated server-side context.
- `engineerProfileId` from validated `EngineerProfileRepository` result.
- `organizationId` from validated `EngineerWorkbenchOrganizationScopeRepository` result.
- assignment verification result created server-side.

Untrusted input:

- appointment id / task id from route path.
- any client body field claiming appointment status.
- any client body field claiming assignment verification.

Dependency on `EngineerProfileRepository` output:

- requires validated engineer identity foundation before detail lookup.

Dependency on `EngineerWorkbenchOrganizationScopeRepository` output:

- requires active organization scope before detail lookup.

Dependency on `EngineerAssignmentRepository` verification result:

- requires verified engineer-to-appointment assignment before appointment detail is loaded.

Organization scope requirement:

- lookup must include the resolved `organizationId`.
- no cross-organization fallback.

Return shape proposal:

- minimal appointment detail source DTO, or `null` / typed not-visible result.

Null / not-found behavior:

- return no visible appointment when not assigned, not in organization, hidden, inactive, deleted, cancelled beyond visibility policy, or otherwise unavailable.

Forbidden behavior:

- must not load appointment detail by appointment id alone.
- must not reveal unassigned appointment existence.
- must not return internal note, audit log, AI raw payload, provider raw payload, or billing / settlement internal data.

Audit log required later:

- successful own-task detail reads may follow future data access policy.
- denied or suspicious detail access attempts may require audit policy.

### `getAppointmentOperationEligibility(...)`

Purpose:

- Read appointment / dispatch visit state facts needed to decide whether a future arrived / started / completion submission operation may be considered.

Required input:

- validated engineer profile context.
- validated organization scope context.
- assignment verification result.
- appointment id / dispatch visit id candidate.
- server-side operation hint.

Trusted input:

- server-side identity, organization scope, and assignment verification.
- operation route context selected by backend endpoint, not client body authority.

Untrusted input:

- appointment id from route.
- appointment status override from client.
- operation name from client body, if any.

Dependency on `EngineerProfileRepository` output:

- engineer profile must already be validated.

Dependency on `EngineerWorkbenchOrganizationScopeRepository` output:

- organization scope must already be validated.

Dependency on `EngineerAssignmentRepository` verification result:

- operation eligibility cannot be evaluated until assignment is verified.

Organization scope requirement:

- state lookup must be scoped to the resolved organization.

Return shape proposal:

- minimal operation eligibility summary, or `null` / typed not-visible / ineligible result proposal.

Null / not-found behavior:

- invisible or mismatched appointment must fail closed through resolver / guard / boundary.

Forbidden behavior:

- must not mutate appointment state.
- must not complete the Case.
- must not create or update Field Service Report.
- must not trigger survey, notification provider, billing, settlement, or AI approval.

Audit log required later:

- denied operation attempts and high-risk operation checks may require audit policy.

### `getAppointmentProjectionSource(...)`

Purpose:

- Provide minimal source data for future Engineer Mobile Workbench task detail projection after assignment verification.

Required input:

- validated engineer profile context.
- validated organization scope context.
- assignment verification result.
- appointment id / task id candidate.

Trusted input:

- server-side identity, organization scope, and assignment verification.

Untrusted input:

- client-selected projection fields.
- client-selected sensitive data expansion.

Dependency on `EngineerProfileRepository` output:

- requires validated engineer identity.

Dependency on `EngineerWorkbenchOrganizationScopeRepository` output:

- requires organization isolation context.

Dependency on `EngineerAssignmentRepository` verification result:

- projection source must only be loaded after verified assignment.

Organization scope requirement:

- projection source lookup must include organization scope.

Return shape proposal:

- minimal projection source DTO containing only workbench-needed fields.

Null / not-found behavior:

- no visible projection source when assignment or organization scope cannot be verified.

Forbidden behavior:

- must not return raw file / photo / signature binary.
- must not return full customer channel identity.
- must not return Field Service Report internal draft details.
- must not return customer-facing report content not yet approved.

Audit log required later:

- future policy may audit detail projection reads if sensitive fields are included.

### `findAppointmentCaseSummaryForWorkbench(...)`

Purpose:

- Provide a bounded Case summary for the appointment detail view without exposing full Case internals.

Required input:

- validated engineer profile context.
- validated organization scope context.
- assignment verification result.
- appointment id / case id linkage from verified appointment context.

Trusted input:

- case linkage from verified appointment context.
- server-side engineer and organization context.

Untrusted input:

- client-supplied case id.
- client-supplied customer phone / address / channel identity.

Dependency on `EngineerProfileRepository` output:

- requires engineer identity foundation.

Dependency on `EngineerWorkbenchOrganizationScopeRepository` output:

- requires active organization scope.

Dependency on `EngineerAssignmentRepository` verification result:

- bounded Case summary is allowed only because the appointment assignment was verified first.

Organization scope requirement:

- Case summary lookup must remain organization-scoped.

Return shape proposal:

- minimal Case summary source DTO.

Null / not-found behavior:

- return no visible summary when Case linkage is invalid or not in scope.

Forbidden behavior:

- must not turn appointment detail lookup into full Case export.
- must not return internal Case notes, audit log, billing / settlement internals, AI raw payload, or unrelated appointments.

Audit log required later:

- future policy may audit sensitive Case summary access.

## Input Contract Boundary

Input authority must remain server-side.

Rules:

- `platformUserId` must come from authenticated server-side context.
- `engineerProfileId` must come from a validated `EngineerProfileRepository` result.
- `organizationId` must come from a validated organization scope context.
- `appointmentId` / `taskId` from a request path is untrusted input.
- `assignmentVerificationResult` must first be created by future `EngineerAssignmentRepository` or guard and must not come from the client.
- client cannot submit appointment status override.
- client cannot submit Case completion, Field Service Report completion, or `finalAppointmentId`.
- client cannot select another `engineerProfileId`, `organizationId`, or `caseId` to inspect appointment detail.
- LINE identity cannot be used as appointment lookup key.

## Return Shape Proposal

Minimal DTO proposal:

```json
{
  "appointmentId": "internal-appointment-reference",
  "caseId": "internal-case-reference",
  "organizationId": "internal-organization-reference",
  "appointmentStatus": "scheduled",
  "dispatchVisitStatus": null,
  "scheduledStartAt": "timestamp-reference",
  "scheduledEndAt": "timestamp-reference",
  "serviceAddressMinimal": "masked or minimum necessary address reference",
  "onSiteContactMinimal": "masked or minimum necessary contact reference",
  "customerDisplayNameMinimal": "safe display label",
  "productSummary": "safe product summary",
  "reportedIssueSummary": "safe issue summary",
  "operationEligibilitySummary": {
    "canArrive": false,
    "canStartWork": false,
    "canSubmitCompletion": false
  },
  "resolvedAt": "timestamp-reference"
}
```

This is a design example only. It is not an API response and not current runtime behavior.

Forbidden return data:

- full customer personal data beyond workbench need.
- internal note.
- audit log.
- AI raw payload.
- provider raw payload.
- billing / settlement internal data.
- hidden appointment suggestions.
- unconfirmed AI dispatch suggestions.
- full customer channel identity records.
- unrelated appointments.
- cross-organization appointments.
- Field Service Report internal draft details.
- customer-facing report content not yet approved.
- raw file / photo / signature binary.

## Appointment Visibility And Operation Rules

Future appointment detail and eligibility lookup must follow these rules:

- appointment detail lookup must always require organization scope.
- appointment detail lookup must always require assignment verification first.
- no direct appointment detail lookup by appointment id alone.
- no cross-engineer fallback.
- no cross-organization fallback.
- no global appointment search.
- no lookup by customer phone or address as authority.
- arrived / started / completion submission eligibility must be based on appointment / dispatch visit state.
- operation eligibility lookup must not mutate state.
- operation eligibility lookup must not imply formal Case completion.
- if appointment is not assigned, not visible, or organization-mismatched, fail closed.

Operation eligibility is read-only. It is not state transition runtime.

## Appointment / Case / Field Service Report Invariant Boundary

Appointment / dispatch visit is the multi-visit layer.

Case is the case-level workflow container.

Field Service Report is the Case-level final summary.

Design constraints:

- one Case can have multiple appointments / dispatch visits.
- one Case ultimately has only one formal Field Service Report.
- appointment detail lookup must not create or update Field Service Report.
- appointment operation eligibility must not break `field_service_reports.case_id` uniqueness.
- `finalAppointmentId` remains system-owned.
- engineer cannot manually select `finalAppointmentId`.
- completion submission is future source-data only, not formal Field Service Report creation.
- completion submission does not mean Case completed.
- completion submission does not trigger survey.
- completion submission does not trigger provider sending.
- completion submission does not trigger billing / settlement approval.
- completion submission does not trigger AI approval.

## Failure Behavior Proposal

Repository layer behavior:

- return appointment detail / operation eligibility source DTO only after verified assignment and organization scope.
- return `null` / typed not-found / not-visible / ineligible state result proposal when access or operation is not allowed.
- do not directly decide HTTP status.
- do not craft final engineer-facing messages.

Resolver / guard / boundary behavior:

- convert sensitive not-found / not-visible / ineligible state cases to generic safe-deny or safe operation-denied response.
- keep external response equivalent where resource enumeration risk exists.
- keep internal reason masked and separate from engineer-facing response.

External response must not leak:

- appointment exists but is assigned to another engineer.
- appointment exists in another organization.
- appointment exists but hidden or unconfirmed.
- case exists but is not assigned.
- appointment was cancelled or reassigned historically.
- Case already has a formal Field Service Report.
- database error details.

Internal log / audit may record a masked reason later, but that reason must not be returned to the engineer mobile response.

## Relationship To Future Repositories

Future repository ordering should remain layered:

1. `EngineerProfileRepository`
   - establishes engineer identity from server-side authenticated platform user context.
2. `EngineerWorkbenchOrganizationScopeRepository`
   - confirms active tenant / organization scope.
3. `EngineerAssignmentRepository`
   - confirms engineer-to-appointment assignment relationship.
4. `EngineerWorkbenchAppointmentRepository`
   - reads appointment detail and operation eligibility after assignment verification.
5. `EngineerWorkbenchCompletionSubmissionRepository`
   - persists future completion source data after identity, organization, assignment, and state checks.

Task506 only defines the fourth boundary. It does not implement any repository and does not authorize completion persistence.

## Data Model Assumptions / Open Questions

Task506 does not decide schema and does not authorize migration.

Open questions:

- Are appointment and dispatch visit represented by the same table or separate tables?
- How are appointment status and dispatch visit status represented?
- How are arrived, started, completed, cancelled, no-show, waiting parts, quote-needed, and related field states layered?
- How should Case status relate to appointment / dispatch visit status?
- Which layer stores `finalAppointmentId`, and which future service derives it for formal completion?
- Should service address, on-site contact, and customer contact projection sources be separated?
- Does `organization_id` already exist on appointment, dispatch visit, and Case records?
- What is the soft delete / inactive field name, if any?
- Does future appointment detail lookup need a dedicated index?
- Is a future migration decision packet required before runtime implementation?
- Should raw file/photo/signature access be handled only by future file storage projection services?

These questions must be answered in a future schema / repository readiness task before implementation.

## Future Sequencing

Future tasks, proposal only:

- Task507: Completion Submission Persistence Design / No Migration.
- Task508: Repository Contract Integration Map / No Runtime.
- Task509: Assignment and Appointment State Readiness Review / No Runtime.
- Task510: Migration Decision Packet / No Apply.
- Task511: Repository Runtime Authorization Decision Packet / No Runtime.

Task506 does not execute these tasks.

## Non-goals

Task506 does not:

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
- implement appointment visibility runtime.
- implement appointment state transition runtime.
- implement completion persistence.
- implement formal Field Service Report creation.
- implement survey trigger / provider sending / billing / settlement / AI approval.
- let appointment repository mutate Case / Appointment / Field Service Report state.

## Verification Boundary

Task506 static verification should confirm:

- `git diff --check docs/task-506-engineer-mobile-workbench-appointment-repository-contract-proposal-no-runtime.md` passes.
- Task506 only adds or modifies the allowed markdown file.
- no `src/`, `admin/src/`, tests, fixtures, migrations, package, smoke, or runtime files are changed by Task506.
- this document explicitly states no runtime, no repository implementation, no SQL, no DB, no database, no migration, no provider, and no AI runtime.

No test, lint, smoke, browser, API, database, migration, provider, or AI command is required for Task506.

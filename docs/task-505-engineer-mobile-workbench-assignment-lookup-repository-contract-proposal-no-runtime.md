# Task 505 - Engineer Mobile Workbench Assignment Lookup Repository Contract Proposal

## Branch Status

Task505 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only.

There is no runtime, no repository implementation, no service implementation, no SQL, no DB command, no database command, no DDL, no migration, no test execution, no provider sending, and no AI/RAG/vector database.

Current Engineer Mobile Workbench runtime remains skeleton-only and current endpoints still return `501 Not Implemented`.

## Reference Handling

Task505 may use prior Engineer Mobile Workbench design decisions as context, but it does not modify any reference file.

Relevant references inspected or confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-502-engineer-mobile-workbench-db-repository-design-branch-entry-no-migration.md`
- `docs/task-503-engineer-mobile-workbench-engineer-profile-repository-contract-proposal-no-runtime.md`
- `docs/task-504-engineer-mobile-workbench-organization-scope-repository-contract-proposal-no-runtime.md`
- `docs/task-496-engineer-mobile-workbench-assignment-permission-rule-design-no-runtime-change.md`
- `docs/task-497-engineer-mobile-workbench-appointment-state-operation-rule-design-no-runtime-change.md`
- `src/repositories/`
- `src/resolvers/EngineerMobileWorkbenchResolver.js`
- `src/guards/EngineerMobileWorkbenchPermissionGuard.js`
- `src/projections/EngineerMobileWorkbenchProjection.js`

Task505 does not rename, create, patch, or normalize those references.

## Repository Purpose

Future `EngineerAssignmentRepository` should provide assignment lookup for Engineer Mobile Workbench requests.

Responsibilities:

- query appointments / dispatch visits assigned to a specific engineer profile within a resolved organization scope.
- support today / recent task list assignment lookup.
- support assignment verification before single appointment detail retrieval.
- support assignment existence checks before future arrived / started / completion submission operations.
- return minimal assignment facts needed by resolver / guard / appointment repository boundaries.
- avoid directly deciding HTTP status.

Non-responsibilities:

- it does not perform login.
- it does not validate sessions.
- it does not link platform users to engineer profiles.
- it does not resolve organization scope.
- it does not decide final operation eligibility by appointment state.
- it does not transition appointment state.
- it does not assemble final projection DTOs.
- it does not persist completion submissions.
- it does not create or update Case records.
- it does not create or update Appointment / Dispatch Visit records.
- it does not create, update, or complete Field Service Reports.
- it does not infer or override `finalAppointmentId`.

## Proposed Contract Methods

These are proposal-only method contracts. Task505 does not implement JavaScript code.

### `listAssignedAppointmentsForEngineer(...)`

Purpose:

- List current or upcoming appointments / dispatch visits assigned to the validated engineer profile inside the resolved organization scope.

Required input:

- validated engineer profile context from future `EngineerProfileRepository`.
- validated organization scope context from future `EngineerWorkbenchOrganizationScopeRepository`.
- server-side date window / list filter.
- optional server-side pagination / limit.

Trusted input:

- `platformUserId` from authenticated server-side context.
- `engineerProfileId` from validated engineer profile context.
- `organizationId` from resolved organization scope context.
- server-selected default date window.

Untrusted input:

- query/body filters supplied by the client.
- client-selected engineer id.
- client-selected organization id.
- client-selected assignment owner.

Dependency on `EngineerProfileRepository` output:

- requires a linked, active, organization-scoped engineer profile.

Dependency on `EngineerWorkbenchOrganizationScopeRepository` output:

- requires an active organization scope context before assignment lookup.

Organization scope requirement:

- every lookup must include the resolved `organizationId`.
- no cross-organization fallback.

Return shape proposal:

- list of minimal assignment DTOs, or an empty list.

Null / not-found behavior:

- empty list can mean no visible assigned tasks.
- it must not distinguish whether hidden tasks exist elsewhere.

Forbidden behavior:

- must not list another engineer's appointments.
- must not return cross-organization assignments.
- must not perform global appointment search.
- must not return full customer personal data.

Audit log required later:

- routine own-task list lookup may not require audit by default.
- suspicious cross-scope filters or repeated deny patterns may require future audit policy.

### `findAssignedAppointmentForEngineer(...)`

Purpose:

- Find one appointment / dispatch visit by route `appointmentId` or task id candidate, but only when it is assigned to the validated engineer profile within the resolved organization scope.

Required input:

- validated engineer profile context.
- validated organization scope context.
- appointment id / task id candidate from request path.

Trusted input:

- `engineerProfileId` from validated server-side engineer profile context.
- `organizationId` from validated server-side organization scope context.

Untrusted input:

- appointment id / task id from route path.
- any request body field claiming assignment ownership.

Dependency on `EngineerProfileRepository` output:

- requires validated engineer identity before lookup.

Dependency on `EngineerWorkbenchOrganizationScopeRepository` output:

- requires resolved tenant / organization boundary before lookup.

Organization scope requirement:

- lookup must include `organizationId` and `engineerProfileId` together.

Return shape proposal:

- minimal assignment DTO, or `null` / typed not-assigned result.

Null / not-found behavior:

- return no visible assignment when missing, assigned to another engineer, assigned to another organization, cancelled, reassigned, inactive, deleted, or otherwise not visible.

Forbidden behavior:

- must not reveal whether the appointment exists but belongs to another engineer.
- must not use "first matching appointment" lookup.
- must not perform customer phone or address lookup.
- must not return full appointment detail before assignment verification.

Audit log required later:

- denied or suspicious access attempts may require future audit policy.

### `verifyEngineerAssignmentForAppointment(...)`

Purpose:

- Provide a narrow yes/no-or-typed-result assignment verification boundary for future detail projection and state operation checks.

Required input:

- validated engineer profile context.
- validated organization scope context.
- appointment id / dispatch visit id candidate.
- operation hint, if future policy needs it.

Trusted input:

- server-side engineer profile and organization scope.
- server-side operation route context.

Untrusted input:

- appointment id / dispatch visit id supplied by client route.
- operation name supplied by client body, if any.

Dependency on `EngineerProfileRepository` output:

- requires engineer profile identity foundation.

Dependency on `EngineerWorkbenchOrganizationScopeRepository` output:

- requires active organization scope.

Organization scope requirement:

- assignment verification must always include organization scope.

Return shape proposal:

- verified minimal assignment context, or `null` / typed denied result.

Null / not-found behavior:

- no visible assignment should be treated as fail closed by resolver / guard.

Forbidden behavior:

- must not decide appointment state transition eligibility.
- must not mutate appointment / Case / Field Service Report.
- must not return field service report draft internals.

Audit log required later:

- operation-related deny events may require audit at guard / service boundary.

### `listRecentAssignmentsForEngineer(...)`

Purpose:

- List a bounded recent assignment history for mobile workbench context, if future UX needs it.

Required input:

- validated engineer profile context.
- validated organization scope context.
- server-side recent window and limit.

Trusted input:

- server-side engineer profile and organization scope.
- server-defined retention / list window.

Untrusted input:

- client-selected broad date ranges.
- client-selected other engineer filters.

Dependency on `EngineerProfileRepository` output:

- requires validated engineer identity.

Dependency on `EngineerWorkbenchOrganizationScopeRepository` output:

- requires validated organization scope.

Organization scope requirement:

- recent history must be scoped to the same organization and engineer profile.

Return shape proposal:

- bounded list of minimal recent assignment DTOs.

Null / not-found behavior:

- empty list without exposing whether other assignments exist.

Forbidden behavior:

- must not become a full dispatch history export.
- must not expose unrelated engineer assignments.
- must not expose internal billing / settlement / audit data.

Audit log required later:

- normal own-history reads may follow future data access audit policy.

## Input Contract Boundary

Input authority must remain server-side.

Rules:

- `platformUserId` must come from authenticated server-side context, not client body/query.
- `engineerProfileId` must come from a validated `EngineerProfileRepository` result.
- `organizationId` must come from a validated `EngineerWorkbenchOrganizationScopeRepository` result.
- `appointmentId` / `taskId` from a request path is untrusted input.
- route ids must be revalidated with `engineerProfileId` plus `organizationId`.
- client cannot pass or override assignment owner.
- client cannot specify another `engineerProfileId` to inspect tasks.
- client cannot switch organization scope for assignment lookup.
- LINE identity cannot be used as an assignment lookup key.
- If LINE is used later, it must first resolve through scoped binding into the server-side identity flow.

## Return Shape Proposal

Minimal DTO proposal:

```json
{
  "assignmentId": "internal-assignment-reference",
  "appointmentId": "internal-appointment-reference",
  "caseId": "internal-case-reference",
  "engineerProfileId": "internal-engineer-profile-reference",
  "organizationId": "internal-organization-reference",
  "assignmentStatus": "assigned",
  "appointmentStatus": "scheduled",
  "scheduledStartAt": "timestamp-reference",
  "scheduledEndAt": "timestamp-reference",
  "dispatchVisitId": null,
  "assignmentRole": null,
  "isPrimaryEngineer": null,
  "resolvedAt": "timestamp-reference"
}
```

This is a design example only. It is not an API response and not current runtime behavior.

Forbidden return data:

- full customer personal data.
- full customer phone / address / contact payload.
- internal note.
- audit log.
- AI raw payload.
- provider raw payload.
- billing / settlement internal data.
- unrelated engineer assignments.
- cross-organization assignments.
- hidden appointment suggestions.
- unconfirmed AI dispatch suggestions.
- customer-facing report content not yet approved.
- Field Service Report internal draft details.

## Assignment Visibility Rules

Future assignment lookup must follow these rules:

- assignment lookup must always include organization scope.
- engineer can only see appointments assigned to that engineer profile.
- no cross-engineer fallback.
- no cross-organization fallback.
- no "first matching appointment" lookup.
- no assignment lookup by customer phone or address.
- no global appointment search.
- appointment detail must require assignment verification before projection.
- arrived / started / completion submission must require assignment verification before operation eligibility check.
- if assignment cannot be verified, fail closed.

Assignment visibility is not the same as:

- organization membership.
- admin / dispatcher / supervisor permission.
- subscription entitlement.
- seat billing.
- usage billing.
- customer channel identity.
- raw LINE identity.

## Appointment / Case / Field Service Report Invariant Boundary

Assignment exists at appointment / dispatch visit layer.

Design constraints:

- assignment lookup must not imply Case completion.
- assignment lookup must not create Field Service Reports.
- assignment lookup must not modify Field Service Reports.
- assignment lookup must not update Case status.
- assignment lookup must not update Appointment status.
- one Case can have multiple appointments / dispatch visits.
- one Case ultimately has only one formal Field Service Report.
- assignment lookup must not break `field_service_reports.case_id` uniqueness.
- `finalAppointmentId` remains system-owned.
- engineer cannot manually select `finalAppointmentId`.
- completion submission is future source-data only, not formal Field Service Report creation.

Future completion persistence must remain a separate contract and must not be hidden inside assignment lookup.

## Failure Behavior Proposal

Repository layer behavior:

- return assignment DTO on verified assignment.
- return `null` / typed not-assigned result proposal when not visible.
- return typed inactive / unavailable result proposal only for internal guard handling if useful.
- do not directly decide HTTP status.
- do not craft customer-facing or engineer-facing response messages.

Resolver / guard behavior:

- convert not-found / not-assigned / inactive / invisible results to generic safe-deny.
- keep external response equivalent across sensitive failure cases.
- avoid resource enumeration.

External response must not leak:

- appointment exists but is assigned to another engineer.
- appointment exists in another organization.
- appointment exists but is not visible.
- case exists but is not assigned.
- assignment existed historically but is cancelled or reassigned.
- organization membership details.
- database error details.

Internal log / audit may record a masked reason later, but that reason must not be returned to the engineer mobile response.

## Relationship To Future Repositories

Future repository ordering should remain layered:

1. `EngineerProfileRepository`
   - establishes engineer identity from server-side authenticated platform user context.
2. `EngineerWorkbenchOrganizationScopeRepository`
   - confirms active tenant / organization scope.
3. `EngineerAssignmentRepository`
   - confirms the assignment relationship between the engineer profile and appointment / dispatch visit.
4. `EngineerWorkbenchAppointmentRepository`
   - loads appointment detail and appointment state eligibility after assignment verification.
5. `EngineerWorkbenchCompletionSubmissionRepository`
   - persists future completion source data after identity, organization, assignment, and state checks.

Task505 only defines the third boundary. It does not implement any repository and does not authorize completion persistence.

## Data Model Assumptions / Open Questions

Task505 does not decide schema and does not authorize migration.

Open questions:

- Is assignment represented by an independent assignment table, or by engineer fields on appointments?
- Are dispatch visits and appointments the same table, or separate tables?
- How is assignment status represented?
- How are reassignment, cancellation, historical assignment, and multi-engineer visits represented?
- Does the model need `primary engineer` and `assistant engineer` fields?
- Does `organization_id` already exist on assignment, appointment, and dispatch visit records?
- What is the soft delete / inactive field name, if any?
- Does future assignment lookup need a dedicated index?
- Does multi-organization contractor / vendor engineer access exist in Phase 1 or later?
- Should assignment lookup include both scheduled and recently completed appointments?
- Is a migration decision packet needed before runtime implementation?

These questions must be answered in a future schema / repository readiness task before implementation.

## Future Sequencing

Future tasks, proposal only:

- Task506: Engineer Workbench Appointment Repository Contract Proposal / No Runtime.
- Task507: Completion Submission Persistence Design / No Migration.
- Task508: Repository Contract Integration Map / No Runtime.
- Task509: Assignment and Appointment State Readiness Review / No Runtime.
- Task510: Migration Decision Packet / No Apply.

Task505 does not execute these tasks.

## Non-goals

Task505 does not:

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
- implement assignment permission runtime.
- implement appointment visibility runtime.
- implement appointment state transition runtime.
- implement completion persistence.
- let assignment lookup modify Case / Appointment / Field Service Report state.

## Verification Boundary

Task505 static verification should confirm:

- `git diff --check docs/task-505-engineer-mobile-workbench-assignment-lookup-repository-contract-proposal-no-runtime.md` passes.
- Task505 only adds or modifies the allowed markdown file.
- no `src/`, `admin/src/`, tests, fixtures, migrations, package, smoke, or runtime files are changed by Task505.
- this document explicitly states no runtime, no repository implementation, no SQL, no DB, no database, no migration, no provider, and no AI runtime.

No test, lint, smoke, browser, API, database, migration, provider, or AI command is required for Task505.

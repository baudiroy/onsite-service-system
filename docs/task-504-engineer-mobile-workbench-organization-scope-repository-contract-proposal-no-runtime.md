# Task 504 - Engineer Mobile Workbench Organization Scope Repository Contract Proposal

## Branch Status

Task504 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only.

There is no runtime, no repository implementation, no service implementation, no SQL, no database command, no DDL, no migration, no test execution, no provider sending, and no AI/RAG/vector database.

Current Engineer Mobile Workbench runtime remains skeleton-only and current endpoints still return `501 Not Implemented`.

## Reference Handling

Task504 may use prior Engineer Mobile Workbench design decisions as context, but it does not modify any reference file.

Relevant existing references include:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-502-engineer-mobile-workbench-db-repository-design-branch-entry-no-migration.md`
- `docs/task-503-engineer-mobile-workbench-engineer-profile-repository-contract-proposal-no-runtime.md`
- `docs/task-495-engineer-mobile-workbench-organization-scope-active-organization-policy-no-runtime-change.md`
- `docs/task-496-engineer-mobile-workbench-assignment-permission-rule-design-no-runtime-change.md`
- `src/auth/EngineerMobileWorkbenchAuthSessionBoundary.js`
- `src/resolvers/EngineerMobileWorkbenchResolver.js`
- `src/guards/EngineerMobileWorkbenchPermissionGuard.js`
- `src/repositories/`

PM shorthand reference names may differ from actual file names. Task504 does not rename, create, or patch those references.

## Repository Purpose

Future `EngineerWorkbenchOrganizationScopeRepository` should provide the organization scope foundation for Engineer Mobile Workbench requests.

Responsibilities:

- confirm the workbench request organization scope from server-side authenticated user and linked engineer profile context.
- confirm whether the organization is active, not deleted, and eligible for Engineer Mobile Workbench.
- provide minimal organization scope context for future assignment lookup, appointment visibility, and completion submission boundary.

Non-responsibilities:

- it does not perform login.
- it does not find or link engineer profiles.
- it does not decide assignment permission.
- it does not decide appointment visibility.
- it does not decide entitlement billing / usage billing.
- it does not decide subscription / plan access.
- it does not mutate Case / Appointment / Field Service Report state.

## Proposed Contract Methods

These are proposal-only method contracts. Task504 does not implement JavaScript code.

### `resolveWorkbenchOrganizationScopeForEngineerProfile(...)`

Purpose:

- Resolve the organization scope for an already validated engineer profile.

Required input:

- server-side platform user id.
- validated engineer profile id.
- organization id from linked engineer profile or server-side resolved context.

Trusted input:

- engineer profile context produced by future `EngineerProfileRepository`.
- organization candidate from server-side context.

Untrusted input:

- any client body/query/header organization value.
- any client-selected tenant or organization switch.

Dependency on `EngineerProfileRepository` output:

- requires a valid linked engineer profile context before resolving workbench organization scope.

Organization scope requirement:

- the resolved organization must match the engineer profile organization context.

Return shape proposal:

- minimal organization scope DTO, or `null` / typed not-found result.

Null / not-found / inactive behavior:

- return no scope if organization is missing, inactive, deleted, suspended, or mismatched.

Forbidden behavior:

- must not fall back to another organization.
- must not use first active organization.
- must not expose billing or plan internals.

Audit log required later:

- suspicious cross-scope attempts may require audit policy.

### `verifyOrganizationActiveForWorkbench(...)`

Purpose:

- Confirm the organization can be used for Engineer Mobile Workbench.

Required input:

- server-side organization id.
- validated engineer profile context.

Trusted input:

- server-side resolved organization scope.
- validated engineer profile context.

Untrusted input:

- organization id supplied by the client.

Dependency on `EngineerProfileRepository` output:

- profile must already be resolved and scoped.

Organization scope requirement:

- verify only the organization linked to the engineer profile context.

Return shape proposal:

- active / eligible organization scope context, or `null` / typed inactive result.

Null / not-found / inactive behavior:

- fail closed when inactive, deleted, suspended, missing, or not eligible.

Forbidden behavior:

- must not decide subscription entitlement.
- must not return plan or billing details.
- must not mutate organization settings.

Audit log required later:

- failed scope attempts and inactive/suspended access attempts may require audit policy.

### `getWorkbenchOrganizationScopeContext(...)`

Purpose:

- Build the minimal organization scope context required by future guards, assignment lookup, appointment projection, and completion boundary.

Required input:

- authenticated platform user context.
- validated engineer profile context.

Trusted input:

- server-side identity and engineer profile context.

Untrusted input:

- client-selected organization, provider channel, route parameter, body field, or header.

Dependency on `EngineerProfileRepository` output:

- cannot build scope without a validated engineer profile identity foundation.

Organization scope requirement:

- scope context must be resolved server-side and fail closed on ambiguity.

Return shape proposal:

- minimal workbench organization scope DTO, or `null` / typed failure result.

Null / not-found / inactive behavior:

- return no scope when organization cannot be safely resolved.

Forbidden behavior:

- must not include customer data.
- must not include raw entitlement rules.
- must not include organization-wide member lists.

Audit log required later:

- no default audit for safe successful scope assembly unless policy requires.
- suspicious failures can be audited by upper layer or security policy.

## Input Contract Boundary

Input authority must remain server-side.

Rules:

- `platformUserId` must come from authenticated server-side context.
- `engineerProfileId` must come from a validated `EngineerProfileRepository` result.
- `organizationId` must come from linked engineer profile / server-side resolved context.
- client body/query/header cannot specify or override organization scope.
- LINE identity cannot be an organization scope source.
- If LINE is used later, it must go through scoped binding to platform user / engineer profile first, then server-side organization resolution.

## Return Shape Proposal

Minimal DTO proposal:

```json
{
  "organizationId": "internal-organization-reference",
  "organizationStatus": "active",
  "workbenchEnabled": null,
  "organizationDisplayName": "safe display name",
  "scopeSource": "engineer-profile-linkage",
  "resolvedAt": "timestamp-reference",
  "engineerProfileId": "internal-engineer-profile-reference",
  "platformUserId": "internal-platform-user-reference"
}
```

This is a design example only. It is not an API response and not current runtime behavior.

Forbidden return data:

- cross-organization data.
- full organization billing settings.
- subscription internal data.
- usage billing details.
- entitlement raw rules.
- internal audit log.
- internal notes.
- provider payload.
- AI raw payload.
- customer personal data.
- token or secret.
- LINE channel secret values.
- unrelated organization member lists.

## Organization Isolation Rules

Future repository lookup must preserve tenant isolation.

Rules:

- every future lookup must be organization-scoped.
- no cross-organization fallback.
- no global organization search by engineer display name.
- no client-selected organization override.
- no "first active organization" lookup.
- no global raw LINE user id lookup.
- if organization cannot be resolved, fail closed.
- if organization is inactive / deleted / suspended, fail closed.
- if engineer profile organization mismatches resolved organization, fail closed.
- repository must not leak whether another organization exists.

## Entitlement / SaaS Boundary

Organization scope, permission, entitlement, seat billing, usage billing, AI Add-on, and Enterprise SSO are separate layers.

Task504 does not:

- implement entitlement checks.
- decide subscription / plan access.
- read or output billing / usage internal data.
- implement SaaS billing.
- implement usage billing.
- implement seat billing.
- implement Enterprise SSO.

Future entitlement gates may use organization scope context, but entitlement logic must not be mixed into this repository's basic scope resolution.

Fail-closed responses must not expose billing or plan reasons to the engineer client.

## Failure Behavior Proposal

Repository and upper layers should have distinct responsibilities.

Repository responsibilities:

- return minimal organization scope DTO on success.
- return `null` / typed not-found / typed inactive result on failure.
- avoid HTTP status decisions.
- avoid client response shaping.

Resolver / guard responsibilities:

- convert repository failure into generic safe-deny.
- avoid disclosing whether an organization exists but is inactive.
- avoid disclosing whether a user belongs to another organization.
- avoid disclosing whether an engineer profile exists but has organization mismatch.
- avoid disclosing whether workbench is disabled for a tenant.

Internal logging / audit:

- may record safe internal reason codes where policy allows.
- must not return those reason codes to the engineer client.
- must not store raw sensitive payload.

## Relationship To Future Repositories

Relationship boundaries:

- `EngineerProfileRepository` establishes engineer identity foundation first.
- `EngineerWorkbenchOrganizationScopeRepository` confirms only organization scope foundation.
- `EngineerAssignmentRepository` handles assignment permission.
- `EngineerWorkbenchAppointmentRepository` handles appointment visibility and projection.
- `EngineerWorkbenchCompletionSubmissionRepository` handles future completion source/draft persistence.

This repository must not collapse assignment, appointment, or completion persistence responsibilities into organization scope resolution.

## Data Model Assumptions / Open Questions

Open questions for future design:

- Is there already an organizations table sufficient for workbench scope?
- How are organization active / suspended / deleted statuses represented?
- Should `workbenchEnabled` be an independent organization setting or an entitlement gate?
- What is the canonical organization scope field name?
- Is there a soft delete field, and what is its canonical name?
- Does future workbench scope lookup need indexes?
- Is a future migration decision packet required?
- Will multi-tenant / contractor / vendor engineers involve multiple organizations?
- Should Phase 1 allow only a single linked organization for engineer workbench?
- Should organization display name be returned, or should projection layer add display text later?

Task504 does not answer these through schema or migration.

## Future Sequencing

Proposal-only future tasks:

- Task505: Engineer Assignment Lookup Repository Contract Proposal / No Runtime.
- Task506: Engineer Workbench Appointment Repository Contract Proposal / No Runtime.
- Task507: Completion Submission Persistence Design / No Migration.
- Task508: Repository Contract Integration Map / No Runtime.
- Task509: Migration Decision Packet / No Apply.

Task504 does not execute any of these tasks.

## Explicit Non-goals

Task504 does not:

- modify backend `src/`.
- modify `admin/src/`.
- modify routes, controllers, resolvers, guards, projections, or validators.
- add repository class.
- add service class.
- add model.
- add SQL.
- add migration.
- modify Migration020.
- execute database / DDL / psql / migration / dry-run / apply commands.
- add or modify tests / fixtures / smoke tests.
- execute test / lint / smoke / browser / API commands.
- modify package files.
- call LINE / SMS / Email / App providers.
- call AI, RAG, or vector database.
- use real personal data, token, secret, or database URL values.
- modify inventory docs.
- implement entitlement / billing / usage / subscription runtime.
- design organization scope repository as a writer for Case / Appointment / Field Service Report state.

## Verification Boundary

Task504 should be verified statically only:

- `git diff --check docs/task-504-engineer-mobile-workbench-organization-scope-repository-contract-proposal-no-runtime.md`.
- confirm Task504 only adds or modifies the allowed markdown file.
- confirm no `src/`, `admin/src/`, tests, fixtures, migrations, or package files are part of this task.
- confirm this document states no runtime, no repository implementation, no SQL, no database, no migration, no provider, and no AI runtime.

No test, lint, database, smoke, browser, API, provider, or AI command is required for Task504.

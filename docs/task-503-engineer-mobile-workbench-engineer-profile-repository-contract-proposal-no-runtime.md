# Task 503 - Engineer Mobile Workbench Engineer Profile Repository Contract Proposal

## Branch Status

Task503 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only.

There is no runtime, no repository implementation, no SQL, no database command, no DDL, no migration, no test execution, no provider sending, and no AI/RAG/vector database.

Current Engineer Mobile Workbench runtime remains skeleton-only and current endpoints still return `501 Not Implemented`.

## Reference Handling

Task503 may use prior Engineer Mobile Workbench design decisions as context, but it does not modify any reference file.

Relevant existing references include:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-502-engineer-mobile-workbench-db-repository-design-branch-entry-no-migration.md`
- `docs/task-494-engineer-mobile-workbench-engineer-identity-model-decision-packet-no-runtime-change.md`
- `docs/task-495-engineer-mobile-workbench-organization-scope-active-organization-policy-no-runtime-change.md`
- `docs/task-496-engineer-mobile-workbench-assignment-permission-rule-design-no-runtime-change.md`
- `src/repositories/`
- `src/services/AuthService.js`
- `src/auth/EngineerMobileWorkbenchAuthSessionBoundary.js`
- `src/resolvers/EngineerMobileWorkbenchResolver.js`
- `src/guards/EngineerMobileWorkbenchPermissionGuard.js`

PM shorthand reference names may differ from actual file names. Task503 does not rename, create, or patch those references.

## EngineerProfileRepository Purpose

Future `EngineerProfileRepository` should provide the engineer identity foundation for Engineer Mobile Workbench.

Responsibilities:

- find a linked engineer profile from an already authenticated platform user context.
- confirm whether the engineer profile is active, not deleted, and scoped to the resolved organization.
- provide minimal engineer identity context for future assignment repository, appointment repository, and permission guard use.

Non-responsibilities:

- it does not perform login.
- it does not validate sessions.
- it does not decide permissions.
- it does not decide assignment access.
- it does not change appointment state.
- it does not persist completion submissions.
- it does not create Field Service Reports.
- it does not mutate Case / Appointment / Field Service Report state.

## Proposed Contract Methods

These are proposal-only method contracts. Task503 does not implement JavaScript code.

### `findActiveEngineerProfileForUser(...)`

Purpose:

- Resolve the active engineer profile linked to the authenticated platform user within the current organization scope.

Required input:

- server-side platform user id.
- server-side organization scope id.

Trusted input:

- platform user id from authenticated server-side context.
- organization id from server-side resolved organization scope.

Untrusted input:

- any client body/query value claiming user, engineer, or organization authority.

Organization scope requirement:

- query must be scoped to the resolved organization.
- no cross-organization fallback.

Return shape proposal:

- minimal engineer profile DTO, or `null` / typed not-found result.

Null / not-found behavior:

- return no profile when missing, inactive, deleted, unlinked, or organization-mismatched.
- upper layers convert this to generic safe-deny.

Forbidden behavior:

- must not return user credential fields.
- must not return unrelated organization memberships.
- must not return full audit log or internal notes.
- must not decide HTTP status.

Audit log required later:

- simple successful lookup may not need audit by default.
- denied or suspicious cross-scope attempts may require future audit policy.

### `findEngineerProfileByIdWithinOrganization(...)`

Purpose:

- Resolve a profile by profile id only after the server has an authenticated user and organization scope.

Required input:

- engineer profile id candidate.
- server-side platform user id.
- server-side organization scope id.

Trusted input:

- platform user id and organization scope from server-side context.

Untrusted input:

- engineer profile id from path/body if any.

Organization scope requirement:

- the profile id must be re-checked against the server-side user and organization scope.
- client-selected profile id is not authority.

Return shape proposal:

- same minimal engineer profile DTO, or `null` / typed not-found result.

Null / not-found behavior:

- return no profile when profile id is missing, inactive, deleted, unlinked, or organization-mismatched.

Forbidden behavior:

- must not use "first matching engineer" lookup.
- must not let one engineer inspect another engineer profile.
- must not mutate profile status.

Audit log required later:

- denied cross-profile attempts may require audit policy.

### `getEngineerProfileIdentityContext(...)`

Purpose:

- Build the minimal identity context needed by future workbench guards and repositories.

Required input:

- authenticated platform user context.
- resolved organization scope.

Trusted input:

- authenticated server-side identity and server-side organization scope.

Untrusted input:

- client engineer id, organization id, channel id, or route parameters.

Organization scope requirement:

- identity context must be scoped to exactly one active organization for the current request.

Return shape proposal:

- minimal engineer identity context DTO, or `null` / typed not-found result.

Null / not-found behavior:

- return no context when identity or organization scope cannot be resolved safely.

Forbidden behavior:

- must not include credentials, raw provider identity, customer data, or broad user profile data.
- must not include assignment allow decisions.
- must not include appointment visibility data.

Audit log required later:

- no default audit for safe successful identity context assembly unless policy requires.
- suspicious failure can be audited by upper layer or security policy.

## Input Contract Boundary

Input authority must remain server-side.

Rules:

- `platformUserId` must come from authenticated server-side context, not client body/query.
- `organizationId` must come from server-side resolved organization scope, not engineer frontend input.
- `engineerProfileId`, if it appears in future path/body, must be revalidated through platform user plus organization scope.
- LINE identity must not be treated as global identity.
- If LINE is used later, it can only connect through scoped binding to platform user / engineer profile.
- Client-provided identity fields are hints at most and should not authorize access.

## Return Shape Proposal

Minimal DTO proposal:

```json
{
  "engineerProfileId": "internal-engineer-profile-reference",
  "platformUserId": "internal-platform-user-reference",
  "organizationId": "internal-organization-reference",
  "displayName": "safe display name",
  "status": "active",
  "roleType": "engineer",
  "engineerType": "field",
  "capabilityFlags": [],
  "linkedAt": "timestamp-reference"
}
```

This is a design example only. It is not an API response and not current runtime behavior.

Forbidden return data:

- password hash.
- token or secret.
- full audit log.
- internal note.
- raw provider payload.
- AI raw payload.
- billing / settlement internal data.
- full customer personal data.
- cross-organization data.
- unrelated LINE channel identity.
- assignment allow decision.
- appointment detail.

## Organization Isolation Rules

Future repository queries must always be organization-scoped.

Rules:

- no cross-organization fallback.
- no "first matching engineer" lookup.
- no global LINE identity lookup.
- no client-selected organization override.
- if organization cannot be resolved, fail closed.
- if profile organization mismatches request organization, fail closed.
- if user is linked to multiple organizations, the active organization scope must be resolved before profile use.
- repository must not silently select an arbitrary organization.

## Failure Behavior Proposal

Repository and upper layers should have distinct responsibilities.

Repository responsibilities:

- return minimal DTO on success.
- return `null` or typed not-found result on missing, inactive, deleted, unlinked, or organization-mismatched profile.
- avoid HTTP status decisions.
- avoid response shaping for clients.

Resolver / guard responsibilities:

- convert repository failure into generic safe-deny.
- avoid disclosing whether the user exists but is not an engineer.
- avoid disclosing whether the engineer exists but belongs to another organization.
- avoid disclosing whether a profile is inactive.
- avoid exposing internal enum / state details that help enumeration.

Internal logging / audit:

- may record safe internal reason codes where policy allows.
- must not return those reason codes to the engineer client.
- must not store raw sensitive payload.

## Relationship To Future Repositories

`EngineerProfileRepository` is identity foundation only.

Relationship boundaries:

- `EngineerWorkbenchOrganizationScopeRepository` may resolve allowed organization scope, but `EngineerProfileRepository` still verifies profile scope before returning identity context.
- `EngineerAssignmentRepository` handles assignment permission; `EngineerProfileRepository` does not decide assignment access.
- `EngineerWorkbenchAppointmentRepository` handles appointment visibility and operation eligibility; `EngineerProfileRepository` does not return appointment details.
- `EngineerWorkbenchCompletionSubmissionRepository` handles future completion source/draft persistence; `EngineerProfileRepository` does not persist completion data.

The future guard/resolver should compose these layers without collapsing them.

## Data Model Assumptions / Open Questions

Open questions for future design:

- Is there already a dedicated engineer profile table?
- Is there already a platform user to engineer profile linkage?
- How should engineer profile status be represented?
- What is the canonical organization scope field name?
- Is there a soft delete field, and what is its canonical name?
- Does the future workbench need indexes for organization + user + engineer profile lookup?
- Is a future migration decision packet required before runtime implementation?
- Should contractor/vendor engineer relationships be represented in the engineer profile, a separate relation, or assignment records?
- Should capability flags be stored or derived from role/permission/entitlement?

Task503 does not answer these through schema or migration.

## Future Sequencing

Proposal-only future tasks:

- Task504: Engineer Workbench Organization Scope Repository Contract Proposal / No Runtime.
- Task505: Engineer Assignment Lookup Repository Contract Proposal / No Runtime.
- Task506: Engineer Workbench Appointment Repository Contract Proposal / No Runtime.
- Task507: Completion Submission Persistence Design / No Migration.
- Task508: Migration Decision Packet / No Apply.

Task503 does not execute any of these tasks.

## Explicit Non-goals

Task503 does not:

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
- treat completion submission as formal Field Service Report.
- design `EngineerProfileRepository` as a writer for Case / Appointment / Field Service Report state.

## Verification Boundary

Task503 should be verified statically only:

- `git diff --check docs/task-503-engineer-mobile-workbench-engineer-profile-repository-contract-proposal-no-runtime.md`.
- confirm Task503 only adds or modifies the allowed markdown file.
- confirm no `src/`, `admin/src/`, tests, fixtures, migrations, or package files are part of this task.
- confirm this document states no runtime, no repository implementation, no SQL, no database, no migration, no provider, and no AI runtime.

No test, lint, database, smoke, browser, API, provider, or AI command is required for Task503.

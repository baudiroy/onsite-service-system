# Task 495 - Engineer Mobile Workbench Organization Scope And Active Organization Policy

## Status

Task 495 is docs-only.

It defines the future organization scope and active organization policy for Engineer Mobile Workbench. It does not implement runtime behavior.

## Current Baseline

Current Engineer Mobile Workbench runtime remains skeleton-only.

Current endpoints still return `501 Not Implemented`.

Task 492 confirmed existing `requireAuth` / `AuthService` is DB-backed.

Task 493 completed the auth adapter design packet.

Task 494 recommended Model B: engineer profile linked to platform user as Phase 1 target design.

Actual auth/session runtime remains unimplemented.

Real permission / assignment runtime remains unimplemented.

Task 495 is docs-only and does not authorize runtime implementation.

## Why Organization Scope Policy Is Required

Engineer Mobile Workbench is a SaaS-ready multi-tenant feature.

Engineers should only see appointment / dispatch visit data inside their organization scope and only when assigned or explicitly authorized.

Organization scope must not be client-controlled.

Organization scope is not assignment permission.

Entitlement / subscription / seat is not permission.

Admin or super-admin privilege must not hide organization isolation problems.

Contractor/vendor engineers may introduce multi-organization and external-organization boundaries.

## Organization Scope Source Candidates

### Source A - Authenticated platform user current organization

Description:

- existing auth context may provide current organization or user membership context

Pros:

- low friction
- may reuse existing user/membership concepts

Risks:

- may be admin-centered
- may not provide engineer-specific active organization
- may be DB-backed

Needs confirmation:

- server-side trust
- DB/repository dependency
- engineer-specific policy

### Source B - Linked engineer profile organization

Description:

- linked engineer profile determines organization scope

Pros:

- aligns with Task494 Model B
- can include engineer-specific status and assignment eligibility
- clearer than using broad admin/user roles directly

Risks:

- likely requires DB/repository/schema
- needs profile lifecycle and disabled/suspended policy
- must handle multi-organization engineers deliberately

Needs confirmation:

- profile status
- multi-organization behavior
- disabled engineer behavior
- contractor/vendor relationship model

### Source C - Assignment-derived organization

Description:

- organization comes from appointment / dispatch visit assignment lookup

Pros:

- close to own-task access
- natural for task-level permission guard

Risks:

- assignment lookup may leak task existence if not safe-denied
- cannot be used as client-visible discovery
- likely requires DB/repository

Needs confirmation:

- safe-deny behavior
- no task data returned before permission allow
- response equivalence

### Source D - Active organization selection

Description:

- multi-organization engineer uses a selected active organization context

Pros:

- supports multi-tenant and multi-brand future
- supports contractors or supervisors with multiple organization relationships

Risks:

- client-supplied active organization cannot be trusted by itself
- needs server-side verified selection lifecycle
- needs audit and safe-deny behavior

Needs confirmation:

- selection storage
- verification lifecycle
- audit
- fallback behavior

## Decision Matrix

| Source | Server-side trust level | DB/repository need | Multi-org fit | Own-task fit | Enumeration risk | Recommended Phase 1 use |
| --- | --- | --- | --- | --- | --- | --- |
| Source A - authenticated user current organization | Medium if server-side, low if client-supplied | Likely if loaded from user membership | Medium | Weak without assignment guard | Medium | Only as bridge if server-side and clearly scoped |
| Source B - linked engineer profile organization | High if profile is verified server-side | Likely yes | Good if profile supports memberships | Good with assignment guard | Medium | Preferred target design |
| Source C - assignment-derived organization | High after safe assignment lookup | Yes | Good | Strong | High if lookup leaks existence | Use only inside permission guard with safe-deny |
| Source D - active organization selection | High only if server-verified | Likely yes | Strong | Medium until assignment guard runs | Medium | Future need for multi-org users |

Recommended design:

- Phase 1 target design should use linked engineer profile organization as the main organization scope source.
- If profile runtime / DB scope does not exist, keep runtime skeleton-only or continue docs-only.
- Assignment-derived organization belongs in permission guard, not client-visible discovery.
- Active organization selection must be server-side verified if used.

## Active Organization Policy

Future policy should distinguish:

- single-organization engineer: server-side default active organization
- multi-organization engineer: server-side active organization selection
- contractor/vendor engineer: constrained by service provider / client organization relationship
- admin/supervisor: not automatically engineer own-task context
- customer service: cannot use customer-service identity to operate engineer workbench

Active organization must not be accepted from request body or query as authority.

If a header/cookie/reference is used in the future, it must be only a reference. Server-side validation is still required.

## Boundary With Assignment Permission

These layers must remain separate:

- auth identity: who logged in
- organization scope: which organization context the actor may operate under
- assignment permission: whether the actor may view or operate a specific appointment / dispatch visit

Organization allow does not equal appointment allow.

Assignment allow does not equal projection all-fields allow.

Projection must remain allow-list first and minimum necessary.

## Safe-deny And Enumeration Protection

Future behavior must avoid response differences that leak:

- whether organization exists
- whether appointment exists
- whether task belongs to another engineer
- whether the actor has hidden organization membership details
- DB error details
- stack trace

Cases such as org not found, not a member, task not found, task not assigned, and cross-organization access should be response-equivalent where practical.

Response equivalence should be covered by future tests.

## SaaS / Entitlement / Seat Boundary

Plan entitlement can decide whether the workbench feature is available.

Entitlement is not permission.

Seat billing can limit licensed users, but it is not appointment access.

Usage tracking must not include unnecessary sensitive payload.

Enterprise SSO future support must not break organization isolation.

AI add-on entitlement must not allow AI to read engineer data outside Data Access Control.

## Future Implementation Implications

If linked engineer profile organization is selected:

- profile repository / DB design may be needed
- profile status must be checked
- assignment eligibility must be explicit
- organization membership and workbench organization scope must be linked carefully

If active organization selection is selected:

- server-side verified active organization store may be needed
- selection changes should be audited
- client reference must not be trusted alone

If existing `requireOrganizationAccess` is reused:

- its params/body/query organization id derivation risk must be addressed
- it should not be treated as engineer identity or assignment proof

Any DB/schema/migration work requires future PM exact scope.

Task 495 does not create tables or migrations.

## Future Task496 Recommendation

Proposal only:

`Task496 - Engineer Mobile Workbench Assignment Permission Rule Design / No Runtime Change`

Reason:

- organization scope only defines tenant boundary
- own-task access still requires appointment / dispatch visit assignment rules
- before real permission runtime, assignment allow / deny / exception / supervisor override boundaries must be defined

Task 495 does not authorize Task496 implementation.

## Explicit Non-goals

Task 495 does not:

- modify backend `src/`
- modify `admin/src/`
- add or modify route/controller/resolver/guard/projection/auth/boundary/service/repository
- wire `requireAuth` or `requireOrganizationAccess` to Engineer Mobile Workbench route
- add auth adapter runtime
- add actual auth/session validation
- add real permission decision
- add organization scope runtime
- add DB / repository
- add schema / migration / Migration020
- add fixtures / tests
- execute tests
- execute DB / migration / psql
- execute smoke/browser/API tests
- implement mobile UI / PWA
- implement upload / signature / object storage
- trigger provider sending
- call AI/RAG/vector database
- modify `package.json`
- modify inventory docs

## Migration / Schema Decision

No migration, schema, index, DB, or Migration020 change is included in Task 495.

## Runtime Decision

No runtime behavior is changed in Task 495.

Engineer Mobile Workbench remains skeleton-only with no actual auth/session validation and no real organization scope runtime.

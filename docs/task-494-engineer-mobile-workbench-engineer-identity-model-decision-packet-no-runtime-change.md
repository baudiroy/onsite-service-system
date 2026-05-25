# Task 494 - Engineer Mobile Workbench Engineer Identity Model Decision Packet

## Status

Task 494 is docs-only.

It records the Engineer Mobile Workbench engineer identity model decision packet. It does not implement runtime behavior.

## Current Baseline

Current Engineer Mobile Workbench runtime remains skeleton-only.

Current endpoints still return `501 Not Implemented`.

Task 492 confirmed existing `requireAuth` / `AuthService` is DB-backed.

Task 493 completed the auth adapter design packet.

Actual auth/session runtime remains unimplemented.

Engineer identity model remains undecided.

Task 494 is docs-only and does not authorize runtime implementation.

## Why Engineer Identity Model Must Be Decided First

The system must not directly assume engineer equals admin/internal user.

The system must not mix engineer identity with customer identity or customer channel identity.

The system must not treat raw LINE user id as global engineer identity.

The system must not treat token/link as identity by itself.

Engineer Mobile Workbench needs own-task access, not general admin access.

Organization isolation, assignment permission, SaaS seat / entitlement, and audit actor design all depend on a correct engineer identity model.

## Candidate Identity Models

### Model A - Engineer is an existing platform user

Description:

- engineer uses the existing user / role / permission system
- existing platform auth may be reused after explicit scope

Pros:

- can reuse `requireAuth` and existing user context
- lower conceptual duplication
- may fit current route/middleware patterns

Risks:

- DB-backed
- admin permissions may be too broad for own-task workbench access
- requires explicit engineer role or permission
- assignment guard must still enforce own-task access

Needs confirmation:

- engineer role
- organization membership
- disabled user handling
- multi-organization behavior

### Model B - Engineer profile linked to platform user

Description:

- login remains platform user based
- engineer profile is a separate domain profile linked to that user

Pros:

- keeps user auth centralized
- allows engineer-specific status, assignment eligibility, dispatch profile, contractor metadata, and mobile constraints
- cleanly separates engineer domain identity from admin/customer-service user capabilities

Risks:

- likely requires repository / DB design
- may require future schema or migration
- needs profile linking and lifecycle policy

Needs confirmation:

- profile status
- organization scope
- assignment lookup
- profile ownership
- disabled/suspended behavior

### Model C - Contractor / vendor engineer identity

Description:

- engineer may belong to an external vendor, contractor, brand, or service provider context

Pros:

- supports multi-brand / multi-vendor / service-provider operating model
- future-compatible with SaaS and vendor-specific assignment

Risks:

- multi-tenant and organization isolation become more complex
- needs stronger data minimization
- needs precise audit actor and visibility rules

Needs confirmation:

- contractor visibility
- seat billing
- audit actor mapping
- vendor/brand data boundary
- organization relationship model

### Model D - Separate engineer-only identity

Description:

- engineer identity is independent from platform admin/customer user identity

Pros:

- clearest separation
- mobile workbench can have dedicated lifecycle and permissions

Risks:

- may over-design Phase 1
- requires new auth, lifecycle, linking, and permission model
- likely requires DB/schema/migration

Needs confirmation:

- whether the complexity is justified
- whether it fits first-phase low-cost strategy
- how to link with organization, assignment, audit, and SaaS seat rules

## Decision Matrix

| Model | Reuses existing auth? | DB/repository need | Organization isolation fit | Own-task access fit | SaaS/seat fit | Risk | Recommended? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Model A - existing platform user | Yes | Existing auth is DB-backed | Good if membership policy is correct | Requires separate assignment guard | Basic fit with role/permission; seat mapping needs policy | Medium | Possible, but only after engineer role and DB scope are explicit |
| Model B - engineer profile linked to platform user | Yes for login, profile for engineer domain | Likely yes | Stronger than Model A if profile carries organization/assignment eligibility | Strong fit | Strong fit for field engineer seat and contractor states | Medium/high | Preferred Phase 1 design direction, not implementation |
| Model C - contractor/vendor engineer identity | Maybe | Likely yes | Requires explicit tenant/vendor boundary | Good if modeled carefully | Strong for SaaS/vendor/brand future | High | Future-compatible, but not first runtime step |
| Model D - separate engineer-only identity | No or partial | Likely yes | Strong if built correctly | Strong if built correctly | Strong but costly | High | Defer unless product requires full separation |

Recommended design direction:

Phase 1 should prefer Model B as the target design: engineer profile linked to platform user.

If current schema does not support engineer profile, do not add migration in this task.

If runtime work is needed before the profile exists, use a tightly scoped no-DB adapter or docs-only continuation. Do not silently hard-code Model A assumptions into runtime.

## Required Identity Fields

Future engineer actor context may need:

- actor type
- actor reference
- engineer profile reference
- organization scope reference
- role hints
- status such as active, disabled, or suspended
- assignment eligibility
- source such as platform-user, linked-profile, or contractor-profile
- request id

Future engineer actor context must not include:

- password hash
- raw token
- raw LINE user id
- raw provider channel id
- full user record
- all organization memberships by default
- customer channel identity
- unrelated customer data
- full permission internals

## Organization Membership And Assignment Relationship

These concepts must remain separate:

- auth identity answers: who is this actor?
- organization scope answers: which organization scope can this actor operate under?
- assignment permission answers: can this actor view or operate this appointment / dispatch visit?

They must not be collapsed into one check.

Entitlement / subscription is not permission.

Seat billing is not permission.

Organization admin permission should not automatically equal engineer own-task access.

## LINE / Channel Identity Boundary

LINE should not be required for engineer task management.

If LINE is used, it should only support future quick login, identity binding, or shortcut entry.

Raw LINE user id must not be treated as global identity.

Channel identity must be organization + channel scoped.

Engineer identity must not be mixed with customer channel identity.

LINE push should not be required for engineer task notifications.

## Audit Actor Boundary

Future audit / evidence records need traceable actor identity.

Audit actor should not record:

- raw token
- raw channel id
- full credential
- full user record

Actor reference should be an internal stable reference.

AI must not rewrite audit actor or evidence.

Audit actor is not the same as customer-facing identity.

## Future Implementation Implications

If Model A is selected:

- existing auth may be reused
- DB/repository scope is likely required
- engineer role and membership policy must be explicit

If Model B is selected:

- engineer profile repository / DB design may be required
- linking between user and engineer profile must be explicit
- profile status and assignment eligibility need policy

If Model C is selected:

- contractor/vendor organization boundary design is required
- data minimization and audit actor design become more important

If Model D is selected:

- separate identity lifecycle design is required
- it may be too heavy for Phase 1 unless product requires it

Any DB/schema/migration work requires future PM exact scope.

Task 494 does not create tables or migrations.

## Future Task495 Recommendation

Proposal only:

`Task495 - Engineer Mobile Workbench Organization Scope and Active Organization Policy / No Runtime Change`

Reason:

- identity model needs active organization policy
- multi-organization engineer / contractor / admin users cannot rely on client-supplied organization id
- before actual auth runtime, organization scope selection and validation must be decided

Task 494 does not authorize Task495 implementation.

## Explicit Non-goals

Task 494 does not:

- modify backend `src/`
- modify `admin/src/`
- add or modify route/controller/resolver/guard/projection/auth/boundary/service/repository
- wire `requireAuth` to Engineer Mobile Workbench route
- add auth adapter runtime
- add actual auth/session validation
- add real permission decision
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

No migration, schema, index, DB, or Migration020 change is included in Task 494.

## Runtime Decision

No runtime behavior is changed in Task 494.

Engineer Mobile Workbench remains skeleton-only with no actual auth/session validation.

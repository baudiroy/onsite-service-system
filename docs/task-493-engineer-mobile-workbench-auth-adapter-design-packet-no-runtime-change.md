# Task 493 - Engineer Mobile Workbench Auth Adapter Design Packet

## Status

Task 493 is docs-only.

It designs a future Engineer Mobile Workbench auth adapter. It does not implement auth adapter runtime.

## Current Baseline

Current Engineer Mobile Workbench runtime remains skeleton-only.

Current endpoints still return `501 Not Implemented`.

Task 490 only completed the request context bridge skeleton.

Task 492 confirmed `requireAuth` / `AuthService` is DB-backed in practice.

Existing `requireAuth` is not suitable for a no-DB runtime task.

Task 493 is design-only and does not implement auth adapter runtime.

## Why A Workbench Auth Adapter Is Needed

Engineer Mobile Workbench needs engineer-specific identity context.

Existing platform auth may be internal-user centered.

Engineer identity, customer identity, and admin identity must not be mixed.

The DB-backed `requireAuth` path cannot be directly introduced in a no-DB task.

Workbench auth/session should establish identity preconditions only.

Workbench auth/session is not assignment permission.

The permission / assignment guard remains responsible for deciding whether the task belongs to the authenticated engineer.

## Proposed Adapter Responsibility

Future Workbench auth adapter should:

- receive server-side authenticated user context, if it already exists
- determine whether that user can be treated as an engineer actor under future policy
- build normalized engineer actor context
- build organization scope candidate under future policy
- preserve request id
- preserve client type
- avoid task / appointment lookup
- avoid assignment permission decisions
- avoid customer / case / appointment / Field Service Report data projection
- avoid formal state mutation

The adapter should be a boundary between platform auth and the engineer mobile surface. It should not become a task authorization, projection, or completion service.

## Adapter Input Boundary

Future adapter must not accept as identity:

- client-supplied `engineerId`
- client-supplied `organizationId` override
- token/link by itself
- raw LINE id as global identity
- customer channel identity
- raw provider payload

Future adapter may consider these inputs only if provided server-side:

- existing server-side `req.user`
- server-side role / permission summary
- server-side organization membership summary
- request id
- client type

If these inputs come from a DB-backed auth path, future PM scope must explicitly authorize DB/repository implications.

## Adapter Output Boundary

Future normalized output may look like:

```json
{
  "implemented": true,
  "authenticated": true,
  "engineerActor": {
    "actorType": "engineer",
    "actorRef": "safe-engineer-reference",
    "organizationScopeRef": "safe-organization-scope-reference",
    "roleHints": ["field_engineer"]
  },
  "source": "server-side-auth-context",
  "requestId": "safe-request-reference"
}
```

This is a proposal only.

Future adapter output must not include:

- raw token
- raw credential
- raw LINE / provider channel id
- full user record
- password hash
- permission internal payload
- all organization memberships by default
- customer data
- appointment data
- Case / Field Service Report data
- internal audit details

The output should provide only enough identity context for later permission / assignment guard evaluation.

## Engineer Actor Policy Questions

Future product and engineering decisions must answer:

- Is an engineer an existing platform user role?
- Does engineer share the same user table as admin, customer service, dispatcher, supervisor, and finance users?
- Can engineer belong to multiple organizations?
- Does engineer need organization membership check?
- Does engineer need explicit engineer profile / staff profile?
- Can engineer be determined by role / permission only?
- Does engineer need tenant entitlement?
- How should disabled or suspended engineer users be handled?
- How should contractor or vendor engineers be handled?
- How should multi-tenant SaaS seat / entitlement be separated from permission?

These questions should be decided before actual auth runtime writes a durable identity assumption into code.

## Organization Scope Policy

Organization scope must be generated server-side.

Organization scope must not be client-controlled.

If a user belongs to multiple organizations, future work must define active organization selection policy.

Admin or super-admin permission must not automatically become engineer own-task access.

Organization isolation must not be hidden behind broad admin privileges.

Entitlement is not permission.

Usage tracking must not include unnecessary sensitive payload.

## Safe-deny / Error Behavior

The adapter should support safe failure behavior for:

- unauthenticated
- invalid session
- not engineer
- no active organization
- no assignment permission, later handled by assignment guard

Auth adapter failure must not leak:

- whether task exists
- whether appointment exists
- whether Case exists
- whether customer exists
- raw auth reason
- DB error details
- stack trace

Workbench route responses still need response equivalence policy.

## Future Implementation Options

### Option A - Adapter consumes existing `req.user`

Requires route middleware to populate `req.user`.

Likely means using existing `requireAuth`.

DB/repository implication must be accepted.

### Option B - Adapter consumes a future lightweight session context

Requires a separate session context provider.

May avoid direct route coupling.

Needs future design.

### Option C - Repository-backed engineer actor lookup

Only possible if PM explicitly scopes DB/repository.

Must preserve organization isolation.

No migration unless separately scoped.

### Option D - Continue skeleton-only until auth policy is finalized

Safest option if engineer identity model is unclear.

## Future Task494 Recommendation

Proposal only:

`Task494 - Engineer Mobile Workbench Engineer Identity Model Decision Packet / No Runtime Change`

Reason:

- before actual auth runtime, decide whether engineer is platform user, staff profile, contractor profile, or separate engineer identity
- avoid hard-coding engineer identity to existing admin/customer user assumptions
- avoid DB-backed implementation before identity model is confirmed

Task 493 does not authorize Task494 implementation.

## Explicit Non-goals

Task 493 does not:

- modify backend `src/`
- modify `admin/src/`
- add or modify route/controller/resolver/guard/projection/auth/boundary/service/repository
- wire `requireAuth` to Engineer Mobile Workbench route
- add auth adapter runtime
- add actual auth/session validation
- add real permission decision
- add DB / repository
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

No migration, schema, index, DB, or Migration020 change is included in Task 493.

## Runtime Decision

No runtime behavior is changed in Task 493.

Engineer Mobile Workbench remains skeleton-only with no actual auth/session validation.

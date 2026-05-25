# Task 489 - Engineer Mobile Workbench Actual Auth Session Runtime Preflight Review

## Status

Task 489 is docs-only.

It records a read-only source preflight review before any actual Engineer Mobile Workbench auth/session runtime implementation. It does not implement auth/session runtime.

## Current Baseline

Current Engineer Mobile Workbench runtime remains skeleton-only.

Current endpoints still return `501 Not Implemented`.

Task 476 auth/session boundary is placeholder only.

Task 482 actual auth/session design packet is complete.

Task 488 minimal skeleton tests passed with `node --test`.

Task 489 does not implement actual auth/session runtime.

## Read-only Inspect Summary

Read-only inspection found these relevant files:

- `src/auth/EngineerMobileWorkbenchAuthSessionBoundary.js`
- `src/middlewares/requireAuth.js`
- `src/middlewares/requirePermission.js`
- `src/middlewares/requireOrganizationAccess.js`
- `src/middlewares/requireSystemOrSuperAdmin.js`
- `src/services/AuthService.js`
- `src/services/OrganizationAccessService.js`
- `src/utils/errors.js`
- `src/utils/responses.js`
- `src/utils/customerFacingSafeDenyResponse.js`
- `src/utils/customerAccessContext.js`
- `src/middlewares/requestId.js`
- `src/routes/fieldService.routes.js`
- `src/routes/engineerMobileWorkbench.routes.js`

No source file was modified during this review.

## Existing Auth / Session Pattern Review

### Auth middleware

`src/middlewares/requireAuth.js` exists.

Observed pattern:

- extracts bearer credentials from the request authorization header
- calls `AuthService.getCurrentUserFromToken`
- attaches the result to `req.user`
- reuses existing `req.user` if it is already present
- returns auth errors through the standard middleware error path

Future risk:

- this path uses `AuthService`
- `AuthService.getCurrentUserFromToken` verifies credentials and then loads current user data through repositories and permission services
- therefore actual auth/session runtime may require DB/repository access unless a future task deliberately scopes a no-DB placeholder integration

### Request user / organization context

Existing request context is primarily `req.user`.

`src/middlewares/requestId.js` attaches `req.requestId`.

No dedicated generic `requestContext` file was found.

`src/middlewares/requireOrganizationAccess.js` can derive organization id from route params, request body, or query, then calls `OrganizationAccessService.assertAccess`.

Future risk:

- `requireOrganizationAccess` currently accepts organization id from request locations
- for Engineer Mobile Workbench identity, client-supplied organization id must not be trusted as identity or task scope
- actual workbench context should derive organization scope from server-side authenticated user/session and later assignment lookup

### Safe-deny / error envelope

`src/utils/errors.js` defines common app error classes and status codes.

`src/middlewares/errorHandler.js` uses `errorResponse` from `src/utils/responses.js`.

Customer-facing safe-deny helpers exist in:

- `src/utils/customerFacingSafeDenyResponse.js`
- `src/utils/customerAccessContext.js`

Fit assessment:

- existing app errors are useful for admin/internal API error style
- customer-facing safe-deny helpers are useful design references for enumeration protection
- Engineer Mobile Workbench should have its own safe-deny behavior and should not directly reuse customer-facing messages without checking role and surface fit

### Role / permission pattern

`src/middlewares/requirePermission.js` exists.

Observed pattern:

- calls `requireAuth`
- checks `req.user.permissions`
- denies if required permission is missing

Fit assessment:

- this is a reusable pattern for permission shape
- it is not sufficient for engineer task assignment
- actual workbench auth/session should establish user context only
- permission / assignment guard must still check assigned appointment or explicit authorized exception

### Organization scope pattern

`src/services/OrganizationAccessService.js` exists.

Observed pattern:

- system/super admin can access broader organization scopes
- non-system users require membership in the organization
- scoped filters can be built for organization-constrained queries

Future risk:

- organization access checks can use repository-backed membership lookup
- actual Engineer Mobile Workbench auth/session runtime should not silently introduce DB access unless PM scopes it
- assignment and task visibility remain separate from organization membership

## Engineer Mobile Workbench Auth / Session Fit Assessment

Future actual auth/session runtime should:

- use server-side authenticated request context
- establish engineer context
- establish organization scope
- preserve request id
- avoid returning customer, case, appointment, or Field Service Report data
- leave assignment checks to the permission / assignment guard
- leave projection data shaping to the projection layer

Future actual auth/session runtime must not:

- trust client-supplied `engineerId`
- trust client-supplied `organizationId`
- treat a token/link as engineer identity by itself
- treat raw LINE user id as global identity
- mix customer channel identity with engineer identity
- make LINE a required dependency for task management
- return task data before permission / assignment allow
- mutate Case / Appointment / Field Service Report state

LINE can remain a future quick login / identity binding / shortcut option, but the engineer workbench must not require LINE push or LINE identity as the core task-management dependency.

## Proposed Future Task490 Scope Options

These options are proposals only. Task 489 does not implement them.

### Option A - No-DB placeholder request context bridge

Future auth/session boundary could still return skeleton output while reading only an existing request context placeholder, if PM wants a very small next step.

Characteristics:

- no DB
- no real login validation
- lowest risk
- keeps endpoints not implemented
- does not establish real engineer identity
- useful only as wiring preparation

### Option B - Actual auth/session validation using existing middleware/context

Future auth/session runtime could use existing auth middleware/context only if PM explicitly scopes the exact files and accepts the dependency profile.

Characteristics:

- may use `req.user`
- may need existing `requireAuth`
- may involve `AuthService`
- may involve repository-backed user/permission loading
- must not add repository access unless PM scopes it
- must not trigger provider sending
- must not return task data
- must not perform assignment checks

This option is only safe if DB/repository implications are explicitly reviewed and authorized.

### Option C - Defer runtime and design repository-backed auth separately

If the only viable actual auth/session path requires DB/repository access, defer implementation.

Characteristics:

- separate future DB/repository scope
- explicit test DB or no-DB test strategy
- exact allowed files
- explicit safe-deny behavior
- no provider sending
- no AI/RAG
- no task projection until auth and assignment are both approved

## Future Exact File Touch Plan Proposal

This is a recommendation only.

Potential future files may include:

- `src/auth/EngineerMobileWorkbenchAuthSessionBoundary.js`
- an existing middleware/context helper, only if PM later allows it
- `docs/task-490-...`

Task 489 does not modify these files.

Task490, if executed, must list exact allowed files again.

## Future Stop Conditions

Future auth/session runtime work must stop and report if it requires:

- DB / repository access without PM scope
- migration / Migration020
- provider sending
- AI/RAG/vector database
- LINE runtime side effect
- raw credential logging
- raw LINE id exposure
- client-supplied `engineerId` or `organizationId` for identity
- route/controller/resolver changes outside exact scope
- customer / case / appointment / Field Service Report data response
- Case / Appointment / Field Service Report state mutation
- tests / fixtures unless separately scoped

## Explicit Non-goals

Task 489 does not:

- modify backend `src/`
- modify `admin/src/`
- add or modify route/controller/resolver/guard/projection/auth/boundary/service/repository
- add actual auth/session validation
- add real permission decision
- add real projection data
- add fixtures / tests
- execute tests
- add DB / migration / Migration020
- execute DB / migration / psql
- execute smoke/browser/API tests
- implement mobile UI / PWA
- implement upload / signature / object storage
- trigger provider sending
- call AI/RAG/vector database
- modify `package.json`
- modify inventory docs

## Verification Scope

Allowed verification for Task 489 is limited to static checks and documentation scans.

No admin check is required because `admin/src/` is untouched.

## Migration / Schema Decision

No migration, schema, index, DB, or Migration020 change is included in Task 489.

## Runtime Decision

No runtime behavior is changed in Task 489.

Engineer Mobile Workbench remains skeleton-only. Actual auth/session runtime still requires PM exact scope and a clear decision among the future options above.

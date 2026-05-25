# Task 492 - Engineer Mobile Workbench Existing Auth Middleware Deep-dive

## Status

Task 492 is docs-only.

It records a read-only deep-dive of existing auth middleware and related auth/session flow. It does not implement runtime behavior.

## Current Baseline

Current Engineer Mobile Workbench runtime remains skeleton-only.

Endpoints still return `501 Not Implemented`.

Task 489 preflight found existing auth middleware and repository-backed auth risk.

Task 490 implemented request context bridge only, with no actual login validation.

Task 491 concluded actual auth/session needs a scope decision.

Task 492 is read-only deep-dive only, not runtime implementation.

## Existing Auth Middleware Flow

### `requireAuth`

`src/middlewares/requireAuth.js` exports:

- `requireAuth`
- `extractBearerToken`

Observed behavior:

- reads the request authorization header
- accepts only bearer-style credentials
- returns auth error when no valid bearer credential exists
- if `req.user` already exists, it calls `next()` without reloading identity
- otherwise calls `AuthService.getCurrentUserFromToken`
- writes the returned user DTO to `req.user`
- forwards errors to the standard middleware error path

The auth result is written to `req.user`. No `req.auth` or generic request context object was observed in this flow.

### `AuthService`

`src/services/AuthService.js` handles credential verification and user loading.

Observed behavior:

- verifies access credential with configured auth secret
- extracts the subject id
- loads current user by id through `UserRepository`
- loads roles and permissions through `PermissionService`
- returns a user DTO containing id, display name, email, mobile, user type, status, auth provider, last login time, roles, and permissions

The login path also uses transactions, audit service, password comparison, and token issuance. That login path is not needed for Engineer Mobile Workbench route auth wiring, but it confirms the service is tightly coupled to DB-backed user data.

### Permission middleware

`src/middlewares/requirePermission.js` calls `requireAuth`, then checks `req.user.permissions`.

This means permission middleware is also dependent on the `requireAuth` user DTO shape.

### Organization access middleware

`src/middlewares/requireOrganizationAccess.js` reads organization id from:

- route params
- request body
- query string

Then it calls `OrganizationAccessService.assertAccess(req.user, organizationId)`.

`OrganizationAccessService` can call `UserOrganizationRepository`, especially for non-system users.

This is a useful platform pattern, but it is not directly sufficient for Engineer Mobile Workbench task isolation because client-supplied organization id must not establish engineer identity or task assignment scope.

### Error and request id pattern

`src/utils/errors.js` defines app errors such as auth required and permission denied.

`src/utils/responses.js` defines the standard error envelope.

`src/middlewares/requestId.js` attaches request id to `req.requestId` and response header.

The normal error path can preserve request id through error handling.

## DB / Repository Dependency Assessment

Existing `requireAuth` is DB-backed in practice.

Reason:

- `requireAuth` calls `AuthService.getCurrentUserFromToken`
- `AuthService.getCurrentUserFromToken` calls `getCurrentUserById`
- `getCurrentUserById` calls `UserRepository.findById`
- it also calls `PermissionService.getUserRoles`
- it also calls `PermissionService.getUserPermissions`
- `PermissionService` uses permission repositories

Existing organization access is also DB-backed in practice.

Reason:

- `OrganizationAccessService` may call `UserOrganizationRepository`
- scoped organization filters may require organization membership lookup

No migration is directly required just to call these existing paths, but the paths assume existing users, roles, permissions, user organization memberships, and related schema are present and valid.

Conclusion:

Existing `requireAuth` is not suitable for a no-DB runtime task.

If Engineer Mobile Workbench routes wire `requireAuth`, PM must explicitly accept DB/repository implications or separately scope a no-DB adapter that only reads already-populated request context.

## Engineer vs Customer Identity Assessment

Existing auth appears to be centered on internal platform users.

Evidence:

- `AuthService` returns user DTO with user type, roles, and permissions
- `requirePermission` checks `req.user.permissions`
- organization access uses user organization membership

This may be compatible with engineer login if engineers are modeled as platform users, but the current deep-dive did not prove that:

- engineer role is uniquely distinguishable
- engineer user and customer identity are always separate
- assigned engineer identity is always the same concept as user id
- mobile workbench user is never a customer-channel identity

No direct LINE identity dependency was found in `requireAuth`.

However, raw LINE id must not be used as global engineer identity in future work.

Token/link must not be treated as identity by itself. It must only be a credential used by an approved auth path.

Future work must confirm whether engineers are normal users, role-scoped users, a separate profile type, or a future mobile engineer identity.

## Organization Isolation Assessment

Existing auth by itself returns user identity and permissions, but it does not directly produce a single Engineer Mobile Workbench organization scope.

Organization access exists separately through `OrganizationAccessService`.

Important concerns:

- `requireOrganizationAccess` derives organization id from params/body/query
- that pattern is useful for admin APIs, but it should not be treated as identity proof for Engineer Mobile Workbench
- a mobile engineer task should derive allowed organization/task access from server-side user context and assignment lookup
- system/admin roles may bypass normal organization membership checks, which can be correct for admin surfaces but risky for a mobile engineer own-task surface if applied without workbench-specific policy

Recommendation:

Engineer Mobile Workbench needs a workbench-specific organization scope policy, even if it reuses existing user identity.

## Error / Safe-deny Assessment

`requireAuth` failure uses auth errors, generally producing an auth-required style response.

`requirePermission` failure uses permission denied.

Potential mismatch with Engineer Mobile Workbench:

- generic auth and permission errors may be acceptable for authenticated internal APIs
- mobile workbench task endpoints also need response equivalence for not-own, not-found, cross-organization, and unauthorized task references
- route-level auth failure is only one layer; task lookup and assignment denial still need a workbench-specific safe-deny model

No sensitive credential values should be logged or returned.

Future adapter should ensure:

- no raw credential value in response
- no resource existence leakage
- no customer/case/appointment existence leakage
- request id remains available
- endpoint still does not reveal task assignment details on denial

## Reuse Recommendation

Do not directly wire `requireAuth` into Engineer Mobile Workbench routes in a no-DB task.

`requireAuth` can be reused only if PM explicitly scopes:

- route file changes
- actual endpoint behavior changes
- DB/repository implications
- test strategy
- safe-deny behavior
- engineer identity policy
- organization scope policy

Recommended next step:

- keep runtime unchanged
- do a docs-only Workbench auth adapter design packet
- define how existing `req.user`, role/permission data, organization membership, and assignment guard should interact

If PM wants runtime next, the safest runtime path is not "blindly add `requireAuth` to routes"; it should be a tightly scoped adapter or middleware plan with explicit DB/repository acceptance.

## Future Task493 Options

These are proposals only:

### Option A - Docs-only Workbench auth adapter design

Design a workbench-specific adapter that can consume existing request user context safely.

No runtime change.

### Option B - Runtime no-DB adapter wrapping existing request context only

Only reads `req.user` if a previous middleware already populated it.

Does not call `requireAuth`, `AuthService`, DB, or repository.

Still does not create real task access.

### Option C - Runtime existing `requireAuth` route wiring with explicit DB/repository scope

Wires existing middleware to workbench routes.

Requires PM to explicitly accept DB/repository implications and endpoint behavior change.

### Option D - Repository-backed engineer auth lookup design

Designs or implements a dedicated engineer identity lookup path.

Requires separate DB/repository scope and tests.

## Stop Conditions For Future Runtime

Future runtime must stop if:

- `requireAuth` implies DB but the task says no DB
- `AuthService` loads roles/permissions/organizations unexpectedly
- auth failure leaks identity/resource details
- route middleware changes endpoint behavior beyond scope
- engineer identity cannot be distinguished from customer/admin user
- client-supplied organization id is used as identity scope
- provider sending or AI/RAG is required
- tests require package changes

## Explicit Non-goals

Task 492 does not:

- modify backend `src/`
- modify `admin/src/`
- add or modify route/controller/resolver/guard/projection/auth/boundary/service/repository
- wire `requireAuth` to Engineer Mobile Workbench route
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

No migration, schema, index, DB, or Migration020 change is included in Task 492.

## Runtime Decision

No runtime behavior is changed in Task 492.

Engineer Mobile Workbench remains skeleton-only with no actual auth/session validation.

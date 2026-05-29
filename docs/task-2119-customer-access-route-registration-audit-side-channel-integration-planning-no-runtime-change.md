# Task2119 - Customer Access Route-Registration Audit Side-Channel Integration Planning

## Status

- Documentation-only planning for future Customer Access route-registration audit side-channel integration.
- This task does not authorize or implement route-registration audit runtime integration.
- No source, test, package, route, controller, mount, runtime, DB, migration, SQL, repository, query, smoke, server, listener, network, Zeabur/env, provider, admin, AI, RAG, model, billing, settlement, payment, invoice, package, or package-lock work was performed.
- The 7 held historical docs remain untracked and untouched.

## Current Accepted Route-Registration Boundary

Public Customer Access route registration currently covers only:

- `GET /customer-access/:caseId`
- `GET /customer-access/:caseId/service-report/:reportId`

The internal test route remains separate:

- `/__internal/customer-access/service-reports/:caseId/:reportId`

Accepted success summary:

```js
{
  registered: true,
  routes: [
    { method: 'GET', path: '/customer-access/:caseId' },
    { method: 'GET', path: '/customer-access/:caseId/service-report/:reportId' },
  ],
}
```

Accepted failure summary:

```js
{
  registered: false,
  messageKey: 'customerAccess.unavailable',
  customerVisible: false,
  reasonCode,
}
```

Guarded route-registration failure reason codes:

- `mount_target_invalid`
- `db_client_invalid`
- `route_registration_failed`

Current registration boundary rules:

- Registration is injected-only.
- Registration must not import or fall back to global app, server, public routes, env, DB provider, external provider, AI, or billing modules.
- `dbClient.query` is not called during route registration.
- Projection service and facade execution are not called during route registration.
- Registration summaries remain sanitized and do not expose raw router, target, handler, route, dbClient, dependency, or thrown error objects.

## Current Accepted Audit Components

The audit event builder already supports route-registration audit event types:

- `customer_access.route_registration.success`
- `customer_access.route_registration.failure`

Accepted route-registration audit matrix:

- decision: `success` or `failure`
- routes:
  - `/customer-access/:caseId`
  - `/customer-access/:caseId/service-report/:reportId`
- method: `GET`
- source: `customer_access_route_registration`
- metadata:
  - `dependencyValid`
  - `registrationResult`

Accepted audit writer adapter boundary:

- The writer is an optional injected `function writer(auditEvent)`.
- There is no global writer fallback.
- Writer throw, rejection, and malformed result are contained.

Accepted writer normalizer boundary:

- Writer results normalize to `recorded`, `skipped`, or `failed`.
- Normalization is safe and non-throwing.
- No persistence is provided by the normalizer.
- No raw writer result fields are exposed.

## Future Integration Point Proposal

Preferred future integration point:

- `registerCustomerAccessRoutes`, after a sanitized registration summary is produced.

Rationale:

- The summary already contains the safe success/failure decision.
- The success summary already contains the accepted public route list.
- The failure summary already contains a bounded safe reason code.
- This avoids exposing raw target, router, handler, dbClient, dependency, route, or thrown error objects to audit.
- The audit result can remain out of the registration summary.

Alternative future integration point:

- App adapter registration layer only if PM later wants a per-route registration-attempt audit policy at that layer.

Both options are planning only. This document does not authorize runtime changes.

## Future Route-Registration Audit Events

Future success event:

- `eventType`: `customer_access.route_registration.success`
- `decision`: `success`
- `source`: `customer_access_route_registration`
- `method`: `GET`
- `reasonCode`: none
- `metadata.dependencyValid`: `true`
- `metadata.registrationResult`: `success`

Route policy for success:

- The builder accepts one route per event.
- Preferred planning choice: emit one audit event per registered route.
- Candidate success routes:
  - `/customer-access/:caseId`
  - `/customer-access/:caseId/service-report/:reportId`
- Representative single-route audit should be used only if PM explicitly chooses that policy in a future runtime task.

Future failure event:

- `eventType`: `customer_access.route_registration.failure`
- `decision`: `failure`
- `source`: `customer_access_route_registration`
- `method`: `GET`
- `reasonCode`: one of the accepted route-registration reason codes
- `metadata.dependencyValid`: `false` for dependency failures
- `metadata.registrationResult`: `failure`, `invalid`, or `unavailable` as appropriate

Route policy for failure:

- Use only an accepted public route when the route is safely known.
- If no safe accepted route is available, skip the writer rather than inventing a route.
- Never include partial route lists from a failed registration attempt.

## Future Audit Call And Skip Behavior

Future implementation must preserve these rules:

- If no `auditWriter` is injected, no audit call occurs and the registration summary is unchanged.
- If `auditWriter` is non-function or malformed, no audit call occurs and the registration summary is unchanged.
- If the audit event builder returns invalid, skip the writer and keep the registration summary unchanged.
- If `auditWriter` throws, rejects, or returns a malformed result, keep the registration summary unchanged.
- Audit result must never appear in the registration summary.
- Audit result must never appear in a customer response.
- Audit write failure must never change a successful registration summary.
- Audit write failure must never change a failure registration summary.

## Non-Leakage Boundary

Future route-registration audit events must never include:

- raw app, router, or mount target
- handler functions or function source
- raw route object
- raw dbClient or query function
- projection service or facade function source
- raw options or dependency objects
- env or Zeabur values
- provider payload or raw payload
- AI prompts or responses
- debug, stack, or SQL
- tokens or headers
- DB rows or query metadata
- internal, private, or admin-only fields
- partial route lists from failed registration

The registration summary must remain sanitized and unchanged.

## Future Runtime Task Boundaries - Candidates Only

Future Task A candidate:

- Add optional `auditWriter` injection to `registerCustomerAccessRoutes` only.
- No DB or persistence.
- No registration summary shape change.
- Audit success emits one event per route.
- Audit failure emits a safe failure event only when route and reason are safe.

Future Task B candidate:

- Add tests-only regression guards proving route-registration audit failure does not change summary.
- Guard that raw dependency objects and partial failed routes do not leak into audit events or summaries.

Future Task C candidate:

- Create a branch checkpoint for route-registration audit side-channel integration.

These candidates are not authorized by this planning document.

## Explicit Non-Goals

- No runtime integration.
- No source or test changes beyond this document.
- No route-registration `auditWriter` injection yet.
- No service-report audit changes.
- No case overview audit changes.
- No context middleware audit integration.
- No audit persistence or DB writer.
- No DB, migration, SQL, repository, or query changes.
- No route, controller, global mount, or production mount changes.
- No app, server, or public routes changes.
- No smoke, endpoint probe, server, listener, network, Zeabur, or env work.
- No provider, admin, AI, billing, package, or package-lock work.

## Verification

Executed commands for this docs-only planning task:

```sh
git diff --check -- docs/task-2119-customer-access-route-registration-audit-side-channel-integration-planning-no-runtime-change.md
git status --short --branch
```

Results:

- `git diff --check -- docs/task-2119-customer-access-route-registration-audit-side-channel-integration-planning-no-runtime-change.md`: PASS.
- `git status --short --branch`: branch `main...origin/main` with only the Task2119 doc plus the 7 held historical docs untracked before commit.

Node tests were not required or run because this task is documentation-only and no source or test files were changed.

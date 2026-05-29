# Task2115 - Customer Access Service-Report Audit Side-Channel Integration Planning

## Status

- Task2114 is accepted, pushed, and synced.
- Case overview audit side-channel integration branch is checkpointed.
- This document is planning-only and docs-only.
- Service-report audit runtime integration is not authorized by this task.
- The 7 held historical docs remain untracked and untouched.

## Current Accepted Service-Report Boundaries

Route:

- `GET /customer-access/:caseId/service-report/:reportId`

Route params:

- `caseId` from path params only
- `reportId` from path params only

Service input DTO:

- `dbClient`
- `customerAccessContext`
- `caseId`
- `reportId`

Service-report response allowlist:

- `customerReportReference`
- `caseReference`
- `serviceStatus`
- `appointmentWindow`
- `engineerDisplayName`
- `serviceSummary`
- `completionTime`
- `publicAttachments`

Public attachment item allowlist:

- `attachmentId`
- `label`
- `mimeType`

Safe-deny/unavailable HTTP envelope:

- HTTP status: `404`
- `status: deny`
- `messageKey: customerAccess.unavailable`
- `customerVisible: false`
- `data: null`
- `error.messageKey: customerAccess.unavailable`

The service-report boundary must not expose existence or non-existence details for case or report records.

## Current Accepted Audit Components

Audit event builder:

- supports `customer_access.service_report.allow`
- supports `customer_access.service_report.deny`
- route: `/customer-access/:caseId/service-report/:reportId`
- method: `GET`
- decision: `allow` or `deny`
- allowed source: `customer_access_projection_service`
- allowed source: `customer_access_controller`
- metadata key: `routeMatched`
- metadata key: `contextPresent`
- metadata key: `identifierValid`

Audit writer adapter:

- optional injected `function writer(auditEvent)`
- no global fallback
- writer throw is contained
- writer rejection is contained
- malformed writer result is contained

Writer result normalizer:

- `recorded`, `skipped`, and `failed` normalized result
- no persistence
- safe result shape only

## Proposed Future Integration Point

Preferred future integration point:

- Customer service-report projection HTTP boundary / handler layer after final customer-facing response decision is known.

Rationale:

- the handler has validated route params
- the handler has the final allow or deny HTTP outcome
- the handler can avoid building audit events from raw DB rows
- the handler can avoid building audit events from projection internals
- the handler can keep audit result out of the customer response

Alternative future integration point:

- projection service boundary only if PM later wants DB/query failure reason classification

Both points are planning candidates only. This task does not authorize runtime changes.

## Future Service-Report Audit Events

Allow event:

- `eventType`: `customer_access.service_report.allow`
- `decision`: `allow`
- `route`: `/customer-access/:caseId/service-report/:reportId`
- `method`: `GET`
- `source`: `customer_access_projection_service` or `customer_access_controller`, depending on the future chosen boundary
- `caseId`: from validated route/service input only
- `reportId`: from validated route/service input only
- `organizationId`: from sanitized `customerAccessContext` only when safe
- `customerId`: from sanitized `customerAccessContext` only when safe
- no `reasonCode`

Deny event:

- `eventType`: `customer_access.service_report.deny`
- `decision`: `deny`
- `route`: `/customer-access/:caseId/service-report/:reportId`
- `method`: `GET`
- `source`: `customer_access_projection_service` or `customer_access_controller`, depending on the future chosen boundary
- `caseId`: from validated route/service input only when safe
- `reportId`: from validated route/service input only when safe
- `organizationId`: from sanitized `customerAccessContext` only when safe
- `customerId`: from sanitized `customerAccessContext` only when safe
- `reasonCode`: `customerAccess.unavailable` or another accepted safe reasonCode only

## Future Audit Call And Skip Behavior

Future integration must preserve these rules:

- if no `auditWriter` is injected, no audit call occurs and service-report response is unchanged
- if `auditWriter` is non-function or malformed, customer-facing behavior is unchanged
- if the audit event builder returns invalid, writer is skipped and response is unchanged
- if `auditWriter` throws, response is unchanged
- if `auditWriter` rejects, response is unchanged
- if `auditWriter` returns malformed result, response is unchanged
- audit result never appears in response body
- audit result never appears in response headers
- audit write failure never changes HTTP status

## Non-Leakage Boundaries

Future service-report audit events must never include:

- raw request or response
- headers or rawHeaders
- authorization, cookies, tokens, or session
- body, query, or params object
- user, auth, channel, access, or session raw objects
- raw `customerAccessContext`
- raw projection service result
- raw DB rows
- query metadata
- query text or values
- provider payload or raw payload
- AI prompts or responses
- debug, stack, or SQL values
- internal, private, or admin-only fields
- customer raw phone, address, email, or LINE identity
- service report raw internal notes
- engineer notes
- diagnosis notes
- completion notes
- private report body

## Future Runtime Task Boundaries

These are candidates only, not authorization.

Future Task A:

- add optional `auditWriter` injection to service-report HTTP handler/app adapter only
- no DB or persistence
- no response body or status change
- test allow and deny events

Future Task B:

- add mounted route regression guard confirming no audit dependency by default
- add service-report audit writer failure isolation tests

Future Task C:

- checkpoint service-report audit integration branch

## Explicit Non-Goals

This task does not authorize or perform:

- runtime integration
- source code changes
- test code changes
- package changes
- service-report `auditWriter` injection
- route-registration audit integration
- context middleware audit integration
- audit persistence or DB writer
- DB, migration, SQL, repository, or query changes
- route, controller, or global mount changes
- production mount
- `src/app.js`, `src/server.js`, or `public.routes.js` changes
- smoke, server, listener, network, Zeabur, or env work
- provider, admin, AI, RAG, model, billing, settlement, payment, or invoice work

## Verification

Run:

```sh
git diff --check -- docs/task-2115-customer-access-service-report-audit-side-channel-integration-planning-no-runtime-change.md
git status --short --branch
```

Node tests are not required for this docs-only planning task unless source or test files change.

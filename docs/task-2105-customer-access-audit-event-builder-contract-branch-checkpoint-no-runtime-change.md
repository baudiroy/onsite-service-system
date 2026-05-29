# Task2105 - Customer Access Audit Event Builder Contract Branch Checkpoint

## Status

- Task2101 through Task2104 are accepted, pushed, and synced.
- This checkpoint is docs-only.
- The Customer Access audit event builder remains pure and not integrated into runtime.
- No source, runtime, test, package, audit persistence, DB, migration, SQL, route, controller, global mount, production mount, smoke, server, listener, network, Zeabur/env, provider, admin, AI, billing, settlement, payment, invoice, app, server, or public-routes work was performed.
- The 7 held historical docs remain untracked and untouched.

## Task2101 Summary

Task2101 added the Customer Access audit event contract skeleton:

- pure dependency-free builder
- no DB work
- no audit persistence
- no provider work
- no runtime integration

Supported event types:

- `customer_access.case_overview.allow`
- `customer_access.case_overview.deny`
- `customer_access.service_report.allow`
- `customer_access.service_report.deny`
- `customer_access.route_registration.success`
- `customer_access.route_registration.failure`

Result shape:

- valid: `{ ok: true, auditEvent }`
- invalid or malformed: `{ ok: false, reasonCode }`

## Task2102 Summary

Task2102 added immutability and determinism guards:

- source unchanged; tests-only plus docs
- no `Date.now`
- no `new Date`
- no `Math.random`
- no crypto randomness
- no `process.env`
- no global state
- no mutation of caller input or metadata
- output isolation across calls
- output freezing was not added; isolation is covered by tests

## Task2103 Summary

Task2103 added the decision, reasonCode, route, method, and source matrix.

Decision values:

- `customer_access.case_overview.allow`: `allow`
- `customer_access.case_overview.deny`: `deny`
- `customer_access.service_report.allow`: `allow`
- `customer_access.service_report.deny`: `deny`
- `customer_access.route_registration.success`: `success`
- `customer_access.route_registration.failure`: `failure`

Route and method rules:

- case overview: `/customer-access/:caseId`, `GET`
- service report: `/customer-access/:caseId/service-report/:reportId`, `GET`
- route registration: `/customer-access/:caseId` or `/customer-access/:caseId/service-report/:reportId`, `GET`

Source allowlist:

- `customer_access_controller`
- `customer_access_projection_service`
- `customer_access_route_registration`
- `customer_access_context_middleware`

Invalid matrix result reasonCodes:

- `invalid_event_matrix`
- `invalid_decision`
- `invalid_reason_code`
- `invalid_route`
- `invalid_method`
- `invalid_source`
- `invalid_input`
- `invalid_event_type`

## Task2104 Summary

Task2104 added the metadata matrix.

Global metadata keys:

- `routeMatched`
- `contextPresent`
- `identifierValid`
- `dependencyValid`
- `registrationResult`

Case and service allow/deny event metadata:

- `routeMatched`
- `contextPresent`
- `identifierValid`

Route registration success/failure metadata:

- `dependencyValid`
- `registrationResult`

Metadata value rules:

- boolean metadata must be actual booleans only
- `registrationResult` allowlist is `success`, `failure`, `invalid`, `skipped`, `unavailable`
- invalid metadata is omitted rather than failing the event
- cross-event metadata is omitted rather than failing the event
- contradictory metadata is omitted rather than failing the event

## Current Audit Event Output Contract

Audit event output keys remain:

- `eventType`
- `occurredAt`
- `requestId`
- `actorType`
- `organizationId`
- `customerId`
- `caseId`
- `reportId`
- `decision`
- `reasonCode`
- `route`
- `method`
- `source`
- `metadata`

## ReasonCode Rules

Allow and success events:

- do not emit `reasonCode`
- provided `reasonCode` fails closed with `invalid_reason_code`

Deny and failure events may emit only:

- `customerAccess.unavailable`
- `invalid_input`
- `invalid_context`
- `invalid_identifier`
- `access_denied`
- `not_found`
- `service_unavailable`
- `mount_target_invalid`
- `db_client_invalid`
- `route_registration_failed`

Unknown, sensitive, raw, SQL-like, or token-like `reasonCode` values fail closed with `invalid_reason_code` and do not leak raw input.

## Sensitive Data Non-Leakage

The audit event builder must not emit:

- raw request or response
- headers, rawHeaders, authorization, cookies, body, rawBody, query, or params object
- raw user, session, auth, channel, or access objects
- phone, address, email, or LINE raw identity
- tokens or secrets
- DB rows or query metadata
- provider payload or raw payload
- AI prompts or responses
- internal, engineer, diagnosis, completion, or private report notes
- debug, stack, or SQL
- env or Zeabur values
- payment or billing details
- unknown fields

## Static Boundary

The audit builder must not:

- import DB, env, app, server, routes, provider, AI, billing, repository, controller, or runtime modules
- call IO
- call listen/server APIs
- call fetch/network APIs
- access `process.env`
- call `Date.now`
- call `Math.random`
- call crypto randomness

The builder is not integrated into runtime routes or controllers in this branch.

## Next Branch Candidates

These are candidates only, not authorization:

- Customer Access audit writer contract skeleton
- Customer Access audit side-channel integration planning
- Customer Access runtime audit integration with injected writer
- Customer Access audit persistence repository contract
- Engineer Mobile audit event builder branch

## Verification

Run:

```sh
git diff --check -- docs/task-2105-customer-access-audit-event-builder-contract-branch-checkpoint-no-runtime-change.md
git status --short --branch
```

Node tests are not required for this docs-only checkpoint unless source or test files change.

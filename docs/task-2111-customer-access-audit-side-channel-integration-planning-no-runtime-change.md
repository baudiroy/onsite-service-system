# Task2111 - Customer Access Audit Side-Channel Integration Planning

## Status

- Task2110 is accepted, pushed, and synced.
- This document is planning-only and docs-only.
- No runtime audit integration is authorized or implemented by this task.
- No source, runtime, test, package, audit persistence, DB, migration, SQL, repository, query, route, controller, global mount, production mount, app, server, public routes, smoke, server, listener, network, Zeabur/env, provider, admin, AI, RAG, model, billing, settlement, payment, or invoice work was performed.
- The 7 held historical docs remain untracked and untouched.

## Existing Accepted Audit Components

### Audit Event Builder

Accepted by Task2101 through Task2105:

- pure dependency-free builder
- deterministic output
- no caller input mutation
- output isolation
- sensitive-data stripping
- no runtime integration

Supported event types:

- `customer_access.case_overview.allow`
- `customer_access.case_overview.deny`
- `customer_access.service_report.allow`
- `customer_access.service_report.deny`
- `customer_access.route_registration.success`
- `customer_access.route_registration.failure`

Accepted builder matrices:

- decision matrix for `allow`, `deny`, `success`, and `failure`
- reasonCode allowlist and invalid-result reason behavior
- route matrix for case overview, service report, and route registration events
- method matrix limited to `GET`
- source matrix for controller, projection service, context middleware, and route registration sources
- metadata matrix for route/context/identifier/dependency/registration result keys

### Audit Writer Result Normalizer

Accepted by Task2106 through Task2108:

- pure result normalizer
- no persistence
- no runtime integration
- recorded/skipped/failed status matrix
- safe reasonCode allowlist and fallbacks
- sensitive-data stripping
- deterministic output
- no caller input mutation
- output isolation

Normalized output keys:

- `ok`
- `status`
- `auditWritten`
- `persisted`
- `reasonCode`

### Injected Audit Writer Adapter

Accepted by Task2109 through Task2110:

- pure adapter skeleton
- writer shape is only `function writer(auditEvent)`
- explicit injected writer required
- no global fallback writer
- no object `write()` writer support
- writer result normalized through Task2106-Task2108 normalizer
- writer throw or rejection returns safe failed result
- malformed audit event fails before writer invocation
- writer receives sanitized audit event copy
- caller audit event input is not mutated
- no runtime integration

## Candidate Integration Points

The following are candidates only, not authorization.

### Case Overview Controller Or Facade Boundary

Candidate events:

- emit `customer_access.case_overview.allow` for valid allow response
- emit `customer_access.case_overview.deny` for safe-deny, invalid input, or access unavailable response

Candidate boundary options:

- `customer_access_controller`
- `customer_access_context_middleware`

Only one boundary should be chosen in a future runtime task to avoid duplicate audit events.

### Service-Report Projection HTTP Boundary

Candidate events:

- emit `customer_access.service_report.allow` for valid allow response
- emit `customer_access.service_report.deny` for safe-deny, invalid input, not found, query failure, or access unavailable response

Candidate boundary options:

- `customer_access_projection_service`
- `customer_access_controller`

Only one boundary should be chosen in a future runtime task to avoid duplicate audit events.

### Route Registration Boundary

Candidate events:

- emit `customer_access.route_registration.success` after successful injected registration summary
- emit `customer_access.route_registration.failure` after sanitized registration failure summary

Candidate source:

- `customer_access_route_registration`

## Side-Channel Behavior

Future audit writing must be side-channel only.

Required behavior for any future runtime integration:

- audit write failure must never change customer-facing HTTP status
- audit write failure must never change customer-facing response body
- audit write failure must never throw through request handling
- audit writer result must be normalized before any internal capture
- normalized audit writer result may be captured internally only through the safe result shape
- raw writer error, message, stack, or cause must never be customer-visible
- audit result must never be added to customer response body
- missing writer must default to safe no-writer behavior, not runtime failure

## Event Field Mapping

### Case Overview

Candidate mapping:

- `eventType`: `customer_access.case_overview.allow` or `customer_access.case_overview.deny`
- `route`: `/customer-access/:caseId`
- `method`: `GET`
- `source`: `customer_access_controller` or `customer_access_context_middleware`, depending on the future chosen boundary
- `caseId`: from validated route param or sanitized context only
- `organizationId`: from sanitized `customerAccessContext.auth` only when present and safe
- `customerId`: from sanitized `customerAccessContext.auth` only when present and safe
- `decision`: `allow` or `deny` per response
- `reasonCode`: sanitized deny/failure reason only when allowed by builder matrix

Do not map raw request, raw headers, raw auth object, entitlement graph, route object, handler function, DB result, provider detail, or query metadata.

### Service Report

Candidate mapping:

- `eventType`: `customer_access.service_report.allow` or `customer_access.service_report.deny`
- `route`: `/customer-access/:caseId/service-report/:reportId`
- `method`: `GET`
- `source`: `customer_access_projection_service` or `customer_access_controller`, depending on the future chosen boundary
- `caseId`: from validated route param or sanitized service input only
- `reportId`: from validated route param or sanitized service input only
- `organizationId`: from sanitized `customerAccessContext` only when present and safe
- `customerId`: from sanitized `customerAccessContext` only when present and safe
- `decision`: `allow` or `deny` per response
- `reasonCode`: sanitized deny/failure reason only when allowed by builder matrix

Do not map raw policy details, raw request, raw context object, provider payload, DB row, query metadata, private notes, or customer response body.

### Route Registration

Candidate mapping:

- `eventType`: `customer_access.route_registration.success` or `customer_access.route_registration.failure`
- `route`: from accepted registration summary only
- `method`: `GET`
- `source`: `customer_access_route_registration`
- `decision`: `success` or `failure`
- `reasonCode`: from sanitized registration failure reasonCode only

Do not map route objects, handler functions, app/server objects, registration stack traces, provider payload, DB details, or environment values.

## Audit Metadata Mapping

Case overview and service report allow/deny candidates may use:

- `routeMatched`
- `contextPresent`
- `identifierValid`

Route registration success/failure candidates may use:

- `dependencyValid`
- `registrationResult`

Metadata must not include:

- raw policy details
- deny reason text beyond safe reasonCode
- entitlement details
- organization graph
- provider or subcontractor details
- route objects
- handler functions
- DB results
- query metadata
- raw request or response
- headers, authorization, token, cookie, or session
- private notes, diagnostics, debug fields, or stack traces

## Future Runtime Task Boundaries

These are candidates only, not authorization.

### Future Task A

Add injected `auditWriter` optional dependency to one boundary only, likely case overview controller or facade, with focused tests.

Required constraints:

- optional injected writer only
- default to no writer or audit skipped safely
- no DB or persistence requirement
- no customer response body or status change
- use builder, writer adapter, and normalizer
- verify audit failure does not affect user response
- verify no raw request, context, provider, SQL, token, private data, route object, or handler function is included in audit event

### Future Task B

Add service-report projection HTTP boundary audit side-channel with focused tests.

Required constraints:

- optional injected writer only
- default to no writer or audit skipped safely
- no DB or persistence requirement
- no customer response body or status change
- use builder, writer adapter, and normalizer
- verify allow, deny, not found, query failure, and writer failure paths
- verify no raw request, context, provider, SQL, token, private data, DB result, or query metadata is included in audit event

### Future Task C

Add route registration audit side-channel with focused tests.

Required constraints:

- optional injected writer only
- default to no writer or audit skipped safely
- no DB or persistence requirement
- no production mount change
- no app/server/public routes change
- use builder, writer adapter, and normalizer
- verify success, failure, skipped writer, and writer failure paths
- verify no route object, handler function, server object, env value, provider value, SQL, token, or stack trace is included in audit event

## Explicit Non-Goals

This task does not authorize or perform:

- runtime integration
- source code changes
- test code changes
- package changes
- DB or audit persistence
- audit table, migration, or schema work
- repository/query changes
- route/controller/global mount changes
- production mount
- `src/app.js`, `src/server.js`, or `public.routes.js` changes
- provider sending
- AI, RAG, or model calls
- admin frontend work
- billing work
- smoke, endpoint, server, listener, network, Zeabur, or env work

## Verification

Run:

```sh
git diff --check -- docs/task-2111-customer-access-audit-side-channel-integration-planning-no-runtime-change.md
git status --short --branch
```

Node tests are not required for this docs-only planning task unless source or test files change.

# Task2101 - Customer Access Audit Event Contract Skeleton

## Scope

- Added a pure Customer Access audit event builder skeleton.
- Added focused unit tests and a static boundary test.
- Added this documentation checkpoint.
- The builder is not integrated into runtime routes, controllers, repositories, or persistence.
- No DB, audit log persistence, migration, SQL, smoke, server, listener, network, Zeabur/env, provider, admin, AI, billing, settlement, payment, invoice, package, route, controller, or global mount work was performed.
- The 7 held historical docs remain untracked and untouched.

## Added Module

- `src/customerAccess/customerAccessAuditEventBuilder.js`

The module is pure and dependency-free:

- no imports or `require`
- no IO
- no `process.env`
- no `Date.now`
- no DB, provider, AI, billing, route, controller, repository, app, or server dependency
- no runtime integration

## Result Shape

Valid normalized result:

```json
{
  "ok": true,
  "auditEvent": {}
}
```

Invalid or malformed result:

```json
{
  "ok": false,
  "reasonCode": "invalid_input"
}
```

The builder does not throw on malformed input.

## Supported Event Types

Exact supported event types:

- `customer_access.case_overview.allow`
- `customer_access.case_overview.deny`
- `customer_access.service_report.allow`
- `customer_access.service_report.deny`
- `customer_access.route_registration.success`
- `customer_access.route_registration.failure`

Unknown event types fail closed with:

```json
{
  "ok": false,
  "reasonCode": "invalid_event_type"
}
```

## Audit Event Output Keys

Exact audit event key allowlist:

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

Unknown input keys are omitted.

## Field Normalization

- `eventType` must be one of the supported event types.
- `decision` must be `allow`, `deny`, `success`, or `failure`; if omitted or invalid it is inferred from `eventType`.
- `occurredAt` must be an explicit UTC ISO-like string such as `2026-05-30T10:20:30.000Z`.
- `requestId`, `organizationId`, `customerId`, `caseId`, and `reportId` must be safe nonempty identifier strings.
- `actorType` must be `customer`, `runtime`, or `system`.
- `route` must be one of the accepted Customer Access route contracts.
- `method` currently normalizes only `GET`.
- `source` must be one of the accepted source labels.
- `reasonCode` must be one of the accepted reason labels.
- Unsafe or invalid values are omitted rather than emitted.

## Metadata Allowlist

Exact metadata keys:

- `routeMatched`
- `contextPresent`
- `identifierValid`
- `dependencyValid`
- `registrationResult`

Allowed primitive value types:

- `routeMatched`: boolean
- `contextPresent`: boolean
- `identifierValid`: boolean
- `dependencyValid`: boolean
- `registrationResult`: string label from `success`, `failure`, `invalid`, `skipped`, or `unavailable`

Nested objects, arrays, raw payloads, and unknown metadata keys are omitted.

## Sensitive Data Non-Leakage

The builder does not copy raw containers or unknown fields into audit output. Tests cover non-leakage for:

- raw request and raw response
- headers and rawHeaders
- authorization
- cookies
- body and rawBody
- query
- params object
- user, session, auth, channel, and access raw objects
- phone, address, email, and LINE raw identity
- tokens and secrets
- DB rows and query metadata
- provider payload and raw payload
- AI prompts and responses
- internal notes, engineer notes, diagnosis, completion notes, and private report body
- debug, stack, and SQL
- env and Zeabur values
- payment and billing details
- arbitrary unknown fields

## Static Boundary

The static guard confirms:

- the builder has no forbidden imports or runtime side effects
- the builder does not call IO, listen, fetch, process.env, DB/query, provider, AI, billing, or package/runtime systems
- the builder output contract is explicit and allowlisted
- the builder is not integrated into runtime routes, controllers, or service-report handlers in this task

## Verification

Run targeted tests:

```sh
node --test tests/customerAccess/customerAccessAuditEventBuilder.unit.test.js tests/customerAccess/customerAccessAuditEventBuilderBoundary.static.test.js
```

Run:

```sh
git diff --check
git status --short --branch
```

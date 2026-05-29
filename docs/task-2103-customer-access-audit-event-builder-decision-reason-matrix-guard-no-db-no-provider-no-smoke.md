# Task2103 - Customer Access Audit Event Builder Decision and Reason Matrix Guard

## Scope

- Added a pure event matrix inside the Customer Access audit event builder.
- Added unit and static guards for decision, reasonCode, route, method, and source consistency.
- Added this documentation checkpoint.
- The builder remains pure and is not integrated into runtime.
- No DB, audit persistence, migration, SQL, route, controller, global mount, production mount, smoke, server, listener, network, Zeabur/env, provider, admin, AI, billing, settlement, payment, invoice, package, app, server, or public-routes work was performed.
- The 7 held historical docs remain untracked and untouched.

## Final Decision Values

Exact final decision value per event type:

- `customer_access.case_overview.allow`: `allow`
- `customer_access.case_overview.deny`: `deny`
- `customer_access.service_report.allow`: `allow`
- `customer_access.service_report.deny`: `deny`
- `customer_access.route_registration.success`: `success`
- `customer_access.route_registration.failure`: `failure`

If an input explicitly provides a mismatched `decision`, the builder fails closed with:

```json
{
  "ok": false,
  "reasonCode": "invalid_decision"
}
```

## ReasonCode Behavior

Exact audit-event `reasonCode` allowlist:

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

Per-event behavior:

- allow events do not emit `reasonCode`
- success events do not emit `reasonCode`
- deny events may emit only the allowlisted `reasonCode`
- failure events may emit only the allowlisted `reasonCode`

If an allow/success event provides a `reasonCode`, or any event provides an unknown, sensitive, SQL-like, token-like, or raw `reasonCode`, the builder fails closed with:

```json
{
  "ok": false,
  "reasonCode": "invalid_reason_code"
}
```

## Route and Method Behavior

Case overview events may use only:

- route: `/customer-access/:caseId`
- method: `GET`

Service report events may use only:

- route: `/customer-access/:caseId/service-report/:reportId`
- method: `GET`

Route registration events may use only these public route contracts:

- `/customer-access/:caseId`
- `/customer-access/:caseId/service-report/:reportId`

No arbitrary route, near-match route, trailing-slash route, internal route, or unsupported method is emitted.

Invalid route result:

```json
{
  "ok": false,
  "reasonCode": "invalid_route"
}
```

Invalid method result:

```json
{
  "ok": false,
  "reasonCode": "invalid_method"
}
```

## Source Allowlist

Exact source allowlist:

- `customer_access_controller`
- `customer_access_projection_service`
- `customer_access_route_registration`
- `customer_access_context_middleware`

Per-event source behavior:

- case overview events: `customer_access_controller` or `customer_access_context_middleware`
- service report events: `customer_access_projection_service` or `customer_access_controller`
- route registration events: `customer_access_route_registration`

Invalid source result:

```json
{
  "ok": false,
  "reasonCode": "invalid_source"
}
```

Raw module paths, stack-like values, env/provider-like names, SQL fragments, and arbitrary user strings are rejected without leaking raw source values.

## Invalid Matrix ReasonCodes

Exact invalid result `reasonCode` values used by the matrix:

- `invalid_event_matrix`
- `invalid_decision`
- `invalid_reason_code`
- `invalid_route`
- `invalid_method`
- `invalid_source`

Existing invalid result values are preserved:

- `invalid_input`
- `invalid_event_type`

Invalid results keep the Task2101 shape:

```json
{
  "ok": false,
  "reasonCode": "invalid_event_matrix"
}
```

Invalid results do not include raw input, rejected route, rejected method, rejected source, rejected reasonCode, headers, tokens, SQL, debug data, or stack data.

## Regression Boundaries

Preserved from Task2101 and Task2102:

- supported event types remain unchanged
- audit event output keys remain unchanged
- metadata allowlist remains unchanged
- `{ ok: true, auditEvent }` and `{ ok: false, reasonCode }` result shapes remain unchanged
- immutability and deterministic output remain unchanged
- output isolation remains unchanged
- sensitive data stripping remains unchanged
- static side-effect guard remains unchanged
- audit builder remains not integrated into runtime

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

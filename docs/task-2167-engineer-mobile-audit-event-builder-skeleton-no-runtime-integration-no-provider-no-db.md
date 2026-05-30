# Task2167 Engineer Mobile Audit Event Builder Skeleton / No Runtime Integration No Provider No DB

## Status

Task2167 adds a pure Engineer Mobile audit event builder skeleton and focused tests. It does not integrate the builder into Engineer Mobile runtime, routes, controllers, app/server, production mount, DB, providers, or smoke flows.

## Changed Files

- `src/engineerMobile/engineerMobileAuditEventBuilder.js`
- `tests/engineerMobile/engineerMobileAuditEventBuilder.unit.test.js`
- `tests/engineerMobile/engineerMobileAuditEventBuilderBoundary.static.test.js`
- `docs/task-2167-engineer-mobile-audit-event-builder-skeleton-no-runtime-integration-no-provider-no-db.md`

## Exported API

`src/engineerMobile/engineerMobileAuditEventBuilder.js` exports:

- `buildEngineerMobileAuditEvent(input)`
- `SUPPORTED_ENGINEER_MOBILE_AUDIT_EVENT_TYPES`
- `ENGINEER_MOBILE_AUDIT_EVENT_KEYS`
- `ENGINEER_MOBILE_AUDIT_METADATA_KEYS`

Result shape:

- valid: `{ ok: true, auditEvent }`
- invalid or malformed: `{ ok: false, reasonCode }`

The builder does not throw on malformed input.

## Supported Event Types

Only these event types are supported:

- `engineer_mobile.task_list.allow`
- `engineer_mobile.task_list.deny`
- `engineer_mobile.task_detail.allow`
- `engineer_mobile.task_detail.deny`
- `engineer_mobile.visit_action.allow`
- `engineer_mobile.visit_action.deny`
- `engineer_mobile.route_registration.success`
- `engineer_mobile.route_registration.failure`

Unknown event types fail closed with `reasonCode: "invalid_event_type"` and do not emit arbitrary `eventType` values.

## Audit Event Output Keys

Audit events are built from this explicit top-level allowlist only:

- `eventType`
- `occurredAt`
- `requestId`
- `actorType`
- `organizationId`
- `engineerId`
- `caseId`
- `appointmentId`
- `action`
- `decision`
- `reasonCode`
- `route`
- `method`
- `source`
- `metadata`

Optional fields are omitted when missing or unsafe. Missing `occurredAt` and `requestId` remain omitted. The builder does not generate timestamps.

## Decision Route Method Source Matrix

Task list:

- event types: `engineer_mobile.task_list.allow`, `engineer_mobile.task_list.deny`
- route: `/engineer-mobile/tasks`
- method: `GET`
- source: `engineer_mobile_task_list_handler`
- decisions: `allow`, `deny`
- action: not allowed

Task detail:

- event types: `engineer_mobile.task_detail.allow`, `engineer_mobile.task_detail.deny`
- route: `/engineer-mobile/tasks/:appointmentId`
- method: `GET`
- source: `engineer_mobile_task_detail_handler`
- decisions: `allow`, `deny`
- action: not allowed

Visit action:

- event types: `engineer_mobile.visit_action.allow`, `engineer_mobile.visit_action.deny`
- route: `/engineer-mobile/appointments/:appointmentId/actions/:action`
- method: `POST`
- source: `engineer_mobile_visit_action_handler`
- decisions: `allow`, `deny`
- action: required and must be one of:
  - `engineer_mobile.start_travel`
  - `engineer_mobile.arrive`
  - `engineer_mobile.start_work`
  - `engineer_mobile.finish_work`
  - `engineer_mobile.record_visit_result`

Route registration:

- event types: `engineer_mobile.route_registration.success`, `engineer_mobile.route_registration.failure`
- routes:
  - `/engineer-mobile/tasks`
  - `/engineer-mobile/tasks/:appointmentId`
  - `/engineer-mobile/appointments/:appointmentId/actions/:action`
- methods:
  - `GET` for task list/detail routes
  - `POST` for visit action route
- source: `engineer_mobile_route_registration`
- decisions: `success`, `failure`
- action: not allowed

Mismatched decision, route, method, source, or action fails closed.

## ReasonCode Behavior

Allow and registration success events do not emit `reasonCode`. If a reason code is supplied for those event types, the builder fails closed with `invalid_reason_code`.

Deny and registration failure events may emit only these safe reason codes:

- `engineerMobile.unavailable`
- `invalid_input`
- `invalid_context`
- `invalid_identifier`
- `permission_denied`
- `assignment_not_found`
- `action_not_allowed`
- `service_unavailable`
- `mount_target_invalid`
- `route_registration_failed`

Unknown, token-like, SQL-like, secret-like, or raw reason code values fail closed with `invalid_reason_code` and are not emitted.

Invalid result reason codes are limited to:

- `invalid_input`
- `invalid_event_type`
- `invalid_event_matrix`
- `invalid_decision`
- `invalid_reason_code`
- `invalid_route`
- `invalid_method`
- `invalid_source`
- `invalid_action`

## Metadata Behavior

Metadata is optional and allowlisted.

Allowed metadata keys:

- `routeMatched`
- `contextPresent`
- `identifierValid`
- `permissionPassed`
- `actionAllowed`
- `dependencyValid`
- `registrationResult`

Boolean metadata must be actual booleans only. String booleans and nested/raw values are ignored. Unknown metadata keys are ignored.

`registrationResult`, when allowed, must be one of:

- `success`
- `failure`
- `invalid`
- `skipped`
- `unavailable`

Registration success events only keep `registrationResult: "success"`. Registration failure events keep non-success safe labels.

Returned metadata is newly built and does not share mutable references with caller input.

## Sanitization And Non-Leakage

The builder omits unsafe identifiers and never copies unknown fields. Audit event JSON must not contain:

- raw request/response
- headers/rawHeaders/authorization/cookies/tokens
- body/query/params objects
- raw user/session/auth/channel/access objects
- customer phone/address/email/LINE raw identity
- raw engineer context
- raw service result
- DB rows/query metadata
- provider payload/raw payload
- LINE/SMS/email/app push payload
- AI prompts/responses
- debug/stack/sql
- internal/private/admin-only fields
- completion report private body
- engineer private notes
- customer private notes
- arbitrary unknown fields

## Determinism And Side-Effect Boundaries

The builder is pure and dependency-free:

- no imports
- no IO
- no `Date.now()` or `new Date()`
- no `Math.random()` or crypto randomness
- no `process.env`
- no global state
- no fetch/network APIs
- no provider APIs
- no DB APIs
- no server/listener startup
- no runtime integration

Repeated safe input returns deep-equal output. Caller input is not mutated.

## Verification

Targeted Task2167 tests:

```bash
node --test tests/engineerMobile/engineerMobileAuditEventBuilder.unit.test.js tests/engineerMobile/engineerMobileAuditEventBuilderBoundary.static.test.js
```

Result: PASS, 20/20.

Expected final checks:

```bash
git diff --check
git status --short --branch
```

## Explicit Non-Goals

Task2167 did not perform:

- Engineer Mobile audit runtime integration
- audit writer implementation
- provider sending
- DB execution
- DB connection creation
- migration apply or dry-run
- SQL execution
- `psql`, `DATABASE_URL`, env, Zeabur, or secrets inspection
- route/controller/global mount changes
- production mount activation
- app/server/public routes changes
- Customer Access changes
- smoke or endpoint probes
- server/listener startup
- AI/RAG/provider/model calls
- admin frontend work
- billing/payment work
- package/package-lock changes

The 7 held historical docs remain out of scope and must remain untracked and untouched.

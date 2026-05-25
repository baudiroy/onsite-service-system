# Task 196 - SLA / Operations Risk API Error Response Shape Draft / No Runtime Change

## Purpose and Non-Goals

Task196 defines a documentation-only API error response shape draft for future SLA / operations risk workflows.

This document proposes safe response fields, forbidden metadata, correlation/reference handling, non-leaking response behavior, and Admin UI consumption notes. It does not define final production API response shape, create API implementation, create OpenAPI / Swagger / generated client files, create executable validation schemas, create backend source code, create Admin source code, create logging or redaction utilities, create tests, implement entitlement runtime, implement SaaS billing, or change runtime behavior.

Task196 builds on:

- `docs/PROJECT_GUARDRAILS.md`
- the user-provided short guardrails version synced with PM
- `docs/task-188-sla-operations-risk-safe-error-and-permission-failure-copy-draft-no-runtime-change.md`
- `docs/task-190-sla-operations-risk-api-error-allow-list-review-no-runtime-change.md`
- `docs/task-191-sla-operations-risk-403-vs-404-non-leakage-decision-packet-no-runtime-change.md`
- `docs/task-193-sla-operations-risk-internal-diagnostic-redaction-policy-no-runtime-change.md`
- `docs/task-194-sla-operations-risk-diagnostic-data-classification-matrix-no-runtime-change.md`
- `docs/task-195-sla-operations-risk-qa-artifact-redaction-checklist-no-runtime-change.md`

Task196 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify API behavior,
- modify smoke, browser smoke, automated tests, or QA scripts,
- modify logging or redaction utilities,
- modify OpenAPI / Swagger / generated client files,
- modify `package.json`,
- add a migration file,
- change schema or indexes,
- apply or dry-run Migration 020,
- connect to DB,
- use psql,
- run `npm run db:migrate`,
- execute DDL,
- add SLA runtime,
- add operations risk runtime,
- add entitlement runtime,
- add usage metering runtime,
- add SaaS billing / subscription / payment implementation,
- add dashboard implementation,
- add notification sending,
- send LINE / APP / SMS / email,
- enable survey runtime,
- enable delivery resolver runtime,
- enable outbox worker,
- add AI automatic decisions,
- change Case / Appointment / Report behavior,
- change `finalAppointmentId` logic,
- modify inventory docs,
- perform destructive cleanup,
- output sensitive values.

## Source-of-Truth Guardrails

Task196 preserves:

- one Case = one formal Field Service Report,
- one Case may have many appointments / dispatch visits,
- same Case must not have multiple open appointments at once,
- Field Service Report remains the Case-level final summary,
- `finalAppointmentId` remains backend / system determined and stable after completion,
- LINE is a channel, not the hard-coded core model,
- `line_user_id` is not global identity,
- all major future data must be organization / tenant scoped,
- permission and entitlement are separate concepts,
- customer-visible data and internal-only data must be separated,
- AI is advisory only,
- future design notes do not authorize runtime implementation.

API error response shape must not become a channel for leaking hidden resources, tenant boundaries, customer data, provider data, or diagnostics.

## Current Architecture Assumptions

Task196 assumes:

- no SLA / operations risk runtime exists,
- no SLA / operations risk API exists,
- no SLA / operations risk Admin dashboard exists,
- no executable error response schema exists,
- no OpenAPI / generated client contract exists for this branch,
- no entitlement runtime exists,
- no SaaS subscription / billing / usage runtime exists,
- no notification provider delivery is approved,
- survey runtime remains paused,
- AI remains advisory only.

This response shape draft is future-facing only.

## API Error Response Shape Principles

Future API error responses should:

1. be allow-listed,
2. expose safe codes and safe message keys,
3. avoid raw human text if localization / i18n will be used later,
4. provide safe retry guidance when useful,
5. use opaque correlation references,
6. avoid raw identifiers,
7. avoid hidden resource existence leakage,
8. avoid raw diagnostics,
9. distinguish permission and entitlement conceptually without leaking internals,
10. remain stable enough for Admin UI handling.

## Proposal-Only Response Shape Overview

Proposal-only shape:

```json
{
  "error": {
    "code": "<safe-error-code>",
    "messageKey": "<safe-message-key>",
    "safeMessage": "<safe-message>",
    "retryHint": "<retry-hint-or-null>",
    "correlationId": "<opaque-correlation-id>",
    "fields": [
      {
        "field": "<allow-listed-field>",
        "code": "<safe-field-error-code>"
      }
    ]
  }
}
```

This is not an implemented schema and must not be copied into OpenAPI without future review.

## Allowed Safe Response Fields

Future response fields may include:

| Field | Purpose | Safety rule |
| --- | --- | --- |
| `error.code` | stable safe code | allow-listed only |
| `error.messageKey` | localization key | no raw data |
| `error.safeMessage` | optional safe fallback copy | no sensitive context |
| `error.retryHint` | tells UI next step | enum-like only |
| `error.correlationId` | support reference | opaque, not credential |
| `error.fields[].field` | allow-listed field label | no raw submitted value |
| `error.fields[].code` | safe field-level code | allow-listed only |

Suggested retry hints:

- `refresh`
- `review_permission`
- `ask_authorized_reviewer`
- `try_later`
- `return_to_queue`
- `none`

## Forbidden Response Fields and Metadata

Future responses must not include:

- raw request body,
- raw response body,
- raw query string,
- raw headers,
- customer mobile / phone / tel values,
- raw LINE user id,
- LINE channel secret,
- LINE access token,
- provider credentials,
- token values,
- password values,
- `DATABASE_URL`,
- URLs with embedded secrets,
- raw provider payload,
- raw customer payload,
- full Case / customer / appointment / report payload,
- stack traces,
- SQL errors,
- DB constraint names,
- provider raw errors,
- internal diagnostic payloads,
- real tenant identifiers,
- real organization identifiers,
- hidden resource ids,
- hidden evidence counts,
- hidden audit counts,
- AI prompts or raw AI outputs.

## Correlation / Reference Handling

Correlation ids should be opaque support references.

They should not be:

- database primary keys,
- tenant ids,
- organization ids,
- user ids,
- raw request ids from providers if those reveal account details,
- encoded payloads,
- tokens,
- secrets.

Safe pattern:

```json
{
  "error": {
    "code": "RISK_STALE_STATE",
    "messageKey": "operationsRisk.error.staleState",
    "retryHint": "refresh",
    "correlationId": "<opaque-correlation-id>"
  }
}
```

## Permission and Organization-Scope Response Shape

If the user can see the item but lacks action permission:

```json
{
  "error": {
    "code": "RISK_PERMISSION_DENIED",
    "messageKey": "operationsRisk.error.permissionDenied",
    "retryHint": "review_permission",
    "correlationId": "<opaque-correlation-id>"
  }
}
```

If visibility is uncertain or organization / tenant scope does not match:

```json
{
  "error": {
    "code": "RISK_ITEM_NOT_AVAILABLE",
    "messageKey": "operationsRisk.error.notAvailable",
    "retryHint": "return_to_queue",
    "correlationId": "<opaque-correlation-id>"
  }
}
```

Do not reveal whether the hidden item exists.

## Entitlement / Feature / Plan / Usage Response Shape

For normal operators, future entitlement errors should be generic:

```json
{
  "error": {
    "code": "RISK_FEATURE_NOT_ENABLED",
    "messageKey": "operationsRisk.error.featureUnavailable",
    "retryHint": "ask_authorized_reviewer",
    "correlationId": "<opaque-correlation-id>"
  }
}
```

Do not include plan names, usage counts, pricing, billing event ids, or exact limits unless a future tenant admin / billing admin context is explicitly approved.

## Resource Visibility / Not-Found Response Shape

For hidden, nonexistent, or out-of-scope resources:

```json
{
  "error": {
    "code": "RISK_ITEM_NOT_AVAILABLE",
    "messageKey": "operationsRisk.error.notAvailable",
    "retryHint": "return_to_queue",
    "correlationId": "<opaque-correlation-id>"
  }
}
```

Resource-specific context may be unavailable only when the parent item is already visible:

```json
{
  "error": {
    "code": "RISK_CONTEXT_NOT_AVAILABLE",
    "messageKey": "operationsRisk.error.contextUnavailable",
    "retryHint": "none",
    "correlationId": "<opaque-correlation-id>"
  }
}
```

`RISK_CONTEXT_NOT_AVAILABLE` is a proposal-only generic code and does not replace the Task189 draft list unless future review approves it.

## Audit and Evidence Access Response Shape

If the user can see the risk item but cannot view evidence:

```json
{
  "error": {
    "code": "RISK_EVIDENCE_PERMISSION_DENIED",
    "messageKey": "operationsRisk.error.evidenceUnavailable",
    "retryHint": "ask_authorized_reviewer",
    "correlationId": "<opaque-correlation-id>"
  }
}
```

If the user cannot see the parent item, collapse to not available.

Do not return evidence counts, audit counts, object keys, file paths, provider payload types, or hidden actor details.

## Invalid Action / Workflow-State Response Shape

For visible item invalid action:

```json
{
  "error": {
    "code": "RISK_INVALID_ACTION",
    "messageKey": "operationsRisk.error.invalidAction",
    "retryHint": "refresh",
    "correlationId": "<opaque-correlation-id>"
  }
}
```

For missing reason:

```json
{
  "error": {
    "code": "RISK_REASON_REQUIRED",
    "messageKey": "operationsRisk.error.reasonRequired",
    "retryHint": "none",
    "correlationId": "<opaque-correlation-id>",
    "fields": [
      {
        "field": "reasonCode",
        "code": "FIELD_REQUIRED"
      }
    ]
  }
}
```

Field labels must be allow-listed and must not echo raw input.

## Stale / Concurrent Update Response Shape

For visible stale-state conflicts:

```json
{
  "error": {
    "code": "RISK_STALE_STATE",
    "messageKey": "operationsRisk.error.staleState",
    "retryHint": "refresh",
    "correlationId": "<opaque-correlation-id>"
  }
}
```

For concurrent update:

```json
{
  "error": {
    "code": "RISK_CONCURRENT_UPDATE",
    "messageKey": "operationsRisk.error.concurrentUpdate",
    "retryHint": "refresh",
    "correlationId": "<opaque-correlation-id>"
  }
}
```

Do not expose the other actor identity unless future audit visibility permits it.

## AI Advisory Limitation Response Shape

AI advisory responses should not imply AI authority.

```json
{
  "error": {
    "code": "RISK_AI_ADVISORY_UNAVAILABLE",
    "messageKey": "operationsRisk.error.aiUnavailable",
    "retryHint": "none",
    "correlationId": "<opaque-correlation-id>"
  }
}
```

If AI feature entitlement is not enabled:

```json
{
  "error": {
    "code": "RISK_AI_FEATURE_NOT_ENABLED",
    "messageKey": "operationsRisk.error.aiFeatureUnavailable",
    "retryHint": "ask_authorized_reviewer",
    "correlationId": "<opaque-correlation-id>"
  }
}
```

Do not include prompts, raw outputs, model/provider diagnostics, hidden context, or inferred sensitive facts.

## Channel / Provider Readiness Response Shape

Provider and channel errors should remain channel-agnostic by default.

```json
{
  "error": {
    "code": "RISK_CHANNEL_NOT_AVAILABLE",
    "messageKey": "operationsRisk.error.channelUnavailable",
    "retryHint": "none",
    "correlationId": "<opaque-correlation-id>"
  }
}
```

Do not include raw LINE user id, channel secret, access token, provider account id, recipient contact value, or provider raw error.

## Localization / i18n Readiness Notes

Future responses should prefer `messageKey` over hard-coded copy.

`safeMessage` may be included only as a safe fallback if future implementation approves it. Localization files are not created by Task196.

Message keys should:

- be stable,
- be channel-agnostic,
- avoid provider names,
- avoid customer values,
- avoid tenant names,
- map to safe copy from Task188.

## Admin UI Consumption Notes

Future Admin UI should:

- use `error.code` for behavior,
- use `messageKey` or approved localized copy for display,
- use `retryHint` for next-step affordance,
- show correlation id only as opaque support reference,
- avoid displaying raw metadata,
- treat missing details as unavailable rather than hidden proof.

Admin UI should not infer official workflow state from error codes alone.

## Sensitive-Data Redaction and Metadata Boundaries

Task196 follows Task193 and Task194:

- only allow-listed metadata should appear,
- diagnostics stay out of responses,
- hidden data stays hidden,
- tenant / organization isolation is preserved,
- provider/channel diagnostics stay protected,
- AI raw context stays hidden.

## API Allow-List Alignment with Task190

Task196 response shape supports Task190 exposure classes:

- Admin-client safe codes may use the shape when visibility is safe.
- Generic safe-deny codes use the same shape without revealing hidden context.
- Internal-only diagnostics do not appear.
- Never-expose content does not appear.
- Future-only entitlement codes remain future-only until runtime exists.

## 403 vs 404 Alignment with Task191

Task196 does not decide HTTP status. It defines safe body shape.

Future status mapping should still follow Task191:

- explicit permission denial only when item visibility is safe,
- generic not available when visibility is uncertain,
- organization / tenant mismatch collapses to generic not available.

## Diagnostic Redaction Alignment with Task193 / Task194

Task196 response shape excludes diagnostic-protected and prohibited data.

## QA Artifact Alignment with Task195

Any copied response examples in QA artifacts must be sanitized and placeholder-only.

## SaaS Entitlement Guardrail Alignment

Task196 preserves:

- permission vs entitlement separation,
- generic feature unavailable for normal operators,
- no plan internals by default,
- no usage counts by default,
- no billing/subscription implementation.

## Alignment with Task173-Task189 / Task192

Task196 aligns with:

- review-first operations risk design,
- no runtime implementation,
- no migration,
- organization scope,
- RBAC separation,
- audit/evidence separation,
- safe copy,
- safe error code catalog,
- resource enumeration test planning,
- AI advisory only,
- channel abstraction.

## Implementation Blockers and Required Approvals

Before API error response shape is implemented, approve:

- final response schema,
- final error code catalog,
- final HTTP status mapping,
- final message key strategy,
- localization process,
- field error allow-list,
- correlation id generation policy,
- logging and diagnostic redaction,
- Admin UI error handling,
- entitlement and usage exposure policy,
- security review,
- test plan.

This document does not approve implementation.

## Future Task Candidates

Possible follow-up tasks:

1. SLA / Operations Risk Entitlement Failure UX Draft / No Runtime Change.
2. SLA / Operations Risk API Error Field Allow-List Draft / No Runtime Change.
3. SLA / Operations Risk Error Handling Readiness Gate / No Runtime Change.
4. SLA / Operations Risk Localization Copy Pack Draft / No Admin Code Change.
5. SLA / Operations Risk Security Review Checklist / No Runtime Change.

## Verification Checklist

Before using Task196 as input to future implementation, verify:

- `docs/PROJECT_GUARDRAILS.md` still applies,
- Task196 is still proposal-only,
- response fields are allow-listed,
- forbidden metadata remains forbidden,
- correlation ids remain opaque,
- field errors do not echo raw input,
- entitlement responses do not leak plan internals,
- provider/channel responses do not leak provider details,
- AI responses do not expose prompts or raw outputs,
- no OpenAPI / generated client approval is implied.

## Task196 Completion Note

Task196 is complete as a documentation-only API error response shape draft.

No backend source, Admin source, API implementation, route/controller/service/repository, smoke test, automated test, QA script, logging utility, redaction utility, OpenAPI/generated client, executable validation schema, executable config, migration, schema, index, DB, DDL, entitlement runtime, usage metering, SaaS billing/subscription/payment, provider sending, survey runtime, AI automatic decision, or inventory documentation was changed.

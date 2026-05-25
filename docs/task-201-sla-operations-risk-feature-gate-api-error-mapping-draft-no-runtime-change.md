# Task 201 - SLA / Operations Risk Feature Gate API Error Mapping Draft / No Runtime Change

## Purpose and Non-Goals

Task201 defines a documentation-only draft for mapping future SLA / operations risk feature gate outcomes to safe API error behavior.

This document maps entitlement, permission, scope, usage, export, AI add-on, advanced feature, and hidden-resource failures to proposal-only error codes and non-leaking response behavior. It is not implemented API behavior.

Task201 builds on:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-189-sla-operations-risk-error-code-catalog-draft-no-runtime-change.md`
- `docs/task-190-sla-operations-risk-api-error-allow-list-review-no-runtime-change.md`
- `docs/task-191-sla-operations-risk-403-vs-404-non-leakage-decision-packet-no-runtime-change.md`
- `docs/task-192-sla-operations-risk-resource-enumeration-test-plan-no-runtime-change.md`
- `docs/task-193-sla-operations-risk-internal-diagnostic-redaction-policy-no-runtime-change.md`
- `docs/task-194-sla-operations-risk-diagnostic-data-classification-matrix-no-runtime-change.md`
- `docs/task-195-sla-operations-risk-qa-artifact-redaction-checklist-no-runtime-change.md`
- `docs/task-196-sla-operations-risk-api-error-response-shape-draft-no-runtime-change.md`
- `docs/task-197-sla-operations-risk-entitlement-failure-ux-draft-no-runtime-change.md`
- `docs/task-198-sla-operations-risk-entitlement-feature-key-review-no-runtime-change.md`
- `docs/task-199-sla-operations-risk-entitlement-to-permission-mapping-matrix-no-runtime-change.md`
- `docs/task-200-sla-operations-risk-first-release-entitlement-subset-decision-packet-no-runtime-change.md`

Task201 does not:

- define final production API error mapping,
- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify API behavior,
- modify permission runtime,
- modify entitlement runtime,
- modify routes, controllers, services, repositories, validators, mappers, or middleware,
- modify smoke, browser smoke, automated tests, or QA scripts,
- modify logging or redaction utilities,
- modify OpenAPI / Swagger / generated client files,
- modify executable schemas or config,
- modify `package.json`,
- add a migration file,
- change schema or indexes,
- apply or dry-run Migration 020,
- connect to DB,
- use psql,
- run `npm run db:migrate`,
- execute DDL,
- create usage metering runtime,
- create SaaS billing, subscription, payment, plan, or pricing runtime,
- add notification sending,
- send LINE / APP / SMS / email,
- enable survey runtime,
- enable AI automatic decisions,
- modify inventory docs,
- output sensitive values.

## Source-of-Truth Guardrails

Task201 preserves:

- one Case = one formal Field Service Report,
- one Case may have many appointments / dispatch visits,
- same Case must not have multiple open appointments at once,
- Field Service Report remains the Case-level final summary,
- `finalAppointmentId` remains backend / system determined and stable after completion,
- LINE is a channel, not the hard-coded core model,
- `line_user_id` is not global identity,
- all major future data remains organization / tenant scoped,
- permission and entitlement remain separate concepts,
- entitlement does not bypass RBAC,
- RBAC does not grant a feature that the organization does not have,
- customer-visible data and internal-only data remain separated,
- AI is advisory only,
- future design notes do not authorize runtime implementation.

## Current Architecture Assumptions

Task201 assumes:

- no SLA / operations risk runtime exists,
- no SLA / operations risk API exists,
- no SLA / operations risk Admin dashboard exists,
- no entitlement runtime exists,
- no permission runtime changes are approved,
- no usage metering runtime exists,
- no SaaS billing / subscription / payment runtime exists,
- no plan/pricing runtime exists,
- no notification provider delivery is approved,
- survey runtime remains paused,
- AI remains advisory only.

## Feature Gate API Error Mapping Principles

Future feature gate error behavior should:

1. disclose only safe, allow-listed information,
2. avoid hidden resource existence leakage,
3. avoid organization / tenant leakage,
4. avoid plan, pricing, usage, and provider diagnostics,
5. avoid raw customer/contact/channel values,
6. avoid raw payload and internal diagnostic dumps,
7. distinguish entitlement and permission internally without leaking unsafe detail,
8. preserve 403 vs 404 non-leakage decisions,
9. keep AI advisory errors non-authoritative,
10. remain testable through resource enumeration cases.

## Feature Gate Decision Categories

| Category | Meaning | Default safe posture |
| --- | --- | --- |
| entitlement missing | organization does not have feature enabled | feature unavailable unless visibility requires generic denial |
| feature disabled | feature intentionally disabled pending approval | feature unavailable |
| permission missing | user lacks action/view permission | permission denied only if resource visibility is already allowed |
| organization / tenant scope mismatch | resource is outside allowed tenant scope | generic not available |
| usage limit reached | future usage gate blocks action | limited/unavailable without values |
| export not enabled | export feature unavailable | export unavailable |
| AI add-on not enabled | AI advisory feature unavailable | AI suggestion unavailable; manual review remains |
| advanced feature unavailable | advanced rules/config unavailable | feature unavailable |
| resource hidden / not visible | caller cannot know resource exists | generic not available |

## Error Code Mapping Overview

| Feature gate outcome | Proposed safe code | Status style | Safe message direction |
| --- | --- | --- | --- |
| entitlement missing | `RISK_FEATURE_NOT_ENABLED` or `RISK_ENTITLEMENT_REQUIRED` | 403 if safe | feature not available |
| feature disabled until approval | `RISK_FEATURE_NOT_ENABLED` | 403 if safe | feature not available |
| permission missing | `RISK_PERMISSION_DENIED` | 403 if item visible | no permission |
| higher reviewer required | `RISK_ACTION_REQUIRES_REVIEWER` | 403 if item visible | higher review needed |
| organization scope mismatch | `RISK_ITEM_NOT_AVAILABLE` | 404-style | item not available |
| queue scope mismatch | `RISK_QUEUE_SCOPE_DENIED` or generic unavailable | 403 or 404-style | queue not available |
| usage limit reached | `RISK_USAGE_LIMIT_REACHED` | 429 or 403 future policy | usage currently limited |
| plan limit reached | `RISK_PLAN_LIMIT_REACHED` | 403 or 429 future policy | limit reached |
| export not enabled | `RISK_EXPORT_NOT_ENABLED` | 403 if safe | export unavailable |
| AI add-on not enabled | `RISK_AI_ADDON_NOT_ENABLED` | 403 if safe | AI suggestion unavailable |
| hidden case/appointment/report context | `RISK_ITEM_NOT_AVAILABLE` | 404-style | item not available |
| stale gate decision | `RISK_STALE_STATE` | 409 if item visible | refresh |

These codes are proposal-only and do not create runtime behavior.

## Entitlement Missing / Feature Disabled Mapping

For normal operators:

- prefer `RISK_FEATURE_NOT_ENABLED`,
- do not expose plan names,
- do not expose feature keys,
- do not expose usage values,
- do not expose pricing or provider details.

For future authorized tenant admins:

- a safe feature unavailable message may include an approved next step,
- detailed plan or entitlement visibility requires a separate policy.

If resource visibility is uncertain, collapse to generic not available.

## Permission Missing Mapping

Use explicit permission denial only when:

- the user is authenticated,
- the organization context is valid,
- the user can already see the item or queue,
- the failed action is safe to disclose,
- the message does not reveal hidden evidence, audit, entitlement, or customer context.

Otherwise use generic not available.

Suggested safe code:

- `RISK_PERMISSION_DENIED`
- `RISK_ACTION_REQUIRES_REVIEWER`
- `RISK_QUEUE_SCOPE_DENIED`

## Organization / Tenant Scope Mismatch Mapping

Organization / tenant scope failures should usually collapse to not available.

Recommended outward behavior:

- code: `RISK_ITEM_NOT_AVAILABLE`,
- status style: 404-style,
- message: "This item is not available."

Do not reveal whether the hidden item exists in another tenant, belongs to another organization, or has a different channel binding.

## Usage Limit / Export Limit Mapping

Usage and export behavior is future-only.

| Scenario | Proposed code | Boundary |
| --- | --- | --- |
| usage window limited | `RISK_USAGE_LIMIT_REACHED` | no usage values |
| plan limit reached | `RISK_PLAN_LIMIT_REACHED` | no plan/pricing detail |
| export unavailable | `RISK_EXPORT_NOT_ENABLED` | no hidden counts |
| export permission missing | `RISK_PERMISSION_DENIED` or generic unavailable | depends on visibility |

The response must not include raw usage values, billing diagnostics, provider diagnostics, or hidden export counts.

## AI Add-On / AI Feature Mapping

AI feature failures must preserve advisory-only boundaries.

| Scenario | Proposed code | Safe message direction |
| --- | --- | --- |
| AI add-on unavailable | `RISK_AI_ADDON_NOT_ENABLED` | AI suggestion is not available |
| AI hint permission missing | `RISK_PERMISSION_DENIED` if item visible | no permission |
| AI context hidden | `RISK_ITEM_NOT_AVAILABLE` | item not available |
| AI runtime unavailable in future | `RISK_AI_ADVISORY_UNAVAILABLE` if added to catalog | review manually |

AI errors must not imply AI would have made an official decision.

## Advanced Feature / Disabled-Until-Approved Mapping

Advanced features should fail closed until separately approved.

| Scenario | Proposed code | Notes |
| --- | --- | --- |
| advanced rules unavailable | `RISK_FEATURE_NOT_ENABLED` | no rule internals |
| custom thresholds unavailable | `RISK_FEATURE_NOT_ENABLED` | no hidden threshold values |
| business-hours config unavailable | `RISK_FEATURE_NOT_ENABLED` | no internal policy leak |
| audit view unavailable | `RISK_AUDIT_PERMISSION_DENIED` or generic unavailable | depends on visibility |
| API access unavailable | `RISK_FEATURE_NOT_ENABLED` or generic unavailable | avoid external enumeration |

Disabled-until-approved features must not expose hidden feature details to normal users.

## Resource Hidden / Not Visible Mapping

If the caller may not know whether a resource exists, use generic not available.

Candidate outward code:

- `RISK_ITEM_NOT_AVAILABLE`

Avoid more specific codes when they reveal:

- hidden Case existence,
- hidden appointment existence,
- hidden report existence,
- hidden evidence existence,
- hidden audit existence,
- hidden channel binding,
- hidden entitlement availability,
- hidden provider readiness.

## Generic Safe-Deny Mapping

Generic safe-deny is the fallback when the system cannot safely distinguish what the caller is allowed to know.

Suggested public shape:

```json
{
  "error": {
    "code": "RISK_ITEM_NOT_AVAILABLE",
    "messageKey": "operationsRisk.error.itemNotAvailable",
    "safeMessage": "This item is not available.",
    "retryHint": "none",
    "correlationId": "<opaque-correlation-id>"
  }
}
```

This is a proposal-only response example and must not be copied into OpenAPI without future review.

## 403 vs 404 Decision Alignment

Align with Task191:

- use explicit 403 when the caller can already see the resource and the action denial is safe,
- use 404-style not available when resource visibility is uncertain,
- collapse permission / scope / entitlement / not-found failures when needed to avoid enumeration,
- use 409 for stale or conflict states only when the item is already visible,
- use 400 validation errors only with allow-listed fields.

## API Error Response Shape Alignment

Align with Task196 response fields:

- `error.code`
- `error.messageKey`
- `error.safeMessage`
- `error.retryHint`
- `error.correlationId`
- `error.fields[]` only for allow-listed validation fields

Do not include:

- raw request or response body,
- raw customer/contact/channel values,
- raw provider payload,
- full Case / customer / appointment / report payload,
- stack traces,
- SQL errors,
- DB constraint names,
- provider raw errors,
- internal diagnostic payload,
- hidden tenant or organization identifiers.

## Admin Copy and UX Alignment

Align with Task188 and Task197:

- permission failure: "You do not have permission to perform this action."
- feature unavailable: "This feature is not available for this organization."
- usage limited: "Usage is currently limited. Try again later or ask an authorized admin."
- AI unavailable: "AI suggestion is not available for this organization. Review this item manually."
- generic hidden item: "This item is not available."

Copy remains placeholder-only.

## Feature Key Alignment with Task198

Feature gate outcomes should use Task198 placeholder keys internally only.

Raw feature keys should not be exposed to customers and should usually not be shown to normal operators.

First-release-safe keys:

- `sla_tracking`
- `operations_risk_dashboard`
- `operations_risk_queue`
- `operations_risk_actions`
- `operations_risk_role_queues`

Future-only keys must still fail closed.

## Entitlement-to-Permission Alignment with Task199

Task199's four-gate model applies:

1. organization has entitlement,
2. user has permission,
3. requested object is inside scope,
4. response is safely shaped.

The error mapping should reveal only the safest necessary failure category.

## First-Release Subset Alignment with Task200

Task200 proposes a narrow first-release entitlement subset.

For first-release candidates:

- errors should support queue/dashboard/manual-action workflows,
- errors should not expose advanced or AI-only features,
- errors should not imply notification sending exists,
- errors should not imply official lifecycle mutation is available.

## Resource Enumeration Test Alignment

Future tests should verify:

- cross-organization IDs do not reveal existence,
- hidden queues do not reveal counts,
- hidden evidence does not reveal existence,
- missing entitlement does not reveal plan internals to normal users,
- missing permission does not reveal hidden resources,
- AI unavailable does not reveal prompts or provider diagnostics,
- export unavailable does not reveal hidden export counts,
- generic safe-deny timing and shape do not create obvious enumeration signals.

Task201 does not add tests.

## Diagnostic Redaction and QA Artifact Alignment

Diagnostics and QA artifacts must align with Task193 / Task194 / Task195.

Do not include:

- raw payloads,
- raw channel ids,
- customer contact values,
- secrets or credentials,
- stack traces,
- SQL errors,
- DB constraint names,
- provider raw errors,
- internal diagnostic payloads,
- hidden tenant identifiers,
- hidden organization identifiers,
- real usage values,
- pricing values.

## Channel-Agnostic and LINE-Safe Boundaries

Feature gate errors should not hard-code LINE.

Principles:

- no raw LINE user id in responses,
- no LINE access token or channel secret in diagnostics,
- no indication that a customer has or lacks LINE binding unless future authorized channel admin scope exists,
- no LINE-only entitlement names for channel-agnostic features,
- future APP / SMS / email channels should not require changing core SLA/risk errors.

## AI Advisory-Only Boundary

AI gate errors should never imply:

- AI can complete reports,
- AI can close cases,
- AI can dispatch,
- AI can approve settlement,
- AI can suppress risks,
- AI can escalate risks,
- AI can send notifications,
- AI can write uncertain content as official fact.

If AI is unavailable, the safe fallback is manual human review.

## Alignment with Task173-Task197

Task201 preserves prior docs:

- escalation remains human-reviewed,
- data model remains proposal-only,
- thresholds remain proposal-only,
- business hours remain policy-only,
- dedupe and suppression remain policy-only,
- dashboard remains design-only,
- human actions remain future-only,
- action audit and evidence remain design-only,
- permission and organization scope remain mandatory,
- Admin dashboard and copy remain non-runtime drafts,
- API contract remains draft-only,
- readiness gate remains blocking before runtime,
- first-release risk scope remains narrow,
- RBAC remains proposal-only,
- safe error / response / redaction guidance remains mandatory,
- entitlement UX remains non-runtime.

## Implementation Blockers and Required Approvals

Before implementation, future tasks must approve:

1. production error code catalog,
2. production feature key catalog,
3. entitlement source of truth,
4. permission source of truth,
5. evaluation order,
6. 403 vs 404 behavior,
7. API response shape,
8. Admin copy,
9. localization keys,
10. resource enumeration tests,
11. diagnostic redaction policy,
12. security review.

## Future Task Candidates

Possible next docs-only tasks:

- feature gate error code decision packet,
- entitlement failure localization key draft,
- resource enumeration expected response matrix,
- Admin disabled-state copy to API error mapping,
- tenant admin visibility error policy,
- usage-sensitive error policy,
- AI add-on unavailable error policy.

Runtime implementation remains out of scope.

## Verification Checklist

Task201 should be considered valid only if:

- it remains documentation-only,
- it does not define final production API error mapping,
- it does not modify backend source,
- it does not modify Admin source,
- it does not modify API behavior,
- it does not modify permission runtime,
- it does not modify entitlement runtime,
- it does not modify smoke, browser smoke, automated tests, or QA scripts,
- it does not modify OpenAPI / Swagger / generated clients,
- it does not create executable schema/config,
- it does not add migrations,
- it does not connect to DB,
- it does not run DDL,
- it does not apply or dry-run Migration 020,
- it does not implement usage metering,
- it does not implement SaaS billing / subscription / payment,
- it does not implement plan / pricing runtime,
- it does not send LINE / APP / SMS / email,
- it does not implement survey runtime,
- it does not implement AI automatic decisions,
- it does not modify inventory docs,
- it contains no sensitive values,
- it does not violate `docs/PROJECT_GUARDRAILS.md`.

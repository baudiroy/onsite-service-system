# Task 202 - SLA / Operations Risk Feature Gate Localization Key Draft / No Runtime Change

## Purpose and Non-Goals

Task202 defines a documentation-only localization key draft for future SLA / operations risk feature-gate UX.

This document proposes placeholder localization key families and safe copy directions for feature gate failures, permission failures, entitlement failures, usage limitations, AI add-on limitations, and generic safe-deny states. It does not create localization files or production translation strings.

Task202 builds on:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-183-sla-operations-risk-dashboard-copy-and-empty-state-policy-no-admin-code-change.md`
- `docs/task-188-sla-operations-risk-safe-error-and-permission-failure-copy-draft-no-runtime-change.md`
- `docs/task-189-sla-operations-risk-error-code-catalog-draft-no-runtime-change.md`
- `docs/task-190-sla-operations-risk-api-error-allow-list-review-no-runtime-change.md`
- `docs/task-191-sla-operations-risk-403-vs-404-non-leakage-decision-packet-no-runtime-change.md`
- `docs/task-192-sla-operations-risk-resource-enumeration-test-plan-no-runtime-change.md`
- `docs/task-193-sla-operations-risk-internal-diagnostic-redaction-policy-no-runtime-change.md`
- `docs/task-194-sla-operations-risk-diagnostic-data-classification-matrix-no-runtime-change.md`
- `docs/task-195-sla-operations-risk-qa-artifact-redaction-checklist-no-runtime-change.md`
- `docs/task-196-sla-operations-risk-api-error-response-shape-draft-no-runtime-change.md`
- `docs/task-197-sla-operations-risk-entitlement-failure-ux-draft-no-runtime-change.md`
- `docs/task-201-sla-operations-risk-feature-gate-api-error-mapping-draft-no-runtime-change.md`

Task202 does not:

- define final production localization keys,
- create or modify localization files,
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

Task202 preserves:

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
- customer-visible data and internal-only data remain separated,
- AI is advisory only,
- future design notes do not authorize runtime implementation.

## Current Architecture Assumptions

Task202 assumes:

- no SLA / operations risk runtime exists,
- no SLA / operations risk API exists,
- no SLA / operations risk Admin dashboard exists,
- no localization implementation exists for this branch,
- no entitlement runtime exists,
- no permission runtime changes are approved,
- no usage metering runtime exists,
- no SaaS billing / subscription / payment runtime exists,
- no notification provider delivery is approved,
- survey runtime remains paused,
- AI remains advisory only.

## Localization Key Draft Principles

Future localization keys should:

1. be stable enough for API `messageKey` references,
2. avoid embedding tenant, user, customer, plan, provider, or channel values,
3. avoid exposing hidden resource existence,
4. support generic safe-deny behavior,
5. support permission and entitlement distinction without leaking internals,
6. support future multilingual UI,
7. avoid hard-coding LINE,
8. avoid implying AI is authoritative,
9. avoid production translation finality in docs-only drafts,
10. remain separate from executable localization files until implementation approval.

## Key Naming Guidelines

Recommended key style:

```text
operationsRisk.error.<family>.<meaning>
operationsRisk.action.<family>.<meaning>
operationsRisk.emptyState.<family>.<meaning>
```

Guidelines:

- use lower camel case after the product prefix,
- keep keys semantic, not UI-placement-specific,
- avoid plan tier names,
- avoid provider names,
- avoid tenant/customer identifiers,
- avoid channel-specific names unless the future feature is channel-specific,
- avoid raw feature key names in customer-facing copy,
- keep safe error keys separate from internal diagnostic keys.

## Message Family Overview

| Family | Purpose |
| --- | --- |
| generic safe-deny | hidden or unavailable item |
| permission denied | user lacks permission for visible action |
| organization / tenant scope | unavailable due to scope without leaking details |
| entitlement / feature disabled | organization feature not enabled |
| usage / export limited | feature is limited or unavailable without exposing values |
| AI add-on / advisory limitation | AI suggestion unavailable or advisory-only |
| advanced feature unavailable | advanced rules/config unavailable |
| request access / contact admin | safe next-step copy |
| retry / support reference | refresh / support reference copy |
| channel / provider readiness | channel/provider not available without raw details |

## Generic Safe-Deny Keys

Proposal-only keys:

| Key | Safe copy direction |
| --- | --- |
| `operationsRisk.error.itemNotAvailable` | This item is not available. |
| `operationsRisk.error.contextNotAvailable` | Context is not available. |
| `operationsRisk.error.queueNotAvailable` | This queue is not available. |
| `operationsRisk.error.actionNotAvailable` | This action is not available. |
| `operationsRisk.emptyState.noVisibleItems` | No visible items are available. |

Use these when visibility is uncertain or when permission, entitlement, scope, and resource-not-found should be collapsed.

## Permission / Organization Scope Keys

Proposal-only keys:

| Key | Safe copy direction |
| --- | --- |
| `operationsRisk.error.permissionDenied` | You do not have permission to perform this action. |
| `operationsRisk.error.reviewerRequired` | This item requires a higher review permission. |
| `operationsRisk.error.queueScopeDenied` | This queue is not available with your current permission. |
| `operationsRisk.error.evidencePermissionDenied` | Evidence is not available with your current permission. |
| `operationsRisk.error.auditPermissionDenied` | Action history is not available with your current permission. |
| `operationsRisk.error.scopeUnavailable` | This item is not available. |

Scope mismatch should usually use generic not-available copy.

## Entitlement / Feature Disabled Keys

Proposal-only keys:

| Key | Safe copy direction |
| --- | --- |
| `operationsRisk.error.featureNotEnabled` | This feature is not available for this organization. |
| `operationsRisk.error.entitlementRequired` | This action requires an enabled feature. |
| `operationsRisk.emptyState.featureUnavailable` | This feature is not available. |
| `operationsRisk.action.requestAccess` | Ask an authorized admin to review feature access. |
| `operationsRisk.action.contactAdmin` | Contact an authorized admin for help. |

These keys must not expose plan names, pricing, or hidden entitlement details to normal operators.

## Usage / Export Limit Keys

Proposal-only keys:

| Key | Safe copy direction |
| --- | --- |
| `operationsRisk.error.usageLimited` | Usage is currently limited. Try again later or ask an authorized admin. |
| `operationsRisk.error.limitReached` | This limit has been reached for the current period. |
| `operationsRisk.error.exportNotEnabled` | Export is not available for this organization. |
| `operationsRisk.error.exportUnavailable` | Export is not available. |
| `operationsRisk.emptyState.exportUnavailable` | Export tools are not available. |

Do not include usage numbers, pricing, billing diagnostics, provider diagnostics, or hidden export counts.

## AI Add-On / AI Advisory Limitation Keys

Proposal-only keys:

| Key | Safe copy direction |
| --- | --- |
| `operationsRisk.error.aiSuggestionUnavailable` | AI suggestion is not available for this organization. |
| `operationsRisk.error.aiAdvisoryOnly` | AI suggestions are optional and do not make official decisions. |
| `operationsRisk.action.reviewManually` | Review this item manually. |
| `operationsRisk.emptyState.aiUnavailable` | AI suggestions are not available. |

AI copy must not imply that AI can dispatch, complete, approve, suppress, escalate, notify, or write official facts.

## Advanced Feature / Disabled-Until-Approved Keys

Proposal-only keys:

| Key | Safe copy direction |
| --- | --- |
| `operationsRisk.error.advancedFeatureUnavailable` | Advanced review tools are not available for this organization. |
| `operationsRisk.error.customRulesUnavailable` | Custom rules are not available. |
| `operationsRisk.error.businessHoursConfigUnavailable` | Business-hours configuration is not available. |
| `operationsRisk.error.auditViewUnavailable` | Action history is not available. |
| `operationsRisk.error.apiAccessUnavailable` | API access is not available. |

Advanced feature copy should avoid hidden rule, threshold, audit, and API details.

## Request Access / Contact Admin Keys

Proposal-only keys:

| Key | Safe copy direction |
| --- | --- |
| `operationsRisk.action.askAdmin` | Ask an authorized admin to review this setting. |
| `operationsRisk.action.askReviewer` | Ask an authorized reviewer for help. |
| `operationsRisk.action.requestAccess` | Request access through an authorized admin. |
| `operationsRisk.action.returnToQueue` | Return to the queue. |

Do not imply that normal users can upgrade a plan, change billing, or enable tenant features.

## Retry / Support Reference Keys

Proposal-only keys:

| Key | Safe copy direction |
| --- | --- |
| `operationsRisk.error.staleState` | This item changed. Refresh and try again. |
| `operationsRisk.error.concurrentUpdate` | Another update finished first. Refresh and review the latest state. |
| `operationsRisk.action.refresh` | Refresh and review the latest state. |
| `operationsRisk.support.referenceAvailable` | Share the support reference with an authorized admin if needed. |

Support references must be opaque and must not contain credentials, raw identifiers, or encoded payloads.

## Channel / Provider Readiness Keys

Proposal-only keys:

| Key | Safe copy direction |
| --- | --- |
| `operationsRisk.error.channelContextUnavailable` | Channel information is not available. |
| `operationsRisk.error.deliveryNotAvailable` | Delivery is not available. |
| `operationsRisk.error.providerReadinessUnavailable` | Delivery readiness is not available. |

These keys are future-only and must not expose LINE binding status, provider configuration, or channel identifiers.

## Placeholder-Safe Copy Examples

Safe examples:

- "This item is not available."
- "This feature is not available for this organization."
- "You do not have permission to perform this action."
- "AI suggestion is not available for this organization. Review this item manually."
- "This item changed. Refresh and try again."

Avoid examples:

- "This resource belongs to another organization."
- "This customer is on a plan that does not include this feature."
- "This channel binding exists but is disabled."
- "The provider account is missing."
- "The export contains hidden rows."

## Multilingual Readiness Notes

Future implementation should:

- keep `messageKey` stable,
- separate message keys from default fallback copy,
- avoid concatenated strings where grammar differs by language,
- avoid embedding raw dynamic values in copy,
- define approved interpolation only if future product policy allows it,
- keep admin-only diagnostic copy separate from user-facing copy.

Task202 does not create localization files or production translations.

## API `messageKey` Alignment with Task196

Task196 proposed `error.messageKey` as a safe response field.

Task202 keys may be used as future candidates for that field, but only after:

- API response shape is approved,
- localization key catalog is approved,
- Admin UI handling is approved,
- non-leakage tests are approved.

## Admin UX Alignment with Task183 / Task188 / Task197

Admin UX should use:

- short and calm wording,
- clear next step when safe,
- generic non-disclosure when visibility is uncertain,
- manual review fallback for AI unavailability,
- contact-admin language for entitlement failures.

Admin UX must not display raw feature keys to customers and should usually avoid raw feature keys for normal operators.

## Error Mapping Alignment with Task189 / Task201

Task202 key families map to Task189 / Task201 categories:

| Error category | Key family |
| --- | --- |
| `RISK_ITEM_NOT_AVAILABLE` | generic safe-deny |
| `RISK_PERMISSION_DENIED` | permission denied |
| `RISK_FEATURE_NOT_ENABLED` | entitlement / feature disabled |
| `RISK_USAGE_LIMIT_REACHED` | usage / export limited |
| `RISK_EXPORT_NOT_ENABLED` | usage / export limited |
| `RISK_AI_ADDON_NOT_ENABLED` | AI add-on limitation |
| `RISK_STALE_STATE` | retry / support reference |

This is not an executable mapping.

## Non-Leakage Alignment with Task190 / Task191 / Task192

Localization keys should support:

- generic safe-deny for hidden resources,
- collapsed 403 / 404 behavior when needed,
- no hidden resource counts,
- no plan or usage details for normal operators,
- no channel binding disclosure,
- no evidence or audit existence leakage,
- no raw diagnostic copy.

## Redaction and QA Artifact Alignment

Documentation and future QA artifacts must not include:

- raw payloads,
- raw channel identifiers,
- customer contact values,
- provider credentials,
- tokens or secrets,
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

Localization keys should avoid hard-coding LINE unless a future LINE-specific feature is explicitly scoped.

Use generic words such as:

- channel,
- delivery,
- notification,
- customer contact method.

Do not reveal LINE binding status, raw LINE identifiers, LINE provider credentials, or LINE delivery diagnostics.

## AI Advisory-Only Boundary

AI wording must preserve:

- AI suggestions are optional,
- AI does not make official decisions,
- AI does not mutate official state,
- manual review is always available,
- AI unavailable is not a workflow blocker unless future product explicitly makes it so.

## Alignment with Task173-Task200

Task202 preserves:

- escalation remains human-reviewed,
- data model remains proposal-only,
- thresholds remain proposal-only,
- business hours remain policy-only,
- dashboards and copy remain design-only,
- human actions remain future-only,
- audit and evidence policy remains design-only,
- organization and permission scope remain mandatory,
- API contract remains draft-only,
- readiness gate remains blocking before runtime,
- first-release scope remains narrow,
- RBAC remains proposal-only,
- safe error / response / redaction guidance remains mandatory,
- entitlement UX remains non-runtime,
- feature keys remain placeholder-only,
- first-release entitlement subset remains proposal-only.

## Implementation Blockers and Required Approvals

Before implementation, future tasks must approve:

1. production localization key catalog,
2. production copy in supported languages,
3. API `messageKey` mapping,
4. Admin UI rendering behavior,
5. interpolation policy,
6. tenant admin / normal user visibility policy,
7. non-leakage tests,
8. QA artifact redaction rules,
9. security review.

## Future Task Candidates

Possible next docs-only tasks:

- production localization key readiness review,
- Admin disabled-state copy matrix,
- API error code to localization key mapping table,
- tenant admin vs operator copy decision packet,
- AI unavailable copy policy,
- usage/export unavailable copy policy,
- resource enumeration copy consistency test plan.

Runtime and localization file implementation remain out of scope.

## Verification Checklist

Task202 should be considered valid only if:

- it remains documentation-only,
- it does not define final production localization keys,
- it does not create or modify localization files,
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

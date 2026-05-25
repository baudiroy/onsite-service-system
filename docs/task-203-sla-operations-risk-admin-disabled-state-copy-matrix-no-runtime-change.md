# Task 203 - SLA / Operations Risk Admin Disabled-State Copy Matrix / No Runtime Change

## Purpose and Non-Goals

Task203 defines a documentation-only Admin disabled-state copy matrix for future SLA / operations risk workflows.

This document proposes safe disabled-state categories, copy directions, localization key references, and Admin UI placement notes. It does not create Admin UI, localization files, runtime behavior, or production copy.

Task203 builds on:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-182-sla-operations-risk-admin-dashboard-wireframe-requirements-no-admin-code-change.md`
- `docs/task-183-sla-operations-risk-dashboard-copy-and-empty-state-policy-no-admin-code-change.md`
- `docs/task-188-sla-operations-risk-safe-error-and-permission-failure-copy-draft-no-runtime-change.md`
- `docs/task-190-sla-operations-risk-api-error-allow-list-review-no-runtime-change.md`
- `docs/task-191-sla-operations-risk-403-vs-404-non-leakage-decision-packet-no-runtime-change.md`
- `docs/task-192-sla-operations-risk-resource-enumeration-test-plan-no-runtime-change.md`
- `docs/task-193-sla-operations-risk-internal-diagnostic-redaction-policy-no-runtime-change.md`
- `docs/task-194-sla-operations-risk-diagnostic-data-classification-matrix-no-runtime-change.md`
- `docs/task-195-sla-operations-risk-qa-artifact-redaction-checklist-no-runtime-change.md`
- `docs/task-197-sla-operations-risk-entitlement-failure-ux-draft-no-runtime-change.md`
- `docs/task-199-sla-operations-risk-entitlement-to-permission-mapping-matrix-no-runtime-change.md`
- `docs/task-201-sla-operations-risk-feature-gate-api-error-mapping-draft-no-runtime-change.md`
- `docs/task-202-sla-operations-risk-feature-gate-localization-key-draft-no-runtime-change.md`

Task203 does not:

- define final production Admin disabled-state copy,
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

Task203 preserves:

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

Task203 assumes:

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

## Disabled-State Copy Principles

Future Admin disabled-state copy should:

1. say what the user can safely do next,
2. avoid revealing hidden resource existence,
3. avoid plan, pricing, usage, and provider diagnostics,
4. avoid raw customer/contact/channel values,
5. avoid implying AI has authority,
6. avoid implying provider sending is available,
7. distinguish feature unavailable from permission denied only when safe,
8. use generic copy when visibility is uncertain,
9. avoid raw feature keys in normal UI,
10. remain placeholder-only until production copy approval.

## Disabled-State Category Overview

| Category | UI posture |
| --- | --- |
| permission missing | disabled action with permission guidance if item is visible |
| organization / tenant scope not available | generic not available |
| entitlement missing / feature disabled | feature unavailable / contact admin |
| usage or export limit reached | limited/unavailable without values |
| AI add-on not enabled | AI unavailable / review manually |
| advanced feature unavailable | advanced tools unavailable |
| workflow state does not allow action | action unavailable for current state |
| stale / concurrent update risk | refresh required |
| duplicate / suppressed / already resolved | state already handled |
| audit / evidence access not available | evidence/history unavailable |
| channel/provider readiness not available | delivery unavailable without provider details |
| no-send / no-provider test mode | delivery intentionally disabled in test context |
| disabled until approval | feature not available yet |

## Permission Disabled-State Copy

| Scenario | Placeholder key | Safe copy direction |
| --- | --- | --- |
| action permission missing | `operationsRisk.error.permissionDenied` | You do not have permission to perform this action. |
| reviewer required | `operationsRisk.error.reviewerRequired` | This item requires a higher review permission. |
| queue scope denied | `operationsRisk.error.queueScopeDenied` | This queue is not available with your current permission. |
| evidence permission denied | `operationsRisk.error.evidencePermissionDenied` | Evidence is not available with your current permission. |
| audit permission denied | `operationsRisk.error.auditPermissionDenied` | Action history is not available with your current permission. |

Use permission copy only when the user can safely know the item or queue exists.

## Organization / Tenant Scope Disabled-State Copy

| Scenario | Placeholder key | Safe copy direction |
| --- | --- | --- |
| item outside organization scope | `operationsRisk.error.itemNotAvailable` | This item is not available. |
| queue outside scope | `operationsRisk.error.queueNotAvailable` | This queue is not available. |
| context hidden | `operationsRisk.error.contextNotAvailable` | Context is not available. |

Do not say that an item belongs to another organization or tenant.

## Entitlement / Feature Disabled-State Copy

| Scenario | Placeholder key | Safe copy direction |
| --- | --- | --- |
| feature unavailable | `operationsRisk.error.featureNotEnabled` | This feature is not available for this organization. |
| entitlement required | `operationsRisk.error.entitlementRequired` | This action requires an enabled feature. |
| feature unavailable empty state | `operationsRisk.emptyState.featureUnavailable` | This feature is not available. |
| contact admin | `operationsRisk.action.contactAdmin` | Contact an authorized admin for help. |
| request access | `operationsRisk.action.requestAccess` | Request access through an authorized admin. |

Normal operators should not see plan names, pricing, commercial reasons, or raw feature keys.

## Usage / Export Limit Disabled-State Copy

| Scenario | Placeholder key | Safe copy direction |
| --- | --- | --- |
| usage limited | `operationsRisk.error.usageLimited` | Usage is currently limited. Try again later or ask an authorized admin. |
| limit reached | `operationsRisk.error.limitReached` | This limit has been reached for the current period. |
| export not enabled | `operationsRisk.error.exportNotEnabled` | Export is not available for this organization. |
| export unavailable | `operationsRisk.error.exportUnavailable` | Export is not available. |

Do not display raw usage values, pricing, billing diagnostics, provider diagnostics, or hidden export counts.

## AI Add-On / AI Advisory Disabled-State Copy

| Scenario | Placeholder key | Safe copy direction |
| --- | --- | --- |
| AI suggestion unavailable | `operationsRisk.error.aiSuggestionUnavailable` | AI suggestion is not available for this organization. |
| AI advisory-only reminder | `operationsRisk.error.aiAdvisoryOnly` | AI suggestions are optional and do not make official decisions. |
| manual review fallback | `operationsRisk.action.reviewManually` | Review this item manually. |
| AI empty state | `operationsRisk.emptyState.aiUnavailable` | AI suggestions are not available. |

AI disabled states must not imply AI would have completed, approved, suppressed, escalated, or notified.

## Workflow-State Disabled-State Copy

| Scenario | Placeholder key | Safe copy direction |
| --- | --- | --- |
| action invalid for state | `operationsRisk.error.actionNotAvailable` | This action is not available. |
| item cannot be resolved yet | `operationsRisk.error.actionNotAvailable` | Review the required details before continuing. |
| missing reason | future validation key | Add a reason before continuing. |
| state no longer matches | `operationsRisk.error.staleState` | This item changed. Refresh and try again. |

Workflow-state disabled copy must not suggest bypassing Case / Appointment / Report guards.

## Stale / Concurrent Update Disabled-State Copy

| Scenario | Placeholder key | Safe copy direction |
| --- | --- | --- |
| stale item | `operationsRisk.error.staleState` | This item changed. Refresh and try again. |
| concurrent update | `operationsRisk.error.concurrentUpdate` | Another update finished first. Refresh and review the latest state. |
| refresh action | `operationsRisk.action.refresh` | Refresh and review the latest state. |

Do not expose another operator's identity unless a future audit policy allows it.

## Duplicate / Suppressed / Already-Resolved Disabled-State Copy

| Scenario | Placeholder key | Safe copy direction |
| --- | --- | --- |
| already resolved | future state key | This item is already resolved. |
| already suppressed | future state key | This item is already suppressed. |
| grouped duplicate | future state key | This signal is grouped with an existing item. |
| reopen unavailable | `operationsRisk.error.actionNotAvailable` | Reopen is not available for this item. |

These states should not imply deletion or hidden lifecycle mutation.

## Audit / Evidence Disabled-State Copy

| Scenario | Placeholder key | Safe copy direction |
| --- | --- | --- |
| evidence unavailable | `operationsRisk.error.evidencePermissionDenied` | Evidence is not available with your current permission. |
| audit unavailable | `operationsRisk.error.auditPermissionDenied` | Action history is not available with your current permission. |
| context hidden | `operationsRisk.error.contextNotAvailable` | Context is not available. |

Do not expose evidence counts, audit counts, file paths, object keys, provider payloads, or raw attachments.

## Channel / Provider Readiness Disabled-State Copy

| Scenario | Placeholder key | Safe copy direction |
| --- | --- | --- |
| channel context unavailable | `operationsRisk.error.channelContextUnavailable` | Channel information is not available. |
| delivery unavailable | `operationsRisk.error.deliveryNotAvailable` | Delivery is not available. |
| provider readiness unavailable | `operationsRisk.error.providerReadinessUnavailable` | Delivery readiness is not available. |

These are future-only placeholders. Do not reveal LINE binding status, provider configuration, or channel identifiers.

## No-Send / No-Provider Test Mode Copy

Future no-send / no-provider test mode copy may say:

- "Delivery is disabled in this test mode."
- "No customer notification was sent."
- "Review this item manually."

It must not expose provider details, credentials, real channel ids, or raw delivery payloads.

## Disabled-Until-Approval Copy

For disabled-until-approved features:

- "This feature is not available yet."
- "This tool requires additional approval before use."
- "Ask an authorized admin to review this setting."

Avoid implying the feature exists for other hidden organizations or can be enabled by a normal operator.

## Localization Key Alignment with Task202

Task203 references Task202 placeholder keys only. It does not create localization files or production translations.

Future implementation must re-review:

- key names,
- fallback copy,
- supported languages,
- interpolation rules,
- visibility policy,
- non-leakage tests.

## Admin UI Placement Notes

Future Admin UI may use disabled-state copy in:

- disabled buttons,
- inline helper text,
- empty states,
- error banners,
- tooltip-like explanations,
- side panel state messages.

Task203 does not create Admin source. Future UI should avoid over-explaining hidden details and should not show raw feature keys to normal operators.

## Entitlement / Permission / Scope Alignment

Admin disabled states must reflect:

- entitlement gate: organization feature availability,
- permission gate: user action authority,
- scope gate: organization / queue / item visibility,
- response gate: safe non-leaking copy.

If the UI cannot safely distinguish the failed gate, it should show generic unavailable copy.

## Feature Gate API Error Alignment with Task201

Task201 maps feature gate outcomes to safe API error categories.

Admin disabled-state copy should consume safe API response fields only:

- safe code,
- safe message key,
- safe fallback message,
- safe retry hint,
- opaque correlation reference.

It must not rely on raw diagnostics.

## Non-Leakage Alignment

Disabled-state copy must not reveal:

- hidden resource existence,
- another organization / tenant,
- hidden queue counts,
- hidden evidence counts,
- hidden audit counts,
- plan internals,
- usage values,
- provider readiness details,
- channel binding status,
- customer contact values.

## Diagnostic Redaction and QA Artifact Alignment

Future QA screenshots, logs, and handoff notes must not include:

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

Disabled-state copy should remain channel-agnostic unless a future channel-specific feature is explicitly scoped.

Do not reveal:

- LINE binding status,
- raw LINE identifiers,
- LINE provider credentials,
- LINE delivery diagnostics,
- provider account readiness.

## AI Advisory-Only Boundary

AI disabled-state copy must say that manual review is available and must not imply that AI has authority.

Do not write:

- AI would approve this.
- AI would close this.
- AI would send this.
- AI would suppress this.

## Alignment with Task173-Task202

Task203 preserves:

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
- error and response guidance remains non-leaking,
- entitlement UX remains non-runtime,
- feature keys remain placeholder-only,
- localization keys remain placeholder-only.

## Implementation Blockers and Required Approvals

Before implementation, future tasks must approve:

1. production disabled-state copy,
2. localization key catalog,
3. Admin UI placement,
4. API error mapping,
5. permission / entitlement / scope evaluation,
6. tenant admin vs normal user visibility,
7. QA screenshot redaction,
8. non-leakage tests,
9. security review.

## Future Task Candidates

Possible next docs-only tasks:

- Admin disabled-state to API error mapping table,
- tenant admin vs normal user copy policy,
- tooltip / empty-state UI placement review,
- no-send / no-provider test mode copy policy,
- AI unavailable copy review,
- export unavailable copy review,
- disabled-state QA screenshot redaction test plan.

Runtime and Admin implementation remain out of scope.

## Verification Checklist

Task203 should be considered valid only if:

- it remains documentation-only,
- it does not define final production Admin disabled-state copy,
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

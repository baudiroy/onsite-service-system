# Task 204 - SLA / Operations Risk Feature-Gated Admin Empty-State Surface Inventory / No Runtime Change

## Purpose and Non-Goals

Task204 defines a documentation-only inventory of future Admin surfaces that may need feature-gated empty states for SLA / operations risk workflows.

This document identifies likely dashboard, queue, detail, action, evidence, audit, AI, export, advanced configuration, channel, and no-send surfaces. It does not create Admin UI, localization files, runtime behavior, or production empty-state copy.

Task204 does not:

- define final production Admin empty-state copy,
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

Task204 preserves:

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

Task204 assumes:

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

## Empty-State Surface Inventory Principles

Future Admin empty states should:

1. explain absence or disabled state without leaking sensitive context,
2. distinguish no data, no permission, no entitlement, hidden scope, and disabled-until-approved only when safe,
3. avoid raw feature keys in normal UI,
4. avoid plan/pricing/usage/provider details,
5. avoid raw channel and customer identifiers,
6. support manual review and safe next steps,
7. avoid implying provider sending or AI actions exist,
8. remain aligned with API error and localization key drafts,
9. be testable for resource enumeration safety,
10. remain placeholder-only until Admin implementation is approved.

## Surface Inventory Overview

| Surface | Possible empty / disabled states | First-release relevance |
| --- | --- | --- |
| SLA / operations risk dashboard | no visible queues, feature unavailable, permission missing | high |
| risk queue | no visible items, scope unavailable, entitlement missing | high |
| role queue panels | role queue unavailable, no items for role, permission missing | high |
| risk detail panel | item unavailable, hidden context, stale item | high |
| action panel | action unavailable, reviewer required, stale state | high |
| audit panel | audit unavailable, permission missing, future-only | future |
| evidence panel | evidence unavailable, permission missing, no references | future / limited |
| AI hints panel | AI unavailable, AI add-on not enabled, advisory-only reminder | future |
| AI risk radar panel | disabled until approval | future-only |
| export controls | export not enabled, usage/export limited | future-only |
| advanced rules | disabled until approval | future-only |
| threshold config | disabled until approval, permission missing | future admin |
| business-hours config | disabled until approval, permission missing | future admin |
| channel readiness surface | delivery unavailable, channel info unavailable | future-only |
| no-send test mode surface | delivery disabled in test mode | future test mode |

## Dashboard Empty-State Surfaces

Dashboard surfaces may need empty states for:

- feature not enabled,
- no visible queues,
- no visible risk items,
- permission missing,
- organization / tenant scope unavailable,
- disabled until approval.

Safe copy direction:

- "No visible items are available."
- "This feature is not available for this organization."
- "This dashboard is not available with your current permission."

Do not show hidden queue counts, hidden organization scope, plan internals, or raw feature keys.

## Queue and Role Queue Empty-State Surfaces

Queue surfaces may need empty states for:

- role queue unavailable,
- no visible items,
- queue scope denied,
- item hidden by organization scope,
- feature disabled,
- first-release intentionally excluded category.

Safe copy direction:

- "This queue is not available."
- "No visible items are available."
- "This queue is not available with your current permission."

Role queue copy should not reveal that another role has hidden items.

## Risk Detail / Action Panel Empty-State Surfaces

Risk detail and action panels may need empty states for:

- item no longer visible,
- item changed,
- action unavailable for current state,
- reviewer required,
- reason required,
- already resolved,
- already suppressed,
- stale / concurrent update.

Safe copy direction:

- "This item is not available."
- "This item changed. Refresh and try again."
- "This action is not available."
- "This item requires a higher review permission."

Action panel copy must not suggest bypassing Case / Appointment / Report lifecycle guards.

## Audit / Evidence Empty-State Surfaces

Audit and evidence panels are more sensitive.

Possible states:

- audit unavailable,
- evidence unavailable,
- evidence permission denied,
- audit permission denied,
- no evidence references,
- hidden evidence context,
- future-only audit feature disabled.

Safe copy direction:

- "Evidence is not available with your current permission."
- "Action history is not available with your current permission."
- "Context is not available."

Do not show evidence counts, audit counts, file paths, object keys, provider payloads, or raw attachment details.

## AI Advisory / AI Risk Radar Empty-State Surfaces

AI surfaces should be future-only unless separately approved.

Possible states:

- AI add-on not enabled,
- AI suggestion unavailable,
- AI hint permission missing,
- AI risk radar disabled until approval,
- AI advisory-only reminder.

Safe copy direction:

- "AI suggestion is not available for this organization."
- "Review this item manually."
- "AI suggestions are optional and do not make official decisions."

AI copy must not imply that AI can dispatch, complete, approve, suppress, escalate, notify, or write official facts.

## Export and Usage-Sensitive Empty-State Surfaces

Export surfaces should remain future-only until export policy is approved.

Possible states:

- export not enabled,
- export permission missing,
- usage currently limited,
- safe summary export unavailable,
- audit export unavailable,
- hidden export counts.

Safe copy direction:

- "Export is not available for this organization."
- "Usage is currently limited. Try again later or ask an authorized admin."
- "Export is not available."

Do not expose usage values, pricing, billing diagnostics, provider diagnostics, or hidden row counts.

## Advanced Rules / Threshold / Business-Hours Empty-State Surfaces

Advanced configuration surfaces should be hidden or disabled until approved.

Possible states:

- custom thresholds unavailable,
- advanced rules unavailable,
- business-hours config unavailable,
- admin config permission missing,
- disabled until approval.

Safe copy direction:

- "Advanced review tools are not available for this organization."
- "Custom rules are not available."
- "Business-hours configuration is not available."
- "Ask an authorized admin to review this setting."

Do not reveal hidden rule definitions, hidden thresholds, plan tier details, or organization-specific configuration.

## Channel / Provider / No-Send Mode Empty-State Surfaces

Channel and provider surfaces are future-only.

Possible states:

- channel context unavailable,
- delivery unavailable,
- provider readiness unavailable,
- no-send / no-provider test mode,
- channel feature not enabled,
- customer channel binding not visible.

Safe copy direction:

- "Channel information is not available."
- "Delivery is not available."
- "Delivery is disabled in this test mode."
- "No customer notification was sent."

Do not expose LINE binding status, raw LINE identifiers, provider credentials, provider account readiness, or raw delivery payloads.

## Empty-State Condition Matrix

| Condition | Preferred UI posture | Notes |
| --- | --- | --- |
| no data and user can view surface | normal empty state | no hidden counts |
| permission missing | disabled action / permission copy | only if resource visible |
| entitlement missing | feature unavailable / contact admin | no plan details |
| usage/export limited | limited / unavailable | no values |
| AI add-on not enabled | AI unavailable / manual review | advisory-only |
| organization scope unavailable | generic unavailable | avoid existence leak |
| resource hidden | generic unavailable | avoid enumeration |
| provider/channel unavailable | delivery unavailable | no provider details |
| disabled until approval | feature not available yet | no promise of availability |

## Copy Intent and Placeholder Examples

Safe examples:

- "This item is not available."
- "No visible items are available."
- "This feature is not available for this organization."
- "This action is not available."
- "Review this item manually."
- "Refresh and review the latest state."

Avoid:

- "Another tenant owns this item."
- "This customer has a hidden channel binding."
- "Your current plan blocks this exact feature."
- "The provider account is missing."
- "Hidden audit rows exist."

## Localization Key Alignment with Task202

Use Task202 placeholder key families:

- `operationsRisk.error.itemNotAvailable`
- `operationsRisk.error.permissionDenied`
- `operationsRisk.error.featureNotEnabled`
- `operationsRisk.error.usageLimited`
- `operationsRisk.error.aiSuggestionUnavailable`
- `operationsRisk.error.channelContextUnavailable`
- `operationsRisk.action.refresh`
- `operationsRisk.action.contactAdmin`

Task204 does not create localization files or production translations.

## Disabled-State Alignment with Task203

Task203 defines disabled-state copy categories. Task204 maps those categories to potential Admin surfaces.

Future UI implementation should reuse shared copy patterns rather than inventing inconsistent text per surface.

## Entitlement / Permission / Scope Alignment

Every future empty-state surface must account for:

- entitlement gate,
- permission gate,
- organization / tenant scope gate,
- resource visibility gate,
- response redaction gate.

When the UI cannot safely determine which gate failed, use generic unavailable copy.

## Feature Gate API Error Alignment with Task201

Empty states should consume safe API responses only.

Do not rely on:

- raw diagnostics,
- hidden counts,
- raw feature keys,
- plan internals,
- provider readiness details,
- customer contact values,
- raw channel ids.

## Non-Leakage Alignment

Empty states must not reveal:

- hidden resource existence,
- another organization / tenant,
- hidden queues,
- hidden evidence,
- hidden audit records,
- hidden feature entitlement,
- hidden usage details,
- hidden channel binding.

## Diagnostic Redaction and QA Artifact Alignment

Future screenshots, QA notes, and handoff summaries must not include:

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

Empty-state surfaces should remain channel-agnostic.

Do not hard-code LINE in:

- generic risk dashboard copy,
- SLA queue copy,
- feature-gate copy,
- provider readiness copy,
- AI advisory copy.

Do not expose LINE binding status or raw LINE identifiers.

## AI Advisory-Only Boundary

AI empty states must say only that AI suggestions are unavailable or advisory.

They must not imply:

- AI would have completed an action,
- AI can approve a workflow,
- AI can suppress a risk,
- AI can contact a customer,
- AI can replace human review.

## Alignment with Task173-Task203

Task204 preserves:

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
- localization keys remain placeholder-only,
- disabled-state copy remains placeholder-only.

## Implementation Blockers and Required Approvals

Before implementation, future tasks must approve:

1. production empty-state surfaces,
2. Admin UI placement,
3. localization keys,
4. safe copy,
5. API error mapping,
6. permission / entitlement / scope evaluation,
7. tenant admin vs normal operator visibility,
8. QA screenshot redaction,
9. resource enumeration tests,
10. security review.

## Future Task Candidates

Possible next docs-only tasks:

- Admin empty-state to API error response mapping table,
- dashboard empty-state UX wireframe note,
- queue empty-state non-leakage test matrix,
- AI advisory empty-state copy review,
- export empty-state exclusion policy,
- no-send mode UI copy policy,
- tenant admin feature-unavailable copy policy.

Runtime and Admin implementation remain out of scope.

## Verification Checklist

Task204 should be considered valid only if:

- it remains documentation-only,
- it does not define final production Admin empty-state copy,
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

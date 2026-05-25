# Task 205 - SLA / Operations Risk Admin Empty-State to API Error Mapping Table / No Runtime Change

## Purpose and Non-Goals

Task205 defines a documentation-only mapping table between future Admin empty-state surfaces and future SLA / operations risk API error behavior.

This document connects Task204 surfaces to placeholder error codes, placeholder `messageKey` values, disabled-state copy categories, localization key families, and non-leakage expectations. It does not create Admin UI, API behavior, localization files, executable config, or tests.

Task205 does not:

- define final production Admin/API mapping,
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

Task205 preserves:

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

Task205 assumes:

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

## Mapping Table Principles

Future Admin empty-state to API error mapping should:

1. map surfaces to safe API behavior without leaking hidden resources,
2. avoid raw feature keys in normal UI,
3. avoid plan, pricing, usage, and provider diagnostics,
4. avoid raw customer/contact/channel values,
5. use 404-style generic safe-deny when visibility is uncertain,
6. use explicit permission denial only when item visibility is already allowed,
7. keep AI unavailable wording advisory-only,
8. keep channel/provider wording channel-agnostic,
9. preserve Task196 response shape principles,
10. remain proposal-only until implementation approval.

## Mapping Column Definitions

| Column | Meaning |
| --- | --- |
| Surface | Future Admin UI area that may show an empty or disabled state |
| Cause | Why the surface/action is empty or disabled |
| API code family | Placeholder Task189 / Task201 code direction |
| Message key family | Placeholder Task202 key direction |
| Copy category | Task203 disabled-state category |
| Safe response behavior | 403, 404-style, 409, or generic posture |
| Test expectation | Future non-leakage or enumeration test idea |

## Dashboard Surface Mappings

| Surface | Cause | API code family | Message key family | Copy category | Safe response behavior | Test expectation |
| --- | --- | --- | --- | --- | --- | --- |
| SLA dashboard | feature not enabled | `RISK_FEATURE_NOT_ENABLED` | `operationsRisk.error.featureNotEnabled` | entitlement disabled | 403 if safe | no plan detail |
| SLA dashboard | no visible queues | `RISK_ITEM_NOT_AVAILABLE` or empty success | `operationsRisk.emptyState.noVisibleItems` | generic empty | success or 404-style | no hidden queue count |
| operations dashboard | permission missing | `RISK_PERMISSION_DENIED` | `operationsRisk.error.permissionDenied` | permission disabled | 403 if visible | no hidden role internals |
| operations dashboard | org scope unavailable | `RISK_ITEM_NOT_AVAILABLE` | `operationsRisk.error.itemNotAvailable` | generic safe-deny | 404-style | no tenant leak |

## Queue and Role Queue Surface Mappings

| Surface | Cause | API code family | Message key family | Copy category | Safe response behavior | Test expectation |
| --- | --- | --- | --- | --- | --- | --- |
| risk queue | no visible items | empty success or `RISK_ITEM_NOT_AVAILABLE` | `operationsRisk.emptyState.noVisibleItems` | generic empty | success if authorized | no hidden item count |
| risk queue | queue scope denied | `RISK_QUEUE_SCOPE_DENIED` or generic | `operationsRisk.error.queueScopeDenied` | permission disabled | 403 or 404-style | no hidden queue name |
| role queue panel | role queue unavailable | `RISK_QUEUE_SCOPE_DENIED` | `operationsRisk.error.queueNotAvailable` | generic unavailable | 403 if safe | no cross-role count |
| role queue panel | entitlement missing | `RISK_FEATURE_NOT_ENABLED` | `operationsRisk.error.featureNotEnabled` | entitlement disabled | 403 if safe | no plan detail |

## Risk Detail / Action Panel Surface Mappings

| Surface | Cause | API code family | Message key family | Copy category | Safe response behavior | Test expectation |
| --- | --- | --- | --- | --- | --- | --- |
| risk detail panel | item hidden | `RISK_ITEM_NOT_AVAILABLE` | `operationsRisk.error.itemNotAvailable` | generic safe-deny | 404-style | no existence leak |
| risk detail panel | stale item | `RISK_STALE_STATE` | `operationsRisk.error.staleState` | stale | 409 if visible | requires refresh |
| action panel | permission missing | `RISK_PERMISSION_DENIED` | `operationsRisk.error.permissionDenied` | permission disabled | 403 if visible | no policy internals |
| action panel | reviewer required | `RISK_ACTION_REQUIRES_REVIEWER` | `operationsRisk.error.reviewerRequired` | permission disabled | 403 if visible | no hidden reviewer identity |
| action panel | action invalid for state | `RISK_INVALID_ACTION` | `operationsRisk.error.actionNotAvailable` | workflow state | 400 or 409 if visible | no lifecycle bypass |

## Audit / Evidence Surface Mappings

| Surface | Cause | API code family | Message key family | Copy category | Safe response behavior | Test expectation |
| --- | --- | --- | --- | --- | --- | --- |
| evidence panel | evidence permission denied | `RISK_EVIDENCE_PERMISSION_DENIED` | `operationsRisk.error.evidencePermissionDenied` | evidence disabled | 403 if risk item visible | no evidence count |
| evidence panel | evidence hidden | `RISK_EVIDENCE_NOT_AVAILABLE` or generic | `operationsRisk.error.contextNotAvailable` | generic safe-deny | 404-style | no reference leak |
| audit panel | audit permission denied | `RISK_AUDIT_PERMISSION_DENIED` | `operationsRisk.error.auditPermissionDenied` | audit disabled | 403 if item visible | no audit count |
| audit panel | audit feature unavailable | `RISK_FEATURE_NOT_ENABLED` | `operationsRisk.error.auditViewUnavailable` | feature disabled | 403 if safe | no hidden audit policy |

## AI Advisory / AI Risk Radar Surface Mappings

| Surface | Cause | API code family | Message key family | Copy category | Safe response behavior | Test expectation |
| --- | --- | --- | --- | --- | --- | --- |
| AI hints panel | AI add-on not enabled | `RISK_AI_ADDON_NOT_ENABLED` | `operationsRisk.error.aiSuggestionUnavailable` | AI disabled | 403 if safe | no provider detail |
| AI hints panel | permission missing | `RISK_PERMISSION_DENIED` | `operationsRisk.error.permissionDenied` | permission disabled | 403 if visible | no prompt/output leak |
| AI risk radar panel | disabled until approval | `RISK_FEATURE_NOT_ENABLED` | `operationsRisk.error.advancedFeatureUnavailable` | disabled until approval | 403 if safe | no AI capability promise |
| AI panel | manual fallback | no error or safe UI state | `operationsRisk.action.reviewManually` | AI advisory | success / disabled | manual review visible |

AI mappings must never imply AI can make official decisions or execute actions.

## Export and Usage-Sensitive Surface Mappings

| Surface | Cause | API code family | Message key family | Copy category | Safe response behavior | Test expectation |
| --- | --- | --- | --- | --- | --- | --- |
| export control | export not enabled | `RISK_EXPORT_NOT_ENABLED` | `operationsRisk.error.exportNotEnabled` | export disabled | 403 if safe | no row count |
| export control | usage limited | `RISK_USAGE_LIMIT_REACHED` | `operationsRisk.error.usageLimited` | usage limited | 429 or 403 future policy | no usage value |
| export control | permission missing | `RISK_PERMISSION_DENIED` | `operationsRisk.error.permissionDenied` | permission disabled | 403 if visible | no hidden export detail |
| export empty state | export future-only | `RISK_FEATURE_NOT_ENABLED` | `operationsRisk.emptyState.exportUnavailable` | disabled until approval | 403 if safe | no plan detail |

## Advanced Rules / Threshold / Business-Hours Surface Mappings

| Surface | Cause | API code family | Message key family | Copy category | Safe response behavior | Test expectation |
| --- | --- | --- | --- | --- | --- | --- |
| advanced rules | disabled until approval | `RISK_FEATURE_NOT_ENABLED` | `operationsRisk.error.advancedFeatureUnavailable` | disabled until approval | 403 if safe | no rule detail |
| custom thresholds | feature not enabled | `RISK_FEATURE_NOT_ENABLED` | `operationsRisk.error.customRulesUnavailable` | feature disabled | 403 if safe | no threshold leak |
| business hours | config unavailable | `RISK_FEATURE_NOT_ENABLED` | `operationsRisk.error.businessHoursConfigUnavailable` | feature disabled | 403 if safe | no hidden calendar |
| admin config | permission missing | `RISK_PERMISSION_DENIED` | `operationsRisk.error.permissionDenied` | permission disabled | 403 if visible | no admin policy internals |

## Channel / Provider / No-Send Mode Surface Mappings

| Surface | Cause | API code family | Message key family | Copy category | Safe response behavior | Test expectation |
| --- | --- | --- | --- | --- | --- | --- |
| channel readiness | channel context unavailable | `RISK_CHANNEL_CONTEXT_NOT_AVAILABLE` | `operationsRisk.error.channelContextUnavailable` | channel unavailable | 404-style if visibility uncertain | no channel binding leak |
| delivery readiness | provider unavailable | future generic delivery code | `operationsRisk.error.deliveryNotAvailable` | delivery unavailable | generic | no provider detail |
| no-send test surface | test mode active | no error or future test-mode code | no-send copy family | no-send mode | success / disabled | no provider send |
| provider readiness | provider not configured | generic unavailable | `operationsRisk.error.providerReadinessUnavailable` | provider unavailable | generic | no provider account leak |

Provider delivery is not approved by this task.

## First-Release Exclusion Mappings

| Excluded surface | Cause | Safe UI posture |
| --- | --- | --- |
| AI risk radar | future-only | disabled until approval |
| export controls | future-only / usage-sensitive | unavailable |
| advanced rules | future-only | unavailable |
| broad audit view | future-only | unavailable or hidden |
| provider delivery | future-only | delivery unavailable |
| survey runtime | future-only | not shown in SLA/risk first release |

First-release exclusion should not imply that hidden tenants or plans have the feature.

## Generic Safe-Deny and 403 vs 404 Guidance

Use explicit 403-style behavior when:

- the user can already see the item,
- the failed action is safe to disclose,
- the message does not reveal hidden context.

Use generic 404-style behavior when:

- organization scope is wrong or uncertain,
- resource visibility is not established,
- evidence or audit existence is sensitive,
- channel binding or provider readiness is sensitive,
- entitlement details would reveal hidden plan or tenant information.

## Localization Key Alignment with Task202

This document references Task202 placeholder key families only. It does not create localization files or production translation strings.

Future implementation must re-review key names, fallback copy, interpolation, and supported languages.

## Disabled-State Alignment with Task203

Task203 defines disabled-state copy categories. Task205 maps those categories to API behavior.

Future Admin UI should not create separate copy for each backend failure if a generic safe state is safer.

## API Error Mapping Alignment with Task201

Task201 provides feature gate error mapping principles. Task205 applies those principles to Admin empty-state surfaces.

The mapping remains proposal-only and should not be used as executable routing logic.

## API Response Shape Alignment with Task196

Future API responses should use safe fields only:

- `error.code`
- `error.messageKey`
- `error.safeMessage`
- `error.retryHint`
- `error.correlationId`
- allow-listed field errors when applicable

Do not include raw diagnostics, hidden ids, raw payloads, or provider data.

## Resource Enumeration and Non-Leakage Alignment

Future tests should confirm:

- hidden resources produce generic unavailable states,
- hidden queues do not reveal counts,
- hidden evidence does not reveal existence,
- hidden audit does not reveal existence,
- missing entitlement does not reveal plan details,
- missing permission does not reveal hidden items,
- channel/provider states do not reveal binding or configuration,
- AI states do not reveal prompts, outputs, or provider diagnostics.

Task205 does not create tests.

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

Admin empty-state and API error mapping should remain channel-agnostic.

Do not expose:

- LINE binding status,
- raw LINE identifiers,
- LINE access tokens,
- channel secrets,
- provider account readiness,
- raw delivery payloads.

## AI Advisory-Only Boundary

AI-related empty states and API errors must not imply that AI can:

- dispatch,
- complete,
- close,
- approve,
- suppress,
- escalate,
- notify,
- write official facts.

The fallback is human review.

## Alignment with Task173-Task204

Task205 preserves:

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
- disabled-state copy remains placeholder-only,
- empty-state surfaces remain inventory-only.

## Implementation Blockers and Required Approvals

Before implementation, future tasks must approve:

1. production Admin surfaces,
2. production API error mapping,
3. production localization keys,
4. disabled-state copy,
5. permission / entitlement / scope evaluation,
6. non-leakage tests,
7. QA screenshot redaction,
8. audit policy,
9. security review.

## Future Task Candidates

Possible next docs-only tasks:

- resource enumeration expected response matrix,
- Admin empty-state localization readiness review,
- no-send / no-provider Admin copy policy,
- tenant admin feature-unavailable copy policy,
- usage/export unavailable copy policy,
- AI unavailable copy policy,
- first-release Admin surface acceptance checklist.

Runtime and Admin implementation remain out of scope.

## Verification Checklist

Task205 should be considered valid only if:

- it remains documentation-only,
- it does not define final production Admin/API mapping,
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

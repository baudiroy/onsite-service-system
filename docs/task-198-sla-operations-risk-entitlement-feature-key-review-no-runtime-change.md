# Task 198 - SLA / Operations Risk Entitlement Feature Key Review / No Runtime Change

## Purpose and Non-Goals

Task198 defines a documentation-only review of future entitlement feature keys for SLA / operations risk workflows.

This document proposes placeholder feature key groups, naming guidelines, first-release candidates, future-only candidates, AI add-on candidates, usage-sensitive candidates, and admin-only configuration candidates. It is not a production feature catalog and does not create entitlement runtime behavior.

Task198 builds on:

- `docs/PROJECT_GUARDRAILS.md`
- the user-provided short SaaS-ready and plan-based entitlement guardrails synced with PM
- `docs/task-186-sla-operations-risk-first-release-risk-scope-proposal-no-runtime-change.md`
- `docs/task-187-sla-operations-risk-rbac-matrix-draft-no-runtime-change.md`
- `docs/task-189-sla-operations-risk-error-code-catalog-draft-no-runtime-change.md`
- `docs/task-196-sla-operations-risk-api-error-response-shape-draft-no-runtime-change.md`
- `docs/task-197-sla-operations-risk-entitlement-failure-ux-draft-no-runtime-change.md`

Task198 does not:

- define final production feature keys,
- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify API behavior,
- modify routes, controllers, services, repositories, validators, mappers, or permission middleware,
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
- create entitlement runtime,
- create usage metering runtime,
- create SaaS billing, subscription, payment, plan, or pricing runtime,
- add notification sending,
- send LINE / APP / SMS / email,
- enable survey runtime,
- enable AI automatic decisions,
- modify inventory docs,
- output sensitive values.

## Source-of-Truth Guardrails

Task198 preserves:

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

Feature keys in this document are proposal-only labels for product and engineering alignment. They must not be treated as enabled features until future approval, implementation, tests, and security review exist.

## Current Architecture Assumptions

Task198 assumes:

- no SLA / operations risk runtime exists,
- no SLA / operations risk API exists,
- no SLA / operations risk Admin dashboard exists,
- no entitlement runtime exists,
- no usage metering runtime exists,
- no SaaS billing / subscription / payment runtime exists,
- no plan/pricing runtime exists,
- no notification provider delivery is approved,
- survey runtime remains paused,
- AI remains advisory only.

This document therefore reviews naming and grouping only.

## Entitlement Feature Key Review Principles

Future entitlement feature keys should:

1. be stable enough for product, engineering, support, and audit discussions,
2. describe product capability, not UI placement,
3. avoid exposing internal implementation details to customers or normal operators,
4. be organization / tenant scoped by default,
5. remain independent from user permission labels,
6. support future plan-based entitlement without forcing immediate SaaS billing,
7. support future usage-sensitive controls without implementing metering now,
8. support AI add-on boundaries without authorizing AI decisions,
9. avoid LINE-only naming when the capability is channel-agnostic,
10. avoid implying that a gated feature can mutate official Case / Appointment / Report lifecycle state automatically.

Feature keys should be safe to reference in internal implementation notes. Customer-facing copy should usually use plain feature names rather than raw feature keys.

## Feature Key Naming Guidelines

Recommended naming style:

- use lower snake case,
- use product-domain prefixes such as `sla_`, `operations_risk_`, `customer_`, or `case_`,
- use capability nouns rather than UI labels,
- separate AI add-on keys with `ai_` or an explicit `operations_risk_ai_` prefix,
- separate export keys from view/action keys,
- avoid provider-specific names unless the capability is truly provider-specific,
- avoid plan tier names inside feature keys,
- avoid tenant/customer names inside feature keys,
- avoid pricing, quota, or usage values inside feature keys.

Examples of acceptable placeholder style:

```text
sla_tracking
operations_risk_dashboard
operations_risk_queue
operations_risk_actions
operations_risk_ai_hints
operations_risk_export
```

Examples to avoid:

```text
line_only_sla_dashboard
enterprise_customer_export
tenant_a_ai_package
paid_plan_risk_queue
provider_cost_alert
```

## Proposal-Only Feature Key Inventory

The following inventory is for alignment only. It is not a production entitlement registry.

| Placeholder feature key | Capability area | Proposed category | Notes |
| --- | --- | --- | --- |
| `sla_tracking` | SLA visibility | first-release candidate | baseline internal tracking / queue eligibility |
| `operations_risk_dashboard` | operations dashboard | first-release candidate | role-scoped dashboard shell in future Admin |
| `operations_risk_queue` | risk queue | first-release candidate | view safe risk queues within organization scope |
| `operations_risk_actions` | human actions | first-release candidate | acknowledge, assign, comment, resolve under RBAC |
| `operations_risk_audit_view` | audit visibility | future-only / admin | read risk action history with scoped visibility |
| `operations_risk_export` | export | usage-sensitive | safe summary export only, no raw payload |
| `operations_risk_ai_hints` | AI advisory hints | AI add-on candidate | suggestion-only, no official decisions |
| `operations_risk_ai_radar` | AI risk radar | AI add-on / future-only | higher policy sensitivity |
| `operations_risk_advanced_rules` | advanced policy | future-only | custom rules, thresholds, suppressions |
| `operations_risk_business_hours` | schedule policy | admin configuration | business-hour-aware thresholds |
| `operations_risk_custom_thresholds` | threshold policy | admin configuration | custom policy requiring approvals |
| `operations_risk_role_queues` | role queues | first-release / admin config | queue availability by role and organization |
| `operations_risk_api_access` | API access | future-only | external API access requires separate security review |

## First-Release Candidate Feature Keys

First-release candidates should match Task186's narrow review-first posture.

| Feature key | Why it may fit first release | Must remain human-reviewed |
| --- | --- | --- |
| `sla_tracking` | supports basic overdue / near-due visibility | yes |
| `operations_risk_dashboard` | gives authorized users a safe view of queues | yes |
| `operations_risk_queue` | allows operational risks to be listed and filtered | yes |
| `operations_risk_actions` | allows non-lifecycle workflow actions such as acknowledge / assign / comment | yes |
| `operations_risk_role_queues` | maps risks to role-focused work queues | yes |

These keys must not create appointments, complete reports, close cases, send notifications, approve quotes, approve settlement, change `finalAppointmentId`, or suppress risks automatically.

## Future-Only Feature Keys

Future-only keys should remain disabled until separate product, security, and implementation approval exists.

| Feature key | Why future-only |
| --- | --- |
| `operations_risk_audit_view` | audit visibility requires sensitivity policy and RBAC finalization |
| `operations_risk_export` | export can leak data if not scoped, redacted, and monitored |
| `operations_risk_ai_radar` | AI risk radar is higher sensitivity and must remain advisory |
| `operations_risk_advanced_rules` | custom rules affect policy consistency and operations |
| `operations_risk_api_access` | external access requires API, auth, rate limit, logging, and non-leakage review |

Future-only does not mean rejected. It means the first release should avoid these dependencies.

## AI Add-On Feature Keys

AI add-on feature keys are proposal-only.

| Feature key | Allowed future use | Not allowed |
| --- | --- | --- |
| `operations_risk_ai_hints` | summarize why a risk may matter, suggest review focus, identify missing fields | no auto dispatch, completion, settlement, escalation, suppression, or notification |
| `operations_risk_ai_radar` | future higher-level advisory pattern detection | no official severity decision, no customer-facing action, no hidden state mutation |

AI feature keys must remain separate from deterministic risk visibility. If an organization does not have AI add-on entitlement, deterministic queues should still be able to operate if separately entitled.

AI output must be labeled as advisory and must not become official record without human confirmation.

## Export / Usage-Sensitive Feature Keys

Usage-sensitive keys require extra caution because exports, provider calls, AI support, and high-volume usage may create privacy, security, and cost risk.

| Feature key | Sensitivity | Future requirement |
| --- | --- | --- |
| `operations_risk_export` | data export / leakage risk | safe summary allow-list, permission, entitlement, audit, and usage policy |
| `operations_risk_api_access` | external access and enumeration risk | API security review, rate limit, organization scope, and response redaction |
| `operations_risk_ai_hints` | provider/cost and AI output risk | no raw payload, no sensitive values, reviewable hints only |
| `operations_risk_ai_radar` | higher sensitivity AI risk classification | policy approval, no autonomous action, no customer-visible raw output |

Task198 does not define usage limits, quota values, paid plan thresholds, billing events, or provider metering.

## Admin Configuration Feature Keys

Some capabilities are configuration-oriented and should be visible only to authorized tenant admins or internal administrators in future implementation.

| Feature key | Configuration area | Notes |
| --- | --- | --- |
| `operations_risk_business_hours` | business hours and holiday policy | must align with Task176 |
| `operations_risk_custom_thresholds` | threshold customization | must align with Task175 and approval policy |
| `operations_risk_role_queues` | role queue availability | must align with Task187 RBAC |
| `operations_risk_advanced_rules` | custom rule strategy | future-only; likely needs audit and review workflow |

Configuration entitlement does not grant normal operators permission to edit policy. Future implementation must require both entitlement and permission.

## Permission vs Entitlement Matrix

Permission and entitlement are different gates.

| Capability | Entitlement example | Permission example | Both required? |
| --- | --- | --- | --- |
| view SLA dashboard | `operations_risk_dashboard` | `risk.queue.view` | yes |
| view risk queue | `operations_risk_queue` | `risk.queue.view` | yes |
| acknowledge risk | `operations_risk_actions` | `risk.acknowledge` | yes |
| assign risk owner | `operations_risk_actions` | `risk.assign` | yes |
| view risk audit | `operations_risk_audit_view` | `risk.audit.view` | yes |
| export risk summary | `operations_risk_export` | `risk.export.safe_summary` | yes |
| view AI hint | `operations_risk_ai_hints` | `risk.ai_hint.view` | yes |
| configure business hours | `operations_risk_business_hours` | future admin policy permission | yes |
| configure custom thresholds | `operations_risk_custom_thresholds` | future admin policy permission | yes |

If either gate fails, the UX and API should follow Task197 non-leakage guidance and Task196 safe response shape.

## Organization / Tenant Scope Assumptions

Every future feature entitlement must be scoped to an organization / tenant.

Recommended assumptions:

- feature availability is evaluated per `organization_id`,
- user permissions are evaluated for the same organization context,
- line/channel identities remain scoped by organization and channel,
- feature keys must not encode organization names,
- feature keys must not encode customer identifiers,
- feature keys must not expose hidden resource existence,
- audit logs should record organization scope and actor when future runtime exists.

Task198 does not define tenant subscription tables or entitlement tables. Those remain future schema work.

## Usage and AI Cost Boundary Notes

Future usage-sensitive features may need controls, but Task198 does not implement or approve them.

Future policy areas:

- export count and export content sensitivity,
- AI advisory usage and cost control,
- provider integration limits,
- API rate limits,
- dashboard query volume,
- report generation volume,
- tenant-level custom limits,
- enterprise custom entitlement.

The platform should avoid exposing raw usage, billing diagnostics, provider costs, or AI cost units to normal operators. If future product policy allows tenant admin visibility, that visibility must be designed separately.

## Disabled-Until-Approved Feature Keys

The following keys should stay disabled until future approvals exist:

- `operations_risk_ai_radar`
- `operations_risk_advanced_rules`
- `operations_risk_api_access`
- `operations_risk_export`
- `operations_risk_audit_view` for broad audit visibility
- `operations_risk_custom_thresholds` for tenant-managed thresholds

Disabled means no runtime feature should be exposed, even if placeholder documentation exists.

## Channel-Agnostic and LINE-Safe Boundaries

SLA / operations risk entitlement keys should not hard-code LINE.

Principles:

- risk visibility should be based on internal Case / Appointment / Report state,
- future notification or customer self-service channels are separate capabilities,
- LINE identity must remain scoped by organization and channel,
- raw channel identifiers must not be exposed in entitlement UX,
- feature keys should remain valid if future APP, SMS, email, or web portal support exists,
- entitlement failure copy must not reveal whether a customer has a channel binding.

Channel delivery remains a separate future branch and is not approved by Task198.

## Entitlement Failure UX Alignment with Task197

Task198 aligns with Task197:

- non-admin users should usually see generic unavailable copy,
- tenant admins may receive more detail only if future policy approves,
- usage limits should not reveal sensitive numbers or provider diagnostics,
- AI add-on limits should not imply AI has authority,
- feature keys should not be shown as customer-facing labels,
- entitlement failures must not become workarounds for manual override.

Future API / Admin implementation should map feature keys to safe display names and safe errors.

## RBAC Alignment with Task187

Task187 defines proposal-only permission labels. Task198 maps feature keys to those permission categories without creating runtime permission logic.

Important alignment:

- entitlement grants organization feature availability only,
- permission grants user action rights only,
- neither gate alone is sufficient,
- AI assistant is never a permissioned actor,
- risk actions must not mutate official Case / Appointment / Field Service Report lifecycle,
- audit visibility is more sensitive than queue visibility,
- exports require stricter permission and entitlement than dashboard view.

## First-Release Scope Alignment with Task186

Task186 recommends a narrow first release focused on human-reviewed queue signals.

Recommended first-release entitlement subset:

1. `sla_tracking`
2. `operations_risk_dashboard`
3. `operations_risk_queue`
4. `operations_risk_actions`
5. `operations_risk_role_queues`

Not recommended for first release unless separately approved:

- AI radar,
- broad exports,
- external API access,
- custom advanced rules,
- provider delivery,
- survey runtime,
- billing / settlement risk automation.

## Error / API Response Alignment with Task189 / Task196

Future API implementation should align with:

- Task189 error code catalog,
- Task190 allow-list review,
- Task191 403 vs 404 non-leakage decision,
- Task196 API error response shape,
- Task197 entitlement failure UX.

Suggested future mappings:

| Scenario | Safe public category | Notes |
| --- | --- | --- |
| organization lacks feature entitlement | feature unavailable | do not reveal plan internals to normal users |
| user lacks permission but feature exists | permission denied | do not reveal hidden resource details |
| both permission and entitlement fail | generic unavailable | choose non-leaking response |
| usage-sensitive feature unavailable | feature unavailable / limited | avoid raw usage and billing diagnostics |
| AI add-on unavailable | AI suggestion unavailable | preserve AI advisory-only language |

Task198 does not create API responses or runtime errors.

## Alignment with Task173-Task195

Task198 preserves prior design direction:

- Task173 escalation remains human-reviewed.
- Task174 data model remains proposal-only.
- Task175 thresholds remain proposal-only.
- Task176 business hours remain policy-only.
- Task177 dedupe and suppression remain policy-only.
- Task178 dashboards remain design-only.
- Task179 human action workflow remains future-only.
- Task180 audit and evidence policy remains design-only.
- Task181 organization and permission scope remain mandatory.
- Task182 / Task183 Admin dashboard and copy remain non-runtime drafts.
- Task184 API contract remains draft-only.
- Task185 readiness gate remains blocking before runtime.
- Task186 first-release scope remains narrow.
- Task187 RBAC remains proposal-only.
- Task188 safe error copy remains non-leaking.
- Task189-Task196 error and API response guidance remains proposal-only.
- Task197 entitlement failure UX remains non-runtime.

## Implementation Blockers and Required Approvals

Before any implementation uses these feature keys, future tasks must define and approve:

1. production feature key catalog,
2. plan / entitlement source of truth,
3. tenant subscription and custom entitlement policy,
4. permission-to-entitlement evaluation order,
5. API response mapping and localization,
6. Admin UI copy and disabled-state behavior,
7. usage-sensitive metering model if needed,
8. export allow-list and audit policy,
9. AI advisory cost control and redaction rules,
10. support / tenant admin visibility policy,
11. tests for permission, entitlement, organization scope, and non-leakage,
12. security review.

Implementation still requires explicit approval. This document is not that approval.

## Future Task Candidates

Possible next docs-only tasks:

- define first-release entitlement subset decision packet,
- map entitlement keys to Task187 permission labels,
- map entitlement failures to Task189 error codes,
- define tenant-admin visibility policy,
- define usage-sensitive feature metering proposal,
- define export entitlement and safe-summary policy,
- define AI add-on entitlement and cost-control policy,
- define Admin disabled-state copy for feature-gated actions.

Possible implementation tasks must wait until PM / user explicitly approves runtime scope.

## Verification Checklist

Task198 should be considered valid only if:

- it remains documentation-only,
- it does not define final production feature keys,
- it does not modify backend source,
- it does not modify Admin source,
- it does not modify API behavior,
- it does not modify smoke, browser smoke, automated tests, or QA scripts,
- it does not modify OpenAPI / Swagger / generated clients,
- it does not create executable schema/config,
- it does not add migrations,
- it does not connect to DB,
- it does not run DDL,
- it does not apply or dry-run Migration 020,
- it does not implement entitlement runtime,
- it does not implement usage metering,
- it does not implement SaaS billing / subscription / payment,
- it does not implement plan / pricing runtime,
- it does not send LINE / APP / SMS / email,
- it does not implement survey runtime,
- it does not implement AI automatic decisions,
- it does not modify inventory docs,
- it contains no sensitive values,
- it does not violate `docs/PROJECT_GUARDRAILS.md`.

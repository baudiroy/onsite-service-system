# Task 200 - SLA / Operations Risk First-Release Entitlement Subset Decision Packet / No Runtime Change

## Purpose and Non-Goals

Task200 defines a documentation-only first-release entitlement subset decision packet for future SLA / operations risk workflows.

This document proposes which placeholder entitlement feature keys from Task198 are suitable for a narrow first release, which keys should remain future-only, which keys are AI add-on candidates, which keys are usage/export-sensitive, and which keys are admin-configuration candidates. It is not a production entitlement catalog and does not approve implementation.

Task200 builds on:

- `docs/PROJECT_GUARDRAILS.md`
- the user-provided short SaaS-ready and plan-based entitlement guardrails synced with PM
- `docs/task-186-sla-operations-risk-first-release-risk-scope-proposal-no-runtime-change.md`
- `docs/task-187-sla-operations-risk-rbac-matrix-draft-no-runtime-change.md`
- `docs/task-190-sla-operations-risk-api-error-allow-list-review-no-runtime-change.md`
- `docs/task-191-sla-operations-risk-403-vs-404-non-leakage-decision-packet-no-runtime-change.md`
- `docs/task-196-sla-operations-risk-api-error-response-shape-draft-no-runtime-change.md`
- `docs/task-197-sla-operations-risk-entitlement-failure-ux-draft-no-runtime-change.md`
- `docs/task-198-sla-operations-risk-entitlement-feature-key-review-no-runtime-change.md`
- `docs/task-199-sla-operations-risk-entitlement-to-permission-mapping-matrix-no-runtime-change.md`

Task200 does not:

- define final production entitlement subset,
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

Task200 preserves:

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

Task200 assumes:

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

This decision packet is a planning artifact only.

## First-Release Entitlement Subset Principles

The first-release entitlement subset should:

1. be small,
2. support internal human review,
3. avoid provider delivery,
4. avoid official Case / Appointment / Report mutation,
5. avoid survey runtime,
6. avoid billing / settlement automation,
7. avoid AI automatic decisions,
8. avoid exports unless separately approved,
9. avoid tenant-managed advanced rules in the first pass,
10. be testable with safe summaries and non-leaking errors.

The first release should prove operators can safely see and review risk before adding automation, delivery, exports, or AI-enhanced behavior.

## Candidate Feature Key Classification Model

| Classification | Meaning |
| --- | --- |
| first-release candidate | suitable for narrow review-first internal rollout planning |
| future-only | valuable but should not be enabled in the first release |
| AI add-on candidate | depends on AI advisory policy, cost control, and redaction review |
| usage/export-sensitive candidate | may create data leakage, usage, or cost risk |
| admin-configuration candidate | affects rules/policy and requires stronger admin controls |
| disabled until explicit approval | must remain unavailable until future branch approves it |

Classifications may overlap. For example, `operations_risk_export` is both future-only and usage/export-sensitive.

## Proposed First-Release Candidate Entitlements

Recommended minimal subset:

| Feature key | Decision | Allowed first-release behavior |
| --- | --- | --- |
| `sla_tracking` | include as candidate | internal SLA / risk eligibility and safe queue visibility |
| `operations_risk_dashboard` | include as candidate | role-scoped dashboard shell with safe summaries |
| `operations_risk_queue` | include as candidate | list and filter safe risk queue items |
| `operations_risk_actions` | include as candidate | manual acknowledge, triage, assign, comment, resolve under RBAC |
| `operations_risk_role_queues` | include as candidate | role-oriented queue grouping and visibility |

These entitlements are proposed only for internal review workflows. They do not approve runtime implementation.

## Future-Only Entitlements

| Feature key | Reason to defer |
| --- | --- |
| `operations_risk_audit_view` | audit visibility requires finalized sensitivity and RBAC policy |
| `operations_risk_export` | exports are leakage-sensitive and need allow-list, audit, and usage policy |
| `operations_risk_ai_radar` | AI risk radar requires AI policy, cost control, and advisory-only review |
| `operations_risk_advanced_rules` | advanced rules affect operations policy and need governance |
| `operations_risk_api_access` | external access requires API security, rate limiting, and non-leakage tests |
| `operations_risk_custom_thresholds` | tenant-managed thresholds require policy approval and audit |

Future-only means not part of the proposed first-release subset.

## AI Add-On Candidate Entitlements

| Feature key | Proposed status | Boundary |
| --- | --- | --- |
| `operations_risk_ai_hints` | future optional add-on, not required for first release | advisory suggestions only |
| `operations_risk_ai_radar` | future-only | higher-risk advisory pattern detection only |

AI add-on entitlements must not authorize AI to dispatch, complete reports, close cases, approve quotes, approve settlement, suppress risks, escalate risks, or send notifications.

## Usage / Export-Sensitive Candidate Entitlements

| Feature key | Sensitivity | First-release decision |
| --- | --- | --- |
| `operations_risk_export` | data export and leakage risk | exclude |
| `operations_risk_api_access` | external access and enumeration risk | exclude |
| `operations_risk_ai_hints` | provider/cost and AI output risk | exclude from first release unless separate AI policy approves |
| `operations_risk_ai_radar` | provider/cost and higher-risk AI interpretation | exclude |

Task200 does not define metering, quotas, billing events, or provider cost controls.

## Admin Configuration Candidate Entitlements

| Feature key | Proposed status | Reason |
| --- | --- | --- |
| `operations_risk_business_hours` | future admin configuration | depends on approved business-hours policy |
| `operations_risk_custom_thresholds` | future admin configuration | can affect risk volume and urgency |
| `operations_risk_role_queues` | limited first-release candidate | only safe role queue grouping, not self-service admin config |
| `operations_risk_advanced_rules` | future-only | requires governance and audit |

First release may use fixed approved policy values, but should avoid tenant self-service configuration until a future task approves it.

## Disabled-Until-Approved Entitlements

The following should stay disabled until explicit future approval:

- `operations_risk_audit_view` for broad audit access,
- `operations_risk_export`,
- `operations_risk_ai_hints`,
- `operations_risk_ai_radar`,
- `operations_risk_advanced_rules`,
- `operations_risk_api_access`,
- `operations_risk_business_hours` for tenant-managed config,
- `operations_risk_custom_thresholds`,
- provider notification or delivery capabilities,
- survey runtime capabilities.

Disabled means no runtime UI, API, or background behavior should expose the capability.

## Read-Only / Review-Only / Manual-Action-Only Boundaries

First-release candidates should be limited to:

- read-only queue visibility,
- read-only dashboard summaries,
- safe detail summaries,
- manual acknowledge,
- manual triage,
- manual assignment,
- manual comments,
- manual resolution of risk workflow items.

They must not:

- mutate official Case state,
- mutate official Appointment state,
- mutate official Field Service Report state,
- select or override `finalAppointmentId`,
- approve quote or settlement,
- trigger survey sending,
- trigger customer messaging,
- trigger provider delivery,
- execute AI decisions.

## No Notification / No Provider Sending Boundary

First-release entitlements do not include outbound delivery.

Not included:

- LINE push,
- APP push,
- SMS,
- email,
- webhook delivery,
- survey delivery,
- provider message sending,
- customer-facing reminder sending.

Future notification branches must define channel abstraction, opt-out policy, provider credentials, delivery failure handling, audit, and non-leakage behavior.

## No Official State Mutation Boundary

Operations risk workflow may point users toward items that need attention, but it must not become a hidden official lifecycle mutation path.

Not allowed:

- auto-create appointment,
- auto-cancel appointment,
- auto-complete appointment,
- auto-complete report,
- auto-close case,
- auto-reopen case,
- auto-select final appointment,
- auto-approve quote,
- auto-approve settlement,
- auto-close complaint.

If future UI links to a Case / Appointment / Report workflow, that workflow must enforce its own existing guards and permissions.

## No AI Auto-Decision Boundary

AI may not be part of the first-release entitlement subset unless separately approved as advisory-only.

AI must not:

- decide official severity,
- decide assignment,
- dispatch,
- complete,
- close,
- suppress,
- escalate,
- approve quote,
- approve settlement,
- send messages,
- hide negative feedback,
- write uncertain content as fact.

## First-Release Risk Scope Alignment with Task186

Task186 recommended review-first risk categories such as:

- active case not dispatched,
- active case with no open appointment after prior terminal state,
- appointment unassigned,
- appointment unconfirmed,
- appointment not started,
- stale on-site visit,
- pending parts without next visit,
- pending quote without customer decision,
- report in progress too long,
- completion blocked because no eligible completed visit exists,
- repeated reschedules,
- multiple incomplete visits.

The proposed first-release entitlement subset supports these as internal queue/review signals only.

## Entitlement-to-Permission Alignment with Task199

Task199 maps first-release candidates to permissions:

| Feature key | Typical permissions |
| --- | --- |
| `sla_tracking` | `risk.queue.view`, `risk.detail.view` |
| `operations_risk_dashboard` | `risk.queue.view` |
| `operations_risk_queue` | `risk.queue.view`, `risk.detail.view` |
| `operations_risk_actions` | `risk.acknowledge`, `risk.triage`, `risk.assign`, `risk.comment`, `risk.resolve` |
| `operations_risk_role_queues` | `risk.queue.view` plus future role/queue scope |

Future implementation must still check organization scope and user permission.

## RBAC Alignment with Task187

First-release entitlements should be usable only with Task187-style least privilege.

Recommended posture:

- customer service sees customer-follow-up queues within scope,
- dispatch sees scheduling / assignment queues within scope,
- engineer lead sees field execution / report hygiene queues within scope,
- parts coordinator sees pending parts queues within scope,
- supervisor sees broader or higher-risk items if granted,
- auditor is read-only by default,
- AI assistant has no action authority.

## Entitlement Failure UX Alignment with Task197

If a future first-release feature is unavailable:

- normal operators should see generic feature unavailable / contact admin copy,
- managers may see limited request-access copy if approved,
- tenant admins may see safe feature status only if future policy approves,
- customers should not see entitlement language,
- copy must not expose plan internals, usage values, billing details, provider details, or raw feature keys.

## Error / API Response Alignment with Task190 / Task191 / Task196

Future API behavior should use:

- allow-listed safe error codes,
- safe message keys,
- safe fallback messages,
- opaque correlation references,
- non-leaking 403 / 404 decisions,
- no raw payload,
- no raw identifiers,
- no diagnostic dumps.

Task200 does not create API implementation.

## Organization / Tenant Scope Assumptions

First-release entitlement evaluation should be organization / tenant scoped.

Assumptions:

- entitlement availability is evaluated per organization,
- user permissions are evaluated per organization,
- queue visibility is scoped to authorized role / owner / team where applicable,
- branch / team scope remains placeholder-only until schema and policy exist,
- feature keys must not encode organization names,
- feature keys must not encode customer identifiers,
- feature keys must not reveal hidden resource existence.

## Channel-Agnostic and LINE-Safe Boundaries

The first-release entitlement subset should not depend on LINE.

Principles:

- risk queues are based on internal Case / Appointment / Report state,
- channel identity is not needed for risk queue visibility,
- LINE-specific delivery is not approved,
- raw channel identifiers must not appear in UX or API responses,
- future APP / SMS / email support should not require changing first-release entitlement names,
- existing case reverse LINE binding remains a separate product branch.

## Open Decisions and Required Approvals

Before implementation, the team must decide:

1. whether the proposed first-release subset is accepted,
2. which roles can use each first-release capability,
3. whether `operations_risk_role_queues` is entitlement-only or also configurable,
4. how tenant admins see feature availability,
5. whether first release includes any read-only audit visibility,
6. whether first release includes any AI hints,
7. how to localize disabled-feature copy,
8. how to test non-leakage across entitlement, permission, and scope failures,
9. whether branch/team scope is needed before runtime.

## Alignment with Task173-Task198

Task200 preserves:

- escalation remains human-reviewed,
- data model remains proposal-only,
- thresholds remain proposal-only,
- business hours remain policy-only,
- dedupe and suppression remain policy-only,
- dashboard remains design-only,
- human actions remain future-only,
- audit and evidence policy remains design-only,
- organization and permission scope remain mandatory,
- API contract remains draft-only,
- readiness gate remains blocking before runtime,
- first-release risk scope remains narrow,
- RBAC remains proposal-only,
- safe error / response / redaction guidance remains mandatory,
- entitlement UX remains non-runtime,
- feature keys remain placeholder-only,
- entitlement-to-permission mapping remains proposal-only.

## Implementation Blockers

Implementation requires:

- explicit approval of first-release entitlement subset,
- production feature key catalog,
- production permission catalog,
- entitlement storage/source-of-truth design,
- permission evaluation design,
- organization and scope enforcement design,
- API contract finalization,
- Admin UI design,
- safe error and copy finalization,
- audit policy,
- tests for RBAC, entitlement, scope, and non-leakage,
- security review.

## Future Task Candidates

Possible next docs-only tasks:

- first-release entitlement subset PM decision review,
- first-release feature key to UI surface mapping,
- tenant admin visibility policy,
- operations risk export exclusion policy,
- AI hint entitlement exclusion / inclusion decision,
- feature gate error code mapping,
- implementation readiness gate update.

Runtime implementation remains out of scope.

## Verification Checklist

Task200 should be considered valid only if:

- it remains documentation-only,
- it does not define final production entitlement subset,
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

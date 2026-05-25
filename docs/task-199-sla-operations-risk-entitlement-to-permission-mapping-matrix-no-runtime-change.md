# Task 199 - SLA / Operations Risk Entitlement-to-Permission Mapping Matrix / No Runtime Change

## Purpose and Non-Goals

Task199 defines a documentation-only mapping matrix between future SLA / operations risk entitlement feature keys and future risk permission labels.

This document is proposal-only. It does not create production entitlement behavior, permission behavior, API authorization behavior, Admin UI behavior, executable config, or runtime policy.

Task199 builds on:

- `docs/PROJECT_GUARDRAILS.md`
- the user-provided short SaaS-ready and plan-based entitlement guardrails synced with PM
- `docs/task-186-sla-operations-risk-first-release-risk-scope-proposal-no-runtime-change.md`
- `docs/task-187-sla-operations-risk-rbac-matrix-draft-no-runtime-change.md`
- `docs/task-188-sla-operations-risk-safe-error-and-permission-failure-copy-draft-no-runtime-change.md`
- `docs/task-189-sla-operations-risk-error-code-catalog-draft-no-runtime-change.md`
- `docs/task-190-sla-operations-risk-api-error-allow-list-review-no-runtime-change.md`
- `docs/task-191-sla-operations-risk-403-vs-404-non-leakage-decision-packet-no-runtime-change.md`
- `docs/task-196-sla-operations-risk-api-error-response-shape-draft-no-runtime-change.md`
- `docs/task-197-sla-operations-risk-entitlement-failure-ux-draft-no-runtime-change.md`
- `docs/task-198-sla-operations-risk-entitlement-feature-key-review-no-runtime-change.md`

Task199 does not:

- define final production entitlement-to-permission mapping,
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

Task199 preserves:

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
- scope checks remain mandatory,
- customer-visible data and internal-only data remain separated,
- AI is advisory only,
- future design notes do not authorize runtime implementation.

## Current Architecture Assumptions

Task199 assumes:

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

This mapping is a discussion artifact only.

## Entitlement-to-Permission Mapping Principles

Future authorization should require four gates:

1. the organization has the relevant feature entitlement,
2. the user has the relevant permission,
3. the requested object is inside allowed organization / tenant / branch / team scope,
4. the response follows safe error and non-leakage rules.

Principles:

- Entitlement answers whether the organization has access to the capability.
- Permission answers whether the user may perform the action.
- Scope answers whether the user may access this specific object.
- Response shaping answers what can be safely disclosed if any gate fails.
- No AI feature key grants AI authority to act.
- No risk permission grants official Case / Appointment / Field Service Report mutation.
- No entitlement grants a manual `finalAppointmentId` override.
- Feature-gated UX must never reveal hidden resource existence to unauthorized viewers.

## Evaluation Order Proposal

Future implementation may use this proposal, but Task199 does not implement it.

Recommended high-level order:

1. authenticate user,
2. resolve organization context,
3. check organization / tenant scope,
4. check feature entitlement,
5. check user permission,
6. check branch / team / queue scope if applicable,
7. check data sensitivity / evidence visibility if applicable,
8. return safe success or safe denial response.

Alternative future implementations may swap entitlement and permission checks for non-leakage reasons. If the order changes, the returned error must still avoid revealing whether hidden resources, hidden features, hidden queues, hidden evidence, or hidden usage exist.

## Feature Key to Permission Mapping Overview

| Capability | Placeholder entitlement key | Placeholder permission label | Scope requirement | Notes |
| --- | --- | --- | --- | --- |
| SLA tracking visibility | `sla_tracking` | `risk.queue.view` | organization / queue role | first-release candidate |
| operations risk dashboard | `operations_risk_dashboard` | `risk.queue.view` | organization / role | dashboard shell only |
| risk queue list | `operations_risk_queue` | `risk.queue.view` | organization / queue role | safe summaries only |
| risk detail view | `operations_risk_queue` | `risk.detail.view` | organization / item scope | no raw payload |
| acknowledge / triage | `operations_risk_actions` | `risk.acknowledge` / `risk.triage` | organization / queue role | no official lifecycle mutation |
| assign / reassign | `operations_risk_actions` | `risk.assign` / `risk.reassign` | organization / queue / supervisor scope | no automatic workflow mutation |
| comment | `operations_risk_actions` | `risk.comment` | organization / item scope | internal risk note only |
| evidence reference view | `operations_risk_queue` | `risk.evidence.view` | organization / evidence permission | reference only |
| evidence reference attach | `operations_risk_actions` | `risk.evidence.attach_reference` | organization / evidence permission | no raw payload dump |
| audit trail view | `operations_risk_audit_view` | `risk.audit.view` | organization / auditor scope | future-only / sensitive |
| safe summary export | `operations_risk_export` | `risk.export.safe_summary` | organization / export permission | usage-sensitive |
| AI advisory hints | `operations_risk_ai_hints` | `risk.ai_hint.view` | organization / AI hint permission | advisory-only |
| AI risk radar | `operations_risk_ai_radar` | `risk.ai_hint.view` plus future stronger permission | organization / supervisor scope | future-only |
| business-hours policy | `operations_risk_business_hours` | future admin policy permission | organization / admin scope | config only |
| custom thresholds | `operations_risk_custom_thresholds` | future admin policy permission | organization / admin scope | config only |
| advanced rules | `operations_risk_advanced_rules` | future admin policy permission | organization / admin scope | future-only |

## Dashboard and Queue Mapping

| User intent | Entitlement gate | Permission gate | Safe denial posture |
| --- | --- | --- | --- |
| open SLA dashboard | `operations_risk_dashboard` and `sla_tracking` | `risk.queue.view` | feature unavailable or permission denied, depending safe visibility |
| view role-specific queue | `operations_risk_role_queues` and `operations_risk_queue` | `risk.queue.view` | generic queue unavailable if visibility is uncertain |
| view cross-role queue | `operations_risk_queue` | supervisor-level queue permission in future | do not reveal hidden queue counts |
| filter risk categories | `operations_risk_queue` | `risk.queue.view` | show only allowed filters |
| view first-release risk item | `sla_tracking` or `operations_risk_queue` | `risk.detail.view` | no hidden item existence leakage |

Dashboard and queue access must not expose customer contact values, raw channel identifiers, provider payloads, internal diagnostics, or hidden counts.

## Risk Detail and Evidence Mapping

| User intent | Entitlement gate | Permission gate | Evidence rule |
| --- | --- | --- | --- |
| view safe risk summary | `operations_risk_queue` | `risk.detail.view` | safe summary only |
| view linked case reference | `operations_risk_queue` | risk detail plus existing case view permission | target Case permissions still apply |
| view linked appointment reference | `operations_risk_queue` | risk detail plus appointment view permission | target Appointment permissions still apply |
| view field service report reference | `operations_risk_queue` | risk detail plus report view permission | target Report permissions still apply |
| view evidence reference | `operations_risk_queue` | `risk.evidence.view` | reference only |
| attach evidence reference | `operations_risk_actions` | `risk.evidence.attach_reference` | approved reference only |

Risk detail visibility must not become a shortcut around existing Case / Appointment / Field Service Report permissions.

## Human Action Mapping

| Human action | Entitlement gate | Permission gate | Official lifecycle mutation? |
| --- | --- | --- | --- |
| acknowledge | `operations_risk_actions` | `risk.acknowledge` | no |
| triage | `operations_risk_actions` | `risk.triage` | no |
| assign | `operations_risk_actions` | `risk.assign` | no |
| reassign | `operations_risk_actions` | `risk.reassign` | no |
| comment | `operations_risk_actions` | `risk.comment` | no |
| escalate | `operations_risk_actions` | `risk.escalate` | no |
| de-escalate | `operations_risk_actions` | `risk.de_escalate` | no |
| resolve | `operations_risk_actions` | `risk.resolve` | no |
| reopen | `operations_risk_actions` | `risk.reopen` | no |
| suppress | `operations_risk_advanced_rules` or future suppression entitlement | `risk.suppress` | no |
| unsuppress | `operations_risk_advanced_rules` or future suppression entitlement | `risk.unsuppress` | no |
| mark non-actionable | `operations_risk_advanced_rules` or future suppression entitlement | `risk.non_actionable.mark` | no |

Risk actions are workflow actions. They must not complete reports, close cases, create appointments, approve quotes, approve settlement, send customer messages, or trigger survey delivery.

## Audit Trail Mapping

| User intent | Entitlement gate | Permission gate | Notes |
| --- | --- | --- | --- |
| view own action history | `operations_risk_audit_view` or future audit subset | `risk.audit.view` | future policy decision |
| view item audit trail | `operations_risk_audit_view` | `risk.audit.view` | organization scoped |
| view suppression audit | `operations_risk_audit_view` | stronger audit permission in future | sensitive operational context |
| export audit summary | `operations_risk_export` plus `operations_risk_audit_view` | `risk.export.safe_summary` plus `risk.audit.view` | future-only |

Audit visibility is more sensitive than queue visibility and should be disabled until policy, redaction, and tests exist.

## Export Mapping

| Export type | Entitlement gate | Permission gate | Status |
| --- | --- | --- | --- |
| safe queue summary export | `operations_risk_export` | `risk.export.safe_summary` | future-only / usage-sensitive |
| audit summary export | `operations_risk_export` plus `operations_risk_audit_view` | `risk.export.safe_summary` plus `risk.audit.view` | future-only |
| evidence export | not recommended for first release | evidence-specific future permission | future-only |
| raw payload export | none | none | not allowed by this design |

Exports must be safe-summary-first and require audit logging in future implementation.

## AI Advisory / AI Risk Radar Mapping

| AI capability | Entitlement gate | Permission gate | Boundary |
| --- | --- | --- | --- |
| view AI hint on risk | `operations_risk_ai_hints` | `risk.ai_hint.view` | advisory only |
| request AI risk summary | `operations_risk_ai_hints` | `risk.ai_hint.view` | no official decision |
| AI risk radar | `operations_risk_ai_radar` | `risk.ai_hint.view` plus future stronger permission | future-only |
| AI suppression recommendation | not recommended for first release | none for auto action | human review only |
| AI escalation recommendation | `operations_risk_ai_hints` if future approved | human escalation permission still required | AI cannot escalate |

AI cannot dispatch, complete, bill, suppress, escalate, approve, notify, or close anything. AI suggestions must remain reviewable by humans.

## Custom Threshold / Business-Hours / Advanced Rule Mapping

| Configuration area | Entitlement gate | Permission gate | Status |
| --- | --- | --- | --- |
| business hours | `operations_risk_business_hours` | future admin policy permission | future admin config |
| holiday calendar | `operations_risk_business_hours` | future admin policy permission | future admin config |
| threshold customization | `operations_risk_custom_thresholds` | future admin policy permission | future admin config |
| role queue configuration | `operations_risk_role_queues` | future admin policy permission | future admin config |
| advanced rules | `operations_risk_advanced_rules` | future admin policy permission | future-only |
| suppression policy | `operations_risk_advanced_rules` | `risk.suppress` / `risk.unsuppress` plus future admin policy permission | future-only |

Configuration features should not be visible to normal operators unless future policy explicitly permits limited read-only summaries.

## Permission vs Entitlement Failure Precedence

Task199 does not define executable precedence, but proposes non-leaking behavior.

| Condition | Preferred safe response |
| --- | --- |
| user lacks organization scope | generic not found / not available |
| organization lacks feature entitlement and user is not tenant admin | generic feature unavailable |
| organization lacks feature entitlement and user is authorized tenant admin | feature unavailable with safe admin next step if future policy approves |
| organization has feature but user lacks permission | permission denied if resource visibility is allowed |
| both entitlement and permission fail | generic unavailable |
| feature is usage-sensitive and unavailable | limited/unavailable without values |
| AI add-on unavailable | AI suggestion unavailable; review manually |

If there is doubt, choose the response that leaks less.

## Tenant Admin / Operations Manager / Normal User Visibility Notes

Proposal-only visibility:

| Viewer category | May see raw feature key? | May see entitlement reason? | Suggested behavior |
| --- | --- | --- | --- |
| normal operator | no | no | generic unavailable / contact admin |
| queue owner | no | minimal | queue unavailable or permission denied |
| operations manager | no by default | limited if approved | request access / contact admin |
| tenant admin | maybe in future admin console | safe summary only | feature status without secrets or hidden usage |
| super admin | maybe in future super admin console | protected diagnostics | future-only |
| customer | no | no | no entitlement language |

Raw feature keys are implementation labels and should not be customer-facing.

## Organization / Tenant / Branch / Team Scope Boundaries

Future checks must include scope:

- organization / tenant scope is mandatory,
- branch scope is placeholder-only until branch model exists,
- team scope is placeholder-only until team model exists,
- assigned-owner scope may be used for least-privilege queues,
- queue-role scope may map queues to role categories,
- supervisor scope may allow broader queue visibility,
- auditor scope should be read-only by default.

Scope failures should avoid confirming whether a hidden resource exists.

## Usage and AI Cost Boundary Notes

Usage-sensitive and AI-cost-sensitive capabilities require future policy.

Future runtime must not expose:

- raw usage values to normal operators,
- billing diagnostics,
- provider costs,
- hidden plan details,
- raw AI provider payloads,
- AI prompts or raw AI outputs,
- customer contact values,
- raw channel identifiers.

Task199 does not create usage metering, billing events, pricing logic, or cost control runtime.

## Safe Denial / Non-Leakage Alignment

Safe denial behavior should align with Task190, Task191, Task196, and Task197.

Denials should:

- use allow-listed safe codes,
- use safe message keys,
- use safe fallback copy,
- use opaque correlation references if needed,
- avoid raw identifiers,
- avoid hidden counts,
- avoid raw diagnostics,
- avoid plan internals,
- avoid raw usage values,
- avoid customer contact values,
- avoid raw channel identifiers.

The UI should not infer resource existence from different failure messages when visibility is not allowed.

## Entitlement Failure UX Alignment with Task197

Task197 UX guidance applies to every mapping row:

- feature unavailable is not the same as permission denied,
- normal users should not receive plan details,
- tenant admin visibility is future policy, not current behavior,
- upgrade / request-access copy is placeholder-only,
- usage-limit copy must avoid sensitive values,
- AI add-on copy must preserve AI advisory-only boundaries.

## Feature Key Alignment with Task198

Task199 uses Task198 placeholder keys and does not add a production feature catalog.

If future implementation changes feature keys, this mapping must be re-reviewed before code is written.

The first-release subset remains:

1. `sla_tracking`
2. `operations_risk_dashboard`
3. `operations_risk_queue`
4. `operations_risk_actions`
5. `operations_risk_role_queues`

## RBAC Alignment with Task187

Task199 uses Task187 placeholder permission labels. These labels are not executable permissions.

No mapped permission grants:

- report completion,
- case closure,
- appointment creation / cancellation,
- final appointment override,
- quote approval,
- billing / settlement approval,
- customer notification sending,
- survey delivery,
- AI automatic decision authority.

## Error / API Response Alignment with Task190 / Task191 / Task196

Future implementation should map failures to safe categories:

| Failure | Safe category | Notes |
| --- | --- | --- |
| entitlement missing | feature unavailable | details depend on viewer role and policy |
| permission missing | permission denied | only if resource visibility is allowed |
| scope mismatch | not found / unavailable | avoid resource existence leakage |
| usage-sensitive feature limited | unavailable / limited | no raw usage values |
| AI add-on unavailable | AI suggestion unavailable | manual review remains available where appropriate |

Task199 does not create error code implementation, API responses, or OpenAPI schema.

## Alignment with Task173-Task186 and Task188-Task195

Task199 preserves:

- Task173 escalation remains human-reviewed.
- Task174 data model remains proposal-only.
- Task175 thresholds remain proposal-only.
- Task176 business hours remain policy-only.
- Task177 dedupe and suppression remain policy-only.
- Task178 dashboards remain design-only.
- Task179 human actions remain future-only.
- Task180 action audit and evidence policy remains design-only.
- Task181 organization and permission scope remains mandatory.
- Task182 / Task183 Admin dashboard and copy remain non-runtime drafts.
- Task184 API contract remains draft-only.
- Task185 readiness gate remains blocking before runtime.
- Task186 first-release scope remains narrow.
- Task188 safe error copy remains non-leaking.
- Task189 error catalog remains proposal-only.
- Task190 / Task191 / Task196 response rules remain non-leaking.
- Task192 enumeration tests remain plan-only.
- Task193 / Task194 / Task195 diagnostic and QA redaction remain mandatory.

## Implementation Blockers and Required Approvals

Before implementation, future tasks must define and approve:

1. production feature key catalog,
2. production permission catalog,
3. entitlement source of truth,
4. permission source of truth,
5. evaluation order and non-leakage behavior,
6. organization / branch / team scope model,
7. tenant admin visibility policy,
8. operations manager visibility policy,
9. usage-sensitive metering policy,
10. AI add-on cost and redaction policy,
11. API error mapping,
12. Admin UI disabled-state copy,
13. export allow-list,
14. audit requirements,
15. security tests and resource enumeration tests.

## Future Task Candidates

Possible next docs-only tasks:

- first-release entitlement subset decision packet,
- production feature key naming review,
- permission catalog refinement,
- entitlement failure API code mapping,
- tenant admin visibility policy,
- usage-sensitive feature metering proposal,
- export allow-list policy,
- AI add-on entitlement / cost-control policy,
- Admin disabled-state copy matrix.

Runtime implementation must wait for explicit approval.

## Verification Checklist

Task199 should be considered valid only if:

- it remains documentation-only,
- it does not define final production mapping,
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

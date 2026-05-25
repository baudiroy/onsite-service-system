# Task 189 - SLA / Operations Risk Error Code Catalog Draft / No Runtime Change

## Purpose and Non-Goals

Task189 defines a documentation-only error code catalog draft for future SLA / operations risk workflows.

This document is proposal-only. It does not define final production error codes, executable validation rules, API schemas, backend source code, Admin source code, OpenAPI files, migration-ready schema, DDL, entitlement runtime, SaaS billing, usage metering, notification delivery, survey runtime, or AI automation.

Task189 builds on:

- `docs/PROJECT_GUARDRAILS.md`
- the user-provided short guardrails version synced with PM
- `docs/task-173-sla-operations-risk-escalation-design-no-runtime-change.md`
- `docs/task-174-sla-operations-risk-data-model-proposal-no-migration.md`
- `docs/task-175-sla-operations-risk-policy-and-threshold-matrix-no-runtime-change.md`
- `docs/task-176-sla-operations-risk-clock-source-and-business-hours-policy-no-runtime-change.md`
- `docs/task-177-sla-operations-risk-dedupe-and-suppression-policy-no-runtime-change.md`
- `docs/task-178-sla-operations-risk-dashboard-role-queue-design-no-runtime-change.md`
- `docs/task-179-sla-operations-risk-human-action-workflow-design-no-runtime-change.md`
- `docs/task-180-sla-operations-risk-action-audit-and-evidence-policy-no-runtime-change.md`
- `docs/task-181-sla-operations-risk-permission-and-organization-scope-review-no-runtime-change.md`
- `docs/task-182-sla-operations-risk-admin-dashboard-wireframe-requirements-no-admin-code-change.md`
- `docs/task-183-sla-operations-risk-dashboard-copy-and-empty-state-policy-no-admin-code-change.md`
- `docs/task-184-sla-operations-risk-api-contract-draft-no-runtime-change.md`
- `docs/task-185-sla-operations-risk-runtime-readiness-gate-no-migration-or-runtime-change.md`
- `docs/task-186-sla-operations-risk-first-release-risk-scope-proposal-no-runtime-change.md`
- `docs/task-187-sla-operations-risk-rbac-matrix-draft-no-runtime-change.md`
- `docs/task-188-sla-operations-risk-safe-error-and-permission-failure-copy-draft-no-runtime-change.md`

Task189 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify API behavior,
- modify smoke or browser smoke scripts,
- modify `package.json`,
- add tests,
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

Task189 preserves:

- one Case = one formal Field Service Report,
- one Case may have many appointments / dispatch visits,
- same Case must not have multiple open appointments at once,
- Field Service Report remains the Case-level final summary,
- `finalAppointmentId` remains backend / system determined and stable after completion,
- LINE is a channel, not the hard-coded core model,
- `line_user_id` is not global identity,
- all major future data must be organization / tenant scoped,
- permission and entitlement are separate concepts,
- AI is advisory only,
- future design notes do not authorize runtime implementation.

Error codes must not leak tenant, organization, customer, channel, provider, entitlement, or hidden resource existence.

## Current Architecture Assumptions

Task189 assumes:

- no SLA / operations risk runtime exists,
- no SLA / operations risk tables exist,
- no SLA / operations risk API exists,
- no SLA / operations risk Admin dashboard exists,
- no executable error schema exists for this branch,
- no entitlement runtime exists,
- no SaaS subscription / billing / usage runtime exists,
- no notification provider delivery is approved,
- survey runtime remains paused,
- AI remains advisory only.

This catalog is a vocabulary draft for future planning only.

## Error Code Catalog Principles

Future error codes should:

1. be stable enough for Admin UI handling,
2. avoid exposing sensitive or hidden resource details,
3. separate broad error families from localized UI copy,
4. be organization / tenant safe,
5. support safe-deny behavior,
6. support stale-state and idempotency handling,
7. distinguish permission from entitlement,
8. avoid implying provider sending exists,
9. avoid implying AI is authoritative,
10. avoid weakening official Case / Appointment / Field Service Report invariants.

Error codes should be safe for logs and API responses, but future implementation must still avoid logging raw request payloads or sensitive values.

## Error Code Naming Guidelines

Recommended naming style:

- uppercase snake case,
- family prefix where useful,
- no customer values,
- no provider names unless channel-specific scope is approved,
- no tenant names,
- no dynamic identifiers.

Examples:

- `RISK_PERMISSION_DENIED`
- `RISK_ORG_SCOPE_DENIED`
- `RISK_FEATURE_NOT_ENABLED`
- `RISK_STALE_STATE`
- `RISK_AI_ADVISORY_UNAVAILABLE`

Avoid:

- `CASE_123_NOT_IN_YOUR_ORG`
- `LINE_USER_BOUND_ELSEWHERE`
- `PHONE_NOT_FOUND`
- `TENANT_PLAN_BASIC_DENIED_FOR_CASE_ABC`

## Error Family Overview

| Family | Purpose | Non-leakage posture |
| --- | --- | --- |
| permission | user cannot perform action | do not reveal hidden role or resource details |
| organization-scope | resource outside allowed scope or unavailable | converge with not available when needed |
| entitlement / plan | organization feature not enabled or limit reached | do not reveal other plan internals |
| visibility | resource hidden, unavailable, or not found | do not confirm existence |
| invalid action | action not valid for current state | safe next step only |
| stale / conflict | item changed or concurrent update won | ask refresh |
| duplicate / suppression | grouped, suppressed, already resolved | preserve audit meaning |
| evidence / audit | restricted evidence or action history | no hidden counts or details |
| validation | input does not pass allow-list | do not echo raw input |
| rate / cooldown | too many attempts or cooldown active | no provider details |
| AI advisory | suggestion unavailable or non-authoritative | no AI action authority |
| channel / provider | delivery readiness unavailable | no provider sending assumption |

## Permission and Organization-Scope Error Drafts

| Code | Conceptual HTTP status | Safe operator message | Notes |
| --- | --- | --- | --- |
| `RISK_PERMISSION_DENIED` | 403 | You do not have permission to perform this action. | do not reveal hidden policy internals |
| `RISK_ACTION_REQUIRES_REVIEWER` | 403 | This item requires a higher review permission. | for suppression / severe resolution |
| `RISK_ORG_SCOPE_DENIED` | 404 or 403 | This item is not available. | choose status by future API policy; avoid existence leak |
| `RISK_QUEUE_SCOPE_DENIED` | 403 | This queue is not available with your current permission. | do not expose hidden queue counts |
| `RISK_EVIDENCE_PERMISSION_DENIED` | 403 | Evidence is not available with your current permission. | no evidence count |
| `RISK_AUDIT_PERMISSION_DENIED` | 403 | Action history is not available with your current permission. | no audit count |

Future implementation should decide when to collapse permission and not-found responses to prevent organization / tenant resource discovery.

## Feature Entitlement / Plan Limit Error Drafts

Permission controls what a user can do. Entitlement controls whether the organization / tenant has a feature enabled.

| Code | Conceptual HTTP status | Safe operator message | Notes |
| --- | --- | --- | --- |
| `RISK_FEATURE_NOT_ENABLED` | 403 | This feature is not available for this organization. | do not expose commercial plan details by default |
| `RISK_ENTITLEMENT_REQUIRED` | 403 | This action requires an enabled feature. | generic; no plan upsell copy here |
| `RISK_PLAN_LIMIT_REACHED` | 403 or 429 | This limit has been reached for the current period. | no exact quota unless permitted |
| `RISK_USAGE_LIMIT_REACHED` | 429 | Usage is currently limited. Try again later or contact an authorized admin. | safe for metered actions |
| `RISK_AI_ADDON_NOT_ENABLED` | 403 | AI suggestion is not available for this organization. | no AI auto action |
| `RISK_EXPORT_NOT_ENABLED` | 403 | Export is not available for this organization. | safe feature denial |

These are future design examples only. Task189 does not implement plan checks, entitlement checks, usage metering, billing events, subscriptions, trials, upgrades, downgrades, payments, or tenant plan limits.

## Resource Visibility and Non-Leakage Error Drafts

| Code | Conceptual HTTP status | Safe operator message | Notes |
| --- | --- | --- | --- |
| `RISK_ITEM_NOT_AVAILABLE` | 404 | This item is not available. | not found / hidden / out of scope |
| `RISK_CASE_CONTEXT_NOT_AVAILABLE` | 404 | Case context is not available. | do not reveal case existence |
| `RISK_APPOINTMENT_CONTEXT_NOT_AVAILABLE` | 404 | Visit context is not available. | no appointment ownership leak |
| `RISK_REPORT_CONTEXT_NOT_AVAILABLE` | 404 | Report context is not available. | no report existence leak |
| `RISK_CHANNEL_CONTEXT_NOT_AVAILABLE` | 404 | Channel information is not available. | no LINE binding leak |
| `RISK_OWNER_NOT_AVAILABLE` | 400 or 404 | This owner is not available for assignment. | no hidden user details |

Future implementation should avoid distinct errors that let a caller infer whether a hidden Case, customer, appointment, report, channel binding, or tenant resource exists.

## Invalid Action Error Drafts

| Code | Conceptual HTTP status | Safe operator message | Notes |
| --- | --- | --- | --- |
| `RISK_INVALID_ACTION` | 400 | This action is not available for the current item state. | generic fallback |
| `RISK_REASON_REQUIRED` | 400 | Add a reason before continuing. | suppression / non-actionable |
| `RISK_RESOLVE_REVIEW_REQUIRED` | 400 | Review the required details before resolving this item. | no raw missing fields |
| `RISK_ASSIGNMENT_NOT_ALLOWED` | 400 or 403 | Assignment is not available for this item. | role/scope safe |
| `RISK_ESCALATION_NOT_ALLOWED` | 400 or 403 | Escalation is not available for this item. | no policy leak |
| `RISK_SUPPRESSION_NOT_ALLOWED` | 400 or 403 | Suppression is not available for this item. | high-severity safe |

Invalid action errors must not imply that official Case / Appointment / Report lifecycle guards can be bypassed.

## Stale / Concurrent Update Error Drafts

| Code | Conceptual HTTP status | Safe operator message | Notes |
| --- | --- | --- | --- |
| `RISK_STALE_STATE` | 409 | This item changed. Refresh and try again. | primary stale-state code |
| `RISK_CONCURRENT_UPDATE` | 409 | Another update finished first. Refresh and review the latest state. | no other operator identity unless allowed |
| `RISK_OWNER_CHANGED` | 409 | The owner changed. Refresh before taking action. | safe owner conflict |
| `RISK_STATE_CHANGED` | 409 | This item is no longer in the expected state. Refresh the queue. | generic |
| `RISK_VERSION_REQUIRED` | 400 | Refresh the item before taking action. | if future version token is missing |

Stale-state behavior should be designed before runtime implementation.

## Duplicate / Suppressed / Already-Resolved Error Drafts

| Code | Conceptual HTTP status | Safe operator message | Notes |
| --- | --- | --- | --- |
| `RISK_DUPLICATE_GROUPED` | 409 or 200 | This signal is grouped with an existing item. | response semantics need future design |
| `RISK_ALREADY_SUPPRESSED` | 409 | This item is already suppressed. | no deletion implication |
| `RISK_SUPPRESSION_EXPIRED` | 409 | Suppression expired. Review the item again. | if acting on stale suppression |
| `RISK_ALREADY_RESOLVED` | 409 | This item is already resolved. | no second success |
| `RISK_REOPEN_NOT_AVAILABLE` | 400 or 403 | Reopen is not available for this item. | safe |

Future dedupe and suppression implementation must preserve history and audit.

## Audit and Evidence Access Error Drafts

| Code | Conceptual HTTP status | Safe operator message | Notes |
| --- | --- | --- | --- |
| `RISK_EVIDENCE_NOT_AVAILABLE` | 404 or 403 | Evidence is not available. | not found / hidden collapsed |
| `RISK_EVIDENCE_TYPE_RESTRICTED` | 403 | This evidence is not available with your current permission. | no evidence details |
| `RISK_AUDIT_NOT_AVAILABLE` | 404 or 403 | Action history is not available. | no count leak |
| `RISK_AUDIT_SCOPE_DENIED` | 403 | Action history is not available with your current permission. | scope safe |
| `RISK_EVIDENCE_REFERENCE_INVALID` | 400 | Evidence reference is not available. | no raw reference echo |

Evidence errors must not expose raw payloads or provider data.

## Validation and Input Error Drafts

| Code | Conceptual HTTP status | Safe operator message | Notes |
| --- | --- | --- | --- |
| `RISK_VALIDATION_FAILED` | 400 | Check the required fields and try again. | generic |
| `RISK_INVALID_FILTER` | 400 | One or more filters are not available. | do not echo raw filter |
| `RISK_INVALID_SORT` | 400 | This sort option is not available. | allow-list only |
| `RISK_INVALID_PAGE_SIZE` | 400 | Page size is outside the allowed range. | safe |
| `RISK_INVALID_REASON_CODE` | 400 | Select an available reason. | no raw submitted value |
| `RISK_INVALID_COMMENT` | 400 | Update the note and try again. | no raw note echo |

Validation errors should use allow-listed field labels and avoid echoing raw input.

## Rate Limit / Cooldown Error Drafts

| Code | Conceptual HTTP status | Safe operator message | Notes |
| --- | --- | --- | --- |
| `RISK_RATE_LIMITED` | 429 | Too many attempts. Try again later. | no internal limits unless approved |
| `RISK_ACTION_COOLDOWN_ACTIVE` | 429 or 409 | This action is in cooldown. Try again later. | no policy internals |
| `RISK_RE_ALERT_COOLDOWN_ACTIVE` | 409 | This item is waiting for the next review window. | no provider sending implication |
| `RISK_EXPORT_RATE_LIMITED` | 429 | Export is temporarily limited. Try again later. | safe export limit |

Rate and cooldown errors should not reveal tenant plan internals unless a future authorized admin billing / usage screen is explicitly scoped.

## AI Advisory Error Drafts

| Code | Conceptual HTTP status | Safe operator message | Notes |
| --- | --- | --- | --- |
| `RISK_AI_ADVISORY_UNAVAILABLE` | 200 or 404 | No AI suggestion is available for this item. | UI may still show item |
| `RISK_AI_CONTEXT_RESTRICTED` | 403 | AI suggestion is not available with your current permission. | no hidden context leak |
| `RISK_AI_FEATURE_NOT_ENABLED` | 403 | AI suggestion is not available for this organization. | entitlement safe |
| `RISK_AI_RESULT_STALE` | 409 | AI suggestion may be outdated. Refresh before using it. | advisory only |
| `RISK_AI_NOT_AUTHORITATIVE` | 400 | AI suggestions cannot perform this action. | prevents AI action misuse |

AI error codes must not imply that AI can resolve, suppress, escalate, notify, approve, or mutate official records.

## Channel / Provider Readiness Error Drafts

| Code | Conceptual HTTP status | Safe operator message | Notes |
| --- | --- | --- | --- |
| `RISK_CHANNEL_NOT_AVAILABLE` | 404 or 200 | No deliverable channel is currently available. | no raw channel id |
| `RISK_PROVIDER_NOT_CONFIGURED` | 503 or 400 | Delivery is not configured. | only for future provider screens |
| `RISK_DELIVERY_NOT_APPROVED` | 403 | Customer-facing delivery is not approved for this workflow. | no sending assumption |
| `RISK_CHANNEL_SCOPE_DENIED` | 403 | Channel information is not available. | no LINE binding leak |
| `RISK_NOTIFICATION_DISABLED` | 403 | Notification delivery is disabled for this workflow. | no provider details |

Core SLA / operations risk flow should remain channel-agnostic. LINE-specific errors belong only in future explicitly scoped LINE admin workflows.

## Safe HTTP Status Guidance

HTTP status guidance is conceptual only.

| Status | Use direction | Caution |
| --- | --- | --- |
| 400 | invalid allow-listed input | do not echo raw payload |
| 401 | unauthenticated | generic only |
| 403 | authenticated but not allowed | may leak existence if over-specific |
| 404 | not found / hidden / out of scope | useful for non-leakage |
| 409 | stale state, conflict, already resolved | avoid duplicate side effects |
| 429 | rate limit / usage limit / cooldown | avoid revealing plan internals |
| 503 | provider or optional service unavailable | only when provider context is authorized |

Future implementation should decide when 403 and 404 are collapsed to protect tenant isolation.

## Sensitive-Data Redaction and Response Safety

Future error responses must not include:

- customer mobile / phone / tel values,
- raw LINE user id,
- LINE channel secret,
- LINE access token,
- provider credentials,
- token values,
- password values,
- `DATABASE_URL`,
- raw provider payload,
- raw customer payload,
- full Case / customer / appointment / report payload,
- hidden organization / tenant resource existence,
- URLs with embedded secrets,
- full internal identifiers when not explicitly allowed.

Future responses may include safe:

- error code,
- generic safe message,
- retry hint,
- correlation id,
- allow-listed field label,
- safe documentation reference if approved.

## Dashboard Copy Alignment with Task188

Task189 error codes should map to Task188 safe copy guidance:

- `RISK_PERMISSION_DENIED` -> "You do not have permission to perform this action."
- `RISK_ORG_SCOPE_DENIED` -> "This item is not available."
- `RISK_STALE_STATE` -> "This item changed. Refresh and try again."
- `RISK_ALREADY_RESOLVED` -> "This item is already resolved."
- `RISK_AI_ADVISORY_UNAVAILABLE` -> "No AI suggestion is available for this item."

These mappings are examples only, not final implemented UI copy.

## RBAC Alignment with Task187

Task189 aligns with Task187 by keeping:

- permission failure separate from entitlement failure,
- queue visibility separate from evidence visibility,
- audit visibility separate from action authority,
- AI advisory visibility separate from AI action authority,
- suppression and high-severity resolution protected by stronger authority,
- exports safe-summary only by default.

## API Contract Draft Alignment with Task184

Task189 aligns with Task184:

- queue APIs should use safe summary errors,
- detail APIs should avoid full object payloads,
- action APIs should be audited, permission-checked, and stale-state aware,
- evidence APIs should return safe references only,
- AI advisory APIs should remain optional and non-authoritative,
- API errors should be safe and user-actionable.

Task189 does not create route/controller/service/repository code or OpenAPI.

## SaaS Entitlement Guardrail Alignment

Task189 aligns with `docs/PROJECT_GUARDRAILS.md` SaaS subscription / plan-based entitlement guardrails.

Future implementation should distinguish:

- permission denied: user lacks authority,
- entitlement denied: organization does not have feature enabled,
- usage limit: organization has feature but reached allowed usage,
- provider unavailable: delivery provider is not configured or not approved,
- visibility denied: resource is hidden or outside scope.

Even when entitlement is denied, copy should not expose sensitive commercial, tenant, or hidden resource details to users who should not see them.

## Alignment with Task173-Task186

Task189 aligns with prior planning:

- Task173: escalation errors remain human-reviewed and scoped.
- Task174: model wording remains proposal-only and non-migrated.
- Task175: severity errors do not create final SLA commitments.
- Task176: clock / cooldown errors do not hard-code final calendar policy.
- Task177: dedupe / suppression errors do not imply deletion.
- Task178: dashboard queue errors remain future UI direction.
- Task179: human action errors remain review-first.
- Task180: audit/evidence errors avoid raw payload exposure.
- Task181: organization scope and permission separation are preserved.
- Task182: dashboard wireframe remains no-code.
- Task183: dashboard copy and empty-state policy is reused.
- Task184: API contract remains conceptual.
- Task185: runtime readiness gate remains blocking.
- Task186: first-release risk scope remains proposal-only.

## Implementation Blockers and Required Approvals

Before error codes are implemented, the following must be approved:

- production error code naming policy,
- HTTP status mapping,
- 403 vs 404 collapse policy,
- permission and entitlement denial behavior,
- safe UI copy,
- localization policy,
- API response allow-list,
- field error allow-list,
- logging and correlation id policy,
- tenant / organization scope behavior,
- feature entitlement behavior,
- usage limit behavior,
- provider readiness behavior,
- AI advisory error behavior,
- stale-state and idempotency behavior,
- test plan.

This document does not approve implementation.

## Future Task Candidates

Possible follow-up tasks:

1. SLA / Operations Risk API Error Allow-List Review / No Runtime Change.
2. SLA / Operations Risk Entitlement Failure UX Draft / No Runtime Change.
3. SLA / Operations Risk Stale-State Conflict Test Plan / No Runtime Change.
4. SLA / Operations Risk Evidence Redaction Examples / No Runtime Change.
5. SLA / Operations Risk Localization Copy Pack Draft / No Admin Code Change.
6. SLA / Operations Risk Error Handling Readiness Gate / No Runtime Change.

## Verification Checklist

Before using Task189 as input to future implementation, verify:

- `docs/PROJECT_GUARDRAILS.md` still applies,
- Task189 is still treated as proposal-only,
- error codes do not reveal hidden resource existence,
- error codes distinguish permission from entitlement,
- error codes preserve organization / tenant isolation,
- error codes do not expose customer contact values,
- error codes do not expose raw channel identifiers,
- error codes do not expose provider payloads,
- error codes do not expose credentials or tokens,
- error codes do not imply provider delivery exists,
- error codes do not imply AI made official decisions,
- error codes do not imply risk workflow can mutate official Case / Appointment / Report state,
- error codes remain channel-agnostic unless a future channel-specific scope is approved.

## Task189 Completion Note

Task189 is complete as a documentation-only error code catalog draft.

No backend source, Admin source, API implementation, route/controller/service/repository, smoke test, OpenAPI/generated client, executable config, migration, schema, index, DB, DDL, entitlement runtime, usage metering, SaaS billing/subscription/payment, provider sending, survey runtime, AI automatic decision, or inventory documentation was changed.

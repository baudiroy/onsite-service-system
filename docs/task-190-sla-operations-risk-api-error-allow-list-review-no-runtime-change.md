# Task 190 - SLA / Operations Risk API Error Allow-List Review / No Runtime Change

## Purpose and Non-Goals

Task190 defines a documentation-only API error allow-list review for future SLA / operations risk workflows.

This document classifies the proposal-only Task189 error codes by exposure level. It does not create final production error allow-lists, executable schemas, backend code, Admin code, OpenAPI files, generated clients, API behavior, DB schema, migrations, entitlement runtime, usage metering, SaaS billing, notification delivery, survey runtime, or AI automation.

Task190 builds on:

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
- `docs/task-189-sla-operations-risk-error-code-catalog-draft-no-runtime-change.md`

Task190 does not:

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

Task190 preserves:

- one Case = one formal Field Service Report,
- one Case may have many appointments / dispatch visits,
- same Case must not have multiple open appointments at once,
- Field Service Report remains the Case-level final summary,
- `finalAppointmentId` remains backend / system determined and stable after completion,
- LINE is a channel, not the hard-coded core model,
- `line_user_id` is not global identity,
- all major future data must be organization / tenant scoped,
- permission and entitlement are separate concepts,
- API responses must protect organization / tenant isolation,
- AI is advisory only,
- future design notes do not authorize runtime implementation.

API error allow-listing must prevent resource enumeration, organization leakage, entitlement leakage, raw diagnostic leakage, and sensitive data exposure.

## Current Architecture Assumptions

Task190 assumes:

- no SLA / operations risk runtime exists,
- no SLA / operations risk tables exist,
- no SLA / operations risk API exists,
- no SLA / operations risk Admin dashboard exists,
- no executable error allow-list exists for this branch,
- no entitlement runtime exists,
- no SaaS subscription / billing / usage runtime exists,
- no notification provider delivery is approved,
- survey runtime remains paused,
- AI remains advisory only.

This document is a review layer over Task189, not an implementation packet.

## API Error Allow-List Principles

Future API errors should expose only what the caller is allowed to know.

Allow-list principles:

1. Prefer generic safe-deny codes for permission, organization, entitlement, and visibility failures.
2. Do not expose whether a hidden Case, appointment, customer, report, audit, channel binding, tenant resource, or provider configuration exists.
3. Do not expose raw diagnostics, stack traces, SQL errors, DB constraint names, provider raw errors, raw payloads, or internal identifiers.
4. Expose actionable stale-state and validation errors only when they do not reveal sensitive context.
5. Keep Admin-client safe codes separate from internal diagnostic categories.
6. Keep entitlement errors generic unless a future authorized billing/admin context is explicitly scoped.
7. Keep AI errors advisory and non-authoritative.
8. Keep channel/provider errors channel-agnostic unless a future channel-specific admin screen is scoped.
9. Keep response metadata minimal.
10. Treat Task190 as proposal-only until implementation approval.

## Error Exposure Classification Model

Task190 uses five proposal-only exposure classes.

| Class | Meaning | Default consumer |
| --- | --- | --- |
| Admin-client safe to expose | code and safe message may be returned to authorized Admin UI | authorized Admin user |
| Generic safe-deny only | collapse to generic not-available / permission-denied style response | Admin / API caller |
| Internal-only / log-only | may be stored in protected diagnostics if redacted | engineering / audit tooling |
| Never expose | must not appear in API response, UI, handoff, or normal logs | no user-facing consumer |
| Future-only pending runtime | concept reserved until entitlement / provider / AI / runtime exists | future implementation only |

Internal-only still requires redaction and access control. It does not authorize raw secrets or payload dumping.

## Admin-Client Safe Error Codes

These Task189 draft codes are likely safe to expose to an authorized Admin client, with safe messages, if future implementation confirms permission and scope.

| Code | Exposure | Safe message direction |
| --- | --- | --- |
| `RISK_PERMISSION_DENIED` | Admin-client safe | You do not have permission to perform this action. |
| `RISK_ACTION_REQUIRES_REVIEWER` | Admin-client safe | This item requires a higher review permission. |
| `RISK_QUEUE_SCOPE_DENIED` | Admin-client safe | This queue is not available with your current permission. |
| `RISK_EVIDENCE_PERMISSION_DENIED` | Admin-client safe | Evidence is not available with your current permission. |
| `RISK_AUDIT_PERMISSION_DENIED` | Admin-client safe | Action history is not available with your current permission. |
| `RISK_INVALID_ACTION` | Admin-client safe | This action is not available for the current item state. |
| `RISK_REASON_REQUIRED` | Admin-client safe | Add a reason before continuing. |
| `RISK_STALE_STATE` | Admin-client safe | This item changed. Refresh and try again. |
| `RISK_CONCURRENT_UPDATE` | Admin-client safe | Another update finished first. Refresh and review the latest state. |
| `RISK_ALREADY_SUPPRESSED` | Admin-client safe | This item is already suppressed. |
| `RISK_ALREADY_RESOLVED` | Admin-client safe | This item is already resolved. |
| `RISK_RATE_LIMITED` | Admin-client safe | Too many attempts. Try again later. |

Even safe codes must avoid raw identifiers, hidden resource details, and raw submitted values.

## Generic Safe-Deny Error Codes

Some failures should usually collapse to generic safe-deny responses to avoid resource enumeration.

| Draft code | Recommended external behavior | Reason |
| --- | --- | --- |
| `RISK_ORG_SCOPE_DENIED` | return `RISK_ITEM_NOT_AVAILABLE` or generic not available | avoids tenant/resource leakage |
| `RISK_ITEM_NOT_AVAILABLE` | expose generic not available | safe catch-all |
| `RISK_CASE_CONTEXT_NOT_AVAILABLE` | expose generic context not available only if caller can see risk | avoid confirming Case existence |
| `RISK_APPOINTMENT_CONTEXT_NOT_AVAILABLE` | expose generic context not available only if caller can see risk | avoid visit leakage |
| `RISK_REPORT_CONTEXT_NOT_AVAILABLE` | expose generic context not available only if caller can see risk | avoid report leakage |
| `RISK_CHANNEL_CONTEXT_NOT_AVAILABLE` | expose generic channel info unavailable | avoid LINE / channel binding leakage |
| `RISK_OWNER_NOT_AVAILABLE` | expose generic owner unavailable | avoid hidden user enumeration |

Future implementation should decide if the outward code is always `RISK_ITEM_NOT_AVAILABLE` for out-of-scope resources.

## Internal-Only / Log-Only Error Codes

Internal diagnostic categories may be useful for operations, but they must stay protected and redacted.

| Internal diagnostic category | External behavior | Redaction requirement |
| --- | --- | --- |
| actual permission policy mismatch | generic permission denied | no role internals unless authorized |
| organization mismatch detail | generic not available | no tenant names or hidden ids |
| DB uniqueness conflict detail | stale/conflict safe code | no DB constraint names |
| provider configuration missing detail | generic delivery not configured if scoped | no provider account data |
| entitlement evaluation detail | generic feature unavailable | no commercial plan internals unless authorized |
| AI provider diagnostic detail | generic AI unavailable | no prompts, raw outputs, provider ids |
| evidence storage diagnostic detail | generic evidence unavailable | no file path or object key |

Internal-only diagnostics must not include customer contact values, raw channel ids, provider raw payloads, stack traces, SQL errors, credentials, or secrets.

## Never-Expose Error Content

The following must not appear in future API responses, Admin UI errors, handoff notes, or normal logs:

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
- stack traces,
- SQL errors,
- DB constraint names,
- provider raw errors,
- internal diagnostic payloads,
- URLs with embedded secrets,
- hidden organization / tenant identifiers,
- hidden resource existence statements.

If troubleshooting requires deeper diagnostics, access must be separately authorized, redacted, logged, and limited to protected operational tooling.

## Future-Only Entitlement / Usage Error Codes

The following codes are future-only until entitlement / usage runtime exists.

| Code | Exposure recommendation | Notes |
| --- | --- | --- |
| `RISK_FEATURE_NOT_ENABLED` | generic feature unavailable | safe if not exposing plan details |
| `RISK_ENTITLEMENT_REQUIRED` | generic feature unavailable | no upsell / plan internals by default |
| `RISK_PLAN_LIMIT_REACHED` | future-only | may require authorized billing/admin context |
| `RISK_USAGE_LIMIT_REACHED` | future-only | may require usage policy and period display |
| `RISK_AI_ADDON_NOT_ENABLED` | future-only | no AI runtime approval implied |
| `RISK_EXPORT_NOT_ENABLED` | future-only | safe only after export feature is scoped |

Task190 does not implement entitlement checks, plan runtime, usage metering, billing events, subscriptions, trials, upgrades, downgrades, payments, or tenant plan limits.

## Permission and Organization-Scope Failure Review

Permission failures may be exposed when they do not reveal hidden resources.

Organization-scope failures should be more conservative. If the caller cannot prove visibility, use generic not available.

Recommended future rule:

- if user can see the risk item but cannot perform action: expose permission/action code,
- if user cannot see the item or organization scope is uncertain: expose generic not available,
- if user can see queue row but not evidence: expose evidence unavailable,
- if user can see detail but not audit: expose action history unavailable.

## Resource Visibility / Not-Found Review

Resource visibility errors should protect existence.

Recommended outward behavior:

- Hidden or nonexistent risk item: `RISK_ITEM_NOT_AVAILABLE`.
- Hidden Case context: show no context or safe unavailable message.
- Hidden appointment context: show no context or safe unavailable message.
- Hidden report context: show no context or safe unavailable message.
- Hidden channel binding: show channel unavailable, not binding-specific details.

Do not expose whether a resource was missing, deleted, out of organization, restricted by role, or restricted by entitlement unless future policy explicitly allows it.

## Validation / Invalid Action / Concurrency Review

Validation and action errors are usually safe if they use allow-listed field labels and do not echo raw input.

Safe to expose conceptually:

- `RISK_VALIDATION_FAILED`
- `RISK_INVALID_FILTER`
- `RISK_INVALID_SORT`
- `RISK_INVALID_PAGE_SIZE`
- `RISK_INVALID_REASON_CODE`
- `RISK_INVALID_COMMENT`
- `RISK_INVALID_ACTION`
- `RISK_REASON_REQUIRED`
- `RISK_STALE_STATE`
- `RISK_CONCURRENT_UPDATE`

But future implementation must not echo:

- raw filter values,
- raw comments,
- raw payloads,
- raw ids,
- stack traces,
- SQL details.

## Dedupe / Suppression / Already-Resolved Review

Dedupe and suppression errors should be safe but must preserve audit meaning.

Safe outward codes may include:

- `RISK_DUPLICATE_GROUPED`
- `RISK_ALREADY_SUPPRESSED`
- `RISK_SUPPRESSION_EXPIRED`
- `RISK_ALREADY_RESOLVED`
- `RISK_REOPEN_NOT_AVAILABLE`

Copy must not imply:

- duplicate was deleted,
- suppressed means ignored forever,
- suppression resolved the underlying operational issue,
- AI suppressed the item,
- a customer-facing message was sent.

## Audit and Evidence Access Review

Audit and evidence errors require careful allow-listing.

Safe outward behavior:

- if evidence is hidden: "Evidence is not available."
- if audit is hidden: "Action history is not available."
- if evidence reference is invalid: generic evidence unavailable.

Do not expose:

- evidence count,
- evidence file path,
- object storage key,
- provider payload type,
- audit actor identity unless permitted,
- hidden note content.

## AI Advisory Error Review

AI advisory errors must not imply AI authority.

Likely safe outward codes:

- `RISK_AI_ADVISORY_UNAVAILABLE`
- `RISK_AI_CONTEXT_RESTRICTED`
- `RISK_AI_FEATURE_NOT_ENABLED`
- `RISK_AI_RESULT_STALE`
- `RISK_AI_NOT_AUTHORITATIVE`

Future API should not expose:

- AI prompt,
- raw AI output,
- model/provider diagnostic details,
- hidden context values,
- inferred sensitive facts.

## Channel / Provider Readiness Error Review

Channel / provider readiness errors should remain channel-agnostic by default.

Possible outward codes:

- `RISK_CHANNEL_NOT_AVAILABLE`
- `RISK_PROVIDER_NOT_CONFIGURED`
- `RISK_DELIVERY_NOT_APPROVED`
- `RISK_CHANNEL_SCOPE_DENIED`
- `RISK_NOTIFICATION_DISABLED`

Do not expose:

- raw LINE user id,
- channel access token,
- channel secret,
- provider account id,
- provider raw error,
- recipient contact value,
- whether a hidden customer has a channel binding.

Provider-specific detail belongs only in future protected provider admin diagnostics if approved.

## Safe Error Metadata Boundaries

Future API error metadata may include:

- safe error code,
- safe localized message key,
- retry hint,
- correlation id,
- allow-listed field name,
- stale-state refresh hint,
- safe support reference.

Future API error metadata must not include:

- raw request body,
- raw query string if it may contain sensitive values,
- raw ids outside allow-list,
- customer contact values,
- raw channel identifiers,
- provider payloads,
- stack traces,
- SQL errors,
- DB constraint names,
- provider credentials,
- secrets or tokens.

## Internal Diagnostic Redaction Rules

If future runtime records internal diagnostics, it should:

- store safe correlation ids,
- redact customer contact values,
- redact raw channel ids,
- redact provider payloads,
- redact prompts and AI raw output unless a protected AI audit policy is approved,
- redact SQL and DB constraint details from user-facing paths,
- restrict access to authorized engineering / security / audit roles,
- keep organization scope in diagnostic metadata,
- avoid broad exports.

Task190 does not implement logging or diagnostic storage.

## Dashboard Copy Alignment with Task188

Task190 aligns with Task188:

- permission errors map to safe permission copy,
- organization-scope errors map to generic not available copy,
- stale-state errors map to refresh copy,
- evidence/audit errors map to unavailable-with-permission copy,
- AI errors map to advisory-only copy,
- entitlement errors map to feature-unavailable copy without plan internals by default.

## API Contract Draft Alignment with Task184

Task190 aligns with Task184:

- error payloads should be safe and user-actionable,
- queue/detail/action/audit/evidence/AI endpoints need separate error allow-lists,
- future action endpoints need stale-state and idempotency handling,
- response shapes must avoid full object payloads,
- permission and organization checks must precede sensitive detail exposure.

Task190 does not create API implementation or OpenAPI.

## RBAC Alignment with Task187

Task190 aligns with Task187:

- queue visibility does not imply evidence visibility,
- evidence visibility does not imply audit visibility,
- action authority remains separate from official lifecycle mutation,
- AI advisory visibility does not grant action authority,
- permission failures are safe-deny by default,
- supervisor-only actions should not reveal hidden workflow details to unauthorized users.

## SaaS Entitlement Guardrail Alignment

Task190 aligns with the updated `docs/PROJECT_GUARDRAILS.md` SaaS entitlement guardrails.

Future API errors must distinguish:

- user permission denial,
- organization entitlement denial,
- usage limit / plan limit,
- provider not configured,
- resource hidden or unavailable.

However, the response should expose only the amount of detail the caller is authorized to know.

## Alignment with Task173-Task189

Task190 aligns with prior planning:

- Task173: escalation errors stay scoped and review-first.
- Task174: data model remains proposal-only and non-migrated.
- Task175: severity errors do not create final SLA commitments.
- Task176: clock / cooldown errors do not hard-code calendar policy.
- Task177: dedupe / suppression errors preserve history.
- Task178: dashboard queue errors remain future UI direction.
- Task179: human action errors remain review-first.
- Task180: audit/evidence errors avoid raw payload exposure.
- Task181: permission and organization scope stay central.
- Task182: dashboard wireframe remains no-code.
- Task183: copy and empty-state policy is reused.
- Task184: API contract remains conceptual.
- Task185: runtime readiness gate remains blocking.
- Task186: first-release risk scope remains proposal-only.
- Task187: RBAC draft remains proposal-only.
- Task188: safe error copy remains proposal-only.
- Task189: error code catalog remains proposal-only.

## Implementation Blockers and Required Approvals

Before any API error allow-list is implemented, the following must be approved:

- final error code catalog,
- exposure class per code,
- 403 vs 404 collapse policy,
- Admin message key strategy,
- localization strategy,
- API response metadata allow-list,
- internal diagnostic redaction policy,
- organization / tenant leakage test plan,
- entitlement / plan / usage exposure policy,
- provider readiness exposure policy,
- AI advisory error policy,
- stale-state / concurrency behavior,
- logging and correlation id policy.

This document does not approve implementation.

## Future Task Candidates

Possible follow-up tasks:

1. SLA / Operations Risk Internal Diagnostic Redaction Policy / No Runtime Change.
2. SLA / Operations Risk 403 vs 404 Non-Leakage Decision Packet / No Runtime Change.
3. SLA / Operations Risk Entitlement Failure UX Draft / No Runtime Change.
4. SLA / Operations Risk API Error Response Shape Draft / No Runtime Change.
5. SLA / Operations Risk Permission Failure Test Plan / No Runtime Change.
6. SLA / Operations Risk Error Handling Readiness Gate / No Runtime Change.

## Verification Checklist

Before using Task190 as input to a future implementation task, verify:

- `docs/PROJECT_GUARDRAILS.md` still applies,
- Task190 is still treated as proposal-only,
- exposure classifications are still safe,
- permission and organization-scope failures do not leak resource existence,
- entitlement failures do not expose unauthorized plan details,
- validation failures do not echo raw input,
- diagnostic details remain internal-only and redacted,
- never-expose content is not present in user-facing examples,
- AI remains advisory-only,
- provider / channel errors do not imply sending exists,
- no API / runtime / schema approval is implied.

## Task190 Completion Note

Task190 is complete as a documentation-only API error allow-list review.

No backend source, Admin source, API implementation, route/controller/service/repository, smoke test, OpenAPI/generated client, executable config, migration, schema, index, DB, DDL, entitlement runtime, usage metering, SaaS billing/subscription/payment, provider sending, survey runtime, AI automatic decision, or inventory documentation was changed.

# Task 197 - SLA / Operations Risk Entitlement Failure UX Draft / No Runtime Change

## Purpose and Non-Goals

Task197 defines a documentation-only entitlement failure UX draft for future SLA / operations risk workflows.

This document distinguishes permission failure from entitlement failure and proposes safe UX directions for feature unavailable, plan limit, usage limit, AI add-on, export, dashboard, and advanced feature states. It does not define final production entitlement UX, create Admin UI, create backend API implementation, create entitlement runtime, create usage metering, create SaaS billing, create subscription, create trial, create upgrade/downgrade, create payment, create pricing, create OpenAPI files, create tests, or change runtime behavior.

Task197 builds on:

- `docs/PROJECT_GUARDRAILS.md`
- the user-provided short guardrails version synced with PM
- `docs/task-187-sla-operations-risk-rbac-matrix-draft-no-runtime-change.md`
- `docs/task-188-sla-operations-risk-safe-error-and-permission-failure-copy-draft-no-runtime-change.md`
- `docs/task-190-sla-operations-risk-api-error-allow-list-review-no-runtime-change.md`
- `docs/task-191-sla-operations-risk-403-vs-404-non-leakage-decision-packet-no-runtime-change.md`
- `docs/task-193-sla-operations-risk-internal-diagnostic-redaction-policy-no-runtime-change.md`
- `docs/task-194-sla-operations-risk-diagnostic-data-classification-matrix-no-runtime-change.md`
- `docs/task-195-sla-operations-risk-qa-artifact-redaction-checklist-no-runtime-change.md`
- `docs/task-196-sla-operations-risk-api-error-response-shape-draft-no-runtime-change.md`

Task197 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify API behavior,
- modify smoke, browser smoke, automated tests, or QA scripts,
- modify logging or redaction utilities,
- modify OpenAPI / Swagger / generated client files,
- modify `package.json`,
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
- add plan / pricing implementation,
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

Task197 preserves:

- one Case = one formal Field Service Report,
- one Case may have many appointments / dispatch visits,
- same Case must not have multiple open appointments at once,
- Field Service Report remains the Case-level final summary,
- `finalAppointmentId` remains backend / system determined and stable after completion,
- LINE is a channel, not the hard-coded core model,
- `line_user_id` is not global identity,
- all major future data must be organization / tenant scoped,
- permission and entitlement are separate concepts,
- customer-visible data and internal-only data must be separated,
- AI is advisory only,
- future design notes do not authorize runtime implementation.

Entitlement UX must not leak hidden resources, tenant plan internals, usage values, pricing, provider cost details, or AI token counts.

## Current Architecture Assumptions

Task197 assumes:

- no SLA / operations risk runtime exists,
- no SLA / operations risk API exists,
- no SLA / operations risk Admin dashboard exists,
- no entitlement runtime exists,
- no usage metering runtime exists,
- no SaaS subscription / billing / payment runtime exists,
- no plan/pricing runtime exists,
- no notification provider delivery is approved,
- survey runtime remains paused,
- AI remains advisory only.

This UX draft is future-facing only.

## Entitlement Failure UX Principles

Future entitlement failure UX should:

1. distinguish user permission from organization feature availability,
2. avoid exposing plan internals to normal operators,
3. avoid real pricing, usage values, AI token counts, or billing diagnostics,
4. provide safe next steps such as contact admin or request access,
5. avoid customer-facing delivery assumptions,
6. avoid hard-coding LINE as the only channel,
7. avoid implying that feature gating changes official Case / Appointment / Report lifecycle rules,
8. avoid encouraging workarounds through manual overrides,
9. keep AI add-on limitations advisory-only,
10. remain proposal-only until SaaS entitlement policy is approved.

## Permission vs Entitlement UX Distinction

Permission answers:

```text
Can this user perform this action?
```

Entitlement answers:

```text
Does this organization have this feature enabled?
```

Both must pass before a user can use a gated feature in the future.

| Failure type | Safe UX direction |
| --- | --- |
| permission failure | "You do not have permission to perform this action." |
| entitlement failure | "This feature is not available for this organization." |
| both uncertain | generic not available |
| visibility uncertain | generic not available |

Do not tell a normal user to upgrade a plan unless future product policy approves upgrade prompts for that role.

## Tenant Admin vs Non-Admin Visibility Rules

Proposal-only role visibility:

| Viewer category | Entitlement detail visibility | Suggested UX |
| --- | --- | --- |
| normal operator | minimal | feature unavailable / contact admin |
| queue owner | minimal | feature unavailable / ask authorized reviewer |
| operations manager | limited summary if approved | request access / contact system admin |
| tenant admin | more detail if future SaaS policy approves | plan / feature summary without secrets |
| super admin | diagnostic summary if future console exists | protected admin-only details |
| customer | none | no entitlement language |

Task197 does not create tenant admin, super admin, billing admin, or plan management behavior.

## Feature Not Enabled UX

Safe copy examples:

- "This feature is not available for this organization."
- "Ask an authorized admin if this feature should be enabled."
- "This queue is not available with the current organization settings."

Avoid:

- "Your tenant is on Basic and needs Professional."
- "Upgrade to unlock this case."
- "This customer is blocked because your plan is too low."
- "LINE binding is disabled for this tenant because of plan X."

Feature availability should not reveal sensitive plan or tenant details to normal operators.

## Plan Limit Reached UX

Plan limit UX is future-only until plan runtime exists.

Safe generic copy:

- "This limit has been reached for the current period."
- "Ask an authorized admin to review feature access."

Avoid:

- exact paid plan names unless approved,
- real pricing,
- real quota numbers,
- real usage counts,
- customer-specific billing implications,
- AI token counts,
- provider cost details.

## Usage Limit Reached UX

Usage limit UX is future-only until metering runtime exists.

Safe copy:

- "Usage is currently limited. Try again later or ask an authorized admin."
- "This action is temporarily unavailable because the usage window is limited."

Avoid:

- "You used 12,345 AI tokens."
- "This tenant exceeded SMS budget."
- "Provider cost exceeded limit."
- "Payment failed."

Usage copy should not expose billing or provider details unless future authorized billing context exists.

## AI Add-On Not Enabled UX

AI add-on UX must preserve AI advisory-only boundaries.

Safe copy:

- "AI suggestion is not available for this organization."
- "Review this item manually."
- "AI suggestions are optional and do not make official decisions."

Avoid:

- "AI cannot resolve this because your plan is too low."
- "AI would have completed this action."
- "AI would have approved this."
- "AI token balance is empty."

AI add-on limitations must not imply AI has authority to dispatch, complete, bill, suppress, escalate, or notify.

## Export / Dashboard / Advanced Feature Unavailable UX

Safe copy:

- "Export is not available for this organization."
- "This dashboard view is not available with current organization settings."
- "Advanced review tools are not available for this organization."

Avoid:

- exposing hidden feature keys,
- exposing plan internals,
- exposing hidden queues,
- exposing hidden counts,
- encouraging screenshot workarounds that leak data.

## Generic Non-Disclosure UX

When visibility, permission, and entitlement are uncertain:

```text
This item is not available.
```

or:

```text
This action is not available.
```

Generic copy is preferred when the response might otherwise reveal:

- feature availability,
- plan level,
- tenant identity,
- hidden resource existence,
- channel binding,
- provider configuration,
- usage status.

## Upgrade / Request-Access Placeholder Copy

Request-access copy is placeholder-only.

Safe examples:

- "Ask an authorized admin if this feature should be enabled."
- "Contact your organization admin for access."
- "Request review from an authorized operations manager."

Avoid:

- real pricing,
- plan comparison,
- payment links,
- upgrade buttons,
- trial prompts,
- direct sales copy,
- provider cost details.

Task197 does not approve SaaS upgrade, checkout, payment, trial, subscription, or pricing UI.

## Contact Admin / Support Placeholder Copy

Safe copy:

- "Contact an authorized admin."
- "Ask your operations manager to review this feature."
- "Contact support with the support reference if this seems unexpected."

Support references must be opaque and must not encode tenant, organization, customer, or provider identifiers.

## Admin UI Empty-State and Disabled-Action Notes

Future Admin UI may show:

- disabled action with generic feature unavailable copy,
- empty state explaining no visible features,
- request-access hint for authorized roles,
- manual review fallback when AI is unavailable.

Future Admin UI must not:

- expose plan internals to normal operators,
- reveal hidden queues,
- reveal hidden resource counts,
- show customer-facing upgrade copy,
- suggest manual override of official lifecycle guards,
- hard-code LINE as the only channel.

## API Error Response Alignment with Task196

Task197 aligns with Task196:

```json
{
  "error": {
    "code": "RISK_FEATURE_NOT_ENABLED",
    "messageKey": "operationsRisk.error.featureUnavailable",
    "retryHint": "ask_authorized_reviewer",
    "correlationId": "<opaque-correlation-id>"
  }
}
```

This is placeholder-only and not an implemented schema.

## Error Allow-List and 403/404 Alignment

Task197 aligns with Task190 and Task191:

- entitlement errors are future-only until runtime exists,
- normal operators receive generic feature unavailable copy,
- hidden resources still collapse to generic not available,
- organization / tenant mismatch must not expose plan details,
- usage details are not shown unless future authorized billing context exists.

## RBAC / Organization Scope Alignment

Task197 aligns with Task187:

- entitlement does not grant user permission,
- permission does not grant organization entitlement,
- queue visibility does not imply feature availability,
- evidence / audit visibility remains separate,
- AI advisory visibility remains separate from AI action authority.

## Diagnostic Redaction and QA Artifact Alignment

Task197 aligns with Task193, Task194, and Task195:

- entitlement diagnostics are redacted,
- usage values are not exposed,
- plan/pricing internals are not included in QA artifacts,
- screenshots should not reveal hidden plan details,
- copied API responses must use placeholders only.

## Channel-Agnostic and LINE-Safe Boundaries

Entitlement UX should not hard-code LINE.

Use:

- "customer channel",
- "channel binding",
- "notification channel",
- "delivery channel".

Avoid:

- "LINE required to continue,"
- "LINE id not enabled for this plan,"
- "LINE user unavailable,"
- "upgrade for LINE push" unless future product policy explicitly scopes that UI.

## SaaS Entitlement Guardrail Alignment

Task197 follows the SaaS guardrail:

- plan / entitlement controls organization feature availability,
- permission controls user action authority,
- both are needed for future feature access,
- no billing/subscription/usage runtime is implemented now,
- no tenant plan limit is enforced now,
- no pricing is included now.

## Alignment with Task173-Task196

Task197 aligns with:

- review-first operations risk design,
- no runtime implementation,
- no migration,
- organization scope,
- RBAC separation,
- safe copy,
- error code catalog,
- API error response shape,
- diagnostic redaction,
- QA artifact safety,
- AI advisory only,
- channel abstraction.

## Implementation Blockers and Required Approvals

Before entitlement UX is implemented, approve:

- final feature key catalog,
- production plan tiers,
- entitlement model,
- usage model,
- billing/subscription policy,
- tenant admin visibility,
- normal operator visibility,
- request-access workflow,
- support workflow,
- Admin UI copy,
- API error response mapping,
- localization,
- security review,
- test plan.

This document does not approve implementation.

## Future Task Candidates

Possible follow-up tasks:

1. SLA / Operations Risk Entitlement Feature Key Review / No Runtime Change.
2. SLA / Operations Risk Tenant Admin Visibility Draft / No Runtime Change.
3. SLA / Operations Risk Usage Limit Copy Draft / No Runtime Change.
4. SLA / Operations Risk Error Handling Readiness Gate / No Runtime Change.
5. SLA / Operations Risk SaaS Entitlement Runtime Readiness Gate / No Runtime Change.

## Verification Checklist

Before using Task197 as input to future implementation, verify:

- `docs/PROJECT_GUARDRAILS.md` still applies,
- Task197 is still proposal-only,
- entitlement and permission remain separate,
- normal operators do not see plan internals,
- usage values are not exposed,
- real pricing is not exposed,
- AI token counts are not exposed,
- no upgrade/payment flow is implied,
- channel copy remains channel-agnostic,
- AI remains advisory only.

## Task197 Completion Note

Task197 is complete as a documentation-only entitlement failure UX draft.

No backend source, Admin source, API implementation, route/controller/service/repository, smoke test, automated test, QA script, logging utility, redaction utility, OpenAPI/generated client, executable validation schema, executable config, migration, schema, index, DB, DDL, entitlement runtime, usage metering, SaaS billing/subscription/payment, plan/pricing implementation, provider sending, survey runtime, AI automatic decision, or inventory documentation was changed.

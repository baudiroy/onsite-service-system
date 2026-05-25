# Task 191 - SLA / Operations Risk 403 vs 404 Non-Leakage Decision Packet / No Runtime Change

## Purpose and Non-Goals

Task191 defines a documentation-only decision packet for future 403 vs 404 behavior in SLA / operations risk APIs and Admin UI.

This document explains when explicit permission denial may be acceptable and when a generic not-available / 404-style safe-deny response should hide resource existence. It is proposal-only and does not create final production API behavior, backend code, Admin code, OpenAPI files, generated clients, validation schemas, migrations, entitlement runtime, SaaS billing, notification delivery, survey runtime, or AI automation.

Task191 builds on:

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
- `docs/task-190-sla-operations-risk-api-error-allow-list-review-no-runtime-change.md`

Task191 does not:

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

Task191 preserves:

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

The default posture is fail closed and avoid resource-existence leakage.

## Current Architecture Assumptions

Task191 assumes:

- no SLA / operations risk runtime exists,
- no SLA / operations risk API exists,
- no SLA / operations risk Admin dashboard exists,
- no executable 403 / 404 policy exists for this branch,
- no entitlement runtime exists,
- no SaaS subscription / billing / usage runtime exists,
- no notification provider delivery is approved,
- survey runtime remains paused,
- AI remains advisory only.

This document is a decision packet for future approval, not implemented behavior.

## 403 vs 404 Decision Principles

Recommended principles:

1. Use explicit 403 only when the user is allowed to know the resource or workflow exists but lacks a specific action permission.
2. Use generic 404-style not available when revealing the resource existence could leak organization, tenant, customer, channel, appointment, report, evidence, audit, or entitlement details.
3. Collapse permission and not-found errors when visibility is uncertain.
4. Avoid specific messages about another organization / tenant.
5. Avoid revealing plan, entitlement, or usage details unless the user is in an authorized billing / admin context.
6. Avoid revealing channel binding or provider readiness details unless the user is in an authorized channel admin context.
7. Use 409 for stale / conflict / already-resolved states only when the user can already see the item.
8. Use 400 validation errors only with allow-listed field labels and no raw payload echo.
9. Use 429 only when rate / cooldown / usage exposure is approved.
10. Keep all future behavior testable for non-leakage.

## Threat Model: Resource-Existence Leakage

Resource-existence leakage can happen when errors reveal that a hidden entity exists.

Sensitive examples include:

- a Case exists in another organization,
- a customer exists,
- a phone value matches a customer,
- a LINE identity is bound,
- an appointment exists,
- a Field Service Report exists,
- evidence exists,
- an audit record exists,
- a tenant has or lacks a feature entitlement,
- a provider account is configured,
- an AI context exists.

The response should not let an unauthorized caller distinguish hidden, nonexistent, wrong-organization, wrong-role, wrong-entitlement, or restricted-resource cases.

## Decision Matrix Overview

| Failure type | Prefer 403 when | Prefer 404-style / generic safe-deny when |
| --- | --- | --- |
| permission denied | user can already see item and action availability is safe to disclose | user cannot prove item visibility |
| organization mismatch | rarely | almost always |
| entitlement not enabled | user is authorized tenant admin / billing admin in future scope | normal operator or visibility uncertain |
| usage limit reached | user is authorized to see usage/plan context | normal operator or usage details restricted |
| resource not found | resource is already known in current visible workflow | visibility is uncertain |
| evidence denied | user can see risk item but not evidence | evidence existence itself is sensitive |
| audit denied | user can see risk item but not audit | audit existence itself is sensitive |
| invalid action | user can see item | item visibility is uncertain |
| stale conflict | user can see item | item visibility is uncertain |
| AI advisory unavailable | user can see item | AI context visibility is restricted |
| channel/provider unavailable | user can see authorized channel context | channel binding/provider existence is sensitive |

## Permission Denial Decision Guidance

Use 403-style explicit denial when:

- the user is authenticated,
- the user is authorized for the organization,
- the user can already view the risk item or queue,
- the failed action is safe to disclose,
- the error does not reveal hidden evidence, hidden audit, hidden customer data, or hidden channel data.

Use generic not available when:

- the user cannot view the item,
- organization scope is uncertain,
- role membership is uncertain,
- the action would reveal hidden workflow state,
- the response could confirm another organization's resource.

Example safe explicit denial:

```text
You do not have permission to perform this action.
```

Example safe generic denial:

```text
This item is not available.
```

## Organization-Scope Mismatch Decision Guidance

Organization / tenant mismatch should almost always collapse to generic not available.

Do not say:

- "This item belongs to another organization."
- "This tenant does not match your account."
- "This Case exists in a different tenant."

Use:

```text
This item is not available.
```

Future implementation should also avoid different response timing, metadata, or status combinations that reveal organization mismatch.

## Entitlement / Plan / Usage Decision Guidance

Entitlement and usage failures require two layers:

- operator-facing operational scope,
- future tenant admin / billing scope.

For normal operators, prefer generic feature unavailable:

```text
This feature is not available for this organization.
```

For future authorized tenant admin / billing users, more specific plan or usage details may be allowed only after SaaS billing / entitlement policy is approved.

Do not expose:

- current plan internals,
- hidden feature keys,
- exact usage counts,
- commercial pricing,
- another tenant's entitlement,
- provider cost details,
- AI token usage details,
- billing event diagnostics.

Task191 does not implement entitlement runtime, usage metering, subscription, billing, trial, upgrade, downgrade, or payment logic.

## Resource Visibility / Not-Found Decision Guidance

For risk detail, Case context, appointment context, report context, owner, channel context, evidence, and audit:

- if caller cannot see the parent risk item, return generic not available,
- if caller can see the parent but not a sub-resource, return safe unavailable for that sub-resource,
- do not expose counts or hidden object types,
- do not echo raw ids.

Safe examples:

- "This item is not available."
- "Case context is not available."
- "Visit context is not available."
- "Report context is not available."
- "Channel information is not available."

## Audit and Evidence Access Decision Guidance

Audit and evidence access can reveal sensitive facts even when the risk item is visible.

Use explicit access-denied copy only when the user can see the risk item:

```text
Evidence is not available with your current permission.
```

If the user cannot see the risk item, collapse to:

```text
This item is not available.
```

Do not reveal:

- evidence count,
- audit count,
- evidence type,
- file names,
- object storage keys,
- provider payload type,
- audit actor identity,
- hidden note content.

## Workflow-State Failure Decision Guidance

Workflow-state failures are generally safe only after the user can see the item.

Use 409-style conflict when visible:

- stale state,
- concurrent update,
- already resolved,
- already suppressed,
- duplicate grouped,
- owner changed,
- state changed.

Use generic not available when visibility is uncertain.

Safe examples:

- "This item changed. Refresh and try again."
- "This item is already resolved."
- "This signal is grouped with an existing item."

These messages must not imply deletion, automatic customer messaging, or AI action.

## AI Advisory Limitation Decision Guidance

AI advisory errors are safe only when they do not expose hidden context.

Use explicit AI limitation copy when the user can see the item:

```text
No AI suggestion is available for this item.
```

Use permission-safe copy when AI context is restricted:

```text
AI suggestion is not available with your current permission.
```

Use entitlement-safe copy when the organization does not have AI feature access:

```text
AI suggestion is not available for this organization.
```

AI errors must not expose prompts, raw outputs, hidden fields, provider diagnostics, inferred sensitive facts, or model details unless future policy permits.

## Channel / Provider Readiness Decision Guidance

Channel/provider errors should be generic unless the user is in an authorized provider/channel admin workflow.

Use generic operational copy:

- "Channel information is not available."
- "No deliverable channel is currently available."
- "Customer-facing delivery is not approved for this workflow."
- "Notification delivery is disabled for this workflow."

Do not say:

- "LINE user id not found."
- "This LINE identity is bound elsewhere."
- "Provider token invalid."
- "Channel secret missing."
- "SMS provider rejected this phone."

Task191 does not approve provider sending or channel runtime.

## Admin Copy Implications

Admin UI should:

- show explicit permission-denied only after the user can see the item,
- show generic unavailable copy for hidden or out-of-scope resources,
- avoid hidden counts,
- avoid raw ids,
- avoid provider diagnostics,
- avoid tenant/plan internals,
- offer safe actions such as refresh, return to queue, or ask authorized reviewer,
- avoid implying that no risk exists globally.

Recommended generic fallback:

```text
This item is not available. Refresh the queue or check your current permission.
```

## API Error Allow-List Alignment with Task190

Task191 refines Task190:

- Admin-client safe codes may be exposed only when the item is visible.
- Generic safe-deny codes should collapse hidden / not-found / out-of-scope cases.
- Internal-only diagnostics stay redacted and protected.
- Never-expose content remains prohibited.
- Future-only entitlement / usage errors remain future-only until runtime exists.

## RBAC Alignment with Task187

Task191 aligns with Task187:

- permission failures depend on role and organization scope,
- queue visibility does not imply evidence visibility,
- evidence visibility does not imply audit visibility,
- AI advisory visibility does not grant action authority,
- action authority does not grant official lifecycle mutation,
- supervisor-only actions should avoid revealing hidden workflow state to unauthorized users.

## SaaS Entitlement Guardrail Alignment

Task191 aligns with SaaS-ready guardrails:

- permission checks and entitlement checks are separate,
- normal operators should not see detailed plan internals by default,
- tenant admins may require separate future entitlement visibility,
- usage limits may require separate future billing / usage UI,
- organization / tenant isolation remains stronger than helpful specificity.

## Sensitive-Data and Diagnostic Redaction Rules

Future 403 / 404 decisions must not expose:

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
- hidden organization / tenant resource existence.

## Non-Leakage Example Scenarios

| Scenario | Preferred response direction | Reason |
| --- | --- | --- |
| user requests hidden risk id | 404-style not available | avoid confirming risk exists |
| user sees item but cannot suppress | 403 permission denied | item already visible |
| user requests another organization's Case context | generic context unavailable | avoid tenant leakage |
| user sees risk but not evidence | evidence unavailable with current permission | safe sub-resource denial |
| user tries stale resolve action | 409 refresh required | item visible and stale |
| tenant lacks future SLA feature | feature unavailable for organization | entitlement-safe |
| AI hint hidden by permission | AI suggestion unavailable with current permission | no hidden context leak |
| provider not configured | delivery not configured only in scoped admin context | avoid provider leakage |

All examples use placeholders only and do not represent implemented behavior.

## Alignment with Task173-Task190

Task191 aligns with prior planning:

- Task173: escalation remains human-reviewed and scoped.
- Task174: data model remains proposal-only and non-migrated.
- Task175: severity handling does not create final SLA commitments.
- Task176: clock / cooldown behavior remains draft.
- Task177: dedupe / suppression behavior preserves history.
- Task178: dashboard queues remain future UI direction.
- Task179: human actions remain review-first.
- Task180: audit/evidence details remain protected.
- Task181: permission and organization scope stay central.
- Task182: dashboard wireframe remains no-code.
- Task183: dashboard copy and empty-state policy is reused.
- Task184: API contract remains conceptual.
- Task185: runtime readiness gate remains blocking.
- Task186: first-release risk scope remains proposal-only.
- Task187: RBAC matrix remains proposal-only.
- Task188: safe error copy remains proposal-only.
- Task189: error code catalog remains proposal-only.
- Task190: API error allow-list remains proposal-only.

## Implementation Blockers and Required Approvals

Before any 403 / 404 policy is implemented, the following must be approved:

- final non-leakage policy,
- endpoint-by-endpoint 403 vs 404 mapping,
- organization / tenant visibility behavior,
- role visibility behavior,
- entitlement visibility behavior,
- tenant admin / billing admin exception policy,
- audit and evidence visibility behavior,
- AI advisory visibility behavior,
- provider/channel visibility behavior,
- Admin copy,
- API error response metadata,
- logging and diagnostic redaction,
- automated tests for resource enumeration,
- security review.

This document does not approve implementation.

## Future Task Candidates

Possible follow-up tasks:

1. SLA / Operations Risk Resource Enumeration Test Plan / No Runtime Change.
2. SLA / Operations Risk Internal Diagnostic Redaction Policy / No Runtime Change.
3. SLA / Operations Risk Entitlement Failure UX Draft / No Runtime Change.
4. SLA / Operations Risk API Error Response Shape Draft / No Runtime Change.
5. SLA / Operations Risk Security Review Checklist / No Runtime Change.
6. SLA / Operations Risk Error Handling Readiness Gate / No Runtime Change.

## Verification Checklist

Before using Task191 as input to a future implementation task, verify:

- `docs/PROJECT_GUARDRAILS.md` still applies,
- Task191 is still treated as proposal-only,
- 403 is used only when resource visibility is safe,
- 404-style safe-deny is used for uncertain visibility,
- organization / tenant mismatch does not leak resource existence,
- entitlement failures do not expose unauthorized plan details,
- evidence / audit denial does not expose hidden counts or types,
- AI errors do not expose hidden context,
- provider errors do not expose raw provider diagnostics,
- no final runtime behavior is implied.

## Task191 Completion Note

Task191 is complete as a documentation-only 403 vs 404 non-leakage decision packet.

No backend source, Admin source, API implementation, route/controller/service/repository, smoke test, OpenAPI/generated client, executable config, migration, schema, index, DB, DDL, entitlement runtime, usage metering, SaaS billing/subscription/payment, provider sending, survey runtime, AI automatic decision, or inventory documentation was changed.

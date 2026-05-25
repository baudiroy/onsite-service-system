# Task 188 - SLA / Operations Risk Safe Error and Permission Failure Copy Draft / No Runtime Change

## Purpose and Non-Goals

Task188 defines documentation-only safe error copy and permission failure wording for future SLA / operations risk workflows.

This document is a proposal-only copy draft. It does not define final production error copy, executable validation rules, API response schemas, backend code, Admin code, RBAC runtime, migration, schema, notification delivery, survey runtime, or AI automation.

Task188 builds on:

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

Task188 does not:

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

Task188 preserves:

- one Case = one formal Field Service Report,
- one Case may have many appointments / dispatch visits,
- same Case must not have multiple open appointments at once,
- Field Service Report remains the Case-level final summary,
- `finalAppointmentId` remains backend / system determined and stable after completion,
- LINE is a channel, not the hard-coded core model,
- `line_user_id` is not global identity,
- all major future data must be organization / tenant scoped,
- cross-organization leakage must fail closed,
- AI is advisory only,
- future design notes do not authorize runtime implementation.

Safe copy must protect tenant isolation, organization scope, customer privacy, raw channel identifiers, provider credentials, and internal workflow details.

## Current Architecture Assumptions

Task188 assumes:

- no SLA / operations risk runtime exists,
- no SLA / operations risk tables exist,
- no SLA / operations risk API exists,
- no SLA / operations risk Admin dashboard exists,
- no executable validation or error schema exists for this branch,
- no notification provider delivery is approved,
- survey runtime remains paused,
- AI remains advisory only,
- SaaS-ready / multi-tenant principles apply to future implementation.

This document therefore describes wording direction only. It must not be mistaken for implemented backend or Admin behavior.

## Safe Error Copy Principles

Future SLA / operations risk errors should:

1. be short, calm, and actionable,
2. avoid blame,
3. avoid revealing whether an out-of-scope resource exists,
4. avoid revealing customer contact values or channel identities,
5. avoid exposing raw payloads, provider values, tokens, or credentials,
6. distinguish risk workflow state from official Case / Appointment / Field Service Report state,
7. explain when the operator should refresh, retry, or ask an authorized reviewer,
8. avoid implying a customer message was sent,
9. avoid implying AI made an authoritative decision,
10. preserve organization / tenant isolation.

Preferred pattern:

```text
We could not complete this action. Refresh the item and check your current permission.
```

Avoid:

```text
Case <external-case-id> belongs to another organization.
```

The preferred copy gives the operator a safe next step without confirming the hidden resource or the reason for denial.

## Permission Denied Copy

Permission denied copy should not expose hidden queue items, hidden evidence, hidden audit, or hidden organization membership.

| Scenario | Proposal-only safe copy | Avoid |
| --- | --- | --- |
| user lacks action permission | "You do not have permission to perform this action." | "Only supervisors can suppress this P1 case." |
| user can view but cannot suppress | "This item requires a higher review permission." | "Supervisor Amy must approve this." |
| user can view queue but not evidence | "Evidence is not available with your current permission." | "Photo evidence exists but is hidden." |
| user can view detail but not audit | "Action history is not available with your current permission." | "Audit log has 3 hidden entries." |
| user lacks AI hint visibility | "AI suggestion is not available with your current permission." | "AI saw customer data you cannot view." |
| user cannot export | "Export is not available with your current permission." | "Finance export is locked." |

Permission copy should not reveal exact hidden role names unless the user already has permission to know the workflow policy.

## Organization-Scope Failure Copy

Organization / tenant scope failures must be safe-deny.

| Scenario | Proposal-only safe copy | Notes |
| --- | --- | --- |
| risk item outside scope | "This item is not available." | do not confirm another organization's item exists |
| Case outside scope | "This record is not available." | do not confirm case number / customer |
| appointment outside scope | "This visit is not available." | do not reveal appointment ownership |
| report outside scope | "This report is not available." | preserve Field Service Report privacy |
| audit outside scope | "This history is not available." | do not reveal hidden audit existence |
| channel binding outside scope | "Channel information is not available." | do not reveal LINE binding |

Avoid saying:

- "This belongs to another tenant."
- "This Case exists but is in another organization."
- "This LINE user is bound elsewhere."
- "This phone number belongs to another customer."

Multi-tenant systems must not leak resource existence through error wording.

## Resource Unavailable / Not Found Copy

Future API and Admin copy should converge permission denial and not-found copy when resource visibility is uncertain.

| Scenario | Proposal-only safe copy | Operator action |
| --- | --- | --- |
| item not found or hidden | "This item is not available." | check filters or ask an authorized reviewer |
| queue no longer exists | "This queue is not available." | return to queue list |
| evidence missing or hidden | "Evidence is not available." | continue with visible summary |
| audit missing or hidden | "Action history is not available." | continue without audit detail |
| AI hint missing or hidden | "AI suggestion is not available." | review item manually |

The UI may show role-aware empty states from Task183, but should not expose hidden counts or hidden resource identity.

## Invalid Action Copy

Invalid action copy should tell the operator what to do next without mutating official lifecycle state.

| Scenario | Proposal-only safe copy | Notes |
| --- | --- | --- |
| action not allowed in current risk state | "This action is not available for the current item state." | safe generic |
| resolve without required review | "Review the required details before resolving this item." | no raw missing values |
| suppress without reason | "Add a reason before suppressing this item." | reason required |
| assign to unavailable owner | "This owner is not available for assignment." | do not reveal hidden user data |
| invalid severity change | "This severity change is not available." | escalation policy protected |
| unsupported export | "This export is not available." | safe denial |

Invalid action copy must not suggest that the user can bypass official Case / Appointment / Report guards.

## Stale / Concurrent Update Copy

Future implementation should expect stale-state conflicts.

| Scenario | Proposal-only safe copy | Operator action |
| --- | --- | --- |
| item changed after page load | "This item changed. Refresh and try again." | refresh |
| owner changed | "The owner changed. Refresh before taking action." | refresh |
| state changed to resolved | "This item is no longer active. Refresh the queue." | refresh |
| suppression state changed | "Suppression state changed. Refresh before continuing." | refresh |
| concurrent update conflict | "Another update finished first. Refresh and review the latest state." | refresh |

Stale copy should avoid naming the other operator unless audit visibility permits it.

## Suppressed / Duplicate / Already-Resolved Copy

Suppression and dedupe copy should preserve auditability.

| Scenario | Proposal-only safe copy | Avoid |
| --- | --- | --- |
| already suppressed | "This item is already suppressed." | "Ignored forever." |
| suppression expired | "Suppression expired. Review the item again." | "Risk returned automatically by AI." |
| duplicate grouped | "This signal is grouped with an existing item." | "Duplicate deleted." |
| already resolved | "This item is already resolved." | "Closed by system with no review." |
| reopen not allowed | "Reopen is not available for this item." | "You cannot reopen this customer complaint." |

Suppression must never be described as deletion or proof that the underlying operational issue is gone.

## Audit and Evidence Access-Denied Copy

Audit and evidence copy must separate visible summary from restricted detail.

Proposal-only examples:

- "Evidence is not available with your current permission."
- "Action history is not available with your current permission."
- "Some details may be hidden because of your role."
- "Use the visible summary to continue review, or ask an authorized reviewer."

Avoid:

- "This hidden photo shows the customer's address."
- "There are 4 provider payload entries."
- "The LINE event payload is hidden."
- "The customer's mobile is hidden."

Even the existence, count, or nature of restricted evidence may be sensitive in some workflows.

## AI Advisory Limitation Copy

AI copy must communicate that suggestions are not official decisions.

Proposal-only examples:

- "AI suggestion is for review only."
- "AI may be incomplete. Confirm against the Case and visit history."
- "AI cannot resolve, suppress, escalate, notify, approve, or change official records."
- "No AI suggestion is available. Review the item manually."
- "AI suggestion is hidden because the underlying context is not available with your permission."

Avoid:

- "AI decided this is resolved."
- "AI approved suppression."
- "AI selected the owner."
- "AI confirmed the customer should be notified."
- "AI says billing is correct."

AI hints should not show data the user could not otherwise view.

## Sensitive-Data Redaction and Non-Leakage Rules

Future error copy, API error payloads, dashboard copy, logs, and handoff reports must not expose:

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
- hidden organization / tenant resource existence.

Safe copy may refer to:

- "record",
- "item",
- "visit",
- "report",
- "queue",
- "evidence",
- "action history",
- "current permission",
- "current organization scope",
- "authorized reviewer".

Do not include raw identifiers in generic error copy. If a future Admin detail view shows internal ids, that must be separately permission checked and allow-listed.

## Channel-Agnostic Copy Rules

SLA / operations risk copy must not hard-code LINE as the only channel.

Use:

- "channel information",
- "customer contact channel",
- "delivery channel",
- "channel binding",
- "notification delivery",
- "customer-facing message".

Avoid:

- "LINE is required for this item."
- "LINE user not found" as generic customer-facing or low-privilege Admin copy.
- "This LINE id is bound to another customer."
- "Send LINE reminder" unless delivery runtime and permission are approved.

LINE-specific operational messages may exist in a future LINE admin screen, but core risk workflow copy should remain channel-agnostic.

## API-Safe Error Response Notes

Task184 is conceptual only, but future API errors should follow safe response principles.

Proposal-only response concepts:

| Concept | Suggested shape | Notes |
| --- | --- | --- |
| generic code | `PERMISSION_DENIED`, `NOT_AVAILABLE`, `STALE_STATE`, `INVALID_ACTION` | no resource leakage |
| safe message | short operator-facing copy | no raw values |
| retry hint | `refresh`, `review_permission`, `ask_reviewer`, `none` | optional |
| correlation id | opaque request/log reference | not a credential |
| field errors | allow-listed field labels only | no raw submitted payload echo |

Future API errors should not echo:

- request payloads,
- raw tokens,
- raw channel ids,
- customer contact values,
- full object snapshots,
- hidden resource ids.

## Dashboard / Empty-State Alignment with Task183

Task188 aligns with Task183:

- empty state should not overpromise that no risk exists anywhere,
- permission empty state should say only what the user can safely know,
- evidence unavailable copy should not expose hidden evidence details,
- AI unavailable copy should not imply AI made a decision,
- channel unavailable copy should not imply delivery was attempted,
- suppressed state copy should not imply deletion.

Recommended empty-state continuation:

```text
No active items are visible with your current filters and permission.
```

This is safer than:

```text
There are no overdue cases in the system.
```

## RBAC Alignment with Task187

Task188 aligns with Task187:

- permission denied copy supports least privilege,
- organization scope failures fail closed,
- queue visibility remains separate from evidence visibility,
- audit visibility remains separate from action authority,
- AI advisory visibility does not grant action authority,
- suppression and de-escalation require stronger authority,
- exports remain safe summary by default.

Every future copy string should be reviewed against the relevant permission boundary before implementation.

## Alignment with Task173-Task186

Task188 aligns with prior planning:

- Task173: escalation copy remains human-reviewed and scoped.
- Task174: model wording remains proposal-only and non-migrated.
- Task175: severity copy does not create final SLA commitments.
- Task176: clock copy does not hard-code final calendar policy.
- Task177: dedupe / suppression copy does not imply deletion.
- Task178: dashboard queue copy remains future UI direction.
- Task179: human action workflow remains review-first.
- Task180: audit/evidence copy avoids raw payload exposure.
- Task181: organization scope and permission separation are preserved.
- Task182: dashboard wireframe remains no-code.
- Task183: dashboard copy and empty-state policy is reused.
- Task184: API error direction remains conceptual.
- Task185: runtime readiness gate remains blocking.
- Task186: first-release risk scope remains proposal-only.

## Implementation Blockers and Required Approvals

Before any runtime or UI error behavior is implemented, the following must be approved:

- production role names and permissions,
- organization / tenant scope behavior,
- branch/team scope behavior if any,
- exact safe error codes,
- exact Admin copy strings,
- API error allow-list,
- logging and correlation id policy,
- audit visibility rules,
- evidence visibility rules,
- AI advisory visibility rules,
- localization and Traditional Chinese / English wording policy,
- customer-facing vs internal wording boundary,
- feature flag / kill switch behavior,
- test plan.

This document does not approve implementation.

## Future Task Candidates

Possible follow-up tasks:

1. SLA / Operations Risk Error Code Catalog Draft / No Runtime Change.
2. SLA / Operations Risk Evidence Redaction Examples / No Runtime Change.
3. SLA / Operations Risk Stale-State Conflict UX Draft / No Admin Code Change.
4. SLA / Operations Risk API Error Allow-List Review / No Runtime Change.
5. SLA / Operations Risk Localization Copy Pack Draft / No Admin Code Change.
6. SLA / Operations Risk Permission Failure Test Plan / No Runtime Change.

## Verification Checklist

Before using Task188 as input to a future implementation task, verify:

- `docs/PROJECT_GUARDRAILS.md` still applies,
- Task188 is still treated as proposal-only,
- copy does not reveal hidden resource existence,
- copy does not reveal organization / tenant boundaries,
- copy does not expose customer contact values,
- copy does not expose raw channel identifiers,
- copy does not expose provider payloads,
- copy does not expose credentials or tokens,
- copy does not imply customer messages were sent,
- copy does not imply AI made official decisions,
- copy does not imply risk workflow can mutate official Case / Appointment / Report state,
- copy remains channel-agnostic unless a future channel-specific screen is explicitly scoped.

## Task188 Completion Note

Task188 is complete as a documentation-only safe error and permission failure copy draft.

No backend source, Admin source, API implementation, route/controller/service/repository, smoke test, OpenAPI/generated client, executable config, migration, schema, index, DB, DDL, provider sending, survey runtime, AI automatic decision, or inventory documentation was changed.

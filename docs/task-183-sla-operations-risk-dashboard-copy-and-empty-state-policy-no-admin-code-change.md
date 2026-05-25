# Task 183 - SLA / Operations Risk Dashboard Copy and Empty-State Policy / No Admin Code Change

## Purpose and Non-Goals

Task183 defines proposal-only copywriting and empty-state policy for a future SLA / operations risk Admin dashboard.

This document builds on:

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

Task183 is not an Admin implementation task. It defines future wording direction, not components, routes, API responses, executable UI copy configuration, design assets, backend behavior, runtime jobs, production RBAC, notification delivery, or schema.

Task183 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify API behavior,
- modify smoke or browser smoke scripts,
- add tests,
- add a migration file,
- change schema or indexes,
- apply or dry-run Migration 020,
- connect to DB,
- use psql,
- run `npm run db:migrate`,
- add SLA runtime,
- add operations task runtime,
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

## Current Architecture Assumptions

Task183 assumes:

- one Case has one formal Field Service Report,
- one Case may have multiple appointments / visits,
- one Case should have at most one open appointment at the same time,
- appointment / visit history belongs to dispatch and service execution,
- `finalAppointmentId` is backend / system determined and stable after completion,
- completed report repeat completion is rejected before side effects,
- Admin has no manual final appointment picker,
- SLA / operations risk copy must not replace official Case / Appointment / Report lifecycle labels,
- future role queues remain organization scoped,
- channel delivery is not approved,
- AI is advisory only.

Future dashboard copy should help operators understand what needs attention without implying that risk review can mutate official lifecycle state automatically.

## Copywriting Principles

Future SLA / operations risk dashboard copy should:

1. be short, operational, and easy to scan,
2. distinguish risk state from official Case status,
3. distinguish suggestion from confirmed action,
4. tell the operator what to review next,
5. avoid blame-oriented wording,
6. avoid exposing sensitive values,
7. avoid implying provider messages were sent when delivery runtime does not exist,
8. avoid implying AI can take authoritative action,
9. avoid implying appointments create separate formal reports,
10. avoid implying a suppressed risk was deleted.

Copy should prefer clear state labels over long explanations. Detailed explanations should live in detail panels, tooltips, or audit views if future UI supports them.

## Terminology and Label Guidelines

Recommended proposal-only labels:

| Concept | Preferred wording direction | Avoid |
| --- | --- | --- |
| Risk item | "Risk item" or "Review item" | "Task completed automatically" |
| Queue | "Queue" or "Review queue" | "Automation queue" |
| SLA clock | "Due time", "Overdue", "Paused" | "Guaranteed delivery" |
| Suppression | "Suppressed until review" | "Ignored" or "Deleted" |
| Dedupe group | "Grouped with related signals" | "Duplicates removed" |
| AI suggestion | "AI suggestion" | "AI decision" |
| Channel readiness | "Channel availability summary" | "LINE sent" unless delivery exists |
| Evidence | "Evidence reference" | "Full evidence payload" |

Field labels should be safe summaries, not raw object names or provider-specific payload labels.

## Queue List Copy

Future queue list copy may include:

- "Active risk items",
- "Near due",
- "Overdue",
- "Escalated",
- "Suppressed for review",
- "Grouped signals",
- "Assigned to me",
- "Unassigned",
- "Needs human review",
- "Last safe action",
- "Due in business hours",
- "Due in calendar time".

Queue rows should use concise badges:

| Badge | Meaning |
| --- | --- |
| `P0` | critical human attention needed |
| `P1` | high-priority review |
| `P2` | normal risk review |
| `P3` | low-priority follow-up |
| `Info` | context only |
| `Paused` | clock is paused by policy reason |
| `Grouped` | related signals are grouped |
| `Suppressed` | hidden from normal noise but still reviewable |
| `Re-alerted` | item returned after cooldown or changed condition |

Queue list copy should not include customer contact values, raw channel identifiers, or full payload text.

## Risk Detail Panel Copy

Future detail panel section labels may include:

- "Risk summary",
- "Case context",
- "Appointment / visit context",
- "Field Service Report context",
- "Clock details",
- "Action history",
- "Evidence references",
- "AI suggestion",
- "Visibility and permission".

Detail panel helper copy should clarify:

- "This risk item does not change the official Case status by itself."
- "Appointment history is shown for context. The formal service report remains Case-level."
- "The final appointment marker comes from the completed report, not from manual selection."
- "Evidence is shown as safe references. Sensitive values may be hidden."

These are proposal-only wording examples, not implemented UI strings.

## Severity / Priority / SLA Clock Copy

Severity copy should align with Task175.

| State | Suggested wording direction |
| --- | --- |
| P0 Critical | "Critical review needed" |
| P1 High | "High-priority review" |
| P2 Medium | "Review within policy window" |
| P3 Low | "Low-priority follow-up" |
| Info | "Context signal" |

Clock copy should align with Task176.

| Clock state | Suggested wording direction |
| --- | --- |
| Not overdue | "Due in X business hours" or "Due in X calendar hours" |
| Overdue | "Overdue by X" |
| Paused | "Clock paused: reason summary" |
| Resumed | "Clock resumed" |
| Stopped | "Risk clock stopped by resolved condition" |
| Unknown | "Clock needs review" |

Exact units, rounding, translations, and localization should be decided in future UX implementation. Task183 only defines safe meaning.

## Dedupe / Suppression Copy

Dedupe copy should make grouping visible:

- "Grouped with related signals."
- "This item summarizes related signals. History remains available if permitted."
- "New related signal added to this group."

Suppression copy should make review obligations visible:

- "Suppressed until review time."
- "Suppression reason required."
- "High-severity suppression requires supervisor review."
- "Suppression quiets alerts; it does not delete the risk."

Avoid wording such as:

- "Ignore forever",
- "Delete risk",
- "AI suppressed",
- "Resolved by suppression".

## Empty-State Copy

Future empty states should be role-aware and should not overpromise that there is no risk anywhere.

| Empty state | Suggested wording direction |
| --- | --- |
| My queue empty | "No active items assigned to you." |
| Role queue empty | "No active items in this role queue." |
| Filter empty | "No items match the current filters." |
| Suppression review empty | "No suppressed items currently require review." |
| Escalation queue empty | "No escalated items visible to your role." |
| Evidence unavailable | "Evidence is not available with your current permission." |
| AI suggestion unavailable | "No AI suggestion is available for this item." |
| Channel unavailable | "No deliverable channel is currently available." |

Empty states should avoid:

- "All Cases are safe",
- "No customer issues exist",
- "No SLA risk exists in the organization",
- "Nothing needs review" when filters or permissions may hide items.

## Loading / Error / Warning-State Copy

Loading copy should be neutral:

- "Loading risk queue..."
- "Refreshing risk details..."
- "Checking current visibility..."

Error copy should be safe and actionable:

- "Unable to load this queue. Try again or contact an administrator."
- "This item may have changed. Refresh before taking action."
- "You do not have permission to view this evidence."
- "This action cannot be completed with your current permission."

Warning copy should protect invariants:

- "This action affects the risk workflow only. It does not complete the Case."
- "Notification delivery is not available from this screen."
- "AI suggestions require human confirmation."
- "Suppression requires a reason and review point."

Errors must not include raw request payloads, raw provider responses, connection strings, tokens, raw channel ids, or customer contact values.

## Human Action Confirmation Copy

Future confirmation dialogs should align with Task179.

| Action | Suggested confirmation copy | Required caution |
| --- | --- | --- |
| Acknowledge | "Acknowledge this item for review?" | Not resolution |
| Assign | "Assign this item to the selected owner?" | Respect permission |
| Reassign | "Transfer ownership of this item?" | Preserve history |
| Suppress | "Suppress this item until the review time?" | Reason and review required |
| Unsuppress | "Return this item to active review?" | History remains |
| Escalate | "Escalate this item for higher-priority review?" | No provider sending |
| De-escalate | "Lower the escalation level after review?" | Reason required |
| Resolve | "Mark this risk item resolved?" | Does not complete Case by itself |
| Reopen | "Reopen this risk item for review?" | Preserve prior resolution |
| Non-actionable | "Mark this item non-actionable?" | Supervisor/reviewer policy may apply |

Result messages should be similarly precise:

- "Risk item acknowledged."
- "Risk item assigned."
- "Suppression saved for review."
- "Risk item resolved."

They should not say:

- "Case completed",
- "Customer notified",
- "Report finalized",
- "AI approved",
- "Billing approved",
unless those separate workflows actually occurred through approved runtime.

## Audit / Evidence Copy

Audit copy should align with Task180:

- "Action history",
- "Reason code",
- "Previous state",
- "Next state",
- "Evidence reference",
- "Safe note",
- "Actor summary",
- "Created at",
- "AI suggestion draft".

Evidence helper copy:

- "Evidence is shown as references when available."
- "Some evidence may be hidden by permission."
- "Sensitive values are not shown in this dashboard."

Audit and evidence copy should not encourage operators to paste raw payloads, credentials, full customer data, or full appointment / report objects into notes.

## Permission / Visibility Copy

Permission copy should align with Task181:

- "Visible to your role."
- "Evidence requires additional permission."
- "Action unavailable for your role."
- "This queue is scoped to your organization."
- "Cross-branch visibility depends on approved permission."
- "Some fields are hidden to reduce sensitive data exposure."

Permission copy should avoid revealing hidden values. For example, use "hidden by permission" rather than showing partial raw identifiers that might still identify a customer or channel account.

## AI Advisory Labeling and Disclaimer Copy

AI advisory copy should be explicit:

- "AI suggestion",
- "Suggested summary",
- "Suggested next owner",
- "Possible duplicate",
- "Missing-field reminder",
- "Needs human confirmation".

Suggested disclaimer direction:

- "AI suggestions are advisory. A human or approved deterministic policy must confirm actions."
- "AI cannot complete Cases, send notifications, approve billing, or suppress risks."
- "Review the Case, appointment history, and audit context before acting."

AI copy must not imply that AI can:

- acknowledge,
- assign,
- suppress,
- escalate,
- resolve,
- notify,
- decide customer channel,
- decide formal payable amount,
- complete reports,
- close Cases,
- choose or override `finalAppointmentId`.

## Sensitive-Data Redaction and Display Copy

Future dashboard copy should use safe summaries:

- "Contact hidden",
- "Channel identifier hidden",
- "Provider payload hidden",
- "Sensitive evidence hidden",
- "Credentials are never displayed",
- "Full payload is not shown".

Avoid examples containing real:

- customer contact values,
- raw LINE user id,
- provider secrets,
- tokens,
- passwords,
- API keys,
- database connection strings,
- raw payloads,
- full customer, appointment, report, or webhook objects.

If sample values are needed later, they should use clearly fake placeholders such as `<case-number>`, `<owner-summary>`, `<safe-reason-code>`, and `<hidden-by-permission>`.

## Channel-Agnostic Notification Readiness Notes

Future copy may mention notification readiness, but not delivery completion unless runtime exists.

Safe wording:

- "Channel availability needs review."
- "No deliverable channel is currently available."
- "Manual follow-up may be required."
- "Delivery status is not available from this workflow."

Avoid:

- "LINE message sent",
- "APP push sent",
- "SMS sent",
- "Email delivered",
- "Customer notified",
unless a later approved provider runtime actually supports those states and the current user is authorized to view them.

Core risk copy should remain channel-agnostic. LINE may be a primary channel, but dashboard copy should allow future own APP, SMS, email, manual follow-up, or no-channel states.

## Alignment with Task173 / Task174 / Task175 / Task176 / Task177

Task183 copy policy aligns with:

- Task173 escalation boundaries: escalation copy is not provider sending or lifecycle mutation.
- Task174 data model proposal: field labels are proposal-only and not migration-ready.
- Task175 thresholds: severity wording is attention guidance, not executable policy.
- Task176 clocks: business-hours and calendar-hours wording must be clear.
- Task177 dedupe/suppression: grouping and suppression wording must preserve history and review obligations.

Copy should not redefine these documents as runtime behavior.

## Alignment with Task178 / Task179 / Task180 / Task181 / Task182

Task183 copy policy aligns with:

- Task178 role queues and dashboard ownership,
- Task179 human action workflow,
- Task180 audit and evidence policy,
- Task181 permission and organization-scope review,
- Task182 wireframe requirements.

Future copy should keep these layers distinct:

1. official Case / Appointment / Field Service Report lifecycle,
2. risk workflow state,
3. human action state,
4. audit and evidence visibility,
5. AI advisory suggestions,
6. channel availability / delivery readiness.

## Future Admin / Backend / API Guardrails

Future implementation tasks should explicitly decide:

- where text lives: component code, i18n files, or configuration,
- how to localize risk and clock wording,
- how to prevent raw backend error text from reaching the UI,
- how API errors provide safe user-facing messages,
- how confirmation dialogs handle permission denial and stale state,
- how AI suggestions are labeled,
- how redacted fields are displayed,
- how empty states differ by role, filter, and permission,
- how provider delivery text stays disabled until delivery runtime exists.

No Admin source code should be written from Task183 alone. A later task should define implementation-ready UI copy only after API, runtime, permission, and localization decisions are approved.

## Future Task Candidates

Recommended next safe tasks:

1. Task184 - SLA / Operations Risk API Contract Draft / No Runtime Change.
2. Task185 - SLA / Operations Risk Runtime Readiness Gate / No Migration or Runtime Change.
3. Task186 - SLA / Operations Risk No-Send Test Plan / No Runtime Change.
4. Task187 - SLA / Operations Risk Implementation Pause Summary / No Runtime Change.
5. Task188 - SLA / Operations Risk Admin Implementation Readiness Review / No Admin Code Change.

These suggestions do not approve Admin source changes, backend runtime, API changes, DB work, migration, provider delivery, survey runtime, or AI automatic decisions.

## Verification Checklist

Task183 should be considered valid only if:

- it remains documentation-only,
- it does not modify backend `src/`,
- it does not modify Admin frontend `admin/src/`,
- it does not modify APIs,
- it does not modify smoke or browser smoke scripts,
- it does not add migrations,
- it does not change schema or indexes,
- it does not apply or dry-run Migration 020,
- it does not connect to DB,
- it does not run psql or `npm run db:migrate`,
- it does not send provider messages,
- it does not enable survey runtime,
- it does not add AI automatic decisions,
- it does not modify inventory docs,
- it does not output sensitive values,
- `npm run check` passes,
- `npm run admin:check` passes,
- `git diff --check` passes,
- sensitive scan shows no actual secrets, raw identifiers, raw payloads, or customer data.

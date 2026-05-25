# Task 178 - SLA / Operations Risk Dashboard Role Queue Design / No Runtime Change

## Purpose and Non-Goals

Task178 defines a proposal-only dashboard and role-queue design for future SLA / operations risk review workflows.

This document builds on:

- `docs/task-173-sla-operations-risk-escalation-design-no-runtime-change.md`
- `docs/task-174-sla-operations-risk-data-model-proposal-no-migration.md`
- `docs/task-175-sla-operations-risk-policy-and-threshold-matrix-no-runtime-change.md`
- `docs/task-176-sla-operations-risk-clock-source-and-business-hours-policy-no-runtime-change.md`
- `docs/task-177-sla-operations-risk-dedupe-and-suppression-policy-no-runtime-change.md`

Task178 does not create executable Admin UI, API contracts, production role permissions, runtime jobs, provider delivery, survey runtime, AI decisioning, or migration-ready schema.

Task178 does not:

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

Task178 assumes:

- one Case has one formal Field Service Report,
- one Case may have multiple appointments / visits,
- one Case should have at most one open appointment at the same time,
- appointment / visit history belongs to dispatch and service execution,
- `finalAppointmentId` is backend / system determined and stable after completion,
- completed report repeat completion is rejected before side effects,
- Admin has no manual final appointment picker,
- SLA / risk flags do not replace official Case / Appointment / Report status,
- future risk queues must be organization scoped,
- channel delivery is not approved,
- AI is advisory only.

Dashboard queues are future operational review surfaces. They must not become hidden workflow engines that mutate formal domain state without explicit human-confirmed action and approved runtime design.

## Dashboard Design Principles

Future SLA / operations dashboards should:

1. help humans notice risky work before it becomes a customer or settlement problem,
2. show queue items grouped by operational ownership,
3. preserve Case-level context while allowing appointment and report references,
4. clearly distinguish official domain status from operations risk state,
5. make severity, age, due time, and ownership easy to scan,
6. support acknowledgement, suppression, reassignment, escalation, and resolution review as auditable human actions,
7. avoid sensitive payload exposure,
8. keep delivery-channel selection out of the core dashboard model,
9. allow AI summaries only as suggestions.

Dashboard design should avoid:

- implying a Case can have multiple formal service reports,
- implying an appointment produces its own formal report,
- letting operators manually override `finalAppointmentId`,
- hiding active risk without audit,
- allowing AI to perform queue actions automatically,
- hard-coding LINE into core risk review.

## Role Model and Queue Ownership

The following roles are proposal-only queue audiences, not final production permission definitions.

| Future role view | Primary queue responsibility | Examples |
| --- | --- | --- |
| Customer service | Customer contact, missing information, appointment confirmation, follow-up | waiting for customer reply, appointment unconfirmed, customer unavailable |
| Dispatch coordinator | Scheduling and visit continuity | no open appointment, pending parts next visit needed, route not confirmed |
| Engineer lead | Engineer completion hygiene and field blockers | missing completion report, incomplete visit reason review, repeated pending parts |
| Supervisor / quality | severe delays, complaints, exceptions, repeated rework | P0/P1 risk, complaint risk, repeated incomplete service |
| Finance / settlement | billing and settlement evidence risk | missing proof, amount exception, settlement stale |
| Admin / operations manager | cross-role overview and policy health | overdue backlog, owner load, suppression review, escalation trends |

Queue ownership should be explicit enough that a risk item has a current responsible role or owner, but flexible enough to transfer ownership when work crosses departments.

## Queue Types and Views

Future dashboards may expose several queue types:

| Queue type | Purpose | Typical users |
| --- | --- | --- |
| My active risks | Items assigned to the current user or role | All operational roles |
| Near due | Items approaching due time based on Task176 clock policy | Customer service, dispatch, supervisors |
| Overdue | Items past due or breached | Supervisors, managers, related owner role |
| Unassigned | Risk items needing owner assignment | Dispatch coordinator, supervisor |
| Suppression review | Suppressed items reaching review time or high-severity suppressed items | Supervisors |
| Re-alerted | Acknowledged or suppressed items that need renewed attention | Related owner, supervisor |
| Escalation queue | P0/P1 or repeatedly re-alerted items | Supervisors, managers |
| Finance exceptions | Future billing / settlement related risk items | Finance |
| Quality follow-up | Future survey, complaint, rework, and callback risk items | Supervisor / quality |

These are display concepts only. Task178 does not create routes, components, API endpoints, query builders, or database views.

## Risk Item Display Fields

Future queue rows should use safe summaries rather than raw payloads.

Recommended display fields:

- risk type,
- severity,
- risk state,
- queue owner role,
- assigned owner summary,
- Case identifier / case number summary,
- related appointment sequence if applicable,
- related service report summary if applicable,
- due time,
- overdue / remaining time,
- business-hours age,
- calendar age,
- latest safe action summary,
- last acknowledged at / by summary,
- suppression state and review time,
- escalation level,
- reason code,
- safe note or AI suggested summary if approved for display.

Queue rows should not display:

- customer contact values,
- raw LINE user id,
- provider credentials,
- raw webhook data,
- full request or response payloads,
- database connection strings,
- passwords,
- tokens,
- full report payloads,
- full customer payloads.

## Severity and Priority Presentation

Task175 defines proposal-only severity bands. Future dashboards should present them as attention and routing signals, not as automatic workflow decisions.

Recommended display behavior:

| Severity | Dashboard treatment | Human expectation |
| --- | --- | --- |
| P0 Critical | Top pinned or interruptive supervisor queue | Immediate human review |
| P1 High | Prominent queue priority and near-term owner action | Same-day or business-hours action |
| P2 Medium | Normal risk queue priority | Owner review within policy window |
| P3 Low | Lower priority review queue | Batchable follow-up |
| Info | Contextual signal | No automatic escalation by default |

Severity display should not automatically:

- close Cases,
- complete reports,
- create appointments,
- send notifications,
- approve suppression,
- override `finalAppointmentId`,
- approve billing / settlement.

## Clock / Business-Hours Display Semantics

Task176 separates authoritative clock sources, timezone interpretation, business-hours clocks, calendar-hours clocks, pause/resume, and stop events.

Future dashboards should show:

- due time in the organization's configured timezone,
- remaining time or overdue time,
- whether the timer is business-hours based or calendar-hours based,
- whether the clock is paused,
- pause reason summary,
- stop event summary when risk is resolved,
- last clock recalculation time if persisted runtime exists later.

Display examples:

| Clock state | Dashboard wording direction |
| --- | --- |
| Active and not overdue | "Due in X business hours" or equivalent safe summary |
| Active and overdue | "Overdue by X" |
| Paused | "Paused: waiting for parts ETA" |
| Stopped | "Resolved / stopped by completed report" |
| Unknown | "Needs review: SLA clock cannot be determined" |

Exact wording is future UX work. Task178 only defines interpretation boundaries.

## Dedupe / Suppression Display Semantics

Task177 defines dedupe, grouping, suppression, cooldown, re-alert, and reopen policies.

Future dashboards should:

- show one active grouped queue item when duplicate signals share a dedupe key,
- preserve access to underlying signal history,
- show suppression state clearly,
- show suppression reason summary,
- show who suppressed and when in an audit-safe way,
- show suppression review time,
- show re-alert reason when a suppressed or acknowledged item becomes active again.

Future dashboards should not:

- silently hide suppressed high-severity risk,
- remove historical risk evidence,
- confuse suppression with resolution,
- let AI suppress or resolve a queue item,
- let a suppressed risk mutate official Case / Appointment / Report state.

## Triage Flow

Future triage is a human review workflow:

1. operator opens a role queue,
2. operator reviews safe Case / appointment / report context,
3. operator confirms whether the risk is actionable,
4. operator assigns owner or leaves in role queue,
5. operator records a safe triage note if needed,
6. audit history records the triage action.

Triage should not:

- trigger provider sending,
- change formal service report status,
- complete or close a Case,
- infer `finalAppointmentId`,
- approve quote / settlement / billing,
- expose raw payloads.

## Acknowledgment Flow

Acknowledgment means a human saw and accepted responsibility for reviewing a risk item. It is not resolution.

Future acknowledgement should record:

- acknowledged by,
- acknowledged at,
- owner role or owner,
- safe note if provided,
- policy version or reason code if applicable.

Acknowledgment should not stop SLA clocks unless a separate approved pause rule applies. It should not suppress future re-alert when the condition remains active past cooldown or severity increases.

## Suppression Flow

Suppression should be an explicit human action with a reason and review point.

Recommended future flow:

1. user selects suppression reason,
2. user sets or accepts a review time,
3. high-severity suppression may require supervisor permission,
4. system records audit history,
5. dashboard marks the item as suppressed but reviewable.

Suppression should not:

- delete risk records,
- hide P0 / P1 from all supervisor visibility,
- suppress without reason,
- suppress forever by default,
- be performed automatically by AI,
- send customer messages.

## Escalation Flow

Escalation moves a risk item to a higher attention level or owner queue. It does not mutate core service lifecycle by itself.

Future escalation may be caused by:

- threshold breach,
- repeated re-alert,
- severe complaint,
- missing owner,
- high-value quote or settlement exception,
- repeated incomplete visits,
- overdue pending parts or pending quote state.

Escalation actions should record:

- previous severity / owner,
- new severity / owner,
- escalation reason,
- actor or system source,
- timestamp,
- safe summary.

AI may suggest escalation, but a human or approved deterministic policy must control authoritative escalation behavior.

## Reassignment and Ownership Transfer Flow

Risk ownership may move between roles when the next action changes.

Examples:

| From | To | Example reason |
| --- | --- | --- |
| Customer service | Dispatch | Customer confirmed appointment window |
| Dispatch | Engineer lead | Visit completed but report hygiene is missing |
| Engineer lead | Supervisor | Repeated incomplete visit needs review |
| Supervisor | Finance | Billing / settlement proof issue remains |
| Finance | Customer service | Customer approval record missing |

Future reassignment should be auditable and should not erase prior owner history.

## Resolution Review Flow

Resolution means the underlying risk condition has ended or a human accepted an outcome according to policy.

Potential resolution examples:

- appointment scheduled,
- customer contacted,
- next visit arranged after pending parts,
- quote approved or rejected with reason,
- report completed,
- callback completed,
- finance proof attached,
- supervisor exception decision recorded.

Resolution should be verified against safe state, not only free-text notes. AI summaries may help explain why something appears resolved, but AI must not resolve the risk automatically.

## Audit Log Expectations

Future queue actions should be auditable:

- created / detected,
- grouped / deduped,
- acknowledged,
- assigned,
- reassigned,
- suppressed,
- re-alerted,
- escalated,
- resolved,
- reopened.

Audit entries should use safe allow-list fields and should not include customer contact values, raw channel identifiers, provider secrets, raw payloads, or full object payloads.

## AI Advisory Boundaries

AI may help future dashboards by:

- summarizing safe case context,
- suggesting probable risk reason,
- suggesting missing fields,
- suggesting candidate owner role,
- suggesting severity review,
- detecting duplicate-looking items,
- drafting safe internal notes.

AI must not:

- acknowledge risk,
- suppress risk,
- escalate risk authoritatively,
- assign owners authoritatively,
- resolve risk,
- send notifications,
- decide customer contact channel,
- decide billing / settlement,
- complete reports,
- close Cases,
- choose or override `finalAppointmentId`.

AI outputs should be labeled as suggestions and should remain subject to human confirmation or deterministic approved policy.

## Channel-Agnostic Notification Readiness Notes

Future dashboards may later connect to notification or reminder surfaces, but Task178 does not approve sending.

Design principles:

- dashboard risk item creation is separate from message delivery,
- channel resolution is future work,
- LINE should not be hard-coded into core risk queues,
- own APP, SMS, email, manual follow-up, or no-channel states should remain possible,
- raw channel identifiers should not appear in queue rows,
- delivery failure should not mutate Case / Report completion state.

If future notification actions are added, they should use provider-safe payload allow-lists and explicit permission checks.

## Data Model Alignment with Task174

Task174 proposed future `sla_policies`, `case_risk_flags`, and `operations_tasks` concepts. Task178 maps them to dashboard concepts without creating schema.

| Task174 concept | Dashboard use | Boundary |
| --- | --- | --- |
| `sla_policies` | due time and severity source | No executable policy in Task178 |
| `case_risk_flags` | risk queue row candidate | No table or query created |
| `operations_tasks` | human follow-up assignment candidate | No task runtime created |
| safe metadata | display-safe context | No raw payload or contact values |
| audit fields | queue action history | No audit implementation created |

Future implementation should decide whether dashboards are computed-only, persisted-only, or hybrid as described in Task174.

## Policy Alignment with Task175 / Task176 / Task177

Task178 expects future dashboard behavior to inherit:

- Task175 severity and threshold interpretation,
- Task176 business-hours / calendar-hours clock display,
- Task176 pause / resume / stop semantics,
- Task177 dedupe / grouping behavior,
- Task177 suppression and re-alert behavior,
- Task177 human review requirements.

Dashboard views should not override those policies. They should surface them in a way that makes human review safer and less noisy.

## Admin / Backend Future Implementation Guardrails

Future implementation tasks should explicitly decide:

- whether queue rows are computed, persisted, or hybrid,
- whether role queues are permission-derived or configuration-derived,
- which API endpoints expose risk queue summaries,
- how to redact safe display payloads,
- how to paginate and filter dashboard queues,
- how to audit every queue action,
- how to avoid duplicate active risks,
- how to test no provider sending,
- how to keep AI advisory only.

Future implementation must not start from Task178 alone. It will need a dedicated runtime design, API contract, Admin UI design, migration review, and approval gate.

## Future Task Candidates

Recommended future safe tasks:

1. Task179 - SLA / Operations Risk Human Action Workflow Design / No Runtime Change.
2. Task180 - SLA / Operations Risk Admin Dashboard Wireframe Requirements / No Admin Code Change.
3. Task181 - SLA / Operations Risk API Contract Draft / No Runtime Change.
4. Task182 - SLA / Operations Risk Permission and Organization Scope Review / No Runtime Change.
5. Task183 - SLA / Operations Risk Runtime Readiness Gate / No Migration or Runtime Change.

These are suggestions only. They do not approve runtime, Admin source, API, DB, migration, provider delivery, survey runtime, or AI automatic decision work.

## Verification Checklist

Task178 should be considered valid only if:

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

# Task 179 - SLA / Operations Risk Human Action Workflow Design / No Runtime Change

## Purpose and Non-Goals

Task179 defines a proposal-only human action workflow for future SLA / operations risk handling.

This document builds on:

- `docs/task-173-sla-operations-risk-escalation-design-no-runtime-change.md`
- `docs/task-174-sla-operations-risk-data-model-proposal-no-migration.md`
- `docs/task-175-sla-operations-risk-policy-and-threshold-matrix-no-runtime-change.md`
- `docs/task-176-sla-operations-risk-clock-source-and-business-hours-policy-no-runtime-change.md`
- `docs/task-177-sla-operations-risk-dedupe-and-suppression-policy-no-runtime-change.md`
- `docs/task-178-sla-operations-risk-dashboard-role-queue-design-no-runtime-change.md`

Task179 describes how humans may acknowledge, triage, assign, reassign, suppress, unsuppress, escalate, de-escalate, resolve, reopen, comment, request follow-up, and mark non-actionable risk items before any runtime workflow engine exists.

Task179 does not:

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

Task179 assumes:

- one Case has one formal Field Service Report,
- one Case may have multiple appointments / visits,
- one Case should have at most one open appointment at the same time,
- appointment / visit history belongs to dispatch and service execution,
- `finalAppointmentId` is backend / system determined and stable after completion,
- completed report repeat completion is rejected before side effects,
- Admin has no manual final appointment picker,
- SLA / operations risk state does not replace official Case / Appointment / Report status,
- future role queues remain organization scoped,
- channel delivery is not approved,
- AI is advisory only.

Human risk actions are future operations controls. They must not mutate core lifecycle state unless a later explicitly approved runtime task defines that mutation.

## Human Action Workflow Principles

Future human action workflow should follow these principles:

1. Every authoritative risk action should have a human actor or approved deterministic policy source.
2. Risk workflow state is separate from Case / Appointment / Field Service Report lifecycle state.
3. Acknowledgment is not resolution.
4. Suppression is not deletion.
5. Escalation is not automatic customer contact.
6. Resolution should have safe evidence or a deterministic condition.
7. Reopen should preserve the prior history.
8. AI suggestions can help humans decide, but AI cannot perform authoritative actions.
9. Provider sending and channel delivery require separate future approval.
10. Auditability is required before production runtime.

## Actor Categories and Responsibility Boundaries

The following actor categories are proposal-only labels, not final production permissions.

| Actor category | Typical responsibility | Boundary |
| --- | --- | --- |
| Customer service | Customer contact, missing info, confirmation, follow-up | Cannot close Cases through risk workflow alone |
| Dispatch coordinator | Scheduling, next appointment, owner routing | Cannot override one-open-appointment invariant |
| Engineer lead | Field update hygiene, visit result review | Cannot complete reports through risk workflow alone |
| Supervisor / quality | severe risk, complaint, exception, suppression review | Cannot bypass audit expectations |
| Finance / settlement | billing proof, settlement exception review | Cannot decide formal payable amount by AI suggestion |
| Admin / operations manager | queue governance, policy review, cross-role health | Cannot enable runtime without approved task |
| System policy | deterministic future scheduler / evaluator | Must be auditable and cannot send provider messages by itself |
| AI assistant | suggestions and summaries only | Cannot acknowledge, assign, suppress, escalate, resolve, reopen, or notify |

## Risk Item Lifecycle Overview

Proposal-only lifecycle states:

| State | Meaning | Notes |
| --- | --- | --- |
| `detected` | Candidate risk exists | May be computed or persisted in future |
| `queued` | Visible in a future role queue | Does not imply assignment |
| `acknowledged` | Human has seen it | Not resolved |
| `triaged` | Human categorized next action | Not necessarily assigned |
| `assigned` | Owner / role is responsible | Does not mutate core Case owner unless future policy says so |
| `in_progress` | Human work is underway | SLA clock may still run unless paused by policy |
| `suppressed` | Temporarily quieted with reason | Must have review expectation |
| `escalated` | Higher attention required | Does not send messages by itself |
| `resolved` | Underlying condition ended or accepted outcome recorded | Keeps history |
| `reopened` | Resolved / suppressed risk became active again | Preserves prior state |
| `non_actionable` | Human confirmed not actionable | Still auditable |

These states are not migration-ready enum values. They are design vocabulary only.

## Action Taxonomy

| Action | Purpose | Authority level |
| --- | --- | --- |
| acknowledge | record that a human saw the risk | Human |
| triage | classify next action and urgency | Human |
| assign | set owner or role owner | Human or approved deterministic policy |
| reassign | transfer owner / role | Human |
| suppress | quiet risk until review point | Human, possibly supervisor-only |
| unsuppress | make suppressed risk active again | Human or deterministic review time |
| escalate | increase attention / owner level | Human or approved deterministic policy |
| de-escalate | reduce severity after review | Human |
| resolve | mark risk condition handled | Human or deterministic condition if approved |
| reopen | reactivate due to new evidence | Human or deterministic policy |
| comment | add safe internal note | Human |
| request follow-up | record needed human follow-up | Human |
| mark non-actionable | confirm risk does not require action | Human, with reason |

AI may draft suggestions for these actions but must not perform them.

## Action Preconditions and Expected Effects

| Action | Preconditions | Expected effect | Must not do |
| --- | --- | --- | --- |
| acknowledge | active visible risk | records seen / owner awareness | resolve, suppress, notify |
| triage | active risk and safe context reviewed | sets next-action classification | mutate Case status |
| assign | active or triaged risk | sets owner / role owner | override permissions |
| reassign | existing owner or role | transfers owner | erase prior owner history |
| suppress | reviewed reason and review expectation | hides or quiets according to policy | delete risk, hide P0 from supervisors |
| unsuppress | suppressed risk exists | returns to active queue | reset audit history |
| escalate | threshold, severity, or human reason | raises queue visibility | send provider message |
| de-escalate | human review and reason | lowers attention level | erase previous escalation |
| resolve | condition ended or accepted outcome | closes active risk item | complete Case / Report by itself |
| reopen | new evidence or failed resolution | returns risk to active state | create duplicate active risk if dedupe matches |
| comment | safe note content | appends note | include sensitive payloads |
| request follow-up | owner and follow-up reason | creates future follow-up expectation | send notification by itself |
| mark non-actionable | human reason | removes from active action queue | delete evidence |

## Proposal-Level State Transition Matrix

| From | Action | To | Notes |
| --- | --- | --- | --- |
| `detected` | queue | `queued` | Future evaluator may surface item |
| `queued` | acknowledge | `acknowledged` | Human saw it |
| `queued` / `acknowledged` | triage | `triaged` | Next action classified |
| `triaged` | assign | `assigned` | Owner set |
| `assigned` | start work | `in_progress` | Optional future action |
| Any active state | suppress | `suppressed` | Requires reason and review |
| `suppressed` | unsuppress / review due | `queued` | Returns to visible queue |
| Any active state | escalate | `escalated` | Increased attention |
| `escalated` | de-escalate | prior active state or `triaged` | Requires review |
| Any active state | resolve | `resolved` | Underlying condition handled |
| `resolved` / `suppressed` | reopen | `reopened` then `queued` | New evidence |
| Any active state | mark non-actionable | `non_actionable` | Requires reason |

This is not executable workflow config.

## Acknowledgment Workflow

Future acknowledgment should:

1. identify actor and organization scope,
2. record timestamp,
3. record optional safe note,
4. keep the risk visible if action remains needed,
5. allow cooldown / re-alert policy from Task177.

Acknowledgment should not:

- stop a clock by default,
- resolve risk,
- suppress risk,
- trigger customer contact,
- mutate Case / Appointment / Report lifecycle.

## Triage Workflow

Future triage should classify:

- whether the risk is valid,
- severity review needed,
- owner role,
- next action type,
- whether suppression is appropriate,
- whether supervisor review is needed,
- whether related risk items should be grouped.

Triage may result in assignment, escalation, suppression request, or non-actionable marking, but each should remain separately auditable.

## Assignment and Reassignment Workflow

Assignment should route risk to a responsible owner or role.

Recommended future fields:

- assigned owner summary,
- assigned role summary,
- assigned at,
- assigned by,
- assignment reason,
- previous owner summary.

Assignment must not:

- change official Case owner unless future policy explicitly maps it,
- create appointments,
- bypass organization and permission scope,
- assign based on AI alone.

## Suppression and Unsuppression Workflow

Suppression should require:

- reason code,
- safe note if needed,
- suppressed until or review expectation,
- actor,
- timestamp,
- high-severity review rule if applicable.

Unsuppression may occur when:

- review time arrives,
- human manually unsuppresses,
- severity increases,
- new evidence appears,
- related risk reopens.

Suppression must not hide official Case / Appointment / Report state or erase risk history.

## Escalation and De-Escalation Workflow

Escalation should make a risk more visible and route it to an appropriate human queue.

Escalation sources:

- threshold breach from Task175,
- business-hours or calendar clock from Task176,
- repeated re-alert from Task177,
- supervisor review,
- severe complaint or quality signal,
- future finance or quote exception.

De-escalation should require a human reason and should preserve prior escalation history.

Escalation must not:

- send customer messages,
- trigger survey sending,
- approve settlement,
- complete reports,
- close Cases,
- let AI decide final outcome.

## Resolution Workflow

Resolution should be based on safe evidence or deterministic state.

Candidate resolution examples:

- appointment created or confirmed,
- next visit arranged,
- parts ETA recorded,
- customer follow-up completed,
- report completed,
- quote decision recorded,
- supervisor decision recorded,
- billing evidence attached.

Resolution should record:

- resolved by,
- resolved at,
- resolution reason,
- safe evidence reference,
- whether automatic re-open rules remain active.

Resolved risk is not the same as completed Case unless the formal Case / Report lifecycle also says so.

## Reopen Workflow

Reopen should reactivate a previously resolved or suppressed risk when new evidence appears.

Candidate reopen triggers:

- customer contacts again,
- follow-up due date passes,
- appointment cancelled after risk resolution,
- pending parts ETA expires,
- quote remains undecided after expected date,
- survey / complaint signal appears later,
- proof remains missing after finance review.

Reopen must preserve:

- original detection history,
- prior resolution / suppression reason,
- current new evidence summary,
- dedupe relationship.

## Comment and Evidence Workflow

Future comments should be safe internal notes only.

Comment and evidence rules:

- use concise operational summary,
- avoid customer contact values,
- avoid raw channel identifiers,
- avoid raw payloads,
- avoid credentials,
- avoid full object payloads,
- link to approved internal evidence if runtime exists later,
- keep audit trail of author and timestamp.

AI may draft a comment, but a human must review before it becomes official.

## Non-Actionable / False-Positive Handling

Some risk items may be valid signals but not actionable.

Examples:

- smoke / internal test case,
- customer intentionally delayed,
- duplicate already covered by another active risk,
- policy rule too broad,
- stale signal after source data corrected.

Marking non-actionable should require a reason and should be visible in audit / reporting so future policy tuning can improve.

## Audit Log Expectations

Future workflow audit should record:

- action type,
- actor summary,
- actor role summary,
- organization scope,
- case id / risk id reference,
- prior state,
- next state,
- reason code,
- safe note,
- timestamp,
- policy version if applicable.

Audit should not include raw provider payloads, customer contact values, raw channel identifiers, database connection strings, passwords, tokens, or full object payloads.

## Dashboard Queue Alignment with Task178

Task178 defines future queue surfaces. Task179 defines the actions those queues may expose.

Recommended alignment:

| Task178 queue concept | Task179 action focus |
| --- | --- |
| My active risks | acknowledge, triage, resolve, request follow-up |
| Near due | triage, assign, escalate if needed |
| Overdue | escalate, assign, suppress with review, resolve |
| Unassigned | assign / reassign |
| Suppression review | unsuppress, extend suppression, resolve |
| Re-alerted | re-triage, escalate, resolve |
| Escalation queue | supervisor review, de-escalate, resolve |
| Finance exceptions | assign, comment, resolve with safe evidence |
| Quality follow-up | supervisor review, request follow-up, resolve |

## Dedupe / Suppression Alignment with Task177

Task179 assumes:

- duplicate signals should not create duplicate active action rows,
- grouping should preserve underlying evidence,
- suppression should not delete history,
- cooldown should not erase overdue state,
- re-alert should update the existing risk when dedupe key matches,
- AI cannot suppress automatically.

Human actions should update action history rather than spawn duplicate active risk items.

## Clock / Business-Hours Alignment with Task176

Human workflow should show clock interpretation but not invent clock authority.

Future workflow should respect:

- UTC storage,
- organization / service-region timezone display,
- business-hours vs calendar-hours policy,
- pause / resume / stop semantics,
- P0 override rules if approved later,
- provider timestamps only after normalization.

Human actions such as acknowledgment or assignment should not stop clocks unless a separate approved pause action is performed.

## Threshold / Severity Alignment with Task175

Task175 severity bands should drive attention and review urgency.

Future workflow should:

- require stronger review for P0 / P1 suppression,
- keep P0 visible until resolved or supervisor-reviewed,
- allow P2 / P3 batching according to policy,
- treat Info as context unless combined with other risk,
- avoid automatic mutation at all severity levels.

Severity does not grant permission for customer messaging or workflow mutation.

## Data Model Alignment with Task174

Task174 proposed future concepts like `case_risk_flags` and `operations_tasks`.

Task179 maps human actions to possible future model needs without creating schema:

| Future data need | Possible Task174 relation | Notes |
| --- | --- | --- |
| risk state | `case_risk_flags.risk_state` | Proposal only |
| assigned owner | `operations_tasks` or future risk owner fields | Needs permission design |
| suppression metadata | future risk fields | Needs dedupe / review policy |
| audit history | future audit log or action log | Must be safe allow-list |
| comments | future safe notes | No raw payloads |
| evidence references | future attachment / object refs | Not full payload storage |

Task179 does not create migration-ready columns or indexes.

## Escalation Design Alignment with Task173

Task173 defines escalation as operational and advisory, not lifecycle mutation.

Task179 preserves that:

- escalation is a human review / visibility action,
- escalation does not complete Field Service Reports,
- escalation does not close Cases,
- escalation does not infer `finalAppointmentId`,
- escalation does not send provider messages,
- escalation does not let AI decide final outcomes.

## AI Advisory Boundaries

AI may suggest:

- likely risk reason,
- candidate next action,
- missing data,
- severity review,
- owner role candidate,
- duplicate-looking risk,
- safe comment draft.

AI must not:

- acknowledge,
- triage authoritatively,
- assign,
- suppress,
- unsuppress,
- escalate,
- de-escalate,
- resolve,
- reopen,
- mark non-actionable,
- notify customers,
- mutate Case / Appointment / Report state,
- decide billing / settlement,
- choose or override `finalAppointmentId`.

## Channel-Agnostic Notification Readiness Notes

Future human actions may later request notifications, but Task179 does not approve delivery.

Principles:

- workflow action is separate from delivery action,
- delivery channel is resolved by future channel abstraction,
- LINE should not be hard-coded into risk workflow,
- own APP / SMS / email / manual follow-up / no-channel states remain possible,
- raw channel identifiers should not appear in workflow rows,
- no provider sending occurs from this design.

## Future Runtime / Admin / API Guardrails

Before implementation, a future task must define:

- exact permission model,
- API contract,
- persisted state model,
- audit log storage,
- redaction allow-list,
- dedupe and idempotency behavior,
- role queue access control,
- provider no-send tests,
- AI suggestion labeling,
- UI copy and workflow affordances.

Task179 alone is not implementation approval.

## Future Task Candidates

Recommended future safe tasks:

1. Task180 - SLA / Operations Risk Action Audit and Evidence Policy / No Runtime Change.
2. Task181 - SLA / Operations Risk Permission and Organization Scope Review / No Runtime Change.
3. Task182 - SLA / Operations Risk Admin Dashboard Wireframe Requirements / No Admin Code Change.
4. Task183 - SLA / Operations Risk API Contract Draft / No Runtime Change.
5. Task184 - SLA / Operations Risk Runtime Readiness Gate / No Migration or Runtime Change.

These suggestions do not approve runtime, API, Admin source, DB, migration, provider delivery, survey runtime, or AI automatic decision work.

## Verification Checklist

Task179 should be considered valid only if:

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

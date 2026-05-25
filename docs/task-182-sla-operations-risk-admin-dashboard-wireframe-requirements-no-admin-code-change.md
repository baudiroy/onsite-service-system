# Task 182 - SLA / Operations Risk Admin Dashboard Wireframe Requirements / No Admin Code Change

## Purpose and Non-Goals

Task182 defines proposal-only Admin dashboard wireframe requirements for future SLA / operations risk review screens.

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

Task182 is not an Admin implementation task. It does not create React components, routes, API clients, executable UI configuration, wireframe image assets, backend APIs, runtime jobs, database objects, notification delivery, provider sending, survey runtime, or production RBAC.

Task182 does not:

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

Task182 assumes:

- one Case has one formal Field Service Report,
- one Case may have multiple appointments / visits,
- one Case should have at most one open appointment at the same time,
- appointment / visit history belongs to dispatch and service execution,
- `finalAppointmentId` is backend / system determined and stable after completion,
- completed report repeat completion is rejected before side effects,
- Admin has no manual final appointment picker,
- SLA / operations risk state is separate from official Case / Appointment / Report lifecycle state,
- future role queues remain organization scoped,
- channel delivery is not approved,
- AI is advisory only.

Future Admin dashboard screens should help humans review risk safely. They must not become hidden workflow engines or imply that current Admin UI already has these dashboard features.

## Wireframe Requirements Principles

Future Admin dashboard wireframes should follow these principles:

1. Show risk as an operational review layer, not as formal Case lifecycle state.
2. Keep Case-level context visible while preserving appointment / visit history.
3. Make severity, due time, owner, status, and next action scannable.
4. Keep action controls human-confirmed and permission-aware.
5. Separate queue-row visibility from evidence visibility.
6. Separate AI suggestions from authoritative human actions.
7. Show suppression, dedupe, and audit state clearly.
8. Avoid raw payloads and sensitive identifiers.
9. Keep delivery-channel decisions out of the dashboard wireframe.
10. Avoid implying that a future screen already exists in Admin.

## Proposed Page / Screen Inventory

Future Admin may eventually include these proposal-only screen concepts:

| Screen concept | Purpose | Primary audience |
| --- | --- | --- |
| Operations Risk Overview | Cross-role summary of active, near-due, overdue, escalated, and suppressed risk | Supervisors, operations managers |
| My Risk Queue | Items assigned to the current user or role | All operational roles |
| Role Queue View | Customer service, dispatch, engineer lead, finance, or quality-specific queue | Role-specific users |
| Risk Item Detail Panel | Safe Case / appointment / report context plus action history | Users with item visibility |
| Suppression Review Queue | Suppressed items needing review or re-alert | Supervisors / quality |
| Escalation Queue | P0 / P1 and repeated re-alert items | Supervisors / operations managers |
| Audit / Evidence Drawer | Scoped audit trail and evidence references | Authorized reviewers |

These are screen names for planning only. Task182 does not add routes, navigation items, menu entries, or source files.

## Queue List Layout Requirements

Queue list wireframes should support:

- compact row density for repeated operational use,
- clear severity and risk type display,
- safe Case identifier / case number summary,
- owner role and assigned owner summary,
- due time and overdue state,
- clock basis: business hours or calendar hours,
- risk lifecycle state,
- suppression / acknowledgment / escalation badges,
- latest safe action summary,
- appointment sequence if applicable,
- final report reference if applicable,
- pagination or virtual scrolling as future implementation questions.

Queue rows should not show:

- customer contact values,
- raw LINE user id,
- raw provider payload,
- full customer payload,
- full appointment payload,
- full report payload,
- secrets,
- tokens,
- database connection strings.

## Risk Item Detail Panel Requirements

The future detail panel should show safe context in grouped sections:

| Section | Suggested content | Boundary |
| --- | --- | --- |
| Risk summary | risk type, severity, state, owner, due time | No raw payload |
| Case context | safe Case identifier, Case status summary, created / completed summary | Do not expose sensitive customer contact by default |
| Appointment / visit context | visit sequence, visit result summary, pending parts / quote / no-show context if applicable | Do not imply appointment owns a formal report |
| Field Service Report context | report status, resolved `finalAppointmentId` if completed | No manual final appointment picker |
| Clock context | clock basis, due time, overdue amount, pause state | Proposal-only display |
| Action history | safe audit events and latest action summary | Evidence permission may differ |
| Evidence references | attachment ids or object references if future runtime exists | Do not copy raw evidence payload |
| AI advisory | labeled summary or suggestion if approved | Not authoritative |

The panel should make it clear that the official formal report remains Case-level.

## Filter / Sort / Search / Grouping Requirements

Future dashboard filters may include:

- organization,
- role queue,
- assigned owner,
- severity,
- risk type,
- risk state,
- due window,
- overdue only,
- suppressed only,
- re-alerted only,
- escalation level,
- appointment-related risk,
- report-related risk,
- finance / settlement risk,
- quality / complaint risk.

Sorting may include:

- severity,
- due time,
- overdue age,
- business-hours age,
- last action time,
- escalation level,
- assigned owner,
- created time.

Search should use safe identifiers and summaries. It should not require or expose raw channel identifiers, customer contact values, raw provider payloads, or credentials.

Grouping may support:

- by owner,
- by role,
- by risk type,
- by severity,
- by due day,
- by Case,
- by dedupe group.

## Severity / Priority Display Requirements

Severity display should align with Task175:

| Severity | Wireframe treatment | Must not imply |
| --- | --- | --- |
| P0 Critical | pinned or high-attention supervisor area | automatic Case closure or provider sending |
| P1 High | prominent queue priority | automatic customer contact |
| P2 Medium | normal review priority | automatic suppression |
| P3 Low | lower priority / batchable queue | no review needed |
| Info | contextual signal | authoritative workflow action |

Severity is an attention signal. It should not decide official Case / Appointment / Report lifecycle, billing, settlement, or customer notification by itself.

## SLA Clock / Business-Hours Display Requirements

Clock display should align with Task176:

- due time shown in organization timezone,
- clear label for business-hours or calendar-hours basis,
- remaining time when not overdue,
- overdue duration when breached,
- paused state and pause reason summary,
- resume / review time if applicable,
- stopped / resolved state when risk is closed,
- unknown-clock state when runtime cannot determine the timer.

Wireframes should avoid hiding clock uncertainty. If a due time cannot be determined, the screen should show a review-needed state rather than inventing a time.

## Dedupe / Suppression Display Requirements

Dedupe and suppression display should align with Task177:

- grouped risk item shows a group indicator,
- underlying signal count is visible as a safe count,
- user can access safe history if permitted,
- suppression badge is visible,
- suppression reason summary is visible,
- suppression review time is visible,
- re-alert reason is visible when an item returns,
- high-severity suppressed items remain supervisor-reviewable.

Suppression should never look like deletion. Dedupe should never erase history.

## Acknowledgment / Escalation / Resolution Display Requirements

Human action display should align with Task179:

| Action state | Display requirement | Boundary |
| --- | --- | --- |
| acknowledged | show acknowledged by / at summary | not resolved |
| triaged | show next action and owner role | not lifecycle mutation |
| assigned | show current owner | preserve prior owner in audit |
| suppressed | show reason and review point | not deletion |
| escalated | show level and reason | not provider sending |
| resolved | show resolution reason and evidence summary | not Case completion by itself |
| reopened | show reopen reason | preserve history |
| non-actionable | show human reason | supervisor/reviewer policy applies |

Action state should remain visually separate from official Case status.

## Human Action Affordance Requirements

Future controls may include proposal-only buttons or menu actions such as:

- Acknowledge,
- Triage,
- Assign,
- Reassign,
- Suppress,
- Unsuppress,
- Escalate,
- De-escalate,
- Resolve,
- Reopen,
- Mark non-actionable,
- Add safe note,
- Link evidence reference.

These affordances should be:

- hidden or disabled when the user lacks permission,
- confirmation-gated for suppression, de-escalation, non-actionable marking, and high-severity resolution,
- reason-code aware,
- audit-backed,
- separated from Case completion, report completion, appointment creation, billing approval, settlement approval, and notification sending.

AI may suggest an action label or draft a safe note, but AI must not click or execute the action.

## Audit and Evidence Display Requirements

Audit and evidence display should align with Task180:

- show action category,
- show safe actor summary,
- show actor role summary,
- show prior and next risk state where appropriate,
- show reason code,
- show safe note,
- show evidence references,
- show timestamp,
- label AI-generated suggestions separately.

Evidence display should use references and safe summaries, not copied raw payloads. Some users may see a queue row but not the evidence drawer.

## Permission / Organization Visibility Requirements

Visibility should align with Task181:

- every queue item is organization scoped,
- queue visibility depends on role, owner, queue type, severity, risk category, and evidence sensitivity,
- evidence visibility is checked separately,
- cross-branch or multi-team views are explicit,
- suppression / de-escalation / non-actionable marking requires stronger authority,
- audit visibility is scoped and may differ from queue visibility,
- raw channel identifiers are not authorization keys.

Wireframes should communicate restricted visibility with neutral copy, not by exposing hidden data.

## AI Advisory UI Boundaries

Future AI advisory UI may show:

- suggested summary,
- possible reason,
- duplicate-looking indicator,
- missing-field reminder,
- suggested owner role,
- suggested safe note draft,
- suggested severity review.

AI advisory UI must not:

- acknowledge,
- assign,
- suppress,
- escalate,
- resolve,
- mark non-actionable,
- send notifications,
- choose customer contact channel,
- decide billing / settlement,
- complete reports,
- close Cases,
- select or override `finalAppointmentId`.

AI content should be labeled as suggestion-only and should remain subject to human confirmation or approved deterministic policy.

## Channel-Agnostic Notification Readiness Notes

Future dashboards may eventually expose notification-related context, but Task182 does not approve delivery.

Wireframes may show:

- channel availability summary,
- notification pending / not deliverable summary,
- last delivery attempt summary if future runtime exists,
- manual follow-up needed summary.

Wireframes should not:

- hard-code LINE as the only channel,
- show raw LINE user id,
- send LINE / APP / SMS / email,
- create provider payloads,
- expose provider credentials,
- treat queue action permission as delivery permission.

Delivery channel resolution is a future separate design and runtime concern.

## Data Model Alignment with Task174

Task174 proposed future `sla_policies`, `case_risk_flags`, and `operations_tasks` concepts. Task182 maps them to wireframe needs only.

| Task174 concept | Wireframe use | Boundary |
| --- | --- | --- |
| `sla_policies` | explain clock basis, severity, threshold | No executable policy |
| `case_risk_flags` | source of queue row candidate | No table or query created |
| `operations_tasks` | human action / owner candidate | No task runtime created |
| risk state | row badges and detail panel state | No enum created |
| safe metadata | display-safe context | No raw payload display |
| audit references | action history and evidence drawer | No audit implementation |

Task182 does not define migration-ready columns, indexes, constraints, or API response contracts.

## Policy Alignment with Task175 / Task176 / Task177

Future dashboard wireframes should inherit:

- Task175 severity and threshold meaning,
- Task175 human review requirements,
- Task176 authoritative clock source and timezone assumptions,
- Task176 business-hours / calendar-hours display distinction,
- Task176 pause / resume / stop semantics,
- Task177 dedupe / grouping rules,
- Task177 suppression and re-alert display expectations.

Wireframes should surface these policies; they should not redefine them as executable rules.

## Workflow Alignment with Task178 / Task179 / Task180 / Task181

Future dashboard wireframes should align with:

- Task178 role queues and queue ownership,
- Task179 human action lifecycle and action taxonomy,
- Task180 audit and evidence display safety,
- Task181 permission and organization-scope review.

The wireframe should keep four layers visually distinct:

1. official Case / Appointment / Field Service Report lifecycle,
2. operations risk state,
3. human action state,
4. AI advisory suggestions.

## Future Admin / Backend / API Guardrails

Future implementation tasks should explicitly decide:

- whether the dashboard is route-based, tab-based, or embedded in Case detail,
- whether queue rows are computed, persisted, or hybrid,
- how API endpoints paginate and filter queue rows,
- how safe display payloads are allow-listed,
- how permissions are checked per row, action, and evidence drawer,
- how action requests are confirmed and audited,
- how dashboard refresh avoids stale state,
- how no provider sending is tested,
- how AI suggestions remain advisory,
- how final Case / Report lifecycle remains separate from risk actions.

No Admin source code should be written from Task182 alone. A later task should produce an implementation-ready Admin design and API contract only after runtime and permission decisions are approved.

## Future Task Candidates

Recommended next safe tasks:

1. Task183 - SLA / Operations Risk Dashboard Copy and Empty-State Policy / No Admin Code Change.
2. Task184 - SLA / Operations Risk API Contract Draft / No Runtime Change.
3. Task185 - SLA / Operations Risk Runtime Readiness Gate / No Migration or Runtime Change.
4. Task186 - SLA / Operations Risk No-Send Test Plan / No Runtime Change.
5. Task187 - SLA / Operations Risk Implementation Pause Summary / No Runtime Change.

These suggestions do not approve Admin source changes, backend runtime, API changes, DB work, migration, provider delivery, survey runtime, or AI automatic decisions.

## Verification Checklist

Task182 should be considered valid only if:

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

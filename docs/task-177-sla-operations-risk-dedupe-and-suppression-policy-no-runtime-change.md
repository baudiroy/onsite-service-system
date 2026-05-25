# Task 177 - SLA / Operations Risk Dedupe and Suppression Policy / No Runtime Change

## Purpose and Non-Goals

Task177 defines a proposal-only policy for future SLA / operations risk dedupe, suppression, grouping, cooldown, re-alert, and re-open behavior.

This document builds on:

- `docs/task-173-sla-operations-risk-escalation-design-no-runtime-change.md`
- `docs/task-174-sla-operations-risk-data-model-proposal-no-migration.md`
- `docs/task-175-sla-operations-risk-policy-and-threshold-matrix-no-runtime-change.md`
- `docs/task-176-sla-operations-risk-clock-source-and-business-hours-policy-no-runtime-change.md`

Task177 is not executable configuration and does not define final production SLA commitments. All cooldown windows, grouping examples, suppression examples, and severity behavior are placeholders pending product, operations, organization, vendor, and legal approval.

Task177 does not:

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

Task177 assumes:

- one Case has one formal Field Service Report,
- one Case may have multiple appointments / visits,
- one Case should have at most one open appointment at the same time,
- appointment / visit history belongs to the dispatch and service layer,
- `finalAppointmentId` is backend / system determined and stable after completion,
- completed report repeat completion is rejected before side effects,
- Admin has no manual final appointment picker,
- SLA / risk flags must not replace official Case / Appointment / Report statuses,
- channel delivery is not approved,
- AI is advisory only.

Dedupe and suppression are operations controls. They must not hide official domain state or mutate core lifecycle by themselves.

## Definitions: Signal, Alert, Escalation, Suppression, Dedupe

| Term | Meaning | Boundary |
| --- | --- | --- |
| Signal | A candidate risk condition detected from Case / Appointment / Report / future policy data | May be computed and not persisted |
| Alert | A visible item shown to staff or dashboard | Requires policy and permission |
| Escalation | A higher priority human-review requirement | Does not automatically mutate domain status |
| Dedupe | Combining repeated equivalent signals into one active risk item | Must be deterministic and auditable |
| Suppression | Temporarily or permanently hiding / quieting a risk from alerting surfaces | Must not erase history |
| Cooldown | Minimum time before an acknowledged risk re-alerts | Proposal-only until runtime approved |
| Reopen | Re-activating a resolved / suppressed risk due to new evidence | Must be policy-driven |

## Dedupe Principles

Future dedupe should prevent noisy duplicate risk rows and duplicate dashboard alerts while preserving audit history.

Recommended principles:

1. One active Case-level risk per organization / case / risk type / policy scope should usually exist at a time.
2. Appointment-specific risks may coexist when they refer to different appointments.
3. Report-specific risks should reference the Case-level formal report and must not imply multiple formal reports.
4. Repeated scheduler runs should update the existing active risk when the dedupe key matches.
5. New material evidence should append audit history rather than create duplicate active alerts.
6. Resolved historical risks may remain as records for reporting.
7. Dedupe keys must be stable and not depend on display text, AI summary text, raw payloads, or customer contact values.

Proposal-only candidate dedupe dimensions:

- `organization_id`
- `case_id`
- `risk_type`
- `source_type`
- `source_id`
- `policy_key`
- `active_state`

No actual DB key or migration is created in Task177.

## Suppression Principles

Suppression should reduce noise without hiding unsafe work.

Allowed future suppression reasons may include:

- known customer-requested waiting period,
- customer unavailable,
- approved supervisor hold,
- waiting for parts ETA,
- waiting for quote approval,
- waiting for vendor / warranty decision,
- duplicate signal covered by another active risk,
- internal test / smoke / fixture case,
- non-actionable historical risk.

Suppression must not:

- complete or close a Case,
- complete or reopen a Field Service Report,
- choose or alter `finalAppointmentId`,
- create or cancel appointments,
- send customer messages,
- suppress P0 / severe complaint risk without explicit permission,
- delete risk history,
- hide a Case from all dashboard visibility without policy approval,
- be performed by AI automatically.

Recommended suppression metadata for future runtime:

- suppression reason code,
- suppressed by,
- suppressed at,
- suppressed until,
- review required at,
- safe note,
- policy version.

## Grouping and Correlation Policy

Future dashboards should group related risk signals to avoid operator overload.

Examples:

| Related signals | Suggested grouping | Notes |
| --- | --- | --- |
| `case_not_dispatched` + `case_no_open_appointment` | Case scheduling risk group | One owner queue item may be enough |
| `pending_parts_no_next_visit` + `case_no_open_appointment` | Pending parts follow-up group | Parts owner and dispatch may both see it |
| `report_in_progress_too_long` + `completion_blocked_no_completed_visit` | Report completion blocked group | Supervisor visibility |
| `repeated_reschedules` + `customer_follow_up_required` | Customer coordination group | Customer service owner |
| `complaint_risk` + `survey_low_rating` | Quality / complaint group | Future survey runtime only |
| `billing_settlement_stale` + missing proof | Finance review group | Future billing branch only |

Grouping should not merge underlying facts into a single ambiguous record. It should present a dashboard cluster while preserving source-level evidence.

## Cooldown and Re-Alert Policy

Cooldown windows are proposal-only placeholders. They are not production commitments.

Candidate defaults:

| Severity | Placeholder cooldown after acknowledgment | Re-alert trigger |
| --- | --- | --- |
| P0 Critical | No cooldown unless supervisor suppresses with reason | Any unresolved condition remains visible |
| P1 High | 2 business hours | Deadline worsens, new customer contact, or no action after cooldown |
| P2 Medium | 1 business day | Condition remains active after cooldown |
| P3 Low | 2 business days | Condition remains active and no owner action |
| Info | No automatic re-alert by default | Only if severity increases |

Rules:

- cooldown should not stop the underlying clock,
- cooldown should not erase overdue status,
- re-alert should not create duplicate active risk if dedupe key matches,
- re-alert should update alert visibility and audit history,
- AI may suggest cooldown suitability but cannot set cooldown automatically.

## Acknowledgment and Human Review Policy

Acknowledgment means a human has seen the risk; it does not mean the risk is resolved.

Future policy should distinguish:

- `acknowledged`: human saw / accepted ownership,
- `in_progress`: human action is underway,
- `resolved`: underlying condition has ended or accepted outcome is recorded,
- `suppressed`: intentionally quieted until a review point,
- `reopened`: condition returned or new evidence appeared.

Human review should be required for:

- P0 / P1 suppression,
- complaint / callback risk suppression,
- repeated incomplete visits,
- completion blocked with no eligible completed visit,
- pending parts beyond overdue threshold,
- future survey low rating follow-up,
- any AI-suggested suppression.

## Reopen / Re-Escalation Semantics

A previously resolved or suppressed risk may re-open when material new evidence appears.

Candidate re-open examples:

- customer contacts again after a suppressed follow-up risk,
- pending parts ETA passes without next action,
- new appointment is cancelled after customer follow-up was resolved,
- report remains in progress after the expected action window,
- survey low rating receives new complaint text,
- billing proof remains missing after finance marked follow-up in progress.

Candidate escalation examples:

- P2 risk becomes P1 after threshold breach,
- P1 risk becomes P0 after complaint or severe delay,
- repeated re-alerts move risk to supervisor queue,
- AI suggests higher severity but human review is required before official escalation.

Re-open and escalation must not mutate Case / Appointment / Report lifecycle by themselves.

## Appointment and Report Interaction Rules

Future dedupe must respect multi-visit behavior:

1. Appointment-specific risks should reference the correct appointment.
2. Case-level risk may summarize several appointment-level risks.
3. Cancelled / no-show / pending-parts visits may generate follow-up risk but should not create multiple formal reports.
4. Appointment `visit_result = completed` remains the final-appointment eligibility signal for report completion.
5. `appointment_status = completed` without completed `visit_result` must not be treated as completed service.
6. Dedupe must not collapse different appointments into one source record when separate visit history matters.
7. Suppression must not hide final appointment marker issues.
8. Risk policy must not infer or override `finalAppointmentId`.

## Case Completion and Closure Interaction Rules

Completion should be treated as a lifecycle boundary:

- completed report repeat completion remains rejected,
- completed Case / Report should not generate stale in-progress risk,
- unresolved risk may remain historically visible after completion,
- future post-completion quality / survey risk belongs to a separate policy group,
- suppressing a risk does not complete a Case,
- resolving a risk does not complete a Case,
- reopening a risk does not reopen a completed report.

If a Case is completed while an operations risk is active, future runtime must define whether the risk is auto-resolved, converted to historical, or requires manual review. Task177 does not implement this behavior.

## Auditability and Evidence Expectations

Future runtime should record safe audit evidence for:

- risk first detected,
- dedupe match / update,
- alert shown,
- acknowledgment,
- suppression,
- cooldown applied,
- re-alert,
- re-open,
- escalation,
- resolution.

Audit evidence should include:

- internal identifiers,
- safe reason code,
- policy key / version,
- source object type,
- source object id,
- actor summary for human action,
- timestamp.

Audit evidence must not include:

- customer mobile / phone / tel values,
- raw LINE user id,
- provider credentials,
- provider secrets,
- raw provider payload,
- full customer payload,
- full report payload,
- database credentials.

## AI Advisory Boundaries

AI may:

- suggest likely duplicate signals,
- suggest grouping labels,
- summarize why a risk appears repeated,
- suggest that a risk may be safely acknowledged,
- suggest missing evidence before suppression,
- recommend human review priority.

AI must not:

- suppress a risk,
- resolve a risk,
- reopen a risk,
- escalate a risk officially,
- assign owner,
- contact customer,
- send provider notification,
- mutate Case / Appointment / Report status,
- choose or alter `finalAppointmentId`,
- decide billing / settlement,
- bypass role permissions.

AI suggestions should remain reviewable advisory metadata if future runtime is approved.

## Channel-Agnostic Notification Readiness Notes

Task177 does not approve sending.

Future dedupe should apply before notification delivery to avoid duplicate reminders, but:

- notification channel selection belongs to future channel / delivery layer,
- no raw LINE user id belongs in dedupe / suppression payload,
- no customer contact values should be used as dedupe keys,
- provider delivery cooldown must be separately designed,
- opt-out / suppression policy must be approved before customer-facing sending,
- shared runtime outbound behavior remains unapproved.

## Admin / Dashboard Future Considerations

Future Admin surfaces may show:

- active risk count by Case,
- grouped risk cluster,
- latest alert time,
- acknowledged by / at,
- suppressed until,
- cooldown until,
- re-alert count,
- source appointment / report reference,
- safe reason summary,
- severity and owner role.

Admin UI must:

- make acknowledged / suppressed / resolved distinct,
- avoid implying suppression equals completion,
- avoid exposing raw provider or customer payloads,
- avoid exposing raw LINE user ids,
- respect organization and role scope,
- avoid manual `finalAppointmentId` selection,
- avoid automatic customer contact.

## Data Model Alignment with Task174

Task174 proposed future `case_risk_flags` and `operations_tasks`.

Task177 policy mapping:

| Policy concept | Future data-model candidate | Notes |
| --- | --- | --- |
| Dedupe key | future computed key or unique policy | No migration in Task177 |
| Active risk | `case_risk_flags.risk_state` | Candidate only |
| Suppression | `suppressed_until`, reason metadata | Requires permission design |
| Acknowledgment | `acknowledged_by`, `acknowledged_at` | Human action |
| Resolution | `resolved_by`, `resolved_at` | Does not complete Case |
| Operations follow-up | `operations_tasks` | Human workflow only |
| AI suggestion | safe metadata / feedback log | Advisory only |

Future runtime should decide whether dedupe is enforced by DB uniqueness, service-layer guard, scheduler policy, or a combination. Task177 does not choose a migration-ready strategy.

## Threshold and Clock Alignment with Task175 / Task176

Dedupe and suppression depend on threshold and clock interpretation:

- Task175 defines placeholder severity / threshold bands.
- Task176 defines clock source, timezone, business hours, and pause / resume semantics.
- Task177 defines whether repeated signals become one alert, a re-alert, or a suppressed item.

Future runtime must not evaluate dedupe without knowing:

- risk category,
- source object,
- active / resolved / suppressed state,
- clock mode,
- threshold policy,
- severity,
- cooldown policy,
- human action history.

## Runtime Implementation Guardrails

Before implementation:

1. Define dedupe key policy per risk type.
2. Define active vs historical risk retention.
3. Define suppression permission rules.
4. Define cooldown windows and re-alert rules.
5. Define P0 / complaint suppression restrictions.
6. Define safe metadata allow-list.
7. Define audit event vocabulary.
8. Define dashboard grouping behavior.
9. Define AI suggestion review status.
10. Add no-send tests before notification runtime.
11. Keep provider sending disabled until explicitly approved.
12. Keep Migration 020 paused unless separately approved.
13. Do not modify inventory docs unless a real inventory policy / behavior change occurs.

Future runtime must not weaken:

- one Case = one formal Field Service Report,
- multiple appointments / visits per Case,
- one open appointment invariant,
- backend/system `finalAppointmentId`,
- completed report stability,
- no manual final appointment picker,
- AI advisory-only boundary.

## Future Task Candidates

Recommended next safe docs-only tasks:

1. Task178 - SLA / Operations Risk Dashboard Role Queue Design / No Runtime Change.
2. Operations Task Human Review Workflow Design / No Runtime Change.
3. SLA / Operations Risk Audit Event Vocabulary / No Runtime Change.
4. SLA Runtime Readiness Gate / No Migration.
5. Notification Readiness Relation to SLA Risk / No Runtime Change.

Task178 is recommended because policy, clocks, and dedupe now need a role-specific dashboard interpretation before runtime work.

## Verification Checklist

Task177 should be verified with:

- `npm run check`,
- `npm run admin:check`,
- `git diff --check`,
- sensitive-info scan of this document.

Expected result:

- documentation-only,
- no backend runtime change,
- no Admin frontend change,
- no API change,
- no smoke/browser smoke change,
- no migration / schema / index change,
- no Migration 020 apply or dry-run,
- no DB / psql / `npm run db:migrate`,
- no provider sending,
- no survey runtime,
- no AI automatic decision,
- no sensitive output,
- inventory docs remain frozen.

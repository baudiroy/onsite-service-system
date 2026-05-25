# Task 175 - SLA / Operations Risk Policy and Threshold Matrix / No Runtime Change

## Purpose and Non-Goals

Task175 defines a proposal-only SLA / operations risk policy and threshold matrix for future operations planning. It translates the Task173 escalation design and Task174 data-model proposal into human-readable policy bands, severity levels, and review expectations.

This document is not executable configuration and does not define final production commitments. All durations and bands are placeholder defaults pending product, operations, vendor, brand, and organization approval.

Task175 does not:

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

Task175 assumes the current core architecture remains unchanged:

- one Case has one formal Field Service Report,
- one Case may have multiple appointments / visits,
- one Case should have at most one open appointment at the same time,
- appointment / visit history records multi-dispatch and revisit outcomes,
- the formal report remains Case-level,
- `finalAppointmentId` is backend / system determined and stable after completion,
- completed report repeat completion is rejected before side effects,
- Admin completion does not send `finalAppointmentId` by default,
- no Admin manual final appointment picker exists,
- LINE is a current channel candidate but core Case / Report / risk policy must remain channel-agnostic,
- AI is advisory only and does not mutate official business state.

SLA and operations risk states are not replacements for:

- Case status,
- Appointment status,
- appointment `visit_result`,
- Field Service Report status,
- report completion transition,
- `finalAppointmentId`,
- billing / settlement decisions,
- notification delivery state,
- survey runtime state.

## Policy Principles

Future SLA / operations risk policy should follow these principles:

1. Risk policy highlights work that needs human attention; it does not mutate official workflow state by itself.
2. Thresholds should be configurable by organization and may later vary by case type, brand, vendor, warranty status, customer priority, geography, or service agreement.
3. A risk flag is an attention signal, not proof of fault or a customer-facing promise by itself.
4. Escalation severity should determine visibility and human review urgency, not automatic completion, cancellation, dispatch, billing, or customer contact.
5. AI may suggest risk reasons or missing information, but humans must confirm operational action.
6. Customer-facing messages require future channel / notification approval and must not be implied by this policy.
7. Policy examples must not include customer contact values, raw LINE identifiers, provider payloads, credentials, or production data.
8. Future runtime must support auditability, dedupe, suppression, and safe handoff before enabling persisted risk flags or operations tasks.

## SLA Clock Definitions

SLA clocks are future policy concepts. Task175 does not implement clocks or create executable config.

| Clock | Starts when | Stops when | Notes |
| --- | --- | --- | --- |
| `response_clock` | Case is created or customer inquiry is received | Customer has been contacted or inquiry is resolved | Future policy may use business hours |
| `dispatch_clock` | Case is ready for scheduling or dispatch | Appointment is created / assigned according to policy | Should not force dispatch automatically |
| `appointment_confirmation_clock` | Appointment is proposed / scheduled | Customer confirms or staff marks confirmation outcome | Channel-agnostic |
| `appointment_start_clock` | Scheduled start time arrives | Visit starts or staff records exception | Should account for route reality later |
| `on_site_update_clock` | Appointment enters in-progress / on-site state | Visit result or update is recorded | Prevents stale on-site work |
| `pending_parts_clock` | Visit result becomes `pending_parts` | Parts ETA / reservation / next action / next appointment is recorded | Future parts workflow dependent |
| `quote_clock` | Quote is required or draft is created | Customer approves / rejects / quote expires | Future quote workflow dependent |
| `report_completion_clock` | Eligible visit is completed or report enters in-progress state | Field Service Report is completed or blocked reason is recorded | Does not infer final appointment by itself |
| `customer_follow_up_clock` | Follow-up required reason appears | Staff completes or suppresses follow-up | Future operations task dependent |
| `complaint_callback_clock` | Complaint risk / callback required is recorded | Supervisor / staff callback outcome is recorded | Future quality workflow dependent |
| `survey_feedback_clock` | Survey response indicates low rating / complaint | Staff completes review | Future survey runtime only |
| `billing_settlement_clock` | Case/report becomes billing-ready | Billing / settlement review completes | Future billing branch only |

Recommended future design:

- use stable source timestamps from Case / Appointment / Field Service Report / future quote / future survey rows,
- define business-hours behavior before production thresholds,
- avoid deriving customer-visible promises from raw internal clocks without explicit product approval,
- keep clock calculation deterministic and explainable for operators.

## Operations Risk Categories

Candidate risk categories from Tasks173/174:

| Risk category | Primary layer | Typical owner | Meaning |
| --- | --- | --- | --- |
| `case_not_dispatched` | Case | Dispatch / customer service | Case is ready but no appointment exists |
| `appointment_unassigned` | Appointment | Dispatch | Appointment exists but lacks assigned engineer / dispatch confirmation |
| `appointment_unconfirmed` | Appointment / customer communication | Customer service | Appointment requires customer confirmation |
| `appointment_not_started` | Appointment | Dispatch / engineer lead | Scheduled visit has not started after expected time |
| `appointment_stale_on_site` | Appointment | Engineer lead / supervisor | Visit is in-progress too long without result or update |
| `pending_parts_no_next_visit` | Appointment / parts | Dispatch / parts coordinator | Parts-pending visit lacks ETA or next appointment |
| `pending_quote_no_customer_decision` | Quote / customer communication | Customer service / supervisor | Quote requires customer decision |
| `customer_follow_up_required` | Customer communication | Customer service | Staff follow-up is needed |
| `case_no_open_appointment` | Case / appointment | Dispatch | Case is active but has no open appointment |
| `report_in_progress_too_long` | Field Service Report | Engineer lead / supervisor | Report remains unfinished too long |
| `completion_blocked_no_completed_visit` | Field Service Report / appointment | Supervisor | Completion cannot resolve eligible completed visit |
| `customer_inquiry_stale` | Customer communication | Customer service | Inquiry is waiting too long |
| `repeated_reschedules` | Appointment history | Dispatch / supervisor | Multiple reschedules indicate coordination risk |
| `multiple_incomplete_visits` | Appointment history | Supervisor | Repeated incomplete visits indicate service risk |
| `complaint_risk` | Quality / customer feedback | Supervisor | Complaint or callback risk needs review |
| `survey_low_rating` | Future survey | Supervisor / quality | Low rating needs follow-up |
| `billing_settlement_stale` | Billing / settlement | Finance | Billing / settlement review is stale |

## Severity Levels

Severity levels are proposed operational priorities, not automatic workflow actions.

| Severity | Meaning | Expected human response | Automatic mutation allowed? |
| --- | --- | --- | --- |
| P0 Critical | Customer impact, compliance risk, severe complaint, or major operational block | Immediate supervisor review | No |
| P1 High | Likely customer dissatisfaction or blocked completion if not handled soon | Same-day owner action and supervisor visibility | No |
| P2 Medium | Work is aging or trending risky | Owner queue review | No |
| P3 Low | Early warning / watch item | Monitor or batch review | No |
| Info | Context-only signal | No action unless combined with other risks | No |

Recommended interpretation:

- P0 / P1 should appear prominently in future supervisor dashboard.
- P2 should appear in role queues and aging reports.
- P3 / Info should avoid noisy escalation unless repeated or combined.
- Severity does not grant permission to send customer messages or mutate case state.

## Threshold Matrix

The following matrix uses placeholder values only. It should not be treated as production SLA, executable config, or final business policy.

| Risk category | Watching / P3 placeholder | At-risk / P2 placeholder | Overdue / P1 placeholder | Critical / P0 placeholder | Notes |
| --- | --- | --- | --- | --- | --- |
| `case_not_dispatched` | 2 business hours after ready | 4 business hours | Same business day | VIP / complaint case same day breach | May vary by brand / warranty |
| `appointment_unassigned` | 4 hours before scheduled start | 2 hours before scheduled start | At scheduled start | High-priority case at scheduled start | Does not auto-assign engineer |
| `appointment_unconfirmed` | 1 business day before visit | Same day and still unconfirmed | Scheduled day unconfirmed | Customer complaint / VIP unconfirmed | Channel-agnostic |
| `appointment_not_started` | Scheduled start + 15 minutes | Scheduled start + 30 minutes | Scheduled start + 60 minutes | Customer waiting / complaint raised | Needs route-aware future design |
| `appointment_stale_on_site` | 2 hours in-progress | 4 hours in-progress | 8 hours in-progress | Overnight stale without update | Should consider service type |
| `pending_parts_no_next_visit` | 1 business day after pending parts | 3 business days | 5 business days | Customer complaint or warranty breach | Future parts ETA should refine |
| `pending_quote_no_customer_decision` | 1 business day after quote pending | 3 business days | 5 business days | High amount / complaint | Future quote flow only |
| `customer_follow_up_required` | Same business day | Next business day | 2 business days | Complaint or repeated contact | Does not send automatically |
| `case_no_open_appointment` | 1 business day active without open visit | 2 business days | 3 business days | Repeated customer inquiry | Must not create appointment automatically |
| `report_in_progress_too_long` | 24 hours | 48 hours | 72 hours | Customer waiting for closure | Report completion contract still applies |
| `completion_blocked_no_completed_visit` | Immediate P2 after failed completion | Immediate P1 if customer-visible | P1 until reviewed | P0 if repeated / complaint | No eligible final appointment must stay blocked |
| `customer_inquiry_stale` | 2 business hours | 4 business hours | Same business day | Complaint / repeated inquiry | Future channel queue dependent |
| `repeated_reschedules` | 2 reschedules | 3 reschedules | 4+ reschedules | Complaint / VIP impact | Counts require policy window |
| `multiple_incomplete_visits` | 2 incomplete visits | 3 incomplete visits | 4+ incomplete visits | Safety / complaint risk | Does not create extra formal report |
| `complaint_risk` | Any complaint signal | Callback required | Same-day callback missed | Severe complaint / escalation | Supervisor review |
| `survey_low_rating` | Rating below target | Low rating with comment | Complaint flag or callback required | Severe complaint text | Future survey runtime only |
| `billing_settlement_stale` | 3 business days | 5 business days | 7 business days | High amount / close deadline | Future billing branch only |

Implementation guardrail:

- Future runtime should store policy identifiers or rule versions, not just raw minutes, when persisted risk flags depend on policy.
- Thresholds must be tenant / organization scoped if configurable.
- Business-hours interpretation must be defined before production rollout.

## Escalation Policy Matrix

| Severity | Dashboard visibility | Suggested owner | Human review expectation | Notification readiness | AI advisory boundary |
| --- | --- | --- | --- | --- | --- |
| P0 Critical | Supervisor / manager top queue | Supervisor | Immediate explicit review | Future internal alert only after approval | AI may summarize reason; no action |
| P1 High | Supervisor and role queue | Assigned role + supervisor | Same-day review | Future reminder / internal notification only after approval | AI may suggest missing context |
| P2 Medium | Role queue | Assigned role | Review within next work queue cycle | No customer notification implied | AI may rank or cluster |
| P3 Low | Aging / watch list | Assigned role | Monitor or batch review | No notification implied | AI may provide watch reason |
| Info | Context panel / report | None by default | No required action | No notification | AI may provide explanation only |

Escalation must not:

- automatically close or complete a Case,
- automatically create or cancel appointments,
- automatically complete a Field Service Report,
- automatically resolve `finalAppointmentId`,
- automatically send LINE / APP / SMS / email,
- automatically create survey intent or send survey,
- automatically approve quotes, billing, settlement, refunds, or fees.

## Human Review Requirements

Future runtime should require explicit human action for:

- acknowledging a P0 / P1 risk,
- resolving an overdue risk,
- suppressing a recurring risk,
- approving exception handling,
- deciding customer contact,
- deciding appointment reschedule,
- deciding quote / billing action,
- deciding complaint resolution.

Recommended audit fields for future runtime were proposed in Task174 and may include:

- who acknowledged,
- when acknowledged,
- who resolved,
- when resolved,
- reason code,
- safe note,
- source object reference.

Human review notes should avoid raw provider payloads, raw channel identifiers, credentials, and unmasked customer contact values.

## AI Advisory Boundaries

AI may:

- suggest risk severity,
- summarize stale work reasons,
- identify missing fields,
- detect repeated incomplete visits,
- summarize customer complaint themes,
- explain why a case appears risky,
- draft internal review notes,
- suggest follow-up options for human confirmation.

AI must not:

- mutate Case / Appointment / Report status,
- complete / close / reopen a Case,
- assign or reschedule an appointment,
- choose or change `finalAppointmentId`,
- send customer messages,
- select delivery channel,
- decide quote approval,
- decide billing / settlement amount,
- approve or resolve escalation,
- suppress a risk without human confirmation,
- bypass role permission or organization scope.

AI risk hints should be stored, if future runtime is approved, as advisory metadata with explicit source and review status. They should never become official completion, billing, dispatch, or notification decisions by themselves.

## Channel-Agnostic Notification Readiness Notes

Task175 does not approve notification delivery.

Future notification readiness should observe these boundaries:

- risk detection does not decide delivery channel,
- delivery resolver should choose future LINE / APP / SMS / email / manual follow-up based on approved channel binding and policy,
- risk payloads should reference internal Case / risk identifiers, not raw LINE user ids,
- no customer contact values should appear in handoff or logs unless masked and policy-approved,
- existing case reverse LINE binding may improve deliverability later, but risk policy must not require a Case to originate from LINE,
- notification suppression, opt-out, channel eligibility, and provider credential safety must be designed before any sending.

## Admin / Dashboard Future Considerations

Future Admin surfaces may include:

- SLA badge on Case list,
- operations risk tab on Case detail,
- role-specific queues,
- supervisor escalation queue,
- pending parts follow-up queue,
- pending quote queue,
- customer follow-up queue,
- report completion blocked queue,
- safe risk reason summaries,
- policy / threshold display for operators,
- aging reports.

Admin UI must:

- respect organization scope and role permissions,
- show safe summaries instead of raw payloads,
- avoid exposing raw LINE user ids,
- avoid exposing provider credentials,
- avoid exposing customer contact values in handoff views,
- make clear that risk flags are attention signals,
- avoid adding manual `finalAppointmentId` selection,
- avoid implying a Case can have multiple formal reports.

## Data Model Alignment with Task174

Task174 proposed a hybrid target model:

- compute simple risk candidates for dashboards,
- persist actionable risk flags when acknowledgement, resolution, suppression, assignment, or audit is needed,
- optionally create operations tasks for human follow-up.

Task175 maps policy concepts to that proposal:

| Policy concept | Task174 alignment | Notes |
| --- | --- | --- |
| SLA clock / threshold | future `sla_policies` | Proposal only; no migration |
| Risk category | future `case_risk_flags.risk_type` | Candidate values only |
| Risk state | future `case_risk_flags.risk_state` | Does not replace domain status |
| Severity | future `case_risk_flags.severity` or computed view | Proposed P0-P3 / Info |
| Owner role | future `operations_tasks.assigned_role` | Human workflow only |
| Acknowledge / resolve | future risk flag fields | Must be audited |
| Suppression | future `suppressed_until` or policy | Requires permission design |
| Policy version | future `policy_id` / rule metadata | Needed for auditability |

No table, column, index, migration, repository, service, API endpoint, or Admin UI is created in Task175.

## Runtime Implementation Guardrails

Before any future runtime implementation:

1. Approve whether risk flags are computed-only, persisted, or hybrid.
2. Define business-hours and holiday calendars.
3. Define organization / brand / vendor / warranty policy scoping.
4. Define dedupe and idempotency keys for risk flags.
5. Define suppression / acknowledgement / resolution permissions.
6. Define safe metadata allow-list.
7. Define dashboard role visibility.
8. Define notification eligibility separately from risk detection.
9. Define AI advisory review status.
10. Add no-send tests before any provider integration.
11. Keep Migration 020 paused unless separately approved.
12. Do not modify inventory docs unless a real inventory behavior / policy change occurs.

Future runtime must not weaken:

- one Case = one formal Field Service Report,
- multiple appointments / visits per Case,
- one open appointment invariant,
- backend/system `finalAppointmentId`,
- completed report repeat-completion hardening,
- no manual final appointment picker,
- no AI automatic decision boundary.

## Future Task Candidates

Recommended next safe docs-only tasks:

1. Task176 - SLA / Operations Risk Clock Source and Business Hours Policy / No Runtime Change.
2. SLA / Operations Risk Dashboard Role Queue Design / No Runtime Change.
3. SLA / Operations Risk Dedupe and Suppression Policy / No Runtime Change.
4. Operations Task Human Review Workflow Design / No Runtime Change.
5. SLA Runtime Readiness Gate / No Migration.

Task176 is recommended before runtime work because threshold interpretation depends on clock sources, business hours, holidays, and timezone rules.

## Verification Checklist

Task175 should be verified with:

- `npm run check`,
- `npm run admin:check`,
- `git diff --check`,
- sensitive-info scan of this document.

Expected result:

- documentation-only,
- no backend runtime change,
- no Admin frontend change,
- no API change,
- no smoke test change,
- no migration / schema / index change,
- no Migration 020 apply or dry-run,
- no DB / psql / `npm run db:migrate`,
- no provider sending,
- no survey runtime,
- no AI automatic decision,
- no sensitive output,
- inventory docs remain frozen.

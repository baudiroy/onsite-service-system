# Task 176 - SLA / Operations Risk Clock Source and Business Hours Policy / No Runtime Change

## Purpose and Non-Goals

Task176 defines a proposal-only policy for future SLA / operations risk clock sources, timezone interpretation, business-hours handling, pause / resume / stop semantics, and implementation guardrails.

This document builds on:

- `docs/task-173-sla-operations-risk-escalation-design-no-runtime-change.md`
- `docs/task-174-sla-operations-risk-data-model-proposal-no-migration.md`
- `docs/task-175-sla-operations-risk-policy-and-threshold-matrix-no-runtime-change.md`

Task176 is not executable configuration and does not define final production SLA commitments. All examples are placeholders pending product, operations, legal, vendor, brand, and organization approval.

Task176 does not:

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

Task176 assumes the current system invariants remain unchanged:

- one Case has one formal Field Service Report,
- one Case may have multiple appointments / visits,
- one Case should have at most one open appointment at the same time,
- appointments / visits preserve dispatch and service history,
- `finalAppointmentId` is backend / system determined and stable after completion,
- Admin completion does not send `finalAppointmentId` by default,
- Admin has no manual final appointment picker,
- SLA / risk state does not replace Case / Appointment / Report status,
- LINE is a current channel candidate but core Case / Report / SLA / survey policy must remain channel-agnostic,
- AI is advisory only and must not decide authoritative SLA state or operational action.

SLA clocks should be read as operational policy signals. They must not directly complete, close, cancel, reopen, assign, reschedule, bill, settle, or contact customers.

## Authoritative Clock Source Policy

Future SLA evaluation should use deterministic source timestamps from the core domain or approved future tables. It should not depend on UI-rendered time, client browser time, AI-generated time, or provider message timestamps unless a future policy explicitly maps those events into internal records.

Recommended source priority:

| Clock source | Recommended use | Authority notes |
| --- | --- | --- |
| Server-created timestamps | Case created, appointment created, report created, audit entries | Preferred for internal lifecycle clocks |
| Domain event timestamps | Appointment scheduled, visit started, visit finished, report completed | Preferred if written by backend services |
| Staff-entered operational timestamps | Actual arrival / finish / callback completed | Valid only when captured through approved workflow |
| Future quote / parts / survey timestamps | Quote pending, parts ETA, survey response | Valid only after corresponding runtime exists |
| Provider / channel timestamps | LINE / APP / SMS / email events | Not authoritative unless normalized into internal records |
| AI-generated timestamps | None | AI may suggest stale work but cannot define clock authority |

Policy rule:

- Future runtime should compute SLA from internal normalized fields.
- If a provider event matters, it should first become an internal event with safe metadata and organization scope.
- If there are conflicting timestamps, the system should use the policy-defined internal source and expose the ambiguity for human review rather than letting AI choose.

## Timezone Policy

Future SLA clocks should be timezone-aware.

Recommended policy:

1. Store authoritative timestamps in UTC.
2. Display local time according to organization / service-region policy.
3. Evaluate business hours using the organization or service-region timezone, not the browser timezone.
4. Avoid using customer device timezone as SLA authority.
5. Avoid using provider webhook timezone as SLA authority unless normalized.
6. Persist policy timezone or policy version when persisted risk flags depend on timezone rules.

Open policy question:

- Should organizations be allowed to define multiple service-region timezones, or should one organization-level timezone be enough for the current Taiwan-oriented workflow?

Task176 does not implement timezone handling.

## Business Hours vs Calendar Hours

Future SLA policy should explicitly define whether each clock uses calendar time or business time.

| Clock type | Default proposal | Reason |
| --- | --- | --- |
| Customer inquiry response | Business hours | Staff availability usually matters |
| Case not dispatched | Business hours | Dispatch team schedule matters |
| Appointment confirmation | Business hours until visit day, then calendar | Near-visit risk may be urgent |
| Appointment not started | Calendar relative to scheduled time | Visit window is time-specific |
| On-site stale update | Calendar while visit is in progress | Field activity is active |
| Pending parts follow-up | Business days | Parts and warehouse workflows often use working days |
| Pending quote decision | Business days | Customer / staff review cycle |
| Report completion | Business hours or calendar depending service type | Needs product policy |
| Complaint callback | Business hours, with possible P0 override | Customer impact policy |
| Survey low rating follow-up | Business hours | Quality queue policy |
| Billing / settlement stale | Business days | Finance workflow |

Proposal-only examples:

- A pending parts clock may count only business days.
- An appointment not-started clock may count calendar minutes after scheduled start.
- A complaint P0 may ignore business hours and require immediate human review.

These examples are not production commitments.

## Holiday and Non-Working Day Policy

Future business-hours clocks need holiday and non-working-day rules.

Recommended policy decisions before runtime:

1. Define organization calendar.
2. Define service-region calendar if different from organization calendar.
3. Define weekend behavior.
4. Define public holiday behavior.
5. Define emergency / P0 override behavior.
6. Define vendor / brand-specific exceptions if needed.
7. Define how policy changes affect existing unresolved risk flags.

Recommended default proposal:

- business-hours clocks pause outside approved working windows,
- calendar clocks continue outside working windows,
- P0 / severe complaint clocks may continue regardless of working hours,
- future persisted risk flags should record which policy calendar was used.

Task176 does not create a calendar table or schema.

## SLA Clock Start Events

Start events should be deterministic and tied to internal state changes.

| Clock | Candidate start event | Notes |
| --- | --- | --- |
| `response_clock` | Case created or customer inquiry recorded | Requires channel inquiry normalization |
| `dispatch_clock` | Case marked ready for scheduling | Should not start from incomplete draft intake |
| `appointment_confirmation_clock` | Appointment proposed / scheduled | Requires future confirmation semantics |
| `appointment_start_clock` | Appointment scheduled start time | Schedule source must be internal |
| `on_site_update_clock` | Appointment enters in-progress / on-site state | Status naming must be frozen before runtime |
| `pending_parts_clock` | Visit result becomes `pending_parts` | Uses appointment `visit_result` layer |
| `quote_clock` | Quote required / quote draft created | Future quote runtime only |
| `report_completion_clock` | Eligible service visit completed or report enters in-progress | Needs final report policy |
| `customer_follow_up_clock` | Follow-up required reason is recorded | Future operations task may own |
| `complaint_callback_clock` | Complaint / callback risk recorded | Future quality workflow |
| `survey_feedback_clock` | Survey response marks low rating / complaint | Future survey runtime only |
| `billing_settlement_clock` | Case/report becomes billing-ready | Future billing branch |

Start events must not be inferred from AI text alone.

## SLA Clock Pause / Resume Events

Pause / resume policy must be explicit to avoid invisible SLA manipulation.

Candidate pause reasons:

- waiting for customer availability,
- customer requested reschedule,
- waiting for parts ETA,
- waiting for quote approval,
- waiting for warranty / vendor decision,
- appointment cancelled with documented customer follow-up,
- holiday / non-working day for business-hours clocks,
- approved supervisor hold.

Candidate resume events:

- customer provides available time,
- parts ETA confirmed,
- parts arrived / reserved,
- quote approved / rejected,
- vendor decision received,
- new appointment scheduled,
- supervisor removes hold.

Guardrails:

- Pausing an SLA clock should be an auditable human or deterministic system event.
- AI may suggest a pause reason but must not pause the clock.
- Pausing should not mutate Case / Appointment / Report status by itself.
- Pausing should not hide a Case from dashboards without explicit visibility policy.
- Future runtime should distinguish paused, suppressed, acknowledged, and resolved.

## SLA Clock Stop Events

Clock stop events should represent the end of the specific operational obligation, not necessarily the end of the Case.

Examples:

| Clock | Candidate stop event |
| --- | --- |
| `response_clock` | Customer contacted or inquiry resolved |
| `dispatch_clock` | Appointment created / assigned according to policy |
| `appointment_confirmation_clock` | Customer confirmation outcome recorded |
| `appointment_start_clock` | Visit started or exception recorded |
| `on_site_update_clock` | Visit result / update recorded |
| `pending_parts_clock` | Next appointment scheduled or parts action recorded |
| `quote_clock` | Quote approved / rejected / expired / cancelled |
| `report_completion_clock` | Field Service Report completed or blocked reason recorded |
| `customer_follow_up_clock` | Follow-up completed or supervisor-approved suppression |
| `complaint_callback_clock` | Callback outcome recorded |
| `survey_feedback_clock` | Feedback reviewed / callback resolved |
| `billing_settlement_clock` | Billing / settlement review completed |

Stopping a clock should not imply Case completion unless the Case completion workflow actually completes the formal Field Service Report.

## Appointment Interaction Rules

Appointment clocks must respect the multi-visit design:

1. A Case may have multiple appointments / visits.
2. Visit-specific clocks should attach to the relevant appointment.
3. Case-level risk may aggregate appointment history.
4. Cancelled, no-show, pending-parts, and needs-follow-up visits may start different follow-up clocks.
5. A completed visit can satisfy final service context only through the backend completion contract.
6. `appointment_status = completed` alone should not be treated as final service completion if `visit_result` is not completed.
7. SLA risk must not create a second formal Field Service Report.
8. SLA risk must not choose or override `finalAppointmentId`.
9. SLA risk must not create multiple open appointments.

Future runtime should avoid relying on natural DB order when aggregating appointment history. If "latest" appointment matters, ordering must be deterministic and documented.

## Case / Report Completion Interaction Rules

SLA clocks should observe Field Service Report completion but not own it.

Rules:

- report completion remains backend controlled,
- `finalAppointmentId` is resolved by backend/system before completion,
- completed report repeat completion is rejected before side effects,
- `finalAppointmentId` remains stable after completion,
- no SLA clock can reopen a completed report,
- no SLA clock can mark a report completed,
- no SLA clock can trigger survey runtime by itself,
- no SLA clock can treat a rejected completion as completed,
- future survey / feedback clocks depend on separate survey runtime approval.

If future runtime persists a report completion risk, it should reference the report and Case but must not mutate them.

## Escalation Timing Interpretation

Task175 proposed P0/P1/P2/P3/Info severity bands. Task176 clarifies that timing interpretation depends on:

- clock source,
- timezone,
- business-hours vs calendar-hours mode,
- pause / resume events,
- holiday / non-working-day policy,
- severity override policy,
- organization / brand / vendor / warranty policy scope.

Example interpretation:

- "3 business days pending parts" is not the same as "72 calendar hours pending parts."
- "appointment start + 60 minutes" is calendar-time relative to a scheduled visit window.
- "same business day response" depends on organization working hours and cutoff policy.

These examples are policy discussion aids only.

## Auditability and Evidence Expectations

Future runtime should be able to explain:

- which clock was evaluated,
- which source timestamp started the clock,
- whether the clock used business or calendar time,
- which timezone was used,
- which policy version was used,
- whether pauses / resumes occurred,
- who recorded pause / resume / override,
- why severity was assigned,
- whether AI contributed a suggestion,
- who acknowledged or resolved the risk.

Audit notes and metadata must not include:

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

- suggest that a Case appears stale,
- explain possible risk reasons,
- summarize appointment history,
- suggest missing clock evidence,
- suggest a likely pause reason for human review,
- flag inconsistent timestamps,
- draft internal notes.

AI must not:

- determine authoritative clock source,
- decide official SLA status,
- pause or resume a clock,
- mark a risk acknowledged / resolved / suppressed,
- mutate Case / Appointment / Report status,
- assign engineer,
- create appointment,
- choose or override `finalAppointmentId`,
- send provider notifications,
- send surveys,
- decide billing / settlement,
- bypass permissions or organization scope.

Future AI output should be reviewable, explainable, and safely redacted.

## Channel-Agnostic Notification Readiness Notes

Task176 does not approve notification delivery.

Clock breaches may later feed notification readiness, but:

- risk detection should not choose LINE / APP / SMS / email,
- delivery channel resolution belongs to future channel abstraction / notification layer,
- no raw LINE user id should be included in clock or risk payload,
- customer contact values should not be pasted in handoff,
- existing case reverse LINE binding may improve future deliverability but is not required for SLA evaluation,
- no provider sending occurs without future runtime approval,
- notification suppression / opt-out / eligibility must be designed separately.

## Admin / Dashboard Future Considerations

Future Admin views may show:

- clock type,
- due time,
- elapsed business time,
- elapsed calendar time,
- timezone used,
- pause / resume status,
- risk severity,
- owner role,
- safe reason summary,
- last human action,
- policy version label.

Admin UI should not:

- expose raw channel identifiers,
- expose provider payloads,
- expose credentials,
- expose customer contact values in handoff,
- imply AI made an authoritative decision,
- let operators manually choose `finalAppointmentId`,
- imply a Case has multiple formal reports.

## Data Model Alignment with Task174

Task174 proposed future `sla_policies`, `case_risk_flags`, and `operations_tasks` as proposal-only structures.

Task176 adds policy interpretation expectations:

| Future field / concept | Clock policy use |
| --- | --- |
| `sla_policies.policy_key` | Identifies clock / threshold family |
| `sla_policies.threshold_minutes` | Calendar-time threshold if approved |
| `sla_policies.threshold_business_minutes` | Business-time threshold if approved |
| `sla_policies.warning_minutes_before_due` | Warning band support |
| `case_risk_flags.detected_at` | When risk was detected |
| `case_risk_flags.due_at` | Future computed due time |
| `case_risk_flags.breached_at` | When risk crossed overdue threshold |
| `case_risk_flags.metadata` | Safe allow-list only, possibly includes policy version summary |
| `operations_tasks.due_at` | Human task due time, not customer SLA by itself |

No migration is created in Task176.

## Threshold Alignment with Task175

Task175 threshold examples should not be used without Task176 clock interpretation.

Before future runtime:

- every threshold must specify calendar vs business time,
- every business-time threshold must specify timezone and working calendar,
- every pauseable clock must specify allowed pause reasons,
- every persisted risk should store enough safe evidence to explain the calculation,
- production thresholds must be PM/business-approved,
- organization-specific policies must not leak across tenants.

Task175 and Task176 together are still design notes, not runnable policy config.

## Runtime Implementation Guardrails

Before implementation:

1. Approve clock source inventory.
2. Freeze timezone policy.
3. Define business-hours calendar.
4. Define holiday / non-working-day handling.
5. Define pause / resume / stop events.
6. Define severity override rules.
7. Define dedupe and idempotency for persisted risks.
8. Define safe metadata allow-list.
9. Define role permissions for pause / acknowledge / resolve / suppress.
10. Add no-send tests before any notification runtime.
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

1. Task177 - SLA / Operations Risk Dedupe and Suppression Policy / No Runtime Change.
2. SLA / Operations Risk Dashboard Role Queue Design / No Runtime Change.
3. Operations Task Human Review Workflow Design / No Runtime Change.
4. SLA Runtime Readiness Gate / No Migration.
5. Notification Readiness Relation to SLA Risk / No Runtime Change.

Task177 is recommended because persisted risk flags and operations tasks will need dedupe, suppression, acknowledgement, and re-open semantics before any runtime design can safely proceed.

## Verification Checklist

Task176 should be verified with:

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

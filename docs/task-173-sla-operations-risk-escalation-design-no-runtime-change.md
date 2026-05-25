# Task 173 - SLA / Operations Risk Escalation Design / No Runtime Change

## Background

Task173 designs SLA / operations risk escalation as a product architecture task. It does not implement runtime behavior, connect to DB, apply migrations, modify Admin UI, send provider messages, or enable AI automation.

This task builds on the master handoff from Task172 and the future operations notes in `docs/multi-visit-field-service-design.md`. It defines a future product boundary for SLA, stale-work detection, escalation, dashboards, and AI advisory signals without changing any current Case / Appointment / Field Service Report behavior.

## No-runtime-change Statement

Task173 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
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
- send LINE / APP / SMS / email,
- implement notification delivery runtime,
- implement delivery resolver runtime,
- implement survey runtime,
- implement outbox worker,
- implement AI automatic decisions,
- change Case / Appointment / Report behavior,
- change `finalAppointmentId` logic,
- modify inventory docs,
- perform destructive cleanup,
- output sensitive values.

## Source Review Summary

Reviewed:

- `docs/task-172-system-architecture-master-handoff-index-next-product-branch-selection-no-runtime-change.md`
- `docs/task-171-channel-abstraction-final-pause-summary-no-runtime-change.md`
- `docs/task-157-first-transition-hardening-closure-product-mainline-return-recommendation.md`
- `docs/task-150-migration-020-survey-runtime-final-pause-summary-no-runtime-change.md`
- `docs/task-166-reverse-line-binding-final-pause-summary-no-runtime-change.md`
- `docs/multi-visit-field-service-design.md`
- `docs/future_ai_platform_design.md`
- `docs/future-existing-case-to-line-binding-memo.md`

Relevant existing future notes include:

- SLA / service timeliness / overdue reminders,
- pending parts tracking,
- quote approval,
- customer feedback / quality follow-up,
- exception review,
- role-specific dashboards,
- LINE self-service case inquiry,
- AI risk radar.

Task173 does not patch those source documents. It adds a focused SLA / operations risk design note.

## SLA / Operations Risk Purpose

Future SLA and operations risk controls should help staff notice stale, blocked, or risky work before customers complain or cases drift.

The goal is to provide:

- operational visibility,
- safe prioritization,
- human review cues,
- role-specific dashboard signals,
- future notification readiness,
- future AI advisory support,
- future auditability.

The goal is not to automatically close, complete, cancel, dispatch, bill, settle, or send customer messages.

## Case-level vs Appointment / Visit-level Signals

SLA and operations risk signals should be layered:

| Signal layer | Examples | Should mutate core status? | Notes |
| --- | --- | --- | --- |
| Case-level | case waiting too long, no open appointment, not completed, customer inquiry waiting | No | Case remains the primary customer/service context |
| Appointment / visit-level | not assigned, not started, on site too long, pending parts, no show, repeated reschedules | No | Visit history informs risk but does not create multiple formal reports |
| Field Service Report-level | report in progress too long, completion blocked, no eligible completed visit | No | Report completion still follows existing completion contract |
| Customer / communication-level | inquiry waiting, follow-up required, complaint risk | No | Contact method belongs to channel layer |
| Billing / settlement-level | pending billing, missing proof, high amount | No | Future billing branch only |
| Survey / feedback-level | low rating, callback required | No | Future survey branch only |

## SLA / Risk Signals To Consider

Future signal catalog:

1. Case created but not dispatched within threshold.
2. Appointment scheduled but engineer not assigned.
3. Appointment scheduled but not started after scheduled time.
4. Appointment `in_progress` / `on_site` too long without update.
5. Appointment `visit_result = pending_parts` with no next appointment scheduled.
6. Appointment cancelled / no_show requiring customer follow-up.
7. Case has no open appointment but is not completed.
8. Field Service Report `in_progress` too long.
9. Completion blocked due to no eligible completed visit.
10. Customer inquiry waiting too long without response.
11. Repeated reschedules.
12. Multiple incomplete visits.
13. High-risk complaint / callback request future signal.
14. Survey low rating future signal.
15. Billing / settlement pending too long future signal.

These signals should be evaluated from current domain state and future policy rules. They should not replace existing status fields.

## Candidate SLA / Risk States

Candidate future states:

- `normal`
- `watching`
- `at_risk`
- `overdue`
- `blocked`
- `needs_dispatch`
- `needs_customer_follow_up`
- `pending_parts_follow_up`
- `supervisor_review_required`
- `resolved`

These are future risk states only.

They do not replace:

- Case status,
- Appointment status,
- Appointment `visit_result`,
- Field Service Report status,
- completion transition,
- `finalAppointmentId`.

They must not automatically complete, close, cancel, reopen, assign, reschedule, bill, settle, or send messages.

## Escalation Boundaries

Escalation is an advisory / operational workflow.

Required boundaries:

1. Escalation should not automatically mutate Case status.
2. Escalation should not automatically mutate Appointment status.
3. Escalation should not automatically complete Field Service Report.
4. Escalation should not infer `finalAppointmentId`.
5. Escalation should not trigger survey sending.
6. Escalation should not send LINE / APP / SMS / email without future notification approval.
7. Escalation can create future internal task / dashboard item only after explicit implementation approval.
8. Supervisor review should be explicit human action.
9. AI may suggest risk but cannot decide escalation outcome.
10. A resolved risk flag should not imply the Case is completed.

## Manual Follow-up Boundary

Manual follow-up is an operations workflow, not provider identity.

Future manual follow-up may include:

- call customer,
- confirm appointment,
- ask engineer for update,
- confirm parts ETA,
- request quote approval,
- request supervisor review,
- mark risk as acknowledged,
- mark risk as resolved.

Manual follow-up should record who acted and when if runtime is later implemented, but Task173 does not design or create that schema.

## Notification / Channel Abstraction Relation

SLA risk detection is channel-agnostic.

Channel relation:

1. Customer contact method belongs to the channel layer.
2. Notification delivery requires channel abstraction readiness.
3. No provider sending occurs in Task173.
4. Manual follow-up is operations workflow, not provider identity.
5. Future notification must respect opt-out / suppression / contact eligibility.
6. No raw LINE user id belongs in SLA payload.
7. No customer mobile / phone / tel values should appear in logs or handoff unless masked and policy-approved.
8. Delivery resolver runtime remains unapproved.
9. Notification table foundation is not sending approval.
10. Survey runtime remains paused and must not be triggered by risk detection.

## Admin Dashboard Future Visibility

Future Admin dashboard concepts:

1. Case risk badge.
2. SLA timer / overdue indicator.
3. Dispatch pending list.
4. Appointment stale update list.
5. Pending parts follow-up list.
6. Customer follow-up required list.
7. Supervisor review queue.
8. Safe reason codes.
9. Role-based visibility.
10. Masked channel/contact summaries only.

Possible role views:

- customer service: waiting inquiry, follow-up needed, unconfirmed appointment,
- dispatch: needs dispatch, no assigned engineer, route / schedule risk,
- engineer lead: stale on-site update, incomplete visit, missing report detail,
- supervisor: overdue, blocked, repeated reschedules, complaint risk,
- finance: billing / settlement pending, missing proof, high-risk amount.

Admin UI must not show raw LINE user id, raw provider payload, full notification payload, customer contact values in handoff, provider credentials, or production data dumps.

## AI Advisory Boundary

AI may:

- summarize risk reasons,
- suggest missing fields,
- identify stale status,
- suggest review priority,
- draft internal note,
- cluster repeated issues,
- summarize customer complaint themes,
- recommend human review.

AI must not:

- change Case / Appointment / Report status,
- complete / close / reopen Case,
- assign engineer,
- choose `finalAppointmentId`,
- send customer message,
- decide refund / billing,
- resolve complaint,
- bypass human review,
- approve escalation,
- suppress a risk without human confirmation.

AI output should be explainable, reviewable, and auditable before any operational action.

## Data Model Questions

Future design questions:

1. Is an `sla_policies` table needed?
2. Is a `case_risk_flags` table needed?
3. Is an `operations_tasks` table needed?
4. Should existing activities / timeline be reused?
5. Should risk state be computed, persisted, or hybrid?
6. Are thresholds organization-specific?
7. Are thresholds case type-specific?
8. Are thresholds brand / vendor / warranty-specific?
9. How should escalation audit be recorded?
10. How should acknowledged / resolved states work?
11. How should repeated risk events be deduped?
12. How should retention and reporting policy work?
13. Should smoke / test cases be suppressed from operations risk?
14. Should role permissions restrict risk visibility?
15. How should future billing / survey risk signals join without coupling runtimes?

## API / Runtime Future Task List

Future implementation planning should be split into approved tasks:

1. SLA / operations risk data model proposal / no migration.
2. Risk signal computation contract / no runtime change.
3. SLA policy and threshold design.
4. Operations task / supervisor review workflow design.
5. Admin dashboard UX design / no runtime change.
6. API contract design for risk summaries.
7. Permission / role visibility review.
8. Notification readiness review if outbound reminders are desired.
9. AI risk advisory contract / no automatic decisions.
10. Future runtime implementation only after explicit approval.

## Future Tests / Smoke Plan

Future tests only, not implemented in Task173:

1. Case created but not dispatched risk.
2. Appointment overdue risk.
3. `pending_parts` with no next appointment risk.
4. Repeat completion does not create risk side effects.
5. Completed Case no longer appears overdue.
6. No raw sensitive values in dashboard output.
7. AI advisory does not mutate state.
8. Notification disabled results in no provider call.
9. Role visibility test.
10. Shared runtime no destructive cleanup.
11. Repeated reschedules trigger risk once or dedupe correctly.
12. No eligible completed visit completion error can surface risk without completing Case.

## Security / Privacy / Sensitive Output Rules

Do not expose:

- `DATABASE_URL`,
- password / password hash,
- token / secret,
- customer mobile / phone / tel values in handoff,
- raw LINE user id,
- LINE channel secret / access token,
- provider credentials,
- raw provider payload,
- raw notification payload,
- full customer payload,
- full appointment payload,
- production data dumps.

Safe reporting should use:

- risk type,
- safe reason code,
- count summary,
- masked channel/contact summary,
- due / overdue summary,
- role visibility summary,
- non-sensitive timestamps,
- internal IDs only when allowed by operator policy.

## Remaining Blockers

Remaining blockers before SLA / operations risk runtime:

- decide computed vs persisted risk flags,
- define SLA policies and thresholds,
- define role visibility,
- define acknowledgment / resolution workflow,
- define audit model,
- define dashboard UX,
- define no-send notification relation,
- define opt-out / suppression relation,
- define smoke/test suppression,
- define AI advisory review UX,
- define migration strategy if tables are needed,
- keep inventory docs frozen unless real behavior changes.

## Final Recommendation

Use Task173 as the first SLA / operations risk design entry point.

Recommended next task:

```text
Task174 - SLA / Operations Risk Data Model Proposal / No Migration
```

Scope for Task174 should stay docs-only and compare:

- computed vs persisted risk flags,
- `sla_policies`,
- `case_risk_flags`,
- `operations_tasks`,
- use of existing timeline / activities,
- audit and retention policy.

Do not create a migration file or runtime implementation in Task174 unless the user explicitly changes scope.

## Non-goals

Task173 does not design or implement:

- backend runtime,
- Admin frontend runtime,
- APIs,
- migration files,
- schema / indexes,
- smoke tests,
- DB dry-run / apply,
- SLA engine,
- operations task runtime,
- dashboard UI,
- provider sending,
- LINE push,
- APP push,
- SMS / email,
- delivery resolver runtime,
- survey sending,
- reverse LINE binding runtime,
- billing engine,
- settlement engine,
- AI automatic decisions,
- inventory docs changes,
- destructive cleanup.

## Verification Summary

Recommended verification for Task173:

- `npm run check`
- `npm run admin:check`
- `git diff --check`
- sensitive scan of this document

Sensitive scan matches for policy words such as `token`, `customer mobile`, `raw LINE user id`, `phone`, or `payload` are expected if they are safety warnings or placeholders. They are not actual sensitive values.

Task173 does not require:

- `npm run smoke:028`,
- `npm run smoke:029`,
- `npm run smoke:071:browser`,
- migration apply,
- DB connection,
- psql,
- runtime tests,
- provider live tests,
- survey runtime tests,
- inventory verification.

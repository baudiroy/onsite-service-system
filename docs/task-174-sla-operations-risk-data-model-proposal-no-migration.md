# Task 174 - SLA / Operations Risk Data Model Proposal / No Migration

## Background

Task174 proposes a future SLA / operations risk data model based on Task173. It does not author a migration file, connect to DB, apply migrations, modify runtime behavior, modify Admin UI, send provider messages, or enable AI automation.

Task173 defined the product boundary for SLA, stale-work detection, escalation, manual follow-up, role dashboards, notification relation, and AI advisory. Task174 narrows that into data-model options and open decisions.

## No-runtime-change Statement

Task174 does not:

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

## Source Review Summary

Reviewed:

- `docs/task-173-sla-operations-risk-escalation-design-no-runtime-change.md`
- `docs/task-172-system-architecture-master-handoff-index-next-product-branch-selection-no-runtime-change.md`
- `docs/task-171-channel-abstraction-final-pause-summary-no-runtime-change.md`
- `docs/task-157-first-transition-hardening-closure-product-mainline-return-recommendation.md`
- `docs/multi-visit-field-service-design.md`
- `docs/future_ai_platform_design.md`

Task174 keeps Task173 boundaries:

- SLA risk states do not replace Case / Appointment / Field Service Report status.
- Escalation is advisory and operational.
- AI may suggest but must not decide.
- Channel / notification delivery is not approved.
- No migration or runtime is created.

## Data Model Goals

Future SLA / operations risk data should support:

- configurable SLA thresholds,
- stale-work detection,
- risk flag persistence when useful,
- dashboard filtering,
- supervisor review queues,
- manual follow-up tracking,
- auditability,
- future reporting,
- role-based visibility,
- no sensitive payload exposure.

The model should not:

- mutate core Case / Appointment / Report status automatically,
- complete or close cases,
- infer `finalAppointmentId`,
- send notifications,
- send surveys,
- decide billing / settlement,
- bypass human review.

## Computed vs Persisted Risk Flags

| Approach | Description | Benefits | Risks | Recommended use |
| --- | --- | --- | --- | --- |
| Computed-only | Calculate risk from current Case / Appointment / Report data at query time | No extra writes, always current, simpler early rollout | Can be slow, hard to audit, hard to acknowledge/resolve | Early dashboard prototypes and low-volume review |
| Persisted-only | Store risk rows whenever a scheduler or event updates risk | Fast dashboards, audit trail, acknowledgment/resolution state | Requires dedupe, backfill, scheduler, staleness handling | Later mature operations workflows |
| Hybrid | Compute candidates, persist actionable or acknowledged flags | Balances freshness and auditability | More design complexity | Recommended future direction |

Recommendation:

- Start design with hybrid as the target.
- Use computed signals for simple dashboards.
- Persist risk flags when the operator must acknowledge, assign, resolve, suppress, or audit the risk.
- Do not implement either approach in Task174.

## Candidate Future Tables

These are proposal-only tables. Task174 does not create migration files.

### `sla_policies`

Purpose:

- define thresholds and policy rules for case / appointment / report risk detection.

Candidate fields:

- `id`
- `organization_id`
- `policy_key`
- `policy_name`
- `applies_to`
- `case_type`
- `brand_id`
- `vendor_id`
- `warranty_status`
- `priority`
- `threshold_minutes`
- `threshold_business_minutes`
- `warning_minutes_before_due`
- `active`
- `created_by`
- `created_at`
- `updated_at`

Notes:

- thresholds may be organization-specific,
- future brand / vendor / warranty-specific policies should be optional,
- business-hours logic needs separate design,
- policy changes should not rewrite historical completed cases without an explicit recalculation task.

### `case_risk_flags`

Purpose:

- persist actionable risk flags for Cases and related visits / reports.

Candidate fields:

- `id`
- `organization_id`
- `case_id`
- `appointment_id` nullable
- `service_report_id` nullable
- `risk_type`
- `risk_state`
- `severity`
- `reason_code`
- `source`
- `detected_at`
- `due_at` nullable
- `breached_at` nullable
- `acknowledged_by` nullable
- `acknowledged_at` nullable
- `resolved_by` nullable
- `resolved_at` nullable
- `suppressed_until` nullable
- `policy_id` nullable
- `metadata` safe allow-list only
- `created_at`
- `updated_at`

Notes:

- should never contain raw LINE user id, customer contact values, provider credentials, or full payloads,
- `risk_state` is an operations signal and does not replace Case / Appointment / Report status,
- dedupe key needs design, likely based on organization / case / risk type / source object / active state,
- resolved risk does not mean the Case is completed.

### `operations_tasks`

Purpose:

- represent human follow-up actions created from risk flags or manual supervisor review.

Candidate fields:

- `id`
- `organization_id`
- `case_id`
- `appointment_id` nullable
- `risk_flag_id` nullable
- `task_type`
- `task_status`
- `priority`
- `assigned_role`
- `assigned_user_id` nullable
- `due_at` nullable
- `completed_by` nullable
- `completed_at` nullable
- `created_by`
- `created_at`
- `updated_at`
- `note` safe text only

Notes:

- operations tasks are internal workflow items,
- they should not send customer messages by themselves,
- customer contact still belongs to the channel / notification layer,
- future dashboard can group by role / status / due date.

### Reusing Existing Timeline / Activities

Existing timeline / activity records may be useful for audit display, but they should not replace structured risk state.

Recommended split:

- structured risk and task state in future dedicated tables if approved,
- timeline / activity entries for human-readable audit events,
- no raw payloads in either surface.

## Relationship to Core Domain

Future SLA / operations tables should reference core entities but not own their lifecycle:

| Reference | Purpose | Boundary |
| --- | --- | --- |
| `case_id` | Primary customer service context | Risk cannot replace Case status |
| `appointment_id` | Visit-specific risk context | Risk cannot replace appointment status / visit result |
| `service_report_id` | Report-specific risk context | Risk cannot complete / reopen report |
| `policy_id` | SLA rule source | Policy cannot mutate Case by itself |
| `risk_flag_id` | Operations task source | Task completion does not imply Case completion |

## Candidate Risk Types

Candidate `risk_type` values:

- `case_not_dispatched`
- `appointment_unassigned`
- `appointment_not_started`
- `appointment_stale_on_site`
- `pending_parts_no_next_visit`
- `customer_follow_up_required`
- `case_no_open_appointment`
- `report_in_progress_too_long`
- `completion_blocked_no_completed_visit`
- `customer_inquiry_stale`
- `repeated_reschedules`
- `multiple_incomplete_visits`
- `complaint_risk`
- `survey_low_rating`
- `billing_settlement_stale`

These values are future design candidates only.

## Candidate Risk States

Candidate `risk_state` values:

- `normal`
- `watching`
- `at_risk`
- `overdue`
- `blocked`
- `needs_dispatch`
- `needs_customer_follow_up`
- `pending_parts_follow_up`
- `supervisor_review_required`
- `acknowledged`
- `resolved`
- `suppressed`

These do not replace Case / Appointment / Field Service Report statuses.

## Dedupe and Idempotency Questions

Future runtime must define:

- whether one active risk flag per case / risk type is allowed,
- whether appointment-specific risk flags can coexist for multiple visits,
- whether resolved risk flags can be reopened,
- whether a repeated scheduler run updates an existing active flag or creates a new history row,
- whether operations tasks are one per risk flag or many per risk flag,
- how policy changes affect existing unresolved flags,
- how smoke / test / internal fixtures are suppressed.

Recommended future direction:

- active risk flags should dedupe by organization, risk type, case, optional appointment/report, and active state,
- historical resolved flags should remain for reporting,
- runtime writes should be idempotent and safe to retry.

## Permissions and Visibility

Future role visibility should be explicit:

- customer service can see customer follow-up and stale inquiry risks,
- dispatch can see unassigned / stale appointment / pending parts risks,
- engineer leads can see stale visit updates and missing report details,
- supervisors can see overdue, blocked, repeated reschedule, complaint, and high-severity risks,
- finance can see billing / settlement risks,
- admins can configure policies only if allowed.

Sensitive data should remain masked and scoped.

## Notification and Channel Relation

SLA / operations data model should not embed provider identity.

Future outbound notification should be separate:

- risk detection creates or updates internal risk / task state,
- delivery resolver chooses whether and how to notify later,
- provider identity remains in channel-specific or future generic channel identity layer,
- opt-out / suppression / contact eligibility must be checked before sending,
- no LINE / APP / SMS / email sending is approved in Task174.

## AI Advisory Relation

Future AI may assist by:

- summarizing risk reason,
- proposing priority,
- suggesting missing data,
- drafting internal follow-up notes,
- grouping similar risk cases.

AI must not:

- create official risk resolution without human confirmation,
- mutate Case / Appointment / Report status,
- assign engineer,
- select `finalAppointmentId`,
- send notifications,
- decide billing / refunds,
- close complaints.

AI-generated fields should be marked as suggestion / draft / explanation and should be reviewable.

## Future API / Runtime Task List

Suggested future tasks:

1. SLA policy product rules / threshold matrix.
2. SLA / risk persistence decision review.
3. `sla_policies` migration proposal / no apply.
4. `case_risk_flags` migration proposal / no apply.
5. `operations_tasks` migration proposal / no apply.
6. Risk computation service contract.
7. Risk scheduler / event-trigger design.
8. Dashboard API contract.
9. Admin dashboard UX design.
10. Role permission and redaction review.
11. No-send notification readiness.
12. AI advisory contract.
13. Runtime implementation only after explicit approval.

## Future Test / Smoke Plan

Future tests only:

1. Computed risk: case created but not dispatched.
2. Persisted risk dedupe: repeated scheduler run does not duplicate active flag.
3. Appointment overdue risk.
4. Pending parts without next appointment risk.
5. Completed Case no longer appears overdue.
6. Resolved risk does not mutate Case completion.
7. Operations task completion does not close Case.
8. Role visibility hides unauthorized risk categories.
9. Dashboard payload excludes raw contact / provider payload.
10. AI advisory does not mutate state.
11. Notification disabled means no provider call.
12. Shared runtime no destructive cleanup.

## Security / Privacy Rules

Future SLA / operations records must not store or output:

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

Use safe reason codes, masked channel summaries, non-sensitive timestamps, and scoped internal IDs when allowed.

## Migration Decision

Task174 creates no migration.

All table names and fields are future proposals only:

- `sla_policies`,
- `case_risk_flags`,
- `operations_tasks`.

Any future migration must be a separate explicit task with no-apply review first.

## Runtime Decision

Task174 creates no runtime behavior.

No scheduler, API, dashboard, AI runtime, notification, delivery resolver, or provider sending is implemented.

## Remaining Blockers

Before implementation:

- choose computed / persisted / hybrid model,
- define SLA threshold policy,
- decide whether to use business hours,
- define dedupe keys,
- define role permissions,
- define dashboard requirements,
- define audit / timeline relation,
- define notification relation,
- define suppression / opt-out relation,
- define AI advisory review UI,
- define migration plan,
- define no-send tests.

## Final Recommendation

Use Task174 as the data-model proposal entry point for SLA / operations risk.

Recommended next task:

```text
Task175 - SLA / Operations Risk Policy and Threshold Matrix / No Runtime Change
```

Scope should remain docs-only:

- define threshold categories,
- compare organization / case type / brand / vendor / warranty dimensions,
- define due-time examples,
- no migration,
- no runtime,
- no dashboard implementation.

## Non-goals

Task174 does not design or implement:

- migration file,
- schema / index change,
- backend runtime,
- Admin UI runtime,
- API,
- smoke tests,
- DB dry-run / apply,
- SLA scheduler,
- operations task runtime,
- dashboard UI,
- provider sending,
- delivery resolver runtime,
- survey runtime,
- billing engine,
- AI automatic decisions,
- inventory docs changes,
- destructive cleanup.

## Verification Summary

Recommended verification for Task174:

- `npm run check`
- `npm run admin:check`
- `git diff --check`
- sensitive scan of this document

Sensitive scan matches for policy words such as `token`, `customer mobile`, `raw LINE user id`, `phone`, or `payload` are expected if they are safety warnings or placeholders. They are not actual sensitive values.

Task174 does not require:

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

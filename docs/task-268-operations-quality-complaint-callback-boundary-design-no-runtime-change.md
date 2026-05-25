# Task 268 - Operations / Quality Complaint and Callback Boundary Design / No Runtime Change

## Purpose And Scope

This document extends Task266 and Task267 with docs-only boundary design for future complaint, escalation, callback, negative feedback follow-up, quality follow-up, supervisor review, and AI risk flag workflows.

The goal is to prevent complaint / callback concepts from being confused with official Case status, Appointment / Dispatch Visit status, Field Service Report completion, billing / settlement approval, or AI decision.

Task268 is documentation-only.

This task is not:

- complaint workflow runtime,
- escalation workflow runtime,
- callback / follow-up runtime,
- quality review runtime,
- customer satisfaction survey runtime,
- SLA runtime,
- AI risk runtime,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- automated test implementation,
- provider sending,
- AI / RAG runtime.

Task268 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why Complaint / Callback Boundaries Are Needed After Task267

Task267 separated Operations / Quality data categories.

Task268 focuses on one high-risk subset: complaint, escalation, callback, and follow-up.

These concepts are operationally sensitive because they can affect:

- customer trust,
- supervisor visibility,
- engineer coaching,
- service recovery,
- repeat visit analysis,
- future billing / settlement dispute context,
- future survey follow-up,
- future AI risk radar.

Without clear boundaries, future implementation could accidentally:

- treat negative feedback as formal complaint,
- reopen a Case from a callback flag,
- reopen an Appointment from callback required,
- mark a Field Service Report failed because a customer was unhappy,
- expose supervisor notes to customers,
- let AI risk flag become official complaint,
- mix callback attempts into report notes,
- promise refund or free service without approval.

Task268 defines boundaries only. It does not implement any workflow.

## Definitions

### Complaint

A complaint is a customer dissatisfaction or dispute that is accepted into a future formal review process by authorized human action or explicit future policy.

A complaint is not automatically created by:

- low survey score,
- negative feedback,
- callback required flag,
- AI risk flag,
- repeat visit signal,
- billing dispute signal,
- provider delivery failure.

### Escalation

Escalation is an internal routing decision that moves a matter to supervisor, quality, finance, or another authorized review owner.

Escalation is not:

- Case reopening,
- Appointment reopening,
- Field Service Report failure,
- settlement approval,
- compensation approval,
- automatic customer promise.

### Negative Feedback

Negative feedback is customer-submitted dissatisfaction signal, such as low score or unhappy text.

Negative feedback may require review, but it is not automatically:

- formal complaint,
- service failure,
- compensation approval,
- Case status change,
- appointment status change.

### Callback Required

Callback required means a human follow-up may be needed.

It is an operations / quality signal, not an official Case, Appointment, or Field Service Report status.

### Callback Attempt

Callback attempt is a future record that a human tried to contact the customer.

It should preserve safe metadata such as actor, time, outcome category, and next step. It should not expose full customer contact values in unsafe logs or reports.

### Callback Outcome

Callback outcome is the result of a follow-up attempt.

It may be:

- customer reached,
- unable to reach,
- customer satisfied,
- still dissatisfied,
- supervisor follow-up required,
- service recovery review needed,
- follow-up completed by human.

Callback outcome must not automatically modify official completion facts, Field Service Report, Case completion status, or Appointment status.

### Quality Follow-up

Quality follow-up is an internal process for reviewing service quality, dissatisfaction, repeat visits, missing evidence, or coaching needs.

It is not a replacement for formal Case, Appointment, Field Service Report, billing, settlement, quote, or complaint workflows.

### Supervisor Review

Supervisor review is a human-controlled internal review step.

Supervisor review may evaluate complaint, escalation, service recovery, engineer coaching, or process issue.

Supervisor review is not finance approval, settlement approval, quote approval, or payment approval unless a future policy explicitly defines that authority.

### AI Risk Flag / Suggestion

AI risk flag / suggestion is advisory.

It may help identify risk, summarize context, or propose next review step.

It is not official complaint, escalation, callback outcome, supervisor decision, compensation approval, Case status, Appointment status, or Field Service Report status.

## Boundary Principles

### Complaint / Escalation Does Not Equal Case Reopened

Future complaint or escalation workflow must not automatically reopen a completed Case or change Case status.

If future product supports reopen / correction, it must be a separate workflow with explicit permission, audit, and policy.

### Callback Required Does Not Equal Appointment Reopened

Callback required may ask a human to contact the customer. It must not automatically reopen an appointment, create a new appointment, or change appointment status.

New appointment creation must still follow appointment / dispatch rules and one-open-appointment guard.

### Negative Feedback Does Not Equal Failed Field Service Report

Negative feedback may indicate dissatisfaction, but it does not automatically mean the formal Field Service Report is wrong, failed, or void.

Any report correction or reopen flow requires separate explicit design.

### Callback Outcome Cannot Rewrite Completion Report

Callback outcome may inform future service recovery or quality review.

It must not automatically rewrite:

- formal completion facts,
- `finalAppointmentId`,
- Field Service Report status,
- Case completedAt,
- Appointment visit result.

### Supervisor Review Is Not Finance / Settlement Approval

Supervisor review may address quality, service recovery, or escalation.

It is not settlement approval, finance approval, payment approval, quote approval, discount approval, or compensation approval unless a future approved policy explicitly grants that authority.

### AI Risk Flag Is Not Official Complaint / Escalation Decision

AI may identify possible complaint risk, but human review is required before creating official complaint, escalation, callback closure, service recovery decision, or supervisor outcome.

AI must not close complaint, suppress negative feedback, or mark customer issue resolved.

## Future-only Lifecycle Map

The lifecycle below is conceptual only.

It is not:

- schema,
- DB enum,
- API status,
- Admin route,
- localization key,
- runtime behavior.

Future complaint / callback lifecycle may include:

1. intake / detected
   - source may be survey, customer service flag, manual supervisor flag, customer channel message, or AI advisory flag.

2. triage needed
   - a human needs to classify whether the matter is callback, complaint risk, formal complaint, service recovery, billing dispute, or no action.

3. assigned for follow-up
   - an authorized person owns the callback or review.

4. callback attempted
   - human records safe attempt metadata and outcome category.

5. waiting customer response
   - follow-up is pending customer reply.

6. resolved by human
   - human records safe resolution category.

7. closed by human
   - authorized human closes the complaint / callback workflow.

8. linked to future corrective action / coaching / process improvement
   - future internal improvement record may be created if policy supports it.

The lifecycle should be fail-closed: ambiguous or risky state should require human review.

## Human Review Rules

### Must Require Human Judgment

The following should require human review in future implementation:

- converting negative feedback to formal complaint,
- marking complaint as resolved,
- closing complaint / escalation,
- approving service recovery,
- promising discount, compensation, refund, or free service,
- deciding customer fault or engineer fault,
- deciding whether Case should be reopened,
- deciding whether a new appointment should be created after complaint,
- exposing internal findings to customer,
- linking callback outcome to billing / settlement dispute,
- using AI suggestion in customer-visible message.

### AI May Suggest But Not Decide

AI may:

- summarize feedback,
- identify complaint risk,
- suggest callback priority,
- classify issue themes,
- suggest reviewer group,
- draft internal callback note,
- identify related appointments / visits,
- flag repeat visit pattern,
- suggest missing evidence.

AI must not:

- create official complaint automatically,
- close complaint,
- mark callback completed,
- decide escalation outcome,
- decide service recovery,
- approve compensation,
- approve refund,
- change Case / Appointment / Field Service Report status,
- write customer-visible message without human review.

### Survey Score Or AI Flag Cannot Directly Close

The following must not close complaint / callback / review directly:

- high survey score,
- low survey score,
- absence of customer text,
- AI low-risk classification,
- AI high-risk classification,
- delivery failure,
- no customer reply,
- repeated contact attempt.

Closure should be an authorized human action or a future deterministic policy that is separately designed and approved.

## Data Separation Rules

### Complaint / Callback Notes Must Not Be Only Field Service Report Notes

Complaint, callback, escalation, and supervisor notes must not exist only in Field Service Report internal note.

The Field Service Report is a formal completion summary, not the quality follow-up system.

### Customer-visible Callback Communication Is Separate From Internal Tracking

Customer-visible callback communication may include:

- safe acknowledgement,
- safe follow-up message,
- safe service recovery confirmation,
- safe next-step wording.

Internal tracking may include:

- callback attempt reason,
- internal classification,
- assigned reviewer,
- supervisor note,
- AI suggestion,
- internal risk category,
- quality root-cause hypothesis.

These should not be the same payload.

### AI Suggestion Is Separate From Official Complaint / Callback Record

AI suggestion / risk flag should remain advisory until a human accepts, edits, rejects, or acts on it.

Official complaint / callback record, if future implementation exists, must record human action separately from AI suggestion.

### Sensitive Data Must Stay Protected

Complaint / callback workflows must not expose sensitive data in external replies, handoffs, exports, logs, AI prompts, or general diagnostics.

Prohibited unsafe outputs include:

- full customer mobile values,
- full addresses,
- raw LINE user ids,
- LINE access tokens,
- channel secrets,
- webhook secrets,
- provider credentials,
- raw provider payloads,
- raw AI sensitive payloads,
- customer signature data,
- internal supervisor notes,
- audit logs.

## Interaction With Existing Platform Objects

### Case

Complaint or callback may reference a Case.

It must not automatically:

- reopen Case,
- close Case,
- change Case status,
- change Case completedAt,
- create duplicate Case,
- change customer identity.

### Appointment / Dispatch Visit

Complaint or callback may reference one or more appointments / visits.

It must not automatically:

- reopen appointment,
- create appointment,
- cancel appointment,
- complete appointment,
- change visit result,
- bypass one-open-appointment guard.

### Field Service Report

Complaint or callback may reference the formal Field Service Report.

It must not automatically:

- change report status,
- change report completedAt,
- change report content,
- change `finalAppointmentId`,
- create another formal report.

### Survey Result

Survey result may trigger human review.

It must not automatically:

- create formal complaint,
- create compensation,
- close complaint,
- reopen Case,
- change report.

### Billing / Settlement

Complaint or callback may create future billing / settlement review need.

It must not automatically:

- approve discount,
- approve compensation,
- approve settlement,
- change payment / invoice state,
- modify customer consent.

### Customer Channel Identity

Complaint / callback may use future channel identity for safe communication.

It must not:

- treat raw LINE user id as global identity,
- expose raw channel ids,
- bypass organization scope,
- bypass customer visible data policy.

### Audit Log

Complaint / callback workflows should be audit-ready.

Future audit must use safe summaries and redaction. Audit log is internal-only and not customer-visible.

### AI Suggestion Records

AI suggestions may link to complaint / callback review as advisory context.

They must remain separate from official complaint and callback records.

## SaaS-ready / Security Considerations

### Organization Isolation

Complaint, escalation, callback, quality follow-up, supervisor review, and AI risk flag data must always be scoped by `organization_id`.

No workflow may cross tenant boundaries.

### Role / Permission Separation

Future implementation must decide which roles can:

- view complaint risk,
- create formal complaint,
- assign callback,
- record callback attempt,
- close callback,
- escalate to supervisor,
- view supervisor note,
- approve service recovery,
- view AI suggestion,
- accept / reject / edit AI suggestion,
- export complaint / callback report.

Permission must remain distinct from organization entitlement.

### Customer-visible vs Internal-only Policy

Every complaint / callback surface must define whether it is:

- customer-visible,
- internal-only,
- supervisor-only,
- AI-advisory-only,
- audit-only.

Customer-visible communication must use safe summaries, not internal payloads.

### Field-level Masking Readiness

Future displays, reports, exports, AI context, and audit logs must support masking or exclusion for:

- mobile,
- phone,
- address,
- raw LINE user id,
- email,
- signature data,
- photos,
- internal notes,
- supervisor notes,
- audit logs,
- AI raw payloads.

### Audit Readiness

Future audit event families may include:

- `complaint.intake_detected`,
- `complaint.review_created`,
- `complaint.escalated`,
- `complaint.closed_by_human`,
- `callback.required_marked`,
- `callback.assigned`,
- `callback.attempt_recorded`,
- `callback.outcome_recorded`,
- `callback.closed_by_human`,
- `quality.follow_up_created`,
- `supervisor.review_requested`,
- `ai.complaint_risk_suggested`,
- `ai.callback_summary_suggested`,
- `ai.suggestion_accepted`,
- `ai.suggestion_rejected`,
- `ai.suggestion_edited`.

These are placeholders only. They are not production event names, DB enums, localization keys, API contracts, or runtime behavior.

### Future Entitlement / Usage Tracking Readiness

Possible future entitlements:

- `complaint_review`,
- `quality_follow_up`,
- `callback_tracking`,
- `service_recovery_review`,
- `supervisor_escalation`,
- `ai_complaint_risk_detection`,
- `ai_callback_summary`.

Possible usage tracking:

- AI complaint summaries,
- AI risk flag generation,
- callback notification sending,
- complaint report export,
- scheduled quality report delivery.

These are future planning examples only.

### AI Add-on Readiness

AI complaint and callback support should remain optional and controllable through future AI Add-on / feature entitlement / usage limits.

AI must still respect:

- organization scope,
- user permission,
- customer-visible policy,
- internal-only policy,
- masking,
- audit,
- human review.

## Runtime Forbidden Confirmation

Task268 does not approve:

- complaint workflow runtime,
- escalation workflow runtime,
- callback / follow-up runtime,
- quality review runtime,
- supervisor review runtime,
- survey response runtime,
- SLA / operations risk runtime,
- AI risk runtime,
- AI / RAG runtime,
- provider sending,
- notification delivery,
- LINE / SMS / Email / APP sending,
- DB schema,
- migration,
- API,
- Admin UI,
- audit runtime,
- permission runtime,
- entitlement runtime,
- usage runtime,
- tests,
- smoke fixtures.

General instructions such as "continue", "next task", or "go ahead" must not be interpreted as runtime approval.

## Explicit Non-goals

Task268 confirms:

- no backend source change,
- no Admin source change,
- no API change,
- no migration,
- no schema / index change,
- no DB connection,
- no DDL,
- no `psql`,
- no `npm run db:migrate`,
- no Migration020 dry-run / apply,
- no shared runtime / shared Zeabur operation,
- no destructive cleanup,
- no tests / smoke / fixture change,
- no package change,
- no inventory docs change,
- no provider sending,
- no LINE / SMS / Email / APP sending,
- no notification runtime,
- no survey runtime,
- no complaint runtime,
- no callback runtime,
- no quality review runtime,
- no SLA runtime,
- no AI risk runtime,
- no audit runtime,
- no permission runtime,
- no entitlement runtime,
- no usage runtime,
- no AI agent runtime,
- no RAG runtime,
- no vector database,
- no embedding,
- no official record write by AI,
- no AI auto-decision,
- no sensitive output.

## Conclusion

Task268 establishes a docs-only complaint / escalation / callback boundary design.

It confirms:

- complaint / escalation does not equal Case reopened,
- callback required does not equal Appointment reopened,
- negative feedback does not equal failed Field Service Report,
- callback outcome cannot rewrite completion report,
- supervisor review is not finance / settlement approval,
- AI risk flag is not official complaint / escalation decision,
- complaint / callback / supervisor notes must not live only in Field Service Report internal note,
- no complaint / callback runtime is approved.

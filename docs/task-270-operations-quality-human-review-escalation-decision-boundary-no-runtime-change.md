# Task 270 - Operations / Quality Human Review and Escalation Decision Boundary / No Runtime Change

## Purpose And Scope

This document extends Task266 through Task269 with docs-only guidance for human review and escalation decision boundaries.

It separates survey signals, AI risk flags, complaint candidates, callback candidates, quality review candidates, engineer coaching candidates, and corrective action candidates from human-confirmed formal decisions.

Task270 is documentation-only.

This task is not:

- human review workflow runtime,
- escalation workflow runtime,
- complaint workflow runtime,
- callback / follow-up runtime,
- quality review runtime,
- survey runtime,
- SLA runtime,
- AI risk runtime,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- automated test implementation,
- provider sending,
- AI / RAG runtime.

Task270 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why Human Review / Escalation Decision Boundaries Are Needed After Task269

Task269 mapped future survey feedback to internal risk signals.

Task270 defines the next boundary: when a signal becomes a human-confirmed decision.

The platform must keep these layers separate:

- input signal,
- AI suggestion,
- candidate state,
- human review result,
- confirmed complaint,
- confirmed callback required,
- confirmed quality issue,
- coaching signal,
- corrective action candidate,
- official Case / Appointment / Field Service Report data.

This prevents:

- survey score becoming a formal complaint,
- AI flag becoming escalation decision,
- candidate state being treated as confirmed outcome,
- supervisor review silently mutating official service data,
- quality review being confused with billing / settlement approval,
- AI or survey score closing complaint / callback / escalation.

## Definitions

### Human Review

Human review is a future process where an authorized user evaluates signal context and records a decision or next action.

Human review may consider survey feedback, complaint wording, appointment history, Field Service Report summary, callback context, AI suggestion, or supervisor guidance.

### Supervisor Review

Supervisor review is a higher-responsibility human review for risk, complaint, service recovery, safety, misconduct, repeated issue, or process improvement.

Supervisor review is not automatically finance approval, settlement approval, payment approval, or compensation approval.

### Escalation Decision

Escalation decision is a human-confirmed decision to route a matter to a supervisor, quality owner, customer service lead, finance reviewer, or another authorized owner.

Escalation decision must not automatically mutate official Case, Appointment, or Field Service Report status.

### Complaint Candidate

Complaint candidate is a signal that may become formal complaint after human review.

It is not confirmed complaint.

### Confirmed Complaint

Confirmed complaint is a future formal state or record created by authorized human review or a separately approved deterministic policy.

Task270 does not implement this record or policy.

### Callback Candidate

Callback candidate is a signal that customer follow-up may be needed.

It is not confirmed callback required.

### Confirmed Callback Required

Confirmed callback required is a future human-confirmed decision to contact the customer.

It is not appointment reopened, Case reopened, or complaint closure.

### Quality Review Candidate

Quality review candidate is a signal that service quality may need review.

It is not confirmed quality issue.

### Confirmed Quality Issue

Confirmed quality issue is a future human-confirmed result after review.

It may inform coaching, service recovery, process improvement, or future reporting, but it must not automatically rewrite official service records.

### Engineer Coaching Candidate

Engineer coaching candidate is an internal signal that may indicate training, missing evidence, process adherence, or quality improvement need.

It is not discipline, fault determination, or customer-visible statement.

### Corrective Action Candidate

Corrective action candidate is a future internal signal that a process change, supervisor action, service recovery, or additional follow-up may be needed.

It is not automatic action.

### AI Risk Flag / Suggestion

AI risk flag / suggestion is advisory-only context.

AI may propose that something needs review. It cannot decide, close, approve, dismiss, or mutate official records.

## Decision Boundary Principles

### Survey Signal Is Not Human-confirmed Result

Survey score and survey text are input signals.

They are not:

- confirmed complaint,
- confirmed callback,
- confirmed quality issue,
- supervisor decision,
- official service failure.

### AI Risk Flag Is Not Escalation Decision

AI risk flag may recommend escalation review.

It is not the escalation decision itself.

### Complaint Candidate Is Not Confirmed Complaint

A complaint candidate should be reviewed by an authorized human.

Only human review or separately approved future deterministic policy can create confirmed complaint.

### Callback Candidate Is Not Confirmed Callback Required

Callback candidate is a suggestion or signal.

Confirmed callback required must be a human-controlled future decision.

### Quality Review Candidate Is Not Confirmed Quality Issue

Quality review candidate may indicate service quality risk.

Confirmed quality issue requires human judgment.

### Supervisor Review Must Not Mutate Official Records By Default

Supervisor review must not automatically:

- reopen Case,
- close Case,
- change Appointment status,
- change visit result,
- modify Field Service Report,
- modify `finalAppointmentId`,
- change billing / settlement approval.

If future product needs a correction path, it must be separately designed.

### Human Review Result Is Not Billing / Settlement Approval

Human review in Operations / Quality may identify service issue, complaint, callback need, or coaching need.

It is not:

- quote approval,
- discount approval,
- compensation approval,
- settlement approval,
- payment approval,
- invoice approval.

Links to Billing / Settlement review may be future context only.

### Closure Must Be Human-controlled

Complaint, callback, escalation, and quality review closure must be human-controlled future workflow.

They must not be closed automatically by:

- AI risk flag,
- AI low-risk classification,
- survey score,
- no survey response,
- no customer comment,
- callback attempt count,
- provider delivery status.

## Future-only Decision Matrix

This matrix is conceptual only.

It is not:

- schema,
- DB enum,
- API contract,
- Admin UI behavior,
- runtime decision logic,
- localization key.

All "may update Case status" values are No.

All "may update Appointment status" values are No.

All "may update Field Service Report" values are No.

All "AI may decide / close" values are No.

All "Runtime allowed now" values are No.

| Review context | Input signal | Possible human decision | Customer-visible or internal-only | Requires supervisor review? | May create confirmed complaint? | May create confirmed callback required? | May create confirmed quality issue? | May link to billing / settlement review? | May update Case status? | May update Appointment status? | May update Field Service Report? | AI may suggest? | AI may decide / close? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Low survey score review | Low rating | Mark no action, callback needed, complaint candidate, quality review needed | Internal-only decision; safe customer message only if approved | Maybe | Maybe | Maybe | Maybe | No by default | No | No | No | Yes | No | No |
| Explicit complaint wording review | Complaint-like text | Confirm complaint, request callback, escalate, dismiss after human review | Internal-only by default | Often | Yes | Maybe | Maybe | Maybe | No | No | No | Yes | No | No |
| Safety concern review | Safety concern text | High-priority escalation, supervisor review, service recovery review | Internal-only by default | Yes | Maybe | Maybe | Yes | Maybe | No | No | No | Yes | No | No |
| Engineer behavior complaint review | Engineer behavior feedback | Supervisor review, coaching candidate, complaint confirmation | Internal-only by default | Yes | Maybe | Maybe | Yes | No by default | No | No | No | Yes | No | No |
| Unresolved issue review | Customer says issue remains unresolved | Callback required, quality review, possible new appointment review | Internal-only by default; safe customer callback message possible | Maybe | Maybe | Yes | Maybe | No by default | No | No | No | Yes | No | No |
| Repeat visit dissatisfaction review | Feedback references repeated visits | Quality review, coaching candidate, operations risk review | Internal-only by default | Maybe | Maybe | Maybe | Yes | Maybe | No | No | No | Yes | No | No |
| Pricing / fee dispute review | Customer disputes fee or quote | Link to future billing / settlement review, callback, supervisor review | Internal-only by default; safe customer response only | Maybe | Maybe | Yes | Maybe | Yes | No | No | No | Yes | No | No |
| No-response / incomplete survey review | No response or incomplete response | No action, wait, aggregate only, manual follow-up if policy | Internal analytics by default | No | No | No by default | No | No | No | No | No | Maybe | No | No |
| AI-generated risk flag review | AI advisory signal | Accept, reject, edit, escalate, request human follow-up | Internal-only | Maybe | Maybe | Maybe | Maybe | Maybe | No | No | No | Yes | No | No |
| Supervisor escalation review | Human escalates case | Assign owner, request evidence, require callback, mark review resolved | Internal-only by default | Yes | Maybe | Maybe | Yes | Maybe | No | No | No | Yes | No | No |
| Callback follow-up review | Callback candidate or attempt | Confirm callback required, record attempt, keep open, close by human | Internal-only decision; safe customer contact only if approved | Maybe | Maybe | Yes | Maybe | Maybe | No | No | No | Yes | No | No |
| Confirmed complaint closure review | Open confirmed complaint | Close by human, keep open, escalate, link corrective action | Internal-only decision; safe customer closure message only if approved | Often | Already confirmed | Maybe | Maybe | Maybe | No | No | No | Yes | No | No |

## Data Separation Rules

### Input Signal, AI Suggestion, And Human Result Must Be Separate

Future implementation must keep separate:

- survey raw response,
- negative feedback classification,
- AI summary,
- AI risk flag,
- complaint candidate,
- callback candidate,
- quality review candidate,
- human review result,
- confirmed complaint,
- callback record,
- confirmed quality issue,
- engineer coaching signal,
- corrective action candidate.

Mixing these into one note or one status loses accountability.

### Human Review Notes Must Not Be Only Field Service Report Internal Notes

Human review notes should not exist only inside Field Service Report internal note.

Field Service Report remains the formal completion summary, not the review workflow.

### Customer-visible Communication Must Be Safe

Customer-visible communication must not expose:

- supervisor note,
- internal quality tag,
- AI raw payload,
- audit log,
- internal billing / settlement data,
- engineer internal comment,
- internal responsibility determination,
- raw provider payload,
- raw LINE user id,
- full customer mobile value,
- token,
- secret.

### Pricing / Fee Dispute Can Link To Billing / Settlement Review Only

Pricing / fee dispute may create future Billing / Settlement review link.

It must not automatically:

- change customer consent,
- change quote status,
- approve discount,
- approve compensation,
- approve settlement,
- change invoice / payment state.

### Safety / Misconduct Requires High-priority Human Review

Safety concern or misconduct allegation may be high priority.

AI or survey signal may flag urgency, but AI must not determine truth, blame, discipline, compensation, or closure.

## Interaction With Existing Platform Objects

### Case

Human review may reference a Case.

It must not automatically:

- reopen Case,
- close Case,
- change Case status,
- change Case completedAt,
- create duplicate Case.

### Appointment / Dispatch Visit

Human review may reference appointments / visits.

It must not automatically:

- reopen appointment,
- create appointment,
- cancel appointment,
- complete appointment,
- change visit result,
- bypass one-open-appointment guard.

### Field Service Report

Human review may reference the formal Field Service Report.

It must not automatically:

- change report status,
- change report completedAt,
- change report content,
- change `finalAppointmentId`,
- create another formal report.

### Survey Result

Survey result is an input signal. It should not be overwritten by human review or AI summary.

### Complaint / Callback Future Records

Complaint and callback records, if future implementation exists, should store human-confirmed actions separately from input signal and AI suggestion.

### Quality Review Future Records

Quality review records, if future implementation exists, should preserve review reason, reviewer, result, and next action separately from official service records.

### Billing / Settlement

Human review may link to Billing / Settlement review when feedback relates to pricing, fee, quote, compensation, or dispute.

It must not approve or change billing / settlement by itself.

### Audit Log

Future audit should capture human decisions and AI suggestion acceptance / rejection with safe summaries.

Audit logs remain internal-only.

### AI Suggestion Records

AI suggestion records should preserve what AI suggested, what sources were used, and how humans responded.

They must not become official decisions automatically.

## SaaS-ready / Security Considerations

### Organization Isolation

Human review, escalation, complaint, callback, quality review, coaching, corrective action, and AI suggestion records must always be scoped by `organization_id`.

No workflow may cross tenant boundaries.

### Role / Permission Separation

Future implementation must decide which roles can:

- review low survey score,
- confirm complaint,
- assign callback,
- close callback,
- escalate to supervisor,
- create confirmed quality issue,
- view engineer coaching signal,
- create corrective action candidate,
- link pricing dispute to billing / settlement review,
- accept / reject / edit AI suggestion,
- export review reports.

Permission must remain distinct from organization entitlement.

### Customer-visible vs Internal-only Policy

Every human review output must define whether it is:

- customer-visible,
- internal-only,
- supervisor-only,
- quality-only,
- audit-only,
- AI-advisory-only.

Customer-visible messages should use approved safe summaries.

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

- `human_review.created`,
- `human_review.assigned`,
- `human_review.decision_recorded`,
- `human_review.closed`,
- `complaint.confirmed_by_human`,
- `callback.confirmed_required`,
- `quality_issue.confirmed`,
- `escalation.created`,
- `escalation.closed_by_human`,
- `ai.review_suggestion_accepted`,
- `ai.review_suggestion_rejected`,
- `ai.review_suggestion_edited`.

These are placeholders only. They are not production event names, DB enums, localization keys, API contracts, or runtime behavior.

### Future Entitlement / Usage Tracking Readiness

Possible future entitlements:

- `human_quality_review`,
- `complaint_review`,
- `callback_tracking`,
- `supervisor_escalation`,
- `engineer_coaching_signal`,
- `corrective_action_review`,
- `ai_quality_review_assist`,
- `ai_risk_radar`.

Possible usage tracking:

- AI review suggestions,
- quality report exports,
- scheduled review reports,
- customer callback notifications,
- supervisor dashboard exports.

These are future planning examples only.

### AI Add-on Readiness

AI review support should remain optional and controllable through future AI Add-on / feature entitlement / usage limits.

AI must still respect:

- organization scope,
- user permission,
- customer-visible policy,
- internal-only policy,
- masking,
- audit,
- human review.

## Runtime Forbidden Confirmation

Task270 does not approve:

- human review runtime,
- escalation workflow runtime,
- complaint workflow runtime,
- callback / follow-up runtime,
- quality review runtime,
- survey runtime,
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

Task270 confirms:

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
- no escalation runtime,
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

Task270 establishes docs-only human review and escalation decision boundary guidance.

It confirms:

- survey signal is not human-confirmed result,
- AI risk flag is not escalation decision,
- complaint candidate is not confirmed complaint,
- callback candidate is not confirmed callback required,
- quality review candidate is not confirmed quality issue,
- supervisor review must not mutate official records by default,
- human review result is not billing / settlement approval,
- complaint / callback / escalation closure must be human-controlled,
- no human review / escalation / complaint / callback / quality review runtime is approved.

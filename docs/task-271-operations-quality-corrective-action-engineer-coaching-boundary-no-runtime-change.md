# Task 271 - Operations / Quality Corrective Action and Engineer Coaching Boundary / No Runtime Change

## Purpose And Scope

This document extends Task266 through Task270 with docs-only boundary guidance for future corrective action, engineer coaching, process improvement, quality issue, and AI coaching suggestion workflows.

It separates quality signals, complaint outcomes, callback outcomes, supervisor review, engineer coaching signals, corrective action candidates, confirmed corrective action, process improvement candidates, and official Case / Appointment / Field Service Report data.

Task271 is documentation-only.

This task is not:

- corrective action runtime,
- engineer coaching runtime,
- quality review runtime,
- complaint workflow runtime,
- callback / follow-up runtime,
- survey runtime,
- escalation workflow runtime,
- SLA runtime,
- AI risk runtime,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- automated test implementation,
- provider sending,
- AI / RAG runtime.

Task271 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why Corrective Action / Engineer Coaching Boundaries Are Needed After Task270

Task270 defined human review and escalation decision boundaries.

Task271 defines a further boundary: what happens after review suggests possible coaching or process improvement.

This is sensitive because quality signals can be misunderstood as fault, discipline, performance score, or official finding.

The platform must avoid:

- treating engineer coaching signal as disciplinary record,
- treating AI coaching suggestion as confirmed coaching action,
- treating customer complaint as engineer fault,
- treating pricing dispute as engineer issue by default,
- treating callback outcome as corrective action approval,
- exposing coaching notes to customers,
- changing official Case / Appointment / Field Service Report status because of coaching review.

Corrective action and coaching must remain human-controlled, internal, permissioned, auditable, and separated from customer-visible service data.

## Definitions

### Corrective Action Candidate

Corrective action candidate is a future internal signal that some action may be needed to improve service process, communication, documentation, training, dispatch, billing handoff, or evidence collection.

It is not confirmed corrective action.

### Confirmed Corrective Action

Confirmed corrective action is a future human-confirmed action or plan after review.

Task271 does not implement corrective action records or workflow.

### Engineer Coaching Candidate

Engineer coaching candidate is a future internal signal that an engineer may benefit from coaching, clarification, training, or process reinforcement.

It is not discipline, fault finding, or performance penalty.

### Engineer Coaching Signal

Engineer coaching signal is internal quality context that may suggest a coaching opportunity.

It should be handled with supervisor permission and should not be customer-visible.

### Supervisor Coaching Note

Supervisor coaching note is an internal note for future coaching or quality review.

It must not be exposed to customers, general staff, external partners, or AI customer-facing output.

### Process Improvement Candidate

Process improvement candidate is a future internal signal that the workflow, SOP, dispatch process, checklist, customer communication, quote policy, or billing handoff may need improvement.

It is not engineer fault by default.

### Service Quality Issue

Service quality issue is a human-reviewed quality finding.

It may relate to communication, timing, evidence, service outcome, process, documentation, or customer experience.

It is not automatically engineer fault.

### Repeated Issue Pattern

Repeated issue pattern is a signal that similar problems appear more than once.

It may need review, but it is not automatic proof of fault or discipline.

### AI Coaching Suggestion

AI coaching suggestion is advisory-only.

It may suggest a coaching candidate, process candidate, or missing evidence pattern.

It must not create official coaching, performance, corrective action, or disciplinary record automatically.

### AI Quality Risk Explanation

AI quality risk explanation is a short advisory explanation for why something may need review.

It is not official finding, proof, or decision.

## Boundary Principles

### Engineer Coaching Signal Is Not Disciplinary Record

Engineer coaching signal should be treated as internal support / improvement context.

It must not automatically become:

- disciplinary record,
- negative performance score,
- payroll impact,
- settlement impact,
- customer-facing statement,
- official fault finding.

### Corrective Action Candidate Is Not Confirmed Corrective Action

A candidate means review may be needed.

Confirmed corrective action requires human review and future approved workflow.

### Quality Issue Is Not Engineer Fault

Quality issue may arise from:

- customer expectation mismatch,
- dispatch timing,
- missing parts,
- unclear quote,
- process gap,
- provider communication,
- billing confusion,
- documentation gap,
- engineer behavior,
- product / brand issue.

It must not be attributed to engineer by default.

### Complaint Closure Is Not Coaching Closure

A complaint may be closed while a coaching or process improvement follow-up remains open.

Likewise, coaching may be complete while complaint follow-up remains unresolved.

These are separate workflows.

### Callback Outcome Is Not Corrective Action Approval

Callback may reveal an issue or confirm satisfaction.

It does not approve corrective action, discipline, compensation, billing change, or report correction by itself.

### AI Coaching Suggestion Cannot Create Formal Record

AI may suggest coaching candidate or process improvement candidate.

AI must not create formal coaching, disciplinary, corrective action, or performance record automatically.

### Supervisor Coaching Note Is Internal-only

Supervisor coaching note must not be written into customer-visible data, customer-facing summary, Field Service Report customer summary, provider response, or external handoff.

### Corrective Action Does Not Mutate Official Status

Corrective action must not automatically:

- change Case status,
- change Appointment status,
- change visit result,
- modify Field Service Report,
- change `finalAppointmentId`,
- change billing / settlement approval.

## Future-only Lifecycle Map

The lifecycle below is conceptual only.

It is not:

- schema,
- DB enum,
- API status,
- Admin route,
- localization key,
- runtime behavior.

Future corrective action / coaching lifecycle may include:

1. signal detected
   - source may be survey, complaint, callback, supervisor review, repeat visit, missing evidence, or AI advisory flag.

2. supervisor review needed
   - a human supervisor or quality owner should decide whether the signal needs action.

3. coaching candidate created
   - possible coaching opportunity is recorded for review.

4. process issue candidate created
   - possible SOP / workflow / dispatch / billing handoff issue is recorded for review.

5. human review completed
   - authorized human records review result.

6. coaching action confirmed by human
   - future confirmed coaching action is created only by human decision.

7. process improvement confirmed by human
   - future process improvement is created only by human decision.

8. follow-up tracked
   - future workflow tracks whether action happened.

9. closed by human
   - authorized human closes the coaching / corrective action workflow.

No step above is implemented by Task271.

## Future-only Boundary Matrix

This matrix is conceptual only.

It is not:

- schema,
- DB enum,
- API contract,
- Admin UI behavior,
- runtime logic,
- localization key.

All "may update Case status" values are No.

All "may update Appointment status" values are No.

All "may update Field Service Report" values are No.

All "AI may decide / close" values are No.

All "Runtime allowed now" values are No.

| Scenario | Input source | Possible future output | Customer-visible or internal-only | Requires supervisor review? | May create coaching candidate? | May create corrective action candidate? | May create process improvement candidate? | May affect engineer performance review? | May update Case status? | May update Appointment status? | May update Field Service Report? | AI may suggest? | AI may decide / close? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Low survey score repeated pattern | Survey trend | Quality review / process review candidate | Internal-only | Maybe | Maybe | Maybe | Yes | Future-only maybe after human policy | No | No | No | Yes | No | No |
| Explicit engineer behavior complaint | Customer feedback / complaint | Supervisor review, complaint review, coaching candidate | Internal-only by default | Yes | Maybe | Maybe | Maybe | Future-only maybe after human policy | No | No | No | Yes | No | No |
| Unresolved issue after completion | Survey / callback | Callback review, quality review, possible process issue | Internal-only by default | Maybe | Maybe | Maybe | Yes | No by default | No | No | No | Yes | No | No |
| Repeat visit dissatisfaction | Survey / appointment history | Quality review, process candidate, coaching candidate | Internal-only by default | Maybe | Maybe | Maybe | Yes | Future-only maybe after human policy | No | No | No | Yes | No | No |
| Callback identifies communication issue | Callback outcome | Communication coaching or SOP improvement candidate | Internal-only | Maybe | Maybe | Maybe | Yes | Future-only maybe after human policy | No | No | No | Yes | No | No |
| Callback identifies process issue | Callback outcome | Process improvement candidate | Internal-only | Maybe | No by default | Maybe | Yes | No by default | No | No | No | Yes | No | No |
| Supervisor confirms quality issue | Supervisor review | Confirmed quality issue, follow-up candidate | Internal-only by default | Yes | Maybe | Maybe | Maybe | Future-only maybe after policy | No | No | No | Yes, summarize | No | No |
| Supervisor rejects quality concern | Supervisor review | Dismissed / no action review result | Internal-only by default | Yes | No | No | No | No | No | No | No | Yes, summarize | No | No |
| AI suggests coaching candidate | AI advisory flag | Human review candidate | Internal-only | Yes before action | Maybe after human review | Maybe after human review | Maybe after human review | No by itself | No | No | No | Yes | No | No |
| AI suggests process improvement candidate | AI advisory flag | Human review candidate | Internal-only | Yes before action | No by default | Maybe after human review | Maybe after human review | No by itself | No | No | No | Yes | No | No |
| Safety / misconduct concern | Customer feedback / supervisor flag / AI advisory | High-priority supervisor review candidate | Internal-only by default | Yes | Maybe after human review | Maybe after human review | Maybe | Future-only only after human policy | No | No | No | Yes | No | No |
| Pricing / fee dispute mistakenly attributed to engineer | Customer feedback / billing issue | Billing / Settlement review link first, not engineer fault | Internal-only by default | Maybe | No by default | Maybe if process issue confirmed | Yes, if handoff issue | No by default | No | No | No | Yes | No | No |

## Data Separation Rules

### Signals And Actions Must Stay Separate

Future implementation must keep separate:

- survey signal,
- complaint result,
- callback result,
- AI suggestion,
- supervisor review,
- coaching signal,
- corrective action candidate,
- confirmed corrective action,
- process improvement candidate,
- engineer performance review context.

These concepts should not be collapsed into one status or one note.

### Coaching / Corrective Action Must Not Live Only In Report Notes

Coaching, corrective action, and process improvement should not exist only in Field Service Report internal note.

Field Service Report is the formal completion summary, not the coaching system.

### Customer-visible Data Must Not Expose Internal Coaching

Customer-visible data must not expose:

- engineer coaching note,
- disciplinary implication,
- supervisor internal review,
- AI raw payload,
- audit log,
- internal quality tag,
- internal responsibility determination,
- engineer performance context,
- raw provider payload,
- raw LINE user id,
- full customer mobile value,
- token,
- secret.

### Safety / Misconduct Requires High-priority Human Review

Safety or misconduct concern may be high priority.

AI may flag urgency. AI must not determine truth, fault, discipline, compensation, or closure.

### Pricing / Fee Dispute Should Route Carefully

Pricing or fee dispute should first link to future Billing / Settlement review.

It must not be directly attributed to engineer unless human review confirms a service, communication, or process issue.

## Interaction With Existing Platform Objects

### Case

Corrective action / coaching may reference a Case.

It must not automatically:

- reopen Case,
- close Case,
- change Case status,
- change Case completedAt,
- create duplicate Case.

### Appointment / Dispatch Visit

Corrective action / coaching may reference appointments / visits.

It must not automatically:

- reopen appointment,
- create appointment,
- cancel appointment,
- complete appointment,
- change visit result,
- bypass one-open-appointment guard.

### Field Service Report

Corrective action / coaching may reference the formal Field Service Report.

It must not automatically:

- change report status,
- change report completedAt,
- change report content,
- change `finalAppointmentId`,
- create another formal report.

### Survey Result

Survey result may be an input signal for review.

It must not become coaching record or corrective action automatically.

### Complaint / Callback Future Records

Complaint and callback records may inform coaching or corrective action review.

They must remain separate from coaching / corrective action records.

### Quality Review Future Records

Quality review may identify coaching or process improvement candidate.

It must distinguish signal, review result, and confirmed action.

### Billing / Settlement

Billing / settlement dispute may be related context.

It must not automatically become engineer coaching or corrective action.

### Engineer Profile / Future Performance Context

Engineer performance context, if future product adds it, must require explicit policy, permission, and audit.

Task271 does not implement performance scoring or disciplinary records.

### Audit Log

Future audit should capture important review and action decisions with safe summaries.

Audit logs are internal-only.

### AI Suggestion Records

AI suggestion records should preserve what AI suggested and how humans responded.

They must not become official coaching or corrective action records automatically.

## SaaS-ready / Security Considerations

### Organization Isolation

Corrective action, engineer coaching, quality issue, process improvement, supervisor note, and AI suggestion records must always be scoped by `organization_id`.

No workflow may cross tenant boundaries.

### Role / Permission Separation

Future implementation must decide which roles can:

- view coaching signal,
- create coaching candidate,
- confirm coaching action,
- view supervisor coaching note,
- create corrective action candidate,
- confirm corrective action,
- create process improvement candidate,
- view engineer performance context,
- accept / reject / edit AI coaching suggestion,
- export coaching / quality reports.

Permission must remain distinct from organization entitlement.

### Supervisor-only Access Boundary

Some coaching and corrective action information should be supervisor-only or quality-team-only.

It must not be visible to:

- customers,
- unrelated engineers,
- unauthorized office staff,
- external vendors / brand contacts unless explicit policy permits,
- AI customer-facing response.

### Customer-visible vs Internal-only Policy

Every coaching / corrective action surface must define whether it is:

- customer-visible,
- internal-only,
- supervisor-only,
- engineer-visible,
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

- `coaching.candidate_created`,
- `coaching.action_confirmed`,
- `coaching.closed_by_human`,
- `corrective_action.candidate_created`,
- `corrective_action.confirmed_by_human`,
- `corrective_action.closed_by_human`,
- `process_improvement.candidate_created`,
- `process_improvement.confirmed_by_human`,
- `ai.coaching_suggestion_generated`,
- `ai.coaching_suggestion_accepted`,
- `ai.coaching_suggestion_rejected`,
- `ai.coaching_suggestion_edited`.

These are placeholders only. They are not production event names, DB enums, localization keys, API contracts, or runtime behavior.

### Future Entitlement / Usage Tracking Readiness

Possible future entitlements:

- `engineer_coaching_signal`,
- `corrective_action_review`,
- `process_improvement_review`,
- `quality_review`,
- `supervisor_quality_tools`,
- `ai_coaching_suggestion`,
- `ai_quality_risk_explanation`.

Possible usage tracking:

- AI coaching suggestions,
- AI quality explanations,
- coaching report exports,
- scheduled quality reports,
- supervisor dashboard exports.

These are future planning examples only.

### AI Add-on Readiness

AI coaching and quality analysis should remain optional and controllable through future AI Add-on / feature entitlement / usage limits.

AI must still respect:

- organization scope,
- user permission,
- supervisor-only boundaries,
- customer-visible policy,
- internal-only policy,
- masking,
- audit,
- human review.

## Runtime Forbidden Confirmation

Task271 does not approve:

- corrective action runtime,
- engineer coaching runtime,
- quality review runtime,
- complaint workflow runtime,
- callback / follow-up runtime,
- survey runtime,
- escalation workflow runtime,
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

Task271 confirms:

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
- no corrective action runtime,
- no engineer coaching runtime,
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

Task271 establishes docs-only corrective action and engineer coaching boundary guidance.

It confirms:

- engineer coaching signal is not disciplinary record,
- corrective action candidate is not confirmed corrective action,
- quality issue is not engineer fault,
- complaint closure is not coaching closure,
- callback outcome is not corrective action approval,
- AI coaching suggestion cannot create formal coaching / disciplinary record,
- supervisor coaching note must not be customer-visible,
- corrective action cannot automatically update Case, Appointment, or Field Service Report,
- no corrective action / coaching / quality review runtime is approved.

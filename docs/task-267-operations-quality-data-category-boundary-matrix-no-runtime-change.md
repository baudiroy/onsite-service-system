# Task 267 - Operations / Quality Data Category Boundary Matrix / No Runtime Change

## Purpose And Scope

This document extends Task266 with a docs-only data category boundary matrix for the Operations / Quality branch.

It separates customer-visible feedback, internal quality tracking, supervisor review, AI risk flags, official Case data, official Appointment / Dispatch Visit data, and official Field Service Report data.

Task267 is documentation-only.

This task is not:

- operations workflow runtime,
- quality review runtime,
- complaint workflow runtime,
- callback / follow-up runtime,
- customer satisfaction survey runtime,
- SLA runtime,
- AI risk runtime,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- automated test implementation,
- provider sending,
- AI / RAG runtime.

Task267 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why Data Category Boundaries Are Needed After Task266

Task266 opened the Operations / Quality branch and mapped future concepts:

- customer satisfaction survey result,
- negative feedback,
- complaint / customer escalation,
- callback / follow-up,
- service quality review,
- SLA / operations risk signal,
- engineer coaching signal,
- repeat visit / unresolved case signal,
- AI risk flag / suggestion.

Task267 adds a data boundary matrix because those concepts are easy to misuse if they are stored or displayed in the wrong place.

The product must avoid:

- placing complaint workflow only in Field Service Report internal note,
- using survey free text as official Case status,
- turning AI risk flag into official complaint,
- exposing supervisor notes to customers,
- mixing callback attempts with appointment status,
- turning repeat visit risk into a second formal Field Service Report,
- allowing negative feedback to mutate completed service facts.

Data category separation protects the customer, the operator, the engineer, the supervisor, the organization, and future AI / SaaS boundaries.

## Data Category Definitions

### Customer-visible Communication / Survey-facing Data

Customer-visible communication / survey-facing data is information the customer submitted or may safely see according to future policy.

Examples:

- submitted rating,
- submitted feedback text,
- safe response received message,
- safe callback acknowledgement,
- approved service recovery message,
- approved customer-visible service result summary.

This category must not contain internal labels, AI risk scores, supervisor notes, engineer internal comments, audit logs, internal settlement / billing data, raw provider payloads, or raw LINE user ids.

### Internal-only Quality Tracking Data

Internal-only quality tracking data supports service quality management and operations follow-up.

Examples:

- negative feedback classification,
- quality category,
- service dissatisfaction reason,
- repeat visit risk,
- unresolved case risk,
- engineer coaching signal,
- internal quality review state.

This category may reference customer-submitted content, but it must not become customer-visible by default.

### Supervisor Review / Escalation Data

Supervisor review / escalation data supports human review of higher-risk quality events.

Examples:

- escalation reason,
- supervisor note,
- assigned reviewer,
- review outcome,
- service recovery proposal,
- complaint review decision,
- follow-up required decision.

This category is internal-only unless a future approved customer-facing message is explicitly generated.

### AI Suggestion / Risk Flag Data

AI suggestion / risk flag data is advisory and separate from official records.

Examples:

- AI-generated risk flag,
- AI-generated feedback summary,
- AI-generated callback priority suggestion,
- AI-generated unresolved case explanation,
- AI-generated engineer coaching suggestion.

AI output must support human accept / reject / edit and must never be treated as official record by default.

### Official Case Data

Official Case data is the formal case-level business record.

Examples:

- Case status,
- customer / organization linkage,
- Case completion context,
- Case-level service result summary where official,
- Case-level ownership and lifecycle state.

Operations / Quality signals may reference Case data. They must not automatically mutate official Case status.

### Official Appointment / Dispatch Visit Data

Official Appointment / Dispatch Visit data records each visit and dispatch outcome.

Examples:

- appointment status,
- visit sequence,
- visit result,
- pending parts,
- no show,
- cancelled,
- unable to repair,
- actual arrival / finish context,
- next action.

Operations / Quality may reference abnormal outcomes. It must not turn quality review or complaint review into appointment status changes without a separate approved workflow.

### Official Field Service Report Data

Official Field Service Report data is the one formal Case-level completion report.

Examples:

- final service result,
- onsite completion time,
- `finalAppointmentId`,
- formal completion summary,
- approved service report content.

The Field Service Report is not:

- one report per visit,
- a complaint tracking table,
- a callback tracking table,
- a quality review queue,
- an AI risk flag store.

## Data Boundary Matrix

This matrix is proposal-only.

All "AI may decide / close" values are No.

All "Runtime allowed now" values are No.

| Data / signal | Primary data category | Customer-visible or internal-only | May update official Case status? | May update Appointment / Dispatch Visit status? | May update formal Field Service Report? | Requires human review? | AI may suggest? | AI may decide / close? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Survey score | Customer-visible communication / survey-facing data | Customer-submitted; internal review metadata is internal | No | No | No | Maybe, if low score | Yes, summarize trend | No | No |
| Survey free-text feedback | Customer-visible communication / survey-facing data | Customer-submitted; internal classification is internal | No | No | No | Maybe, if negative or risky | Yes, summarize / classify | No | No |
| Negative feedback classification | Internal-only quality tracking data | Internal-only | No | No | No | Yes if high risk | Yes | No | No |
| Customer complaint / escalation | Supervisor review / escalation data | Internal-only by default, safe customer communication only | No by default | No | No | Yes | Yes, flag risk | No | No |
| Callback required flag | Internal-only quality tracking data | Internal-only by default | No | No | No | Yes | Yes | No | No |
| Callback attempt / result | Internal-only quality tracking data | Safe customer-facing acknowledgement only if policy allows | No | No | No | Yes | Yes, draft internal note | No | No |
| Quality review outcome | Supervisor review / escalation data | Internal-only unless approved summary exists | No by default | No by default | No by default | Yes | Yes | No | No |
| Supervisor note | Supervisor review / escalation data | Internal-only | No | No | No | Yes | Yes, summarize for supervisor | No | No |
| Engineer coaching signal | Internal-only quality tracking data | Internal-only | No | No | No | Yes | Yes | No | No |
| Repeat visit risk signal | Internal-only quality tracking data | Internal-only by default | No | No | No | Yes if high risk | Yes | No | No |
| Unresolved case risk signal | Internal-only quality tracking data | Internal-only by default | No | No | No | Yes | Yes | No | No |
| SLA / operations risk signal | Internal-only quality tracking data | Internal-only by default | No | No | No | Yes if escalated | Yes | No | No |
| AI-generated risk flag | AI suggestion / risk flag data | Internal-only | No | No | No | Yes | Yes | No | No |
| AI-generated summary / suggestion | AI suggestion / risk flag data | Internal-only unless human approves safe wording | No | No | No | Yes before official use | Yes | No | No |
| Formal completion facts | Official Field Service Report data | Customer-visible only through approved service summary | Yes only through existing completion workflow, not quality signal | No | Yes only through existing approved report workflow | Already controlled by completion workflow | No by default | No | No |
| Appointment abnormal outcome | Official Appointment / Dispatch Visit data | Maybe safe summary; internal detail remains internal | No by itself | Yes only through appointment workflow, not quality review | No | Depends on outcome | Yes, flag pattern | No | No |
| Customer-visible service result summary | Official Field Service Report data | Customer-visible after approval | No | No | No after completion unless approved correction workflow exists | Yes before publishing | Yes, draft only | No | No |

## Explicit Boundary Rules

### Feedback And Complaint Data Must Not Become Service Report Notes Only

Customer complaints, negative feedback, callbacks, quality review, and follow-up tracking must not exist only in Field Service Report internal note.

The Field Service Report remains the formal Case-level completion summary. It is not a quality workflow system.

### AI Risk Flags Must Stay Separate From Official Records

AI risk flag / suggestion must be stored, reviewed, and displayed separately from official Case, Appointment, Dispatch Visit, Field Service Report, complaint, callback, and quality review state until a future approved workflow exists.

AI may explain why something looks risky. It cannot close, approve, dismiss, or mutate official records.

### Customer-visible Data Must Stay Safe

Customer-visible data must not include:

- internal-only supervisor note,
- internal quality labels,
- AI raw payload,
- AI risk label,
- engineer internal comment,
- audit log,
- provider diagnostics,
- internal responsibility determination,
- billing / settlement internal data,
- raw LINE user id,
- full customer mobile value,
- token,
- secret.

Customer-facing wording should be safe, minimal, and approved.

### Field Service Report Is Not A Complaint Tracker

The formal Field Service Report remains one Case-level completion report.

It is not:

- one report per appointment,
- a complaint tracker,
- a follow-up tracker,
- a quality review queue,
- an AI risk database,
- a supervisor coaching record.

### Appointment / Dispatch Visit Carries Visit-level Outcomes

Appointment / Dispatch Visit remains the proper home for visit-level outcomes such as:

- pending parts,
- customer unavailable,
- no show,
- cancelled,
- unable to repair,
- quote needed,
- incomplete visit,
- repeat visit context.

Operations / Quality may analyze these outcomes, but it must not redefine visit result semantics.

## SaaS / Security Considerations

### Organization Isolation

All future Operations / Quality data must be scoped by `organization_id`.

No survey result, complaint review, callback, quality review, SLA signal, AI risk flag, dashboard, export, or report may cross organization boundaries.

### Role / Permission Separation

Future implementation must decide which roles can:

- view customer feedback,
- classify negative feedback,
- create complaint review,
- assign callback,
- record callback result,
- resolve quality review,
- view supervisor note,
- view engineer coaching signal,
- view AI risk flag,
- accept / reject / edit AI suggestion,
- export quality report.

Permission is user-level access control. Entitlement is organization-level feature availability. They must remain separate.

### Customer-visible vs Internal-only Policy

Every Operations / Quality feature must define whether its data is:

- customer-visible,
- customer-submitted but internally classified,
- internal-only,
- supervisor-only,
- AI advisory-only,
- audit-only.

The same fact may have both a customer-facing safe summary and an internal-only review record, but they should not be the same payload.

### Field-level Masking Readiness

Future displays, exports, dashboards, AI context, and reports must support masking or exclusion for:

- customer mobile values,
- addresses,
- raw LINE user ids,
- email,
- signatures,
- photos,
- internal notes,
- supervisor notes,
- audit logs,
- AI raw payloads.

### Audit Readiness

Future audit event families may include:

- `feedback.review_classified`,
- `complaint.review_requested`,
- `complaint.review_resolved`,
- `callback.required_marked`,
- `callback.attempt_recorded`,
- `quality.review_outcome_recorded`,
- `supervisor.note_added`,
- `engineer.coaching_signal_created`,
- `ai.quality_risk_flag_generated`,
- `ai.quality_suggestion_accepted`,
- `ai.quality_suggestion_rejected`,
- `ai.quality_suggestion_edited`.

These are placeholders only. They are not production event names, DB enums, localization keys, API contracts, or runtime behavior.

### Future Entitlement / Usage Tracking Readiness

Possible future entitlements:

- `customer_feedback`,
- `quality_follow_up`,
- `complaint_review`,
- `service_quality_review`,
- `role_dashboard`,
- `sla_risk_tracking`,
- `engineer_coaching_signal`,
- `ai_risk_radar`,
- `ai_customer_feedback_summary`.

Possible usage tracking:

- AI quality summaries,
- AI risk flag generation,
- report exports,
- dashboard exports,
- scheduled quality reports,
- callback notifications,
- customer self-service inquiry.

These are future planning examples only.

### AI Add-on Readiness

AI quality and risk analysis should remain optional and controllable through future AI Add-on / feature entitlement / usage limits.

AI must still respect:

- organization scope,
- user permission,
- data visibility,
- field-level masking,
- audit requirements,
- human review.

## Runtime Forbidden Confirmation

Task267 does not approve:

- customer feedback runtime,
- survey response runtime,
- negative feedback classification runtime,
- complaint workflow runtime,
- callback / follow-up runtime,
- quality review runtime,
- supervisor review runtime,
- engineer coaching runtime,
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

Task267 confirms:

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
- no quality review runtime,
- no callback runtime,
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

Task267 establishes a docs-only Operations / Quality data category boundary matrix.

It confirms:

- customer-visible feedback is not internal quality review,
- internal quality review is not supervisor approval by default,
- supervisor notes are not customer-visible,
- AI risk flags are not official records,
- official Case / Appointment / Field Service Report data remains governed by existing workflows,
- Field Service Report is not a complaint tracker,
- Appointment / Dispatch Visit remains the visit-level outcome layer,
- no Operations / Quality runtime is approved.

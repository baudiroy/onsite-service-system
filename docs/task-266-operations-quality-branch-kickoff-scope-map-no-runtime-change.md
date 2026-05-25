# Task 266 - Operations / Quality Branch Kickoff Scope Map / No Runtime Change

## Purpose And Scope

This document opens a docs-only Operations / Quality design branch after the Billing / Settlement branch readiness closure in Task265.

The purpose is to map future boundaries for operational quality, customer feedback, complaint risk, follow-up, service quality review, supervisor tracking, repeat visit signals, SLA / operations risk signals, and AI advisory risk flags.

Task266 is documentation-only.

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

Task266 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why This Branch Follows Billing / Settlement Readiness Closure

Task259 through Task265 clarified future billing, customer fee consent, quote, approval, settlement, payment, and invoice boundaries.

That branch is ready to pause because:

- billing item categories are documented,
- customer fee consent is separated from notes and settlement approval,
- quote acceptance is separated from settlement approval,
- settlement calculation is separated from settlement approval,
- AI may suggest but never approve,
- runtime allowed now remains No.

Operations / Quality is a natural next docs-only branch because real onsite service quality issues often appear across multiple adjacent workflows:

- customer satisfaction survey results,
- low ratings and negative comments,
- complaint or escalation risk,
- callbacks and follow-up,
- repeat visits,
- unresolved cases,
- SLA / operations risk,
- engineer coaching,
- supervisor review,
- AI risk radar.

These concepts must not be mixed into billing approval, Field Service Report notes, appointment status, or survey raw payload without clear boundaries.

## Operations / Quality Branch Purpose

The future Operations / Quality branch should help the platform support:

- service quality visibility,
- customer dissatisfaction follow-up,
- complaint risk review,
- human callback / follow-up workflow,
- supervisor review,
- engineer coaching signals,
- repeat visit and unresolved case review,
- SLA and operations risk visibility,
- AI advisory risk flags,
- customer-visible / internal-only separation,
- audit, permission, entitlement, and usage readiness.

The branch should not turn every signal into an automatic status change. It should help humans see the right work, at the right time, with the right boundaries.

## Concept Map

The concepts below are proposal-only.

They are not:

- table names,
- schema proposals,
- API contracts,
- Admin UI routes,
- production statuses,
- runtime states,
- automated workflows.

| Concept | Primary purpose | Typical source | Suggested data layer | Customer-visible? | Internal-only? | AI may suggest? | AI may decide? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Customer satisfaction survey result | Capture customer post-service feedback | Future survey response | Feedback / survey layer | Customer submitted content may be visible back to customer by policy | Review metadata is internal | Yes, summarize | No | No |
| Negative feedback | Identify dissatisfaction signal | Low rating or negative comment | Feedback / quality layer | Original customer statement may be customer-owned | Internal categorization is internal | Yes, classify / summarize | No | No |
| Complaint / customer escalation | Track formal or potential complaint requiring human review | Customer service flag, supervisor flag, survey text, external channel | Complaint / review layer | Safe customer communication only | Complaint classification, risk score, supervisor notes are internal | Yes, flag risk | No | No |
| Callback / follow-up | Ensure human contact after dissatisfaction, unresolved issue, or risk | Survey, complaint, manual flag, SLA signal | Follow-up layer | Safe callback commitment may be visible | Internal assignment and notes are internal | Yes, suggest priority | No | No |
| Service quality review | Review service result, evidence, repeated issue, or customer experience | Field Service Report, appointments, survey, complaint | Quality review layer | Usually no, unless approved summary is shared | Yes | Yes, organize evidence | No | No |
| SLA / operations risk signal | Identify stale, blocked, overdue, or risky work | Case, appointment, communication, pending parts, quote, follow-up | Operations risk layer | Usually no direct customer visibility | Yes | Yes, flag risk | No | No |
| Engineer coaching signal | Identify training, process, or quality improvement signal | Repeat visit, missing evidence, customer feedback, supervisor review | Internal coaching layer | No | Yes | Yes, suggest pattern | No | No |
| Repeat visit / unresolved case signal | Highlight unresolved or recurring service issue | Multiple appointments, pending parts, no_show, incomplete visit, complaint | Case / appointment review layer | Maybe safe status summary | Internal root-cause review is internal | Yes, summarize | No | No |
| AI risk flag / suggestion | Advisory signal for humans | Permission-aware AI analysis | AI advisory layer | No by default | Yes | Yes | No | No |

## Data Category Separation

Operations / Quality data must be separated by intended audience and authority.

### Customer-visible Data

Customer-visible data may include:

- customer-submitted satisfaction rating,
- customer-submitted feedback text,
- safe response received message,
- safe callback / follow-up message,
- approved service recovery wording,
- customer-visible appointment or Case progress summary,
- customer-visible completed service summary where already approved.

Customer-visible output must not expose:

- internal complaint classification,
- AI risk label,
- supervisor note,
- engineer internal comment,
- audit log,
- billing internal data,
- settlement internal data,
- provider diagnostics,
- raw LINE user id,
- raw provider payload,
- internal responsibility determination.

### Internal-only Quality Data

Internal-only quality data may include:

- quality review reason,
- quality category,
- root-cause hypothesis,
- customer dissatisfaction classification,
- repeat visit reason review,
- engineer coaching note,
- service recovery proposal,
- unresolved risk marker,
- internal follow-up priority,
- supervisor review note,
- AI advisory explanation.

Internal-only data still requires organization scope, role / permission checks, and redaction rules.

### Supervisor Review Data

Supervisor review data may include:

- review requested reason,
- review status,
- assigned reviewer,
- reviewed by,
- reviewed at,
- decision,
- safe internal note,
- linked evidence references,
- whether follow-up is required.

Supervisor review must be a human-controlled process. AI may suggest review, but must not approve, dismiss, resolve, or close review.

### AI Suggestion / Risk Flag Data

AI suggestion / risk flag data may include:

- suggested risk type,
- explanation,
- confidence category,
- referenced source types,
- whether a human accepted, rejected, ignored, or edited the suggestion,
- feedback for future model evaluation.

AI suggestion data must remain separate from official Case, Appointment, Field Service Report, formal complaint, and customer-visible communication until a human or deterministic approved workflow acts.

### Official Case / Appointment / Field Service Report Data

Official records remain governed by existing invariants:

- Case status is not automatically changed by quality signal.
- Appointment status is not automatically changed by survey result or complaint risk.
- Field Service Report status is not automatically changed by feedback, complaint, or AI risk.
- `finalAppointmentId` is not changed by Operations / Quality data.
- Repeat visit signals do not create multiple formal Field Service Reports.

Operations / Quality may reference official records. It must not casually rewrite them.

## Alignment With Existing Rules

### One Case, One Formal Field Service Report

Operations / Quality review must not create one Field Service Report per complaint, callback, survey response, or repeat visit.

The Field Service Report remains the Case-level formal completion summary.

### Multi-visit And Appointment-level Outcomes

Multiple visits and abnormal outcomes remain appointment / dispatch visit context.

Examples:

- pending parts,
- no show,
- cancelled appointment,
- unable to repair,
- quote needed,
- repeated reschedule,
- incomplete service,
- customer unavailable.

Operations / Quality may reference these signals, but they remain visit context and do not create additional formal reports.

### Survey Default Context

Future satisfaction survey is expected to align with Case-level completion and the final completed appointment context.

Default policy:

- survey should follow final service completion,
- survey should use the completed report's stable `finalAppointmentId` where available,
- survey should not be sent before service result confirmation,
- survey result should not directly modify Case / Appointment / Field Service Report status.

Task266 does not implement survey runtime or survey sending.

### Feedback / Complaint / Follow-up Separation

Customer feedback, complaint risk, callback, follow-up, and quality review should not be mixed into:

- Field Service Report internal note,
- appointment completion note,
- billing / settlement approval note,
- audit log customer-facing output,
- AI raw payload,
- provider delivery diagnostics.

They may reference each other through safe IDs or future evidence references after a separate schema and runtime design.

### AI Advisory-only Boundary

AI may:

- summarize survey feedback,
- classify possible dissatisfaction themes,
- flag complaint risk,
- identify repeat visit patterns,
- suggest callback priority,
- summarize unresolved case context,
- suggest engineer coaching signal,
- detect missing evidence or missing follow-up,
- draft internal review notes for human review.

AI must not:

- automatically close complaint,
- automatically hide negative feedback,
- automatically mark follow-up complete,
- automatically mark Case completed or reopened,
- automatically change Appointment status,
- automatically change Field Service Report status,
- automatically assign fault,
- automatically approve compensation,
- automatically promise refund, discount, or free service,
- bypass permission, entitlement, organization scope, or data access policy.

## SaaS-ready / Permission-ready / Audit-ready Considerations

### Organization Isolation

Operations / Quality data must always be scoped to `organization_id`.

Future risk signals, feedback, complaint reviews, callback records, dashboards, AI suggestions, and exports must not cross tenant boundaries.

### Role / Permission Separation

Different roles may need different future access:

- customer service: callback queue and customer communication follow-up,
- dispatch: unresolved appointment and repeat visit signals,
- engineer lead: missing evidence and coaching signals,
- supervisor: complaint risk, escalation, service recovery review,
- finance: only quality signals relevant to approved billing / settlement workflow,
- admin: configuration and permission management.

Future implementation must define permission separately from organization entitlement.

### Customer-visible vs Internal-only Policy

Customer-facing channels may see only safe, approved summaries.

Internal quality risk labels, AI flags, supervisor notes, root-cause hypotheses, audit logs, provider diagnostics, and internal responsibility determination must not become customer-visible by accident.

### Future Plan Entitlement

Operations / Quality features may eventually require SaaS plan / entitlement decisions.

Possible future feature keys:

- `customer_feedback`,
- `quality_follow_up`,
- `complaint_review`,
- `service_quality_review`,
- `sla_risk_tracking`,
- `role_dashboard`,
- `engineer_coaching_signal`,
- `ai_risk_radar`,
- `ai_customer_feedback_summary`.

These are placeholder examples only, not implemented feature keys.

### Usage Tracking Readiness

Future usage tracking may apply to:

- survey analysis,
- AI risk radar,
- feedback summary generation,
- scheduled quality reports,
- dashboard export,
- customer callback notification,
- customer self-service inquiry.

Task266 does not implement usage tracking.

### AI Add-on Readiness

AI risk and quality analysis should be treated as optional AI add-on capability in future SaaS packaging.

Even if an organization has AI entitlement, user permission, organization scope, data visibility, masking, and audit rules still apply.

### Audit Log Readiness

Future audit event families may include:

- `quality.review_requested`,
- `quality.review_assigned`,
- `quality.review_resolved`,
- `complaint.risk_flagged`,
- `complaint.review_created`,
- `complaint.review_resolved`,
- `callback.requested`,
- `callback.completed`,
- `follow_up.required`,
- `follow_up.resolved`,
- `ai.quality_risk_suggested`,
- `ai.quality_suggestion_accepted`,
- `ai.quality_suggestion_rejected`,
- `ai.quality_suggestion_edited`.

These are placeholders only. They are not production event names, DB enums, localization keys, API contracts, or runtime behavior.

Audit records must not contain full customer mobile values, raw LINE user ids, tokens, secrets, raw provider payloads, customer signature data, or unnecessary AI raw sensitive payload.

## Runtime Forbidden Confirmation

Task266 does not approve:

- customer feedback runtime,
- survey response runtime,
- complaint workflow runtime,
- callback / follow-up runtime,
- service quality review runtime,
- SLA / operations risk runtime,
- engineer coaching runtime,
- role dashboard runtime,
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

Task266 confirms:

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

## Branch Kickoff Conclusion

Task266 establishes the Operations / Quality branch scope map only.

The branch should proceed with docs-only boundary work unless the user and PM explicitly approve runtime, migration, API, Admin, provider, AI, audit, permission, entitlement, usage, or test implementation.

Recommended next docs-only directions may include:

- quality signal taxonomy,
- complaint vs negative feedback distinction,
- callback / follow-up workflow boundary,
- supervisor review queue policy,
- AI risk flag review policy,
- customer-visible vs internal-only quality data matrix,
- Operations / Quality readiness gate.

No runtime implementation is approved by this kickoff.

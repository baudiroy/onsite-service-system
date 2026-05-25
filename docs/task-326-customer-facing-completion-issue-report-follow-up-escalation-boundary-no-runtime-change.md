# Task 326 - Customer-facing Completion Issue Report / Follow-up Escalation Boundary / No Runtime Change

## Scope And Non-goals

This document follows Task324 and Task325.

Task326 defines docs-only boundaries for future customer-facing completion issue reports and follow-up / escalation handling when a customer reports:

- I have a question,
- issue not resolved,
- need customer service contact,
- negative feedback,
- complaint,
- callback request,
- fee dispute,
- safety concern,
- engineer behavior issue.

Task326 clarifies how these future signals relate to:

- follow-up entries,
- escalation candidates,
- Operations / Quality review,
- Case,
- Appointment,
- Field Service Report,
- customer-facing service report,
- survey feedback,
- contact history,
- access log,
- audit readiness,
- AI advisory classification.

Task326 is not:

- backend runtime,
- Admin runtime,
- API contract change,
- migration,
- schema change,
- index change,
- view change,
- DB / DDL execution,
- issue report runtime,
- follow-up runtime,
- escalation runtime,
- complaint runtime,
- callback runtime,
- customer-facing report runtime,
- survey runtime,
- notification / provider sending runtime,
- file upload runtime,
- access log runtime,
- audit runtime,
- permission / entitlement / usage runtime,
- AI / RAG runtime,
- test / smoke / fixture change,
- package change,
- inventory documentation change.

No runtime implementation is approved by this document.

## Why This Follows Task325

Task325 clarified that report open, read, click, and download are access events only. They do not imply customer approval, customer acceptance, fee consent, or issue closure.

Task326 covers the next customer-facing action: after a customer opens or downloads a report, they may report an unresolved issue, request support, leave negative feedback, dispute a charge, or raise a complaint.

This document prevents future implementation from accidentally:

- reopening a Case automatically from a customer issue report,
- invalidating the Field Service Report automatically,
- treating low score as a confirmed complaint without review,
- storing issue reports only as Field Service Report internal notes,
- allowing AI to close complaints or make official decisions,
- modifying Case / Appointment / FSR state from customer-facing page input,
- exposing internal notes or audit details in customer-facing issue responses.

## Definitions

### Customer-facing Issue Report

A future customer-submitted signal from LINE, App, Web, Email, phone intake, or report page indicating that the customer has a question, concern, unresolved issue, or request for contact after completion.

### Unresolved Issue Report

A customer-facing issue report that says the service did not fully solve the problem, the same issue remains, a related issue occurred, or the customer needs additional review.

### Need Customer Service Contact

A customer request for a customer service agent to follow up. It is a callback / contact request, not an automatic complaint closure or appointment change.

### Negative Feedback

Low satisfaction, negative wording, or dissatisfaction signal. Negative feedback may indicate risk but is not automatically a confirmed complaint.

### Complaint Candidate

A future internal candidate requiring human review before it becomes a confirmed complaint, escalation, corrective action, refund discussion, or re-dispatch decision.

### Callback Request

A customer request for a human contact. It should create a future follow-up candidate but must not imply that the issue is resolved or closed.

### Follow-up Entry

A future trackable work item for customer service, operations, quality, or supervisor handling after a customer-facing issue signal.

### Escalation Candidate

A future higher-risk follow-up candidate that may require supervisor, quality, finance, legal, or management review.

### Operations / Quality Review Candidate

A future internal review candidate for unresolved issue, negative feedback, repeat visit, engineer behavior issue, safety concern, complaint, or service quality risk.

### Customer-visible Report Page

The future customer-facing page where a customer views the customer-facing service report, downloads the report, submits questions, reports issues, requests support, or accesses survey / feedback flows.

## Boundary Principles

- Issue report is not Case reopened.
- Issue report is not Field Service Report invalidated.
- Issue report is not Appointment status changed.
- Low score / negative feedback is not automatically a confirmed complaint.
- Callback request is not complaint closure.
- Customer-facing issue report must not directly modify Case status.
- Customer-facing issue report must not directly modify Appointment status.
- Customer-facing issue report must not directly modify Field Service Report status or content.
- Customer-facing issue report must not be stored only in FSR internal note.
- Follow-up / escalation requires future human review.
- Complaint confirmation requires future human review and policy.
- Re-dispatch evaluation requires future authorized workflow.
- Fee dispute requires future customer fee consent / billing / settlement review workflow.
- AI may classify, summarize, and flag risk.
- AI must not close, decide, change official state, promise compensation, approve refund, modify service report, or publish customer-facing resolution.
- Issue report acknowledgement must be safe and generic. It should not expose internal triage logic, internal notes, audit details, or hidden risk labels.

## Future-only Issue / Follow-up Matrix

| Issue / action | Source channel / actor | Customer-visible? | Internal-only? | May update Case status? | May update Appointment status? | May update Field Service Report? | May create follow-up / escalation candidate? | Requires human review? | AI may classify / summarize? | AI may decide / close? | Requires contact / access log? | Requires audit readiness? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Customer clicks "I have a question" | Customer via report page / LINE / App / Web | Yes | No | No | No | No | Yes | Yes, before closure | Yes | No | Yes | Yes | No |
| Customer reports unresolved issue | Customer via report page / LINE / App / Web / phone | Yes | No | No | No | No | Yes | Yes | Yes | No | Yes | Yes | No |
| Customer requests callback | Customer via report page / LINE / App / Web / SMS guidance / phone | Yes | No | No | No | No | Yes | Yes | Yes | No | Yes | Yes | No |
| Customer submits negative feedback | Customer via survey / report page / LINE / App / Web | Yes | No | No | No | No | Yes, if policy threshold met | Yes, for high-risk / low score | Yes | No | Yes | Yes | No |
| Customer raises complaint | Customer via any supported channel | Yes | No | No | No | No | Yes | Yes | Yes | No | Yes | Yes | No |
| Customer disputes fee | Customer via report page / LINE / App / Web / phone | Yes | No | No | No | No | Yes | Yes, billing / CS review | Yes | No | Yes | Yes | No |
| Customer reports safety concern | Customer via any supported channel | Yes | No | No | No | No | Yes, likely escalation | Yes | Yes | No | Yes | Yes | No |
| Customer says engineer behavior issue | Customer via any supported channel | Yes | No | No | No | No | Yes, operations / quality candidate | Yes | Yes | No | Yes | Yes | No |
| Customer uploads supporting photo candidate | Customer via future file flow | Yes, upload action only | Content internal until reviewed | No | No | No | Yes | Yes | Yes, metadata / summary only | No | Yes | Yes | No |
| Issue classified as low-risk follow-up | CS / system-assisted triage | Customer may see acknowledgement | Internal triage | No | No | No | Yes | Yes, before closure | Yes | No | Yes | Yes | No |
| Issue classified as complaint candidate | CS / supervisor / AI-assisted triage | Customer may see acknowledgement | Internal triage | No | No | No | Yes | Yes | Yes | No | Yes | Yes | No |
| Issue escalated to supervisor candidate | CS / quality / system-assisted triage | Customer may see acknowledgement | Internal triage | No | No | No | Yes | Yes | Yes | No | Yes | Yes | No |
| Callback completed by human candidate | Human CS / supervisor | Customer participates | Internal outcome details | No | No | No | Yes, update follow-up candidate only | Yes | Yes, summary draft only | No | Yes | Yes | No |
| Follow-up closed by human candidate | Human CS / supervisor / operations | Customer may see safe closure message | Internal decision details | No | No | No | Yes, close follow-up candidate only | Yes | Yes, summary draft only | No | Yes | Yes | No |

All rows are future-only. Customer-facing issue reports and follow-up / escalation candidates must not directly mutate Case, Appointment, or Field Service Report status.

## Data Protection Rules

Issue report, follow-up records, escalation records, callback notes, survey feedback, customer-facing acknowledgements, logs, errors, frontend responses, notification payloads, and AI context must not expose:

- internal note,
- audit log,
- AI raw payload,
- AI risk flag,
- billing internal data,
- settlement internal data,
- engineer internal comment,
- supervisor review record,
- vendor reconciliation rule,
- internal cost,
- unauthorized data.

Logs, errors, frontend responses, AI context, customer acknowledgements, and triage summaries must not expose:

- complete phone values,
- complete email values,
- complete addresses beyond what is necessary and authorized,
- provider tokens,
- secrets,
- LINE access tokens,
- channel secrets,
- raw LINE identifiers,
- raw provider payloads,
- verification codes,
- raw signature data,
- unmasked photos,
- unrestricted customer private data.

Customer-uploaded supporting evidence should be a future file metadata reference. It must not be stored as raw content in the core issue / follow-up record.

AI context for issue classification should use minimum necessary, permission-scoped, organization-scoped, redacted data.

## Safe Customer-facing Acknowledgement

Future customer-facing acknowledgements should be simple and safe.

They may say:

- the issue was received,
- customer service will review,
- a callback may be arranged,
- the customer can contact support if urgent.

They must not say:

- the Case has been reopened unless an authorized workflow actually does that,
- the Field Service Report is invalid unless an authorized workflow actually does that,
- compensation is approved,
- refund is approved,
- a new appointment is confirmed,
- an engineer fault is confirmed,
- a complaint is closed,
- internal risk level or internal investigation result.

## Interaction With Existing Branches

### Customer-facing Completion Flow

Issue reporting is part of the future customer-facing completion experience. It must remain separate from internal FSR content and state.

### Customer-facing Report Versioning / Access / Download

Issue reports may originate from a report page or link access flow, but report open / download does not imply issue resolution, consent, or closure.

### Operations / Quality Complaint / Callback / Human Review

Issue reports should create future follow-up / escalation candidates that feed operations and quality review. This task does not implement that runtime.

### Survey Feedback To Risk Signal

Low score, negative feedback, or customer comments may become future risk signals. They require human review before confirmed complaint or closure decisions.

### Audit Log / Evidence Traceability

Issue reports, supporting evidence, callback attempts, human decisions, escalations, and closure decisions should be audit-ready.

### Data Access Control

Issue report creation, viewing, classification, escalation, callback, closure, and customer acknowledgement must follow the shared Data Access Control model.

### Customer Channel Identity / Notification

Issue reporting and callback flows may involve LINE / App / Web / SMS / Email / phone, but raw channel identifiers must not be exposed.

### Billing / Settlement Fee Dispute Boundary

Fee disputes must flow to future customer fee consent, billing, settlement, or reconciliation review. They must not directly mutate internal billing / settlement results from a customer-facing report page.

### AI Advisory-only

AI may classify, summarize, detect urgency, draft internal summaries, and propose next action.

AI must not decide, close, promise compensation, approve refund, modify official state, modify Field Service Report, hide negative feedback, or publish a customer-facing resolution without human-controlled workflow.

## Explicit Runtime Forbidden Confirmation

Task326 does not allow:

- backend runtime,
- Admin runtime,
- API change,
- migration,
- schema change,
- index change,
- view change,
- DB connection,
- DDL,
- psql,
- `npm run db:migrate`,
- Migration020 dry-run or apply,
- issue report runtime,
- follow-up runtime,
- escalation runtime,
- complaint runtime,
- callback runtime,
- customer-facing report runtime,
- access link runtime,
- download runtime,
- completion runtime change,
- Field Service Report runtime change,
- signature runtime,
- file / photo runtime,
- invoice runtime,
- payment runtime,
- billing runtime,
- settlement runtime,
- survey runtime,
- notification / provider sending runtime,
- customer channel identity runtime,
- permission runtime,
- entitlement runtime,
- usage runtime,
- audit runtime,
- AI / RAG runtime,
- tests / smoke / fixtures change,
- package change,
- inventory docs change.

## Non-goals

Task326 must not:

- modify backend `src/`,
- modify Admin `admin/src/`,
- add or modify API behavior,
- add or modify migrations / schema / indexes / views,
- connect to DB,
- execute DDL,
- run psql,
- run `npm run db:migrate`,
- execute Migration020 dry-run or apply,
- add issue report runtime,
- add follow-up / escalation / complaint / callback runtime,
- add customer-facing report / access link / download runtime,
- add completion / Field Service Report runtime,
- add signature / file / photo runtime,
- add invoice / payment / billing / settlement runtime,
- add survey runtime,
- add notification / provider sending runtime,
- add customer channel identity runtime,
- add permission / entitlement / usage / audit runtime,
- add AI / RAG runtime,
- modify tests / smoke / fixtures / package.json,
- modify inventory docs.

## Future Implementation Gates

Before any runtime work can begin, a future task must explicitly approve:

- exact backend files / layers,
- exact Admin files / layers, if any,
- API contract changes, if any,
- migration / schema / index / view changes, if any,
- DB / DDL permission, if any,
- issue report schema,
- follow-up / escalation schema,
- complaint and callback policy,
- customer acknowledgement copy,
- safe deny / non-enumeration behavior,
- file / photo evidence policy,
- Data Access Control checks,
- audit log requirements,
- contact / access log requirements,
- notification / provider sending boundary, if any,
- AI classification boundaries,
- SaaS usage tracking requirements,
- test / smoke / fixture scope,
- rollback and safety plan.

## Conclusion

Task326 is docs-only customer-facing completion issue report / follow-up escalation boundary guidance.

It does not approve customer-facing issue report runtime, follow-up runtime, escalation runtime, complaint runtime, callback runtime, survey runtime, notification runtime, audit runtime, AI runtime, API changes, Admin changes, DB / DDL, migrations, tests, smoke scripts, fixtures, package changes, or inventory documentation updates.

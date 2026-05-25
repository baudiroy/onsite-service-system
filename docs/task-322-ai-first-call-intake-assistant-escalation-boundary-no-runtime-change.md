# Task 322 - AI First-call Intake Assistant Escalation Boundary / No Runtime Change

## Scope And Non-goals

This document follows Task320 and Task321. It defines a docs-only escalation boundary for a future AI First-call Intake Assistant.

The AI First-call Intake Assistant is a future low-risk intake helper. It may collect dispatch-needed draft information when a customer has not responded to SMS / LINE / Web first-contact attempts. It must hand off to human CS when risk, ambiguity, complaint, dispute, or customer preference requires a person.

Task322 is not:

- AI call runtime,
- AI provider integration,
- human handoff runtime,
- contact attempt log runtime,
- `dispatch_intake_draft` runtime,
- official dispatch data write runtime,
- appointment runtime,
- Case runtime,
- dispatch runtime,
- backend runtime,
- Admin runtime,
- API change,
- migration,
- schema change,
- index change,
- DB / DDL execution,
- provider sending,
- AI / RAG runtime,
- permission / entitlement / usage runtime,
- audit runtime,
- test / smoke / fixture change,
- package change.

No runtime implementation is approved by this document.

## Why This Follows Task321

Task320 defined the first-contact workflow boundary. Task321 defined the data boundary between contact history, draft intake, confirmed dispatch data, and restricted recording content.

Task322 narrows the AI-specific question:

- what AI first-call intake may collect,
- what it must not promise,
- which answers must trigger human handoff,
- how AI call outputs remain draft-only,
- how handoff summaries should avoid raw sensitive payloads,
- why no AI call result can directly create appointments or official dispatch data.

## Definitions

### AI First-call Intake Assistant

A future AI-assisted outbound call helper used only for low-risk first-call intake after a Case exists and the customer has not responded through preferred digital channels.

### Low-risk Dispatch Intake

Dispatch-needed information that can be safely collected without committing business decisions. Examples include broad availability windows, access instructions, symptom clarification, product category, and whether the customer prefers human follow-up.

### High-risk Response

A response that may affect complaint handling, compensation, legal exposure, safety, payment, quote, settlement, privacy, or formal service commitment.

### Complaint / Dispute

Customer dissatisfaction, prior service dispute, engineer complaint, fee dispute, warranty dispute, refund request, compensation request, or other situation requiring human CS / supervisor handling.

### Ambiguous Answer

An answer that is unclear, contradictory, incomplete, or cannot be safely mapped to dispatch intake without human interpretation.

### Human Handoff

The future process of routing a call result to CS / dispatcher with a safe summary and handoff reason category.

### Escalation Trigger

Any signal requiring AI to stop intake and hand off to human CS, including explicit customer request, complaint, dispute, safety concern, legal threat, unclear answer, sensitive data concern, pricing question, compensation request, or AI uncertainty.

### Dispatch Intake Draft

`dispatch_intake_draft` is future draft data. AI call output can only create or update draft candidate information, never confirmed dispatch data.

### Official Dispatch Data

Official scheduling / dispatch data created through authorized CS / dispatcher review, deterministic business logic, and approved workflow. AI cannot commit it.

### Call Recording Metadata

Restricted metadata about a call, separate from recording or transcript content.

### Restricted Recording Content

Audio or transcript content that is not generally visible and should only be accessed under approved complaint, dispute, supervisor review, legal, or similar restricted purposes.

## Boundary Principles

- AI First-call Intake Assistant can only collect low-risk dispatch-needed information.
- AI must not commit official appointment times.
- AI must not create or update formal appointments.
- AI must not commit official dispatch data.
- AI must not promise a quote, fee waiver, compensation, settlement result, warranty outcome, repair outcome, or case closure.
- AI must not request sensitive data beyond what is minimally necessary for dispatch intake.
- AI call results can only become `dispatch_intake_draft` or an escalation note candidate.
- Customer request for a human must trigger handoff.
- High-risk, complaint, dispute, ambiguous, privacy-sensitive, legal, safety, fee, quote, compensation, or settlement answers must trigger handoff.
- Human CS / dispatcher is required before draft intake can become official dispatch data.
- Call recording metadata and restricted recording content must stay separate.
- AI call context must be minimized, masked, organization-scoped, permission-aware, and audit-ready.

## Future-only Escalation Matrix

| Input category | AI may continue? | Must hand off to human? | May create `dispatch_intake_draft`? | May create official dispatch data? | May promise appointment / quote / settlement? | Requires contact attempt log? | Requires audit readiness? | Requires data minimization? | Requires recording restriction? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Customer provides clear low-risk availability | Yes | No | Yes, draft only | No | No | Yes | Yes | Yes | Yes | No |
| Customer provides address clarification | Yes, if minimal and safe | No, unless unclear or sensitive beyond need | Yes, draft only | No | No | Yes | Yes | Yes | Yes | No |
| Customer describes symptom clearly | Yes | No | Yes, draft only | No | No | Yes | Yes | Yes | Yes | No |
| Customer asks for exact appointment guarantee | No | Yes | No, except escalation summary | No | No | Yes | Yes | Yes | Yes | No |
| Customer asks for price quote | No | Yes | No, except escalation summary | No | No | Yes | Yes | Yes | Yes | No |
| Customer asks for compensation | No | Yes | No, except escalation summary | No | No | Yes | Yes | Yes | Yes | No |
| Customer disputes prior service | No | Yes | No, except escalation summary | No | No | Yes | Yes | Yes | Yes | No |
| Customer complains about engineer | No | Yes | No, except escalation summary | No | No | Yes | Yes | Yes | Yes | No |
| Customer gives unclear / contradictory answer | No | Yes | No, except escalation summary | No | No | Yes | Yes | Yes | Yes | No |
| Customer refuses AI call | No | Yes | No, except refusal / handoff note | No | No | Yes | Yes | Yes | Yes | No |
| Customer requests human | No | Yes | No, except handoff note | No | No | Yes | Yes | Yes | Yes | No |
| Safety concern mentioned | No | Yes | No, except escalation summary | No | No | Yes | Yes | Yes | Yes | No |
| Legal threat mentioned | No | Yes | No, except escalation summary | No | No | Yes | Yes | Yes | Yes | No |
| Sensitive personal data volunteered beyond need | No | Yes | No, except minimized escalation summary | No | No | Yes | Yes | Yes | Yes | No |

## AI Script / Wording Safety Rules

Future AI call scripts should use limited and non-committal wording.

Allowed direction:

- ask for broad availability windows,
- ask for safe access instructions,
- ask for symptom clarification,
- explain that CS / dispatcher will confirm scheduling,
- explain that price, quote, compensation, and final service decisions require human confirmation,
- offer human handoff when the customer prefers a person.

Forbidden direction:

- "Your appointment is confirmed",
- "The engineer will arrive at this exact time",
- "This price is approved",
- "You will receive compensation",
- "The company accepts responsibility",
- "This will be covered by warranty",
- "Your case is completed",
- "Your dispatch is official",
- any wording that sounds like a formal appointment, quote, settlement, compensation, or repair outcome commitment.

AI must not ask for sensitive data beyond dispatch necessity. AI must not reveal whether a Case exists, whether a phone is correct, whether a LINE identity is bound, or whether internal verification succeeded.

## Data Protection Rules

AI call context must be:

- minimized,
- masked,
- organization-scoped,
- permission-aware,
- feature-entitlement aware,
- customer-visible-policy aware,
- internal-data-policy aware,
- audit-ready,
- usage-tracking ready.

AI context must not include:

- complete phone values,
- complete email values,
- complete addresses beyond minimum dispatch need,
- raw LINE identifiers,
- provider tokens,
- secrets,
- LINE access tokens,
- channel secrets,
- verification codes,
- binding tokens,
- raw provider payloads,
- complete call recording content,
- unrestricted transcript content,
- signatures,
- unmasked photos,
- internal notes,
- billing / settlement internal data,
- audit log full text,
- AI raw sensitive payload.

Call recording metadata and content must be separated. Recording content should not be sent to AI or made generally searchable by default.

## Human Handoff Rules

Future human handoff should include:

- safe summary,
- handoff reason category,
- source channel,
- timestamp,
- whether the customer requested a human,
- whether the issue includes complaint / dispute / safety / legal / fee / quote / compensation risk,
- missing or unclear fields,
- masked references only,
- audit reference.

Handoff should not include:

- raw transcript by default,
- raw provider payload,
- complete sensitive values,
- internal risk labels in customer-visible output,
- unsupported AI judgment as fact.

Customer-visible response must remain safe. It should not expose internal risk categories, AI confidence, audit logic, or whether verification failed for a specific reason.

## Interaction With Existing Branches

### Contact Attempt Log / Dispatch Intake Draft

AI call outcomes can only produce contact history, draft intake, or escalation note candidates. They must not directly become official dispatch data.

### Customer Channel Identity / Notification

AI calls must respect channel identity scope and notification policy. A customer refusing AI should be eligible for human follow-up through approved channels.

### Data Access Control

AI first-call intake must use the same Data Access Control / Data Permission Model as other data access. It must not retrieve unfiltered customer, case, channel, or historical data.

### Audit Log / Evidence Traceability

AI call attempts, handoff reasons, draft adoption, draft rejection, and restricted recording access should be audit-ready in future runtime.

### Case / Appointment Workflow

AI call outputs cannot create appointments, commit appointment times, close cases, or alter Case / Appointment invariants.

### AI / RAG Advisory-only

AI remains advisory and human-controlled. AI output is not an official record without deterministic validation and authorized human confirmation.

### SaaS Usage Tracking

AI call attempts and summaries may become future usage events. Usage records must not store raw sensitive payloads.

## Explicit Runtime Forbidden Confirmation

Task322 does not allow:

- AI call runtime,
- AI provider integration,
- human handoff runtime,
- contact attempt log runtime,
- `dispatch_intake_draft` runtime,
- official dispatch data write runtime,
- appointment runtime,
- Case runtime,
- dispatch runtime,
- backend runtime,
- Admin runtime,
- API change,
- migration,
- schema change,
- index change,
- DB connection,
- DDL,
- psql,
- `npm run db:migrate`,
- Migration020 dry-run or apply,
- SMS provider sending,
- LINE provider sending,
- Email provider sending,
- App provider sending,
- Web link runtime,
- customer self-service runtime,
- AI / RAG runtime,
- permission runtime,
- entitlement runtime,
- usage runtime,
- audit runtime,
- tests / smoke / fixtures change,
- package change,
- inventory docs change.

## Non-goals

Task322 must not:

- modify backend `src/`,
- modify Admin `admin/src/`,
- add or modify API behavior,
- add or modify migrations / schema / indexes,
- connect to DB,
- execute DDL,
- run psql,
- run `npm run db:migrate`,
- execute Migration020 dry-run or apply,
- add SMS / LINE / Email / App sending,
- add Web link or customer self-service runtime,
- add AI call or AI provider runtime,
- add human handoff runtime,
- add contact log runtime,
- add dispatch intake runtime,
- add appointment / Case / dispatch runtime,
- add AI / RAG runtime,
- add permission / entitlement / usage / audit runtime,
- modify tests / smoke / fixtures / package.json,
- modify inventory docs.

## Future Implementation Gates

Before any runtime work can begin, a future task must explicitly approve:

- AI call eligibility policy,
- allowed AI provider / private model / local model decision,
- exact backend files / layers,
- exact Admin files / layers, if any,
- API contract changes, if any,
- migration / schema / index changes, if any,
- DB / DDL permission, if any,
- contact attempt log schema,
- `dispatch_intake_draft` schema,
- human handoff workflow,
- safe script wording,
- escalation taxonomy,
- recording metadata / content policy,
- Data Access Control and organization isolation checks,
- audit log requirements,
- SaaS usage tracking requirements,
- test / smoke / fixture scope,
- rollback and safety plan.

## Conclusion

Task322 is docs-only AI first-call escalation boundary guidance.

It does not approve AI call runtime, AI provider integration, human handoff runtime, contact log runtime, dispatch intake runtime, official dispatch data writes, appointment runtime, provider sending, DB / DDL, API changes, tests, smoke scripts, fixtures, package changes, or inventory documentation updates.

# Task 320 - Case-created First Contact / Dispatch Intake Workflow Boundary Matrix / No Runtime Change

## Scope And Non-goals

This document follows the `docs/PROJECT_GUARDRAILS.md` update that added the Case-created First Contact / Dispatch Intake Contact Workflow guardrail.

Task320 turns that guardrail into a docs-only boundary matrix. It clarifies the future boundaries between SMS, LINE, Web link, AI call, human call, App, Email, contact attempt history, `dispatch_intake_draft`, and confirmed dispatch data.

Task320 is not:

- backend runtime,
- Admin runtime,
- API contract change,
- migration,
- schema change,
- index change,
- DB / DDL execution,
- SMS sending,
- LINE sending or binding runtime,
- Email sending,
- App notification,
- Web link runtime,
- AI call runtime,
- human call workflow runtime,
- contact attempt log runtime,
- `dispatch_intake_draft` runtime,
- official dispatch data write runtime,
- recording access runtime,
- permission / entitlement / usage runtime,
- audit runtime,
- AI / RAG runtime,
- test / smoke / fixture change,
- package change.

No runtime implementation is approved by this document.

## Why This Task Follows The Guardrail Update

The guardrail update established the future first-contact path:

Case created -> SMS first contact -> LINE binding guidance -> LINE intake when available -> Web link fallback when needed -> AI first-call intake for low-risk non-response -> human handoff for ambiguity, risk, or customer request -> contact attempt history -> `dispatch_intake_draft` -> dispatcher / CS confirmation -> official dispatch data.

That guardrail is intentionally high-level. Task320 adds a boundary matrix so future implementation cannot accidentally treat:

- SMS as the long-term interaction channel,
- AI call as an appointment commitment flow,
- `dispatch_intake_draft` as official dispatch data,
- contact history as a place for raw sensitive payloads,
- call recordings as general searchable case data,
- customer channel runtime as already approved.

## Definitions

### Case-created First Contact

The first outbound contact attempt after a Case is created. The preferred future channel is SMS because it is a low-friction way to reach customers and guide them into a richer channel.

### SMS First Contact

The initial SMS should be a first-contact and LINE-guidance tool. It should not become the long-term interaction model or a place for complex intake.

### LINE Binding Guidance

The SMS or fallback flow should guide the customer to join or bind LINE when possible. LINE is the short- to mid-term primary interaction channel for appointment coordination, progress lookup, supplemental material collection, notifications, completion notices, and satisfaction survey delivery.

### Web Link Fallback

Web link is the fallback path for customers who do not use LINE. The Web path should still encourage LINE binding when appropriate.

### AI First-call Intake Assistant

A future AI-assisted outbound call flow for low-risk cases when the customer has not responded after several hours or by the next day. It may collect dispatch-needed intake information only.

It must not commit official appointment times, quote amounts, compensation, settlement results, or final case decisions.

### Human Customer Service Call

A human CS call is required when AI intake fails, the customer requests a person, the answer is ambiguous, or the situation involves complaint, dispute, safety, compensation, high-risk service, or unclear responsibility.

### Contact Attempt Log / Contact History

The future audit-friendly record of contact attempts across SMS, LINE, Web link, AI call, human call, App, and Email. It records the channel, time, purpose, status, result, masked summary, next step, actor type, and audit context.

It must not store raw provider payloads, complete contact values, unmasked sensitive data, or general-purpose call recordings.

### Dispatch Intake Draft

`dispatch_intake_draft` is a future draft object or state representing collected scheduling and dispatch-needed information. It is not official dispatch data.

### Confirmed Dispatch Data

Confirmed dispatch data is the future official scheduling / dispatch record created only after CS or dispatcher review. AI, SMS, LINE, Web forms, or unreviewed customer replies must not directly commit it.

### Call Recording Restricted Access

Call recordings and transcripts, if ever supported, are restricted evidence. They should not be default case-visible data. Access should be limited to complaint, dispute, supervisor review, legal need, or similarly approved contexts, with retention policy, permission control, and audit log.

## Boundary Principles

- Case creation should trigger SMS first contact in the future workflow.
- SMS should guide customers toward LINE binding.
- Web link is a fallback and should still guide LINE binding.
- AI call may only collect low-risk dispatch-needed information.
- AI must not commit appointment, quote, compensation, settlement, or official status decisions.
- High-risk, complaint, dispute, vague answer, or customer-requested-human situations must hand off to human CS.
- SMS / LINE / Web / AI call collection can only form `dispatch_intake_draft`.
- `dispatch_intake_draft` must be reviewed by CS or dispatcher before becoming official dispatch data.
- Every contact attempt should leave contact history.
- Call recordings must not be generally searchable case data.
- Customer-visible flows must follow customer visible data policy.
- Internal notes, audit logs, provider payloads, raw channel identifiers, billing internal data, AI raw payloads, and restricted recordings must not be exposed to customers.
- Data Access Control, organization scope, audit readiness, notification policy, provider payload policy, and SaaS usage tracking must apply before runtime.

## Future-only Workflow Matrix

| Workflow state | Channel / actor | Customer-visible? | May collect dispatch intake? | May create official dispatch data? | Requires contact attempt log? | Requires safe deny / non-enumeration? | Requires Data Access Control? | Requires audit readiness? | Requires usage tracking? | AI may assist? | AI may decide / commit official data? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Case created | backend system | No | No | No | Future yes if contact begins | Yes | Yes | Yes | No | No | No | No |
| SMS first contact sent candidate | notification system / SMS provider | Yes | Limited link guidance only | No | Yes | Yes | Yes | Yes | Yes | Optional copy drafting only | No | No |
| SMS link clicked | customer / web tracking | Yes | No | No | Yes | Yes | Yes | Yes | Yes | No | No | No |
| LINE binding attempted | customer / LINE channel | Yes | No, identity verification only | No | Yes | Yes | Yes | Yes | Yes | Optional guidance only | No | No |
| LINE binding success | customer / LINE channel | Yes | Not by itself | No | Yes | Yes | Yes | Yes | Yes | No | No | No |
| LINE binding failure | customer / LINE channel | Yes | No | No | Yes | Yes | Yes | Yes | Yes | Optional safe support hint only | No | No |
| Web form opened | customer / Web link | Yes | No until verified | No | Yes | Yes | Yes | Yes | Yes | Optional help text only | No | No |
| Web form completed | customer / Web link | Yes | Yes, draft only | No | Yes | Yes | Yes | Yes | Yes | Optional field validation / summary | No | No |
| AI first-call attempted | AI First-call Intake Assistant | Yes | Low-risk intake only | No | Yes | Yes | Yes | Yes | Yes | Yes | No | No |
| AI first-call completed with low-risk intake | AI First-call Intake Assistant | Yes | Yes, draft only | No | Yes | Yes | Yes | Yes | Yes | Yes | No | No |
| AI first-call escalated to human | AI First-call Intake Assistant / CS queue | Customer may be notified | No official intake commit | No | Yes | Yes | Yes | Yes | Yes | Yes, escalation summary only | No | No |
| Human call attempted | CS | Yes | Yes, draft only | No | Yes | Yes | Yes | Yes | Optional | Optional summary support | No | No |
| Human call completed | CS | Yes | Yes, draft or confirmation candidate | Future-only yes after authorized CS / dispatcher confirmation | Yes | Yes | Yes | Yes | Optional | Optional summary support | No | No |
| App contact attempt | App / push / in-app message | Yes | Future draft only | No | Yes | Yes | Yes | Yes | Yes | Optional copy drafting only | No | No |
| Email contact attempt | Email provider | Yes | Future draft only | No | Yes | Yes | Yes | Yes | Yes | Optional copy drafting only | No | No |
| Dispatch intake draft created | system draft / CS / dispatcher | Internal by default | Yes | No | Yes | Yes | Yes | Yes | Optional | Optional summary / missing field reminder | No | No |
| Dispatch intake confirmed by dispatcher / CS | CS / dispatcher | Internal action, may lead to customer-visible appointment notice | Yes, reviewed | Future-only yes | Yes | Yes | Yes | Yes | Optional | Optional checklist / anomaly reminder | No | No |
| Dispatch data becomes official | backend system after authorized human confirmation | May produce customer-visible appointment info | No new intake collection | Future-only yes, by deterministic business logic and authorized user action | Yes | Yes | Yes | Yes | Optional | No | No | No |

## Data Protection Rules

Future implementation must not expose the following in logs, errors, frontend responses, AI context, provider payload mirrors, smoke output, or handoff material:

- complete phone values,
- complete email values,
- complete addresses,
- raw LINE identifiers,
- provider tokens,
- secrets,
- LINE access tokens,
- channel secrets,
- verification codes,
- binding tokens,
- raw provider payloads,
- call recording content,
- unrestricted transcripts,
- unmasked customer private data,
- internal notes,
- audit log internals,
- billing / settlement internal data,
- AI raw sensitive payload.

Additional rules:

- `dispatch_intake_draft` is never official dispatch data.
- Contact attempt history must use masked summaries and controlled metadata.
- Contact attempt history must not store raw SMS / LINE / Email / App / AI provider payloads by default.
- Call recording metadata and call recording content must be modeled separately in any future design.
- Call recording content should require explicit permission, approved purpose, retention policy, and audit log.
- Customer-facing flows must not reveal whether a Case exists, whether a phone number is correct, whether a LINE identity is already bound, or whether another channel identity exists.

## Interaction With Existing Branches

### Customer Channel Identity / Notification

This workflow depends on future channel identity and notification policy. It must not hard-code LINE as the only customer channel, even though SMS should guide customers toward LINE in the short to mid term.

### Data Access Control

All lookup, link opening, intake display, draft review, contact history, and recording access must use the shared Data Access Control / Data Permission Model.

### Audit Log / Evidence Traceability

Contact attempt history is future audit-adjacent evidence, but it is not a substitute for audit log. High-risk access, recording retrieval, customer identity binding, intake confirmation, and official dispatch data writes should be auditable.

### Engineer Mobile / Field UX

First-contact intake should reduce incomplete dispatch context for engineers, but it must not push complex intake burden into the Engineer Mobile App or field completion flow.

### Case / Appointment Workflow

This workflow must not create official appointments directly from unreviewed AI, SMS, LINE, or Web input. It must preserve the Case / Appointment invariants, including no multiple open appointments for the same Case.

### AI / RAG Advisory-only Boundary

AI may draft, summarize, classify, remind, or escalate. AI must not commit official dispatch data, appointment times, quotes, compensation, settlement outcomes, or formal Case status changes.

### SaaS Usage Tracking

SMS, LINE, Email, App push, Web link usage, AI calls, and contact attempts may all become future usage events. Usage tracking must not store unnecessary sensitive payloads.

## Explicit Runtime Forbidden Confirmation

Task320 does not allow:

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
- AI call runtime,
- human call workflow runtime,
- contact attempt log runtime,
- `dispatch_intake_draft` runtime,
- official dispatch data write runtime,
- recording access runtime,
- Case runtime,
- Appointment runtime,
- dispatch runtime,
- AI / RAG runtime,
- permission runtime,
- entitlement runtime,
- usage runtime,
- audit runtime,
- tests / smoke / fixtures change,
- package change,
- inventory docs change.

## Non-goals

Task320 must not:

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
- add AI call or human call workflow runtime,
- add contact attempt log runtime,
- add dispatch intake runtime,
- add appointment / Case / dispatch runtime,
- add AI / RAG runtime,
- add permission / entitlement / usage / audit runtime,
- modify tests / smoke / fixtures / package.json,
- modify inventory docs.

## Future Implementation Gates

Before any runtime work can begin, a future task must explicitly approve:

- exact backend files / layers,
- exact Admin files / layers, if any,
- API contract changes, if any,
- migration / schema / index changes, if any,
- DB / DDL permission, if any,
- provider sending boundaries,
- customer channel identity and safe verification rules,
- contact attempt data model,
- `dispatch_intake_draft` data model,
- official dispatch confirmation rules,
- call recording retention / access policy,
- Data Access Control and organization isolation checks,
- audit log requirements,
- SaaS usage tracking requirements,
- test / smoke / fixture scope,
- rollback and safety plan.

## Conclusion

Task320 is docs-only boundary guidance.

It does not approve first-contact runtime, dispatch-intake runtime, SMS / LINE / Email / App sending, Web link runtime, AI call runtime, contact attempt log runtime, `dispatch_intake_draft` runtime, official dispatch data writes, recording access runtime, DB / DDL, API changes, tests, smoke scripts, fixtures, package changes, or inventory documentation updates.

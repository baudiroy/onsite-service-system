# Task 321 - Contact Attempt Log and Dispatch Intake Draft Data Boundary / No Runtime Change

## Scope And Non-goals

This document follows Task320 and defines a docs-only data boundary for future contact attempt log / contact history and `dispatch_intake_draft`.

It clarifies the relationship between:

- contact attempt log,
- contact history,
- channel events,
- SMS / LINE / Web / AI / human / App / Email contact attempts,
- collected intake content,
- `dispatch_intake_draft`,
- confirmed dispatch data,
- call recording metadata,
- call recording content.

Task321 is not:

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

## Why This Follows Task320

Task320 established the workflow boundary between channels and actors for Case-created first contact and dispatch intake.

Task321 narrows the design question to data boundaries:

- what may be stored as contact attempt history,
- what can become dispatch intake draft,
- what must stay internal-only,
- what requires human confirmation,
- what must never be saved as raw provider payload,
- why call recording metadata and recording content must be separated,
- why no channel or AI flow can directly commit official dispatch data.

This prevents future runtime work from using contact logs as a hidden source of official dispatch truth or treating unreviewed channel data as confirmed scheduling data.

## Definitions

### Contact Attempt Log

A future minimal record that a contact attempt occurred. It should capture only necessary metadata such as channel, timestamp, purpose, delivery / result category, masked reference, correlation id, actor type, and next step.

It is not official dispatch data and should not store raw provider payloads or full sensitive values.

### Contact History

The case-level or customer-level timeline of contact attempt logs across SMS, LINE, Web, AI call, human call, App, and Email. It is a structured history for operations and audit readiness, not a free-form storage bucket for raw channel content.

### Channel Event

A provider or channel-originated event such as delivery, failure, click, binding attempt, form open, form submit, call attempt, call completion, or handoff. Channel events may inform contact history but should be normalized and minimized before storage.

### SMS Contact Attempt

An SMS outreach event after Case creation. SMS is a first-contact and LINE-guidance channel, not a complete intake channel.

### LINE Binding / Contact Attempt

A LINE-related binding, notification, or customer interaction attempt scoped by `organization_id + line_channel_id + line_user_id`. Raw LINE identifiers should not be exposed in handoff, report, log, or customer-visible responses.

### Web Link / Form Event

A customer Web fallback event for customers who do not use LINE. Web link and form events may collect intake candidate data but should still guide LINE binding when appropriate.

### AI Call Attempt

A low-risk AI First-call Intake Assistant attempt. It may collect dispatch-needed draft information only. It must not commit official data, make promises, or handle high-risk disputes.

### Human Call Attempt

A human CS contact attempt. Human calls can gather and confirm information, but official dispatch data should still be created through authorized workflow and audit-ready confirmation.

### App / Email Contact Attempt

Future contact attempts through owned App or Email. These are additional channels and must follow the same Data Access, notification, audit, and usage boundaries.

### Dispatch Intake Draft

`dispatch_intake_draft` is future draft data collected from SMS, LINE, Web, AI call, human call, App, or Email. It can hold proposed availability, access notes, customer preference, or dispatch-relevant context.

It is not confirmed dispatch data.

### Confirmed Dispatch Data

Confirmed dispatch data is official operational data used for scheduling or dispatch. It can only be created or changed by authorized CS / dispatcher review, deterministic business logic, and approved workflow.

### Call Recording Metadata

Metadata about a call recording, such as whether a recording exists, channel, call id reference, start time, duration category, retention status, restricted access status, and audit reference. It should not include the recording content itself.

### Call Recording Content

The audio file or transcript content. It is highly restricted and must not be generally visible, searchable, exported, or sent to AI by default.

## Boundary Principles

- Contact attempt log is not official dispatch data.
- Contact history is not a raw provider payload archive.
- `dispatch_intake_draft` is not confirmed dispatch data.
- AI / Web / LINE / SMS / call collected content can only become draft first.
- Draft must be confirmed by CS or dispatcher before it becomes official dispatch data.
- AI must not directly create appointments.
- AI must not commit official dispatch data.
- AI must not promise quotes, compensation, settlement results, final appointment times, or formal case outcomes.
- Unclear, high-risk, complaint, dispute, or customer-requested-human situations must be routed to human CS.
- Call recording metadata and call recording content must be separated.
- Call recording content should not be generally searchable or generally case-visible.
- Contact data must follow organization scope, Data Access Control, customer visible data policy, sensitive data masking, audit readiness, notification policy, and SaaS usage tracking.

## Future-only Data Boundary Matrix

| Future data state | Data category | Source channel / actor | Customer-visible? | Internal-only? | Sensitive data risk? | May become official dispatch data directly? | Requires human confirmation? | Requires Data Access Control? | Requires audit readiness? | Requires usage tracking? | Can include raw provider / raw recording payload? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SMS sent attempt | Contact attempt metadata | SMS provider / notification system | No, except the sent SMS content to customer | Yes | Yes | No | No | Yes | Yes | Yes | No | No |
| SMS delivery / failure category | Delivery status category | SMS provider | No | Yes | Low to medium | No | No | Yes | Yes | Yes | No | No |
| SMS link clicked | Contact interaction metadata | Customer / Web tracking | No | Yes | Medium | No | No | Yes | Yes | Yes | No | No |
| LINE binding attempt | Identity / channel event | Customer / LINE channel | Customer participates | Internal normalized result only | Yes | No | No | Yes | Yes | Yes | No | No |
| LINE binding success / failure | Identity / channel event | Customer / LINE channel | Customer may see safe result | Internal normalized result only | Yes | No | No | Yes | Yes | Yes | No | No |
| Web form opened | Web fallback event | Customer / Web link | Yes | Internal event metadata | Medium | No | No | Yes | Yes | Yes | No | No |
| Web form submitted | Intake candidate | Customer / Web link | Customer-provided | Internal draft candidate | Yes | No | Yes | Yes | Yes | Yes | No | No |
| AI call attempted | Contact attempt metadata | AI First-call Intake Assistant | Yes | Internal normalized result | Yes | No | No | Yes | Yes | Yes | No | No |
| AI call low-risk intake completed | Draft intake candidate | AI First-call Intake Assistant | Customer-provided by voice | Internal draft candidate | Yes | No | Yes | Yes | Yes | Yes | No | No |
| AI call escalated to human | Escalation event | AI First-call Intake Assistant / CS queue | Customer may know handoff | Internal escalation summary | Medium | No | Yes | Yes | Yes | Yes | No | No |
| Human call attempted | Contact attempt metadata | CS | Yes | Internal normalized result | Yes | No | No | Yes | Yes | Optional | No | No |
| Human call completed | Draft or confirmation candidate | CS | Yes | Internal notes / draft candidate | Yes | No, unless explicit confirmation workflow is executed | Yes | Yes | Yes | Optional | No | No |
| App contact attempt | Contact attempt metadata | App / push / in-app message | Yes | Internal normalized result | Medium | No | No | Yes | Yes | Yes | No | No |
| Email contact attempt | Contact attempt metadata | Email provider | Yes | Internal normalized result | Medium | No | No | Yes | Yes | Yes | No | No |
| Dispatch intake draft created | Draft dispatch data | System / CS / dispatcher / channel input | No by default | Yes | Yes | No | Yes | Yes | Yes | Optional | No | No |
| Dispatch intake draft edited by CS / dispatcher | Draft dispatch data | CS / dispatcher | No by default | Yes | Yes | No | Yes | Yes | Yes | Optional | No | No |
| Dispatch intake confirmed as official dispatch data | Official dispatch data transition | CS / dispatcher with authorized workflow | May lead to customer-visible appointment info | Internal source of truth | Yes | Future-only yes after approval | Yes | Yes | Yes | Optional | No | No |
| Call recording metadata created | Restricted evidence metadata | Telephony provider / system | No | Yes | Yes | No | Not for metadata creation; yes for access/use | Yes | Yes | Optional | No | No |
| Call recording content access requested | Restricted evidence access | Authorized user / supervisor / legal workflow | No | Yes, restricted | High | No | Yes | Yes | Yes | Optional | No | No |

## Data Minimization Rules

Contact attempt log should store only the minimum required metadata:

- channel,
- timestamp,
- purpose,
- result category,
- masked reference,
- correlation id,
- actor type,
- next step,
- safe summary,
- audit reference.

Contact attempt log must not store:

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
- complete call recording content,
- unrestricted transcript content,
- AI raw sensitive payload,
- unmasked customer private data.

Call recording content must be governed separately. Future access should be limited to complaint, dispute, supervisor review, legal need, or explicitly approved cases, with permission checks, retention policy, audit log, and purpose limitation.

## Draft-to-official Boundary

`dispatch_intake_draft` should preserve:

- source channel,
- source actor type,
- collection timestamp,
- source confidence or completeness category,
- whether customer provided the data directly,
- whether AI summarized the data,
- whether CS / dispatcher reviewed it,
- confirmation status,
- rejected / edited / accepted state,
- audit reference.

Future official dispatch data must not be created from draft automatically.

Draft events that require human review include:

- unclear customer availability,
- address / access ambiguity,
- customer requests human contact,
- complaint,
- dispute,
- compensation request,
- quote or price question,
- high-risk safety concern,
- policy exception,
- AI uncertainty,
- missing required dispatch fields.

If a draft is adopted, edited, rejected, or confirmed, the future workflow should be audit-ready.

## Interaction With Existing Branches

### Case / Appointment Workflow

Contact history and draft intake must not bypass Case / Appointment invariants. No draft can create a second open appointment or commit a formal appointment without the approved appointment workflow.

### Customer Channel Identity / Notification

SMS, LINE, Web, App, and Email contact attempts depend on channel identity and notification policy. Raw channel identifiers must not leak into logs, handoff, reports, or customer-visible output.

### Data Access Control

Contact history, draft intake, official dispatch data, and restricted recording metadata/content must all use the shared Data Access Control / Data Permission Model.

### Audit Log / Evidence Traceability

Contact history is operational evidence, while audit log records privileged actions and sensitive access. Future design should connect them without storing raw sensitive payloads in either place.

### Engineer Mobile / Field UX

Draft intake should improve field readiness for engineers but should not push complex contact-history review or uncertain customer communication into the engineer's mobile workflow.

### AI / RAG Advisory-only

AI may assist with summaries, classification, missing-field reminders, and escalation. AI cannot decide or commit official dispatch data.

### SaaS Usage Tracking

SMS, LINE, Email, App push, Web form use, AI calls, contact attempts, and recording access may become usage events. Usage records should not include unnecessary sensitive payloads.

## Explicit Runtime Forbidden Confirmation

Task321 does not allow:

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

Task321 must not:

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
- contact attempt log schema,
- contact history retention policy,
- raw provider payload exclusion policy,
- `dispatch_intake_draft` schema,
- draft review / edit / reject / confirm workflow,
- official dispatch data transition rules,
- call recording metadata schema,
- call recording content storage and access policy,
- Data Access Control and organization isolation checks,
- audit log requirements,
- SaaS usage tracking requirements,
- test / smoke / fixture scope,
- rollback and safety plan.

## Conclusion

Task321 is docs-only data boundary guidance.

It does not approve contact log runtime, dispatch intake runtime, SMS / LINE / Email / App sending, Web link runtime, AI call runtime, human call workflow runtime, official dispatch data writes, recording access runtime, DB / DDL, API changes, tests, smoke scripts, fixtures, package changes, or inventory documentation updates.

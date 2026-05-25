# Data Correction / Amendment Governance

Status: active phase 1 runtime in progress.

This design note defines first-phase governance for repair / dispatch data correction and later formal amendments. It complements `docs/PROJECT_GUARDRAILS.md` and the runtime foundations added in Task652 and Task653.

## Scope

Phase 1 focuses on practical, enforceable boundaries:

- phone / customer channel identity changes require re-verification
- non-phone repair / dispatch operational corrections may be allowed before engineer departure
- engineer received task before departure requires reconfirm / notification metadata
- post-departure or route-started operational data must not be silently overwritten
- after-arrival unable-to-complete cases should move through evidence and terminal appointment result flow
- completion amendments must not create a second formal Field Service Report

## Non-scope

This design does not itself authorize:

- correction API
- DB migration
- real audit writer
- real contact log writer
- real dispatch note writer
- phone verification runtime
- LINE / SMS / App provider sending
- Case / Appointment / Field Service Report mutation
- follow-up appointment creation
- AI auto-correction or approval

## Phone Change Re-verification Flow

Phone numbers are identity and channel-binding data, not ordinary editable profile text.

Phone and channel identity changes include:

- phone
- phone number
- customer phone
- contact phone
- mobile
- LINE user id
- LINE channel id
- customer channel identity
- App binding identity

Rules:

- Phone changes must not be handled by the general data correction flow.
- Phone changes must require re-verification, such as SMS or Web verification in a future task.
- Existing LINE / App binding must not be silently transferred to a new phone.
- The system should preserve old phone history, contact history, verification attempt history, and audit log.
- If verification is incomplete, official customer/channel identity should not be overwritten.

Task652 implements the first policy guard for this boundary by returning `phone_reverification_required`.
Task653 preserves that decision at request-service level without sending any provider message.

## Pre-departure Correction Rules

Before engineer departure, non-phone operational repair / dispatch data may be corrected by scoped roles with permission.

Examples:

- address summary or service area correction
- floor / elevator information
- on-site contact note, excluding phone identity overwrite
- product type / model summary
- repair description
- photo supplement metadata
- on-site notes
- service type correction

Allowed roles for phase 1:

- customer service
- dispatch assistant
- supervisor
- admin

Rules:

- Corrections require organization scope and permission.
- Corrections must be audit-ready.
- Corrections must not change phone / channel identity directly.
- Corrections must not create or publish Field Service Report.
- Corrections must not change `finalAppointmentId`.

Task652 allows pre-departure operational corrections at policy level.
Task653 marks allowed pre-departure corrections as `correctionApplicationReady` but does not write official data.

## Engineer Received Task / Reconfirm-required Rule

If an appointment exists or an engineer has already received the task but has not departed:

- correction may still be allowed for non-phone operational fields
- the response should mark `engineerReconfirmRequired`
- future runtime should update Engineer Mobile Workbench, notify the engineer, or require engineer acknowledgement
- no provider sending is authorized by this design alone

This avoids silent task changes after the engineer has already seen the job.

## Post-departure / Route-started Freeze

After the engineer has departed or the route has started, formal repair / dispatch operational data should not be silently overwritten.

Rules:

- General correction flow should block or route to manual handling.
- Customer service or dispatch should manually contact the engineer when needed.
- Contact log, dispatch note, and audit trail should be required.
- The original dispatch data should remain traceable.
- Temporary updates should not erase prior instructions or responsibility context.

Task652 returns manual handling metadata for `engineerDeparted` or `routeStarted`.
Task653 supports injected audit / contact log / dispatch note writers and sends only safe metadata.

## After-arrival Unable-to-complete Terminal Appointment States

After arrival, if the job cannot be completed, the system should not hard-edit the original dispatch data just to force completion.

Typical reasons:

- pending parts
- quote required
- customer not home
- site condition mismatch
- product condition differs from intake
- second-person manpower required
- unable to install or repair
- follow-up required

Future appointment terminal states may include:

- `pending_parts`
- `quote_required`
- `customer_not_home`
- `unable_to_complete`
- `follow_up_required`

Engineer-facing runtime should collect reason, notes, photos, and evidence. This should feed appointment / dispatch visit history and future follow-up creation, not create a second formal report.

## Follow-up / Second-dispatch Appointment Principle

Follow-up appointment creation should happen after the current appointment reaches a clear terminal state.

Rules:

- Do not keep multiple open appointments for the same Case.
- Do not overwrite the original visit outcome.
- Do not force completion when work was not completed.
- The next appointment should reference the prior reason and evidence when useful.

## Completion Amendment / No Second FSR Principle

After completion, corrections that affect customer-visible data, reviewed completion details, settlement, warranty, parts, or formal outcome must follow a correction / amendment flow.

Rules:

- Do not create a second formal Field Service Report for the same Case.
- Preserve original report data, amendment reason, reviewer, changed fields, and audit log.
- Do not re-infer or overwrite `finalAppointmentId` merely for amendment.
- Customer-facing report versions should remain traceable.

## Roles

Customer service:

- may request or apply scoped pre-departure non-phone corrections
- should trigger re-verification for phone changes
- should create contact history for post-departure manual handling

Dispatch assistant:

- may correct dispatch operational details before departure
- should notify or reconfirm with engineer when task was already received
- should use dispatch notes after departure

Engineer:

- should not apply general back-office corrections by default
- should record unable-to-complete reasons, evidence, and appointment outcome after arrival

Supervisor / admin:

- may approve exceptional corrections in future tasks
- should review high-risk amendments or post-completion changes

Customer:

- may provide corrected information
- must re-verify phone/channel identity changes

AI:

- may suggest missing-field checks, risk flags, summaries, and correction drafts
- must not automatically modify phone, dispatch data, official completion data, parts, warranty, fees, settlement, or `finalAppointmentId`
- must not approve official correction

## Data Protection / Customer-visible Data Policy

Correction and amendment flows must not expose:

- internal note
- audit log body
- AI raw payload
- raw phone
- raw address
- raw LINE user id
- token or secret
- billing internal data
- settlement internal data
- `finalAppointmentId` when not needed for the user-facing context

Writer payloads and future events should use safe metadata and minimum necessary fields.

## Runtime Tasks Completed

Task652:

- added `evaluateDataCorrectionPolicy(input)`
- added phone / channel identity re-verification policy guard
- added pre-departure allow, post-departure freeze, and after-arrival evidence decisions
- no DB / API / audit writer / provider runtime

Task653:

- added `processDataCorrectionRequest(input, options)`
- added injected audit / contact log / dispatch note writer boundaries
- sends only safe metadata to injected writers
- still no DB / API / real writer / provider runtime

## Future Tasks

- Phone Change Re-verification Flow implementation.
- Correction API and controller boundary.
- Permission runtime integration.
- Real audit log writer integration.
- Real contact log and dispatch note writer integration.
- Pre-departure correction write path.
- Post-departure freeze integration with manual handling flow.
- Unable-to-complete terminal appointment result flow.
- Follow-up / second-dispatch appointment creation.
- Customer-facing report amendment versioning.
- Unit, integration, and smoke coverage for full correction lifecycle.

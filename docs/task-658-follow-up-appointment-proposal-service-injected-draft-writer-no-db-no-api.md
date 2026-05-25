# Task658 - Follow-up Appointment Proposal Service / Injected Draft Writer / No DB / No API

## Scope

Task658 adds a bounded follow-up appointment proposal service for Data Correction / Amendment Governance.

This service creates safe draft/proposal metadata only. It does not create a formal appointment, does not create a Field Service Report, and does not modify `finalAppointmentId`.

## Added Service

`src/dataCorrection/followUpAppointmentProposalService.js`

Exported API:

- `proposeFollowUpAppointment(input, options)`
- `FOLLOW_UP_PROPOSAL_TYPES`
- `FOLLOW_UP_TERMINAL_STATES`
- `PROPOSAL_STATUSES`
- `WRITER_STATUSES`

Supported injected options:

- `followUpDraftWriter`
- `dispatchNoteWriter`
- `auditWriter`

The service does not import DB, repositories, routes, controllers, provider clients, AI, RAG, or notification runtime.

## Supported Terminal States

Follow-up proposal is allowed only after one of these terminal appointment states:

- `pending_parts`
- `quote_required`
- `customer_not_home`
- `unable_to_complete`
- `follow_up_required`

Unsupported terminal states such as `completed` are denied.

## Supported Proposal Types

Supported proposal types:

- `follow_up_appointment`
- `second_dispatch`
- `parts_return_visit`
- `quote_revisit`
- `customer_reschedule`

Task658 only proposes a follow-up draft. It does not create a confirmed appointment or dispatch visit.

## Authorization Boundary

Allowed roles:

- customer service
- dispatch assistant
- supervisor
- admin

The actor must also have a follow-up proposal permission in the input context.

Engineers are denied by default in this first slice. Engineer-originated terminal results are handled by Task657; follow-up creation remains a dispatch/customer-service responsibility until a future task explicitly designs engineer follow-up proposal behavior.

## Safe Writer Payload

Injected writers receive only:

- `organizationId`
- `caseId`
- `sourceAppointmentId`
- `actor.userId`
- `actor.role`
- `terminalState`
- `proposalType`
- `reasonCode`
- optional `safeNote`
- allow-listed `requiredPartsRefs`

Required parts refs are metadata only and are allow-listed to:

- `partId`
- `partCode`
- `partName`
- `quantity`
- `source`

The service strips or omits:

- raw phone
- raw address
- raw LINE user id
- token / secret / password
- internal note raw value
- AI raw payload
- raw file path / storage path
- `finalAppointmentId`
- full request payload

## Explicit Non-creation Flags

The service explicitly returns:

- `formalAppointmentCreated: false`
- `fieldServiceReportCreated: false`
- `finalAppointmentIdChanged: false`

Formal follow-up appointment creation belongs to a later approved task.

## Tests

Added:

- `tests/dataCorrection/followUpAppointmentProposalService.unit.test.js`

Coverage includes:

- Missing input safe-deny.
- Organization mismatch safe-deny.
- Missing permission safe-deny.
- Dispatch assistant can propose follow-up for pending parts.
- Customer service can propose follow-up for quote required.
- Supervisor/admin can propose follow-up.
- Engineer denied by default.
- Unsupported terminal state denied.
- Every supported proposal type accepted.
- Invalid proposal type denied.
- Invalid reason code denied.
- Follow-up draft writer receives safe payload only.
- Dispatch note writer receives safe metadata only.
- Audit writer receives safe metadata only.
- Writer failure returns safe metadata without raw error leak.
- Required parts refs are sanitized and allow-listed.
- Raw phone / address / LINE id / token / secret / internal / AI payloads are stripped.
- `finalAppointmentId` value is excluded.
- The service returns no formal appointment, no FSR, and no final appointment mutation flags.
- Input object is not mutated.
- Import boundary excludes DB, repository, provider, notification runtime, AI, RAG, and vector imports.

## Non-goals

Task658 does not:

- Add or modify APIs.
- Add or modify controllers or routes.
- Add DB queries, repositories, transactions, migrations, or schema.
- Create formal appointments.
- Create Field Service Reports.
- Modify original appointments, Case, Field Service Report, customer identity, LINE/App binding, or finalAppointmentId.
- Add a real audit log writer, dispatch note writer, or follow-up draft persistence.
- Send LINE, SMS, Email, App push, AI calls, or provider notifications.
- Add Engineer Mobile, dispatch UI, or admin UI.
- Add smoke tests.
- Touch shared runtime or production data.

## Future Tasks

Recommended follow-up tasks:

1. Add repository-backed follow-up draft persistence behind explicit API, permission, audit, and DB approval.
2. Add formal follow-up appointment creation flow with one-open-appointment guard.
3. Add dispatch/admin UI for reviewing and confirming follow-up proposals.
4. Add Engineer Mobile Workbench visibility for follow-up status.
5. Add integration and smoke coverage when API and DB slices are approved.

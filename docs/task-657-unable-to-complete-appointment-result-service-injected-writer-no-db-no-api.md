# Task657 - Unable-to-complete Appointment Result Service / Injected Writer / No DB / No API

## Scope

Task657 adds a bounded service for recording arrived, unable-to-complete appointment terminal results through injected writers only.

This task supports the Data Correction / Amendment Governance rule that after an engineer arrives and the work cannot be completed, the current appointment should end with a clear terminal state and evidence metadata. It must not silently rewrite the original repair/dispatch data or force completion.

## Added Service

`src/dataCorrection/unableToCompleteAppointmentResultService.js`

Exported API:

- `recordUnableToCompleteAppointmentResult(input, options)`
- `TERMINAL_STATES`
- `REASON_TO_TERMINAL_STATE`
- `RESULT_STATUSES`
- `WRITER_STATUSES`

Supported injected options:

- `appointmentResultWriter`
- `evidenceWriter`
- `auditWriter`

The service does not import DB, repositories, routes, controllers, provider clients, AI, RAG, or notification runtime.

## Terminal States

Supported terminal appointment states:

- `pending_parts`
- `quote_required`
- `customer_not_home`
- `unable_to_complete`
- `follow_up_required`

Supported reason mappings include:

- `pending_parts` -> `pending_parts`
- `missing_parts` -> `pending_parts`
- `parts_unavailable` -> `pending_parts`
- `quote_required` -> `quote_required`
- `customer_not_home` -> `customer_not_home`
- `unable_to_complete` -> `unable_to_complete`
- `site_condition_mismatch` -> `unable_to_complete`
- `product_mismatch` -> `unable_to_complete`
- `product_condition_mismatch` -> `unable_to_complete`
- `follow_up_required` -> `follow_up_required`
- `second_person_required` -> `follow_up_required`

If both `reasonCode` and `terminalState` are supplied, they must match the mapping.

## Authorization Boundary

The service accepts only:

- assigned engineer for the appointment; or
- supervisor/admin with a result-recording permission.

The appointment must be in arrived / in-field context.

The service safe-denies:

- missing context;
- organization mismatch;
- unassigned engineer;
- unsupported actor role;
- appointment not arrived;
- invalid reason code;
- terminal state / reason mismatch.

## Safe Writer Payload

`appointmentResultWriter` receives only:

- `organizationId`
- `caseId`
- `appointmentId`
- `actor.userId`
- `actor.role`
- `terminalState`
- `reasonCode`
- optional `safeNote`
- allow-listed `evidenceRefs`

`evidenceWriter` receives safe evidence reference metadata only.

`auditWriter` receives the same safe appointment result metadata.

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

Evidence refs are metadata only. Task657 does not upload, download, inspect, or persist files.

## Completion and Follow-up Boundaries

Task657 explicitly returns:

- `fieldServiceReportCreated: false`
- `followUpAppointmentCreated: false`
- `followUpRecommended: true`

This service does not create a Field Service Report, does not create a follow-up appointment, and does not modify `finalAppointmentId`.

Follow-up appointment / second-dispatch creation belongs to a later task.

## Tests

Added:

- `tests/dataCorrection/unableToCompleteAppointmentResultService.unit.test.js`

Coverage includes:

- Missing input safe-deny.
- Organization mismatch safe-deny.
- Unassigned engineer denied.
- Assigned engineer can record arrived unable-to-complete result.
- Supervisor/admin with permission can record result.
- Appointment not arrived denied.
- Every supported terminal state accepted.
- Reason code maps to expected terminal state.
- Invalid reason code denied.
- Terminal state mismatch denied.
- Writer payload contains safe metadata only.
- Evidence writer receives safe evidence refs only.
- Audit writer receives safe metadata only.
- Writer failure returns safe metadata without raw error leak.
- Raw phone / address / LINE id / token / secret / internal / AI payloads are stripped.
- `finalAppointmentId` is excluded.
- Input object is not mutated.
- No Field Service Report creation.
- No follow-up appointment creation.
- Import boundary excludes DB, repository, provider, notification runtime, AI, RAG, and vector imports.

## Non-goals

Task657 does not:

- Add or modify APIs.
- Add or modify controllers or routes.
- Add DB queries, repositories, transactions, migrations, or schema.
- Create Field Service Reports.
- Create follow-up appointments.
- Modify Case, Appointment, Field Service Report, customer identity, LINE/App binding, or finalAppointmentId.
- Upload, download, or process evidence files.
- Add a real audit log writer, appointment result writer, or evidence writer.
- Send LINE, SMS, Email, App push, AI calls, or provider notifications.
- Add admin UI.
- Add smoke tests.
- Touch shared runtime or production data.

## Future Tasks

Recommended follow-up tasks:

1. Add repository-backed unable-to-complete appointment result persistence behind explicit API, permission, audit, and DB approval.
2. Add follow-up appointment creation flow after terminal appointment result.
3. Add Engineer Mobile Workbench UI for terminal result capture.
4. Add file upload/evidence metadata integration.
5. Add integration and smoke coverage when API and DB slices are approved.

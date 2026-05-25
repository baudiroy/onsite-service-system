# Task656 - Post-departure Correction Freeze Handling Service / Injected Contact + Dispatch Note Writers / No DB / No API

## Scope

Task656 adds the first post-departure freeze handling slice for Data Correction / Amendment Governance.

This is a bounded runtime service with injected writers only. It does not apply data corrections and does not connect to API, DB, repositories, providers, notification runtime, or Engineer Mobile Workbench runtime.

## Added Service

`src/dataCorrection/postDepartureCorrectionFreezeService.js`

Exported API:

- `handlePostDepartureCorrectionFreeze(input, options)`
- `FREEZE_STATUSES`
- `WRITER_STATUSES`

Supported injected options:

- `auditWriter`
- `contactLogWriter`
- `dispatchNoteWriter`
- `engineerNotificationWriter`

The service calls the existing Data Correction request policy service and only handles the frozen post-departure path:

- engineer departed
- route started
- not arrived
- policy decision is `manual_dispatch_contact_required`

## Behavior

When the engineer has departed or started the route, ordinary data correction is frozen. The service:

- does not apply the correction;
- does not mutate Case, Appointment, Field Service Report, customer identity, or finalAppointmentId;
- returns manual handling metadata;
- calls injected `auditWriter`, `contactLogWriter`, and `dispatchNoteWriter` when provided;
- may call injected `engineerNotificationWriter` with a safe notification-intent payload when provided.

This prevents silent overwrites after the engineer has already started working from a dispatch task.

## Not-applicable Paths

The service does not run generic freeze writers for:

- missing input;
- pre-departure allowed corrections;
- phone / customer channel identity changes;
- arrived / onsite corrections.

Phone and customer channel identity corrections remain Phone Change Re-verification flow candidates.

Arrived / onsite corrections return engineer-evidence metadata and should be handled by a future terminal appointment result or unable-to-complete flow.

## Safe Writer Payload

Injected contact / dispatch / audit writers receive only safe metadata:

- `organizationId`
- `caseId`
- `appointmentId`
- `actor.userId`
- `actor.role`
- `correction.fieldKey`
- `correction.fieldGroup`
- `decision`
- `reasonCode`
- `safeMessageKey`
- `manualHandlingType`
- optional timestamp

The service does not pass:

- raw `fromValue`
- raw `toValue`
- raw phone
- raw address
- raw LINE user id
- token / secret / password
- internal note raw value
- audit raw payload
- AI raw payload
- `finalAppointmentId`
- full request payload

`engineerNotificationWriter` receives a notification-intent payload only. Task656 does not send LINE, SMS, Email, App push, or any provider notification.

## Tests

Added:

- `tests/dataCorrection/postDepartureCorrectionFreezeService.unit.test.js`

Coverage includes:

- Missing input returns safe not-applicable and no writers are called.
- Pre-departure allowed correction does not call freeze writers.
- Engineer departed correction returns frozen manual handling metadata.
- Route started correction returns frozen manual handling metadata.
- Departed correction calls contact log, dispatch note, and audit writers when injected.
- Engineer notification intent writer receives safe metadata when injected.
- Phone correction remains re-verification required and does not call freeze writers.
- Arrived correction returns engineer evidence required and does not call freeze writers as a generic correction.
- Writer failures return safe metadata and do not leak raw error text.
- Writer payload excludes raw values and finalAppointmentId.
- Input object is not mutated.
- The service contains no correction writer or data application behavior.
- Import boundary excludes DB, repository, provider, notification runtime, AI, RAG, and vector imports.

## Non-goals

Task656 does not:

- Apply data corrections.
- Add or modify APIs.
- Add or modify controllers or routes.
- Add DB queries, repositories, transactions, migrations, or schema.
- Modify Case, Appointment, Field Service Report, customer identity, LINE/App binding, or finalAppointmentId.
- Add a real audit log writer, contact log writer, dispatch note writer, or notification writer.
- Send LINE, SMS, Email, App push, AI calls, or provider notifications.
- Add admin UI.
- Add smoke tests.
- Touch shared runtime or production data.

## Future Tasks

Recommended follow-up tasks:

1. Add Phone Change Re-verification runtime with SMS/Web verification and channel identity safeguards.
2. Add repository-backed post-departure contact log / dispatch note runtime behind explicit API, permission, audit, and DB approval.
3. Add Engineer Mobile Workbench notification/reconfirm surface.
4. Add unable-to-complete appointment terminal result flow.
5. Add follow-up appointment creation flow.
6. Add integration and smoke coverage when the API and DB slices are approved.

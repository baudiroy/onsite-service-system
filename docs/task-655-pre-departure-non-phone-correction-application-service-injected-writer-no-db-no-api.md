# Task655 - Pre-departure Non-phone Correction Application Service / Injected Writer / No DB / No API

## Scope

Task655 adds the first application-layer slice for Data Correction / Amendment Governance.

This task is intentionally bounded:

- Add a pure service wrapper for pre-departure, non-phone operational corrections.
- Use injected writers only.
- Do not mount routes.
- Do not create DB clients.
- Do not add migrations.
- Do not modify Case, Appointment, Field Service Report, customer identity, LINE/App binding, finalAppointmentId, or follow-up appointment runtime.

## Added Service

`src/dataCorrection/preDepartureCorrectionApplicationService.js`

Exported API:

- `applyPreDepartureCorrection(input, options)`
- `APPLICATION_STATUSES`
- `WRITER_STATUSES`

Supported injected options:

- `correctionWriter`
- `auditWriter`
- `engineerNotificationWriter`

The service calls the existing `processDataCorrectionRequest` policy/request service and only calls `correctionWriter` when all of the following are true:

- The policy allows pre-departure correction.
- `correctionApplicationReady` is true.
- The correction is not phone identity or customer channel identity.
- The correction field group is one of:
  - `repair_operational`
  - `dispatch_operational`
  - `appointment_operational`
- The engineer has not departed.
- The route has not started.
- The engineer has not arrived.
- The target value can be safely included as a minimal, sanitized value.

## Safety Behavior

The service is fail-closed by default.

It never calls `correctionWriter` for:

- Phone changes.
- LINE / App / customer channel identity changes.
- Internal-only or unknown fields.
- Post-departure corrections.
- Route-started corrections.
- Arrived / onsite corrections.
- Unsafe raw address-like changes.
- Corrections without an injected writer.

Phone and channel identity changes continue to require re-verification. They are not silently applied and do not overwrite customer identity or channel binding.

Post-departure and route-started corrections remain manual-handling paths. They should be handled by future contact log / dispatch note workflows instead of silent data mutation.

Arrived / onsite changes remain engineer-evidence paths.

## Safe Writer Payload

`correctionWriter` receives safe metadata only:

- `organizationId`
- `caseId`
- `appointmentId`
- `actor.userId`
- `actor.role`
- `correction.fieldKey`
- `correction.fieldGroup`
- sanitized `correction.toValue`, only when safe
- `decision`
- `reasonCode`

The service does not pass through:

- raw `fromValue`
- raw phone
- raw address
- raw LINE user id
- token / secret / password
- internal note
- audit raw payload
- AI raw payload
- `finalAppointmentId`
- full request payload

## Engineer Reconfirmation

If an appointment exists or the engineer has received the task, the service preserves the existing policy metadata:

- `engineerReconfirmRequired: true`

If `engineerNotificationWriter` is injected, it receives the same safe metadata as the correction writer. This is only a future workbench/notification handoff marker; Task655 does not implement Engineer Mobile Workbench runtime, LINE push, App push, SMS, Email, or provider delivery.

## Tests

Added:

- `tests/dataCorrection/preDepartureCorrectionApplicationService.unit.test.js`

Coverage includes:

- Missing input safe-deny and no writer call.
- Allowed pre-departure non-phone correction calls `correctionWriter`.
- Writer payload contains safe metadata only.
- Engineer received task / appointment context triggers reconfirm metadata.
- `engineerNotificationWriter` is called only when reconfirm is required and injected.
- Phone changes never call `correctionWriter`.
- LINE / channel identity changes never call `correctionWriter`.
- Post-departure, route-started, and arrived paths never call `correctionWriter`.
- Writer failures return safe failure metadata without leaking raw error text.
- `finalAppointmentId` is excluded.
- Raw phone / address / LINE id / token / secret / internal / AI payloads are excluded.
- Input object is not mutated.
- Import boundary excludes DB, repository, provider, notification, AI, RAG, vector, route, and controller imports.

## Non-goals

Task655 does not:

- Add or modify API routes.
- Add or modify controllers.
- Add DB queries, repositories, transactions, or migrations.
- Apply real Case / Appointment / Field Service Report writes.
- Modify phone / customer / LINE / App identity.
- Modify `finalAppointmentId`.
- Create follow-up appointments.
- Send LINE, SMS, Email, App push, AI calls, or provider notifications.
- Add admin UI.
- Add smoke tests.
- Touch shared runtime or production data.

## Future Tasks

Recommended follow-up tasks:

1. Wire a real repository-backed correction writer behind explicit API, permission, audit, and DB-scope approval.
2. Add Phone Change Re-verification runtime with SMS/Web verification and customer channel identity safety.
3. Add post-departure manual contact log / dispatch note runtime.
4. Add Engineer Mobile Workbench reconfirmation surface after pre-departure correction.
5. Add unable-to-complete appointment result and follow-up appointment creation flow.
6. Add integration and smoke coverage when the API and DB slices are approved.

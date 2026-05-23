# Task 653 - Data Correction Request Service with Audit/Contact Note Injection / No DB / No API

## Summary

Task 653 adds a Data Correction Request Service that wraps the Task652 policy engine and supports injected audit / contact log / dispatch note writer boundaries.

This task does not add an API, connect to DB, add migrations, modify schema, integrate permission runtime, write real audit logs, write real contact logs, write real dispatch notes, send providers, touch LINE/SMS/App runtime, or add AI/RAG runtime.

## Runtime File

- `src/dataCorrection/dataCorrectionRequestService.js`

Exports:

- `processDataCorrectionRequest(input, options)`

Allowed injected options:

- `auditWriter`
- `contactLogWriter`
- `dispatchNoteWriter`

## Behavior

`processDataCorrectionRequest(input, options)`:

1. Calls `evaluateDataCorrectionPolicy(input)`.
2. Returns the policy decision plus safe service metadata.
3. Calls injected `auditWriter` only when `policy.auditRequired === true`.
4. Calls injected `contactLogWriter` only when `policy.contactLogRequired === true`.
5. Calls injected `dispatchNoteWriter` only when `policy.dispatchNoteRequired === true`.
6. Sends only safe metadata to injected writers.
7. Converts writer failures into safe writer result metadata without leaking raw error messages.

## Safe Writer Payload

Writer payload may include:

- `organizationId`
- `caseId`
- `appointmentId`
- actor `userId`
- actor `role`
- correction `fieldKey`
- correction `fieldGroup`
- `decision`
- `reasonCode`
- `safeMessageKey`
- caller-provided synthetic timestamp, if present

Writer payload must not include:

- raw `fromValue` / `toValue`
- full request dump
- raw phone
- raw address
- raw LINE id
- token
- secret
- internal note
- audit log
- AI raw payload
- `finalAppointmentId`

## Phone Change Behavior

Phone / customer channel identity / LINE/App binding changes remain blocked from general correction flow.

This service returns:

- `phoneReverificationRequired: true`
- `allowed: false`
- `decision: phone_reverification_required`

It does not send SMS, LINE, App push, Email, or any verification provider. Future Phone Change Re-verification Flow implementation must be a separate bounded task.

## Pre-departure Behavior

Allowed pre-departure non-phone operational corrections return:

- `allowed: true`
- `correctionApplicationReady: true`

This task does not apply the correction to Case / Appointment / Field Service Report. It only marks that a future write-path task may proceed if permission, audit, and data checks pass.

If the engineer has received the task but has not departed, the response preserves `engineerReconfirmRequired: true`.

## Post-departure Behavior

After engineer departure or route start, the service returns manual handling metadata:

- `contactLogRequired: true`
- `dispatchNoteRequired: true`
- `auditRequired: true`
- `manualHandlingRequired: true`

If injected writers are provided, they receive safe metadata only.

## Explicit Non-goals

This task does not:

- add API routes
- update Case / Appointment / Field Service Report
- modify `finalAppointmentId`
- create appointment or follow-up appointment
- write real audit logs
- write real contact logs
- write real dispatch notes
- connect to DB
- add DB migration or schema changes
- integrate permission runtime
- send LINE / SMS / App / Email notifications
- add AI/RAG runtime

## Tests

Added:

- `tests/dataCorrection/dataCorrectionRequestService.unit.test.js`

Coverage includes:

- missing input safe deny
- service returns policy decision
- phone change requires re-verification and no provider send
- phone change audit writer receives safe metadata
- pre-departure allowed correction readiness
- engineer received task before departure reconfirm metadata
- post-departure injected writer calls
- route-started manual handling metadata
- arrived engineer evidence metadata
- writer throw safe failure metadata
- no writer injected safe result
- object writer support
- writer payload strips raw phone / address / LINE id / token / secret / internal note / AI raw payload
- writer payload excludes `finalAppointmentId`
- input immutability
- import boundary

## Guardrails Preserved

- One Case may have multiple appointments / dispatch visits, but only one formal Field Service Report.
- Field Service Report remains the Case-level final completion summary.
- `finalAppointmentId` remains system-determined and is not modified.
- Organization isolation and customer-visible data policy remain required.
- Phone / customer channel identity / LINE/App binding changes require re-verification and cannot be silently overwritten.
- AI cannot auto-apply or approve official corrections.

## Future Tasks

Future work should be separately scoped:

- Phone Change Re-verification Flow implementation
- correction API and permission runtime
- real audit log writer integration
- real contact log writer integration
- real dispatch note writer integration
- pre-departure correction write path
- post-departure freeze integration
- unable-to-complete terminal appointment result flow
- follow-up appointment creation
- integration / smoke coverage

## Verification

Expected targeted checks:

- `node --check src/dataCorrection/dataCorrectionRequestService.js`
- `node --test tests/dataCorrection/dataCorrectionRequestService.unit.test.js`
- `git diff --check -- src/dataCorrection/dataCorrectionRequestService.js tests/dataCorrection/dataCorrectionRequestService.unit.test.js docs/task-653-data-correction-request-service-with-audit-contact-note-injection-no-db-no-api.md`

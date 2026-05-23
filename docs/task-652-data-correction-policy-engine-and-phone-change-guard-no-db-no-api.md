# Task 652 - Data Correction Policy Engine and Phone Change Guard / No DB / No API

## Summary

Task 652 adds the first runtime guard for Data Correction / Amendment Governance Phase 1.

This task creates a pure policy engine for repair / dispatch data correction decisions. It does not create a correction API, connect to DB, add migrations, modify schema, write audit logs, send notifications, touch provider runtime, modify Engineer Mobile runtime, or invoke AI/RAG.

## Runtime File

- `src/dataCorrection/dataCorrectionPolicyEngine.js`

Exports:

- `evaluateDataCorrectionPolicy(input)`
- `DATA_CORRECTION_DECISIONS`
- `DATA_CORRECTION_REASONS`
- `CORRECTION_FIELD_GROUPS`

## Policy Contract

The policy engine returns deterministic decision metadata such as:

- `allowed`
- `decision`
- `reasonCode`
- `customerVisible`
- `auditRequired`
- `auditEventType`
- `contactLogRequired`
- `dispatchNoteRequired`
- `engineerReconfirmRequired`
- `engineerEvidenceRequired`
- `phoneReverificationRequired`
- `safeMessageKey`

The output is audit-ready / contact-log-ready / dispatch-note-ready metadata only. This task does not write audit logs, contact logs, dispatch notes, or any official record.

## Phone Change Guard

Phone number, phone identity, customer channel identity, LINE identity, and App binding related changes must go through a future Phone Change Re-verification Flow.

The policy engine blocks general correction flow for phone/channel identity fields by returning:

- `decision: phone_reverification_required`
- `reasonCode: PHONE_CHANGE_REQUIRES_REVERIFICATION`
- `allowed: false`
- `phoneReverificationRequired: true`
- `auditRequired: true`

Phone or channel identity corrections never return `allowed: true`, even before engineer departure.

## Pre-departure Correction

Before engineer departure, non-phone operational corrections can be allowed for scoped roles with correction permission:

- customer service
- dispatch assistant
- supervisor
- admin

Supported operational field groups:

- `repair_operational`
- `dispatch_operational`
- `appointment_operational`

If an appointment exists or the engineer has already received the task but has not departed, the policy returns `engineerReconfirmRequired: true`.

## Post-departure Freeze

After engineer departure or route start, general repair / dispatch operational data should not be silently hard-edited.

The policy returns a manual handling decision with:

- `allowed: false`
- `contactLogRequired: true`
- `dispatchNoteRequired: true`
- `auditRequired: true`

This supports manual dispatch contact and traceability without mutating formal data in this task.

## After Arrival

After arrival, the policy does not hard-edit original dispatch data. It returns an engineer evidence decision:

- `decision: engineer_evidence_required`
- `engineerEvidenceRequired: true`

Future tasks should implement terminal appointment result handling for unable-to-complete cases, such as pending parts, quote required, customer not home, unable to complete, or follow-up required.

## Explicit Non-goals

This task does not:

- add API routes
- update Case / Appointment / Field Service Report
- modify `finalAppointmentId`
- create appointment or follow-up appointment
- create, approve, or publish Field Service Report
- write audit logs
- write contact logs
- write dispatch notes
- connect to DB
- add DB migration or schema changes
- integrate permission runtime
- send LINE / SMS / App / Email notifications
- add AI/RAG runtime

## Tests

Added:

- `tests/dataCorrection/dataCorrectionPolicyEngine.unit.test.js`

Coverage includes:

- missing input safe deny
- organization mismatch safe deny
- missing permission safe deny
- customer service / dispatch assistant / supervisor / admin pre-departure allow
- engineer role denied by default
- AI actor denied for official correction
- phone and channel identity corrections require phone re-verification
- phone correction never allowed before departure
- engineer received task before departure requires reconfirm
- engineer departed / route started requires contact log, dispatch note, and audit metadata
- arrived requires engineer evidence flow
- internal-only / unknown fields safe deny
- no raw phone / address / LINE id / token / secret / internal note / AI raw payload output
- input immutability
- no `finalAppointmentId` output
- no DB / repository / provider / AI imports

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
- audit log writer integration
- pre-departure correction write path
- post-departure freeze integration with contact log / dispatch note
- unable-to-complete terminal appointment result flow
- follow-up appointment creation
- integration / smoke coverage

## Verification

Expected targeted checks:

- `node --check src/dataCorrection/dataCorrectionPolicyEngine.js`
- `node --test tests/dataCorrection/dataCorrectionPolicyEngine.unit.test.js`
- `git diff --check -- src/dataCorrection/dataCorrectionPolicyEngine.js tests/dataCorrection/dataCorrectionPolicyEngine.unit.test.js docs/task-652-data-correction-policy-engine-and-phone-change-guard-no-db-no-api.md`

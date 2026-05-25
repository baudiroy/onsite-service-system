# Task 350 - Appointment Guard Regression Matrix / No Runtime Change

## Scope Summary

This document summarizes the current Appointment / Dispatch Visit guard matrix and the related smoke / documentation coverage.

Task350 is documentation-only. It does not modify `src/`, `admin/src/`, `scripts/smoke/`, migrations, schema, indexes, API contracts, package configuration, provider integrations, notification sending, AI / RAG, billing, customer-facing report, survey, complaint, callback, inventory, parts, WMS, supervisor override, or correction runtime.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, shared runtime verification, API fixture creation, or destructive cleanup is part of this task.

## Appointment Guard Matrix

| Guard name | Purpose | Runtime location / known service area | Expected behavior | Existing smoke / doc coverage | Known gap / future task | Guardrail impact |
| --- | --- | --- | --- | --- | --- | --- |
| One-open appointment guard | Prevent multiple open appointments on the same Case at the same time. | `AppointmentService.assertNoOtherOpenAppointment()` with `AppointmentRepository.findOpenAppointmentsByCaseId()`. | A new appointment is rejected when another non-terminal appointment exists for the same Case. A terminal appointment can be followed by a new appointment. | `smoke:029` covers the same-case open appointment rejection and cross-case independence. | Future concurrency hardening may require DB-level or transaction-level review; current guard is service-layer. | Preserves multiple visits per Case without allowing overlapping open visit state. |
| `dispatchAssignmentId` same-case guard | Prevent direct API clients from attaching an appointment to a dispatch assignment from another Case. | `AppointmentService.ensureDispatchAssignmentForCase()`. | Supplied `dispatchAssignmentId` must exist and belong to the same Case. Cross-case assignment is rejected before appointment creation. | `smoke:029` covers cross-case `dispatchAssignmentId` rejection. | Future broader dispatch lifecycle review may define additional state checks. | Preserves Case / Dispatch / Appointment ownership and organization-scoped data integrity. |
| Completed status / visit result consistency guard | Keep appointment lifecycle status aligned with formal visit completion result semantics. | `AppointmentService.ensureAppointmentCompletionConsistency()`. | A resulting `appointmentStatus = completed` requires `visitResult = completed`; a resulting `visitResult = completed` requires `appointmentStatus = completed`. | `smoke:029` covers rejecting status-only completion and rejecting reopening a completed appointment into a status / result mismatch. Task346 documents historical correction boundary. | Historical inconsistent rows are not corrected; future profiling/correction would require explicit approval. | Preserves `visit_result = completed` as the formal final visit signal and protects final appointment inference. |
| Actual time range guard | Prevent reversed actual visit timestamps while allowing progressive field input. | `AppointmentService.validateActualTimeRange()`. | If both `actualArrivalAt` and `actualFinishedAt` are present, `actualFinishedAt` must be after or equal to `actualArrivalAt`. Update validation uses resulting state. Single-sided actual time updates remain allowed. | `smoke:029` covers reversed actual time rejection, invalid partial actual finish rejection, and valid finish update. Task349 documents closure boundary. | Historical reversed actual time rows are not corrected; future profiling/correction requires separate approval. | Supports field workflow while preventing new invalid actual time ranges. |
| Scheduled time range guard | Ensure planned appointment windows are ordered and usable. | `AppointmentService.validateTimeRange()` in create and reschedule/update flow. | `scheduledStartAt` and `scheduledEndAt` must form a valid scheduled window. Current semantics are strict: `scheduledEndAt` must be later than `scheduledStartAt`. | `smoke:029` covers reversed scheduled time rejection. Task349 documents strict `>` semantics. | Future policy task required before loosening to zero-duration `>=` windows. | Preserves clear appointment windows for dispatch, timeline, and customer confirmation. |
| Scheduled time partial update rejection | Prevent repository partial / coalesce updates from creating a reversed resulting scheduled window. | `AppointmentService.rescheduleAppointment()` pair-required check before transaction side effects. | Supplying only `scheduledStartAt` or only `scheduledEndAt` is rejected. Scheduled time updates must provide both fields together. | `smoke:029` covers scheduled partial update rejection. Task349 documents current boundary. | Future resulting-state validation task needed if product wants to allow scheduled partial updates. | Keeps reschedule semantics simple and prevents accidental appointment window drift. |
| Completed Field Service Report immutability interaction | Prevent post-completion appointment/service-part changes from mutating completed formal report state. | Field Service Report service guards, service part mutation guards, and related completion immutability checks. | Completed Field Service Reports cannot be reopened or indirectly mutated through service part changes. | `smoke:028` covers repeat completion rejection, completed report `finalAppointmentId` clear rejection, and completed report service part create/update/delete rejection. Task341 and Task342 document coverage. | Future manual correction / supervisor override would require explicit design and audit policy. | Preserves one Case = one formal completed Field Service Report and protects post-completion stability. |
| `finalAppointmentId` / final appointment completion eligibility interaction | Ensure formal report completion points to a valid completed visit. | Field Service Report completion flow and `AppointmentRepository.findEligibleFinalAppointmentForCase()`. | Completion uses backend-owned inference when omitted, or strict validation when supplied. Eligible final appointment must belong to the same Case and have `visit_result = completed`. | `smoke:028` covers inferred final appointment, deterministic selection, no eligible completed visit rejection, supplied same-case completed acceptance, and cross-case/non-completed rejection. Task343 documents current behavior. | Legacy no-appointment completion remains a documented boundary, not the standard flow. | Keeps final appointment system-determined and preserves multi-visit Case-level report semantics. |

## Current Known Behavior Summary

One Case can have multiple appointments / dispatch visits, but should not have multiple open appointments at the same time through the service-layer guard.

An appointment marked as completed must have `visitResult = completed`, and `visitResult = completed` requires `appointmentStatus = completed`.

Actual time fields can be filled progressively. If both actual arrival and actual finish are present, the finish timestamp cannot be earlier than arrival.

Scheduled time fields are currently stricter. Scheduled start and end must be provided together, and scheduled end must be later than scheduled start.

Completed Field Service Reports remain stable. Appointment-related hardening must not create a path that mutates completed report context, changes `finalAppointmentId`, reopens the report, or creates a second formal report for the same Case.

Field Service Report completion still follows the Case-level formal report invariant:

- one Case = one formal Field Service Report,
- one Case can have multiple appointments / visits,
- multi-visit history belongs to the appointment / dispatch visit layer,
- final appointment eligibility is based on `visit_result = completed`.

## Non-goals

Task350 does not:

- add a runtime guard,
- modify an existing runtime guard,
- add smoke coverage,
- modify validators,
- modify repository behavior,
- modify API behavior,
- correct historical data,
- add a migration,
- add a schema or index change,
- change Field Service Report completion,
- change `finalAppointmentId` inference,
- change Case status workflow,
- add appointment status values,
- add visit result values,
- add supervisor override,
- add manual correction UI,
- add customer-facing report behavior,
- add survey behavior,
- add complaint / callback behavior,
- add notification behavior,
- add LINE / SMS / Email / App behavior,
- add AI / RAG behavior,
- add billing / settlement behavior,
- add inventory / parts / WMS behavior.

## Future Task Candidates

These are future tasks only and must not be implemented as part of Task350.

### Live Smoke Execution

Run `smoke:028` and `smoke:029` only after explicit disposable local/test runtime confirmation.

Do not create API / DB fixtures against shared / production / Zeabur runtime.

### Scheduled Time Partial Update Policy

If product needs to allow single-sided scheduled time updates, create a dedicated runtime task for resulting-state validation and side-effect semantics.

That task must decide how partial scheduled changes affect:

- appointment status,
- Case appointment summary,
- timeline messages,
- audit actions,
- customer-visible appointment history.

### Historical Appointment Inconsistency Profiling

If historical data quality needs review, create a read-only profiling task for:

- reversed scheduled time rows,
- zero-length scheduled time rows,
- reversed actual time rows,
- status-only completed rows,
- visit result / appointment status mismatches.

Any correction must be a separate task with explicit DB / migration approval if data changes are needed.

### Broader Appointment Lifecycle State Machine Review

Future lifecycle review may define a fuller state machine for:

- scheduled,
- rescheduled,
- completed,
- cancelled,
- no-show,
- pending parts,
- pending quote,
- needs second visit,
- customer-not-home.

The current guard matrix does not implement a new state machine.

### Customer-visible Appointment Timeline Policy

Future customer-facing timeline design should decide which appointment statuses, visit results, scheduled times, actual times, and exception reasons can be shown to customers.

That policy must follow customer visible data rules and must not expose internal notes, audit logs, billing internal data, settlement internal data, or AI raw payload.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No DB-level guard is added by Task350.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke file change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, or production data details.

Future smoke output, profiling reports, and correction reports must continue to redact sensitive values and avoid exposing customer or provider data.

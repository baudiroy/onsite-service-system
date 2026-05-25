# Task 351 - Appointment Lifecycle State Machine Boundary Review / No Runtime Change

## Scope Summary

This document reviews the current Appointment / Dispatch Visit lifecycle boundary after the appointment guard and time consistency work from Task345 through Task350.

Task351 is documentation-only. It does not modify `src/`, `admin/src/`, `scripts/smoke/`, migrations, schema, indexes, API contracts, package configuration, provider integrations, notification sending, AI / RAG, billing, customer-facing report, survey, complaint, callback, inventory, parts, WMS, supervisor override, correction runtime, or any appointment lifecycle runtime.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, shared runtime verification, API fixture creation, or destructive cleanup is part of this task.

## Current Lifecycle Concepts

### `appointmentStatus`

`appointmentStatus` is the appointment-level workflow status.

Known values include:

- `scheduled`,
- `rescheduled`,
- `cancelled`,
- `completed`,
- `no_show`.

`appointmentStatus` is used by the service layer to decide whether an appointment is open or terminal and to drive appointment update actions.

It is not the only formal signal of service completion. Formal final appointment eligibility still depends on `visitResult = completed`.

### `visitResult`

`visitResult` is the field visit outcome.

Known values include:

- `completed`,
- `pending_parts`,
- `pending_quote`,
- `need_second_visit`,
- `customer_not_home`,
- `customer_cancelled`,
- `unable_to_repair`,
- `rescheduled`,
- `no_show`.

`visitResult` captures what happened during the visit. It is the key field for final appointment eligibility when completing the Case-level Field Service Report.

Task345 aligned `appointmentStatus = completed` and `visitResult = completed` for new writes.

### Scheduled Time

Scheduled time represents the planned appointment window:

- `scheduledStartAt`,
- `scheduledEndAt`.

Current behavior:

- create requires both scheduled fields,
- update / reschedule requires the pair when changing scheduled time,
- `scheduledEndAt` must be later than `scheduledStartAt`,
- scheduled time partial updates are currently rejected.

### Actual Arrival / Finished Time

Actual time represents the field visit timestamps:

- `actualArrivalAt`,
- `actualFinishedAt`.

Current behavior:

- both fields are optional,
- single-sided actual time update is allowed,
- when both values exist, `actualFinishedAt` must be after or equal to `actualArrivalAt`,
- update validation uses the resulting state.

### Dispatch Assignment

An appointment may reference a dispatch assignment.

When supplied, `dispatchAssignmentId` must belong to the same Case as the appointment.

This prevents cross-case dispatch / appointment linkage through direct API clients.

### Field Service Report Final Appointment

`finalAppointmentId` points from the Case-level Field Service Report to the final completed appointment.

Current final appointment policy:

- backend is the source of truth when the completion request omits `finalAppointmentId`,
- supplied `finalAppointmentId` remains accepted for compatibility before completion but is strictly validated,
- the final appointment must belong to the same Case,
- the final appointment must have `visit_result = completed`,
- completed Field Service Reports cannot be used as a later manual override path.

## Current Known Guard Behavior

### One-open Appointment

The service layer rejects creating another open appointment for the same Case while an open appointment already exists.

Terminal appointment statuses and terminal visit results allow a subsequent appointment.

This supports multiple visits per Case without allowing two active open visits at the same time.

### Completed Status / Visit Result Consistency

New appointment writes must keep completion status and completion result aligned:

- a resulting `appointmentStatus = completed` requires `visitResult = completed`,
- a resulting `visitResult = completed` requires `appointmentStatus = completed`.

This preserves `visitResult = completed` as the formal visit completion signal.

### Scheduled Time Guard

Scheduled appointment windows must be valid:

- create requires `scheduledStartAt` and `scheduledEndAt`,
- update / reschedule requires scheduled time fields as a pair,
- current semantics are strict: `scheduledEndAt` must be later than `scheduledStartAt`,
- single-sided scheduled time partial update is rejected.

### Actual Time Guard

Actual visit times may be filled progressively, but cannot be reversed when both values exist:

- a partial actual arrival or actual finish can be saved,
- when both values are present in the resulting state, `actualFinishedAt` must be after or equal to `actualArrivalAt`.

### Dispatch Assignment Same-case Guard

Supplied `dispatchAssignmentId` must reference a dispatch assignment for the same Case.

Cross-case dispatch assignment linkage is rejected.

### Completed Field Service Report Immutability Interaction

Completed Field Service Reports should not be mutated by later appointment or service part changes.

Existing Field Service Report guards protect completed reports from repeat completion, `finalAppointmentId` clearing, and service part create / update / delete mutation after completion.

### finalAppointmentId Eligibility

Field Service Report completion requires the resolved final appointment to be a completed visit, unless a separately documented legacy no-appointment path applies.

Appointments with `appointmentStatus = completed` but without `visitResult = completed` are not eligible final appointments.

## Boundary Decisions

Appointments / dispatch visits are the place to record visit-level events such as:

- scheduled visit,
- rescheduled visit,
- cancelled visit,
- customer not home,
- pending parts,
- pending quote,
- need second visit,
- unable to repair,
- no-show,
- final completed visit.

Field Service Report is the Case-level formal completion report.

Current core invariant remains:

- one Case = one formal Field Service Report,
- one Case can have multiple appointments / dispatch visits,
- multiple visits do not create multiple formal Field Service Reports,
- appointment history records the process,
- the formal Field Service Report summarizes the final Case completion.

Customer signatures, photos, evidence files, customer fee approval records, and future customer-facing reports should attach to the appropriate appointment / report / file storage boundary when implemented.

Task351 does not implement those attachment or customer-facing flows.

## Known Gaps / Risks

### No Full Appointment Lifecycle State Machine Runtime

The current runtime has targeted guards, but it is not yet a complete appointment lifecycle state machine.

Future work may need a formal transition table for appointment status and visit result combinations.

### Historical Inconsistent Rows Not Profiled

Historical appointment rows may have been created before the newer guards.

Task351 does not query, profile, or correct historical data.

### Status / Visit Result Transitions Not Fully Productized

The platform has not yet fully productized every valid transition among scheduled, rescheduled, cancelled, completed, pending parts, pending quote, customer unavailable, unable to repair, and no-show outcomes.

The current guard only protects the highest-risk consistency boundaries.

### Customer-visible Appointment Timeline Policy Not Defined

There is no final customer-visible policy yet for which appointment states, visit results, time fields, exception reasons, or follow-up actions should be shown to customers.

Future customer-facing timeline design must respect customer visible data rules.

### Supervisor / Admin Correction Workflow Not Designed

There is no approved correction workflow for historical inconsistent appointments or operator mistakes.

Future correction must include permission, reason, audit log, customer-visible impact, and downstream Field Service Report / billing / survey review.

### DB-level Concurrency Guard Not Implemented

The one-open appointment invariant remains service-layer guarded.

A future concurrency hardening task may review DB-level partial unique constraints, row locks, or transaction isolation.

## Non-goals

Task351 does not:

- add or modify enum values,
- add a runtime guard,
- modify an existing runtime guard,
- add smoke coverage,
- modify validators,
- modify repositories,
- modify API behavior,
- correct historical data,
- add a migration,
- add a schema or index change,
- change Field Service Report completion,
- change `finalAppointmentId` inference,
- change Case status workflow,
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

These are future tasks only and must not be implemented as part of Task351.

### Appointment Lifecycle State Machine Proposal

Create a product / engineering proposal that defines allowed appointment status and visit result transitions.

It should distinguish:

- appointment scheduling status,
- field visit outcome,
- case-level completion,
- customer-visible status,
- billing / settlement implications.

### Appointment Lifecycle Transition Guard Runtime Task

After the state machine proposal is approved, implement service-layer transition guards.

This should include targeted tests and must not loosen existing high-risk guards.

### Historical Appointment State Profiling

Create a read-only profiling task for historical appointment state combinations.

No correction should happen in the profiling task.

### Supervisor / Admin Correction Workflow Design

Design a future correction workflow for authorized users.

Required topics:

- permission,
- reason,
- before / after audit,
- customer-visible impact,
- Field Service Report impact,
- `finalAppointmentId` impact,
- survey impact,
- billing / settlement impact.

### Customer-visible Appointment Timeline Policy Review

Define what customers can see about appointment timeline, visit results, actual time, and exception reasons.

This must not expose internal notes, audit logs, billing internal data, settlement internal data, AI raw payload, or unapproved supervisor review records.

### DB-level Concurrency Hardening Review

Review whether the one-open appointment invariant needs DB-level enforcement before higher-concurrency deployment.

Options may include partial unique constraints, row locks, or conditional writes, but none are implemented by Task351.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No DB-level appointment lifecycle constraint is added by Task351.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke file change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, or production data details.

Future lifecycle profiling, correction, and customer-visible timeline work must continue to redact sensitive values and avoid exposing customer or provider data.

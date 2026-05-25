# Task 349 - Appointment Time Consistency Closure Review / No Runtime Change

## Scope And Non-goals

This document closes the appointment time consistency review after Task347 and Task348.

Task349 is documentation-only. It does not change backend runtime, Admin frontend, API contract, smoke tests, migrations, schema, indexes, package configuration, provider integrations, notification sending, AI / RAG, billing, customer-facing report, survey, complaint, callback, inventory, parts, WMS, supervisor override, or correction runtime.

No database connection, data profiling query, correction script, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, shared runtime verification, API fixture creation, or destructive cleanup is part of this task.

## Scope Summary

Task347 completed the appointment actual time range guard.

Task348 reviewed scheduled time behavior and added smoke coverage for the existing scheduled time guard.

This task only documents the current boundary. It does not change the existing strict scheduled time semantics, does not enable scheduled time partial updates, and does not correct historical rows.

## Current Actual Time Behavior

`actualArrivalAt` and `actualFinishedAt` are optional operational timestamps for the field visit.

Current behavior after Task347:

- if both `actualArrivalAt` and `actualFinishedAt` are present, `actualFinishedAt` must be after or equal to `actualArrivalAt`,
- create requests validate the provided actual time pair,
- update requests validate the resulting state by combining the input value with the existing appointment row,
- single-sided actual time updates remain allowed, so field teams can record arrival first and finish later,
- invalid actual time ranges are rejected before repository mutation, case summary updates, timeline messages, and audit side effects.

Task347 did not correct any historical rows where actual finished time may already be earlier than actual arrival time.

## Current Scheduled Time Behavior

`scheduledStartAt` and `scheduledEndAt` represent the planned appointment window.

Current behavior after Task348:

- create requests require both `scheduledStartAt` and `scheduledEndAt`,
- create requests call `validateTimeRange()` before repository mutation,
- the current scheduled time semantic is strict: `scheduledEndAt` must be later than `scheduledStartAt`,
- update / reschedule requests require `scheduledStartAt` and `scheduledEndAt` to be provided as a pair,
- single-sided scheduled time partial updates are rejected before repository mutation,
- when both scheduled fields are provided during update / reschedule, `validateTimeRange()` rejects a reversed or zero-length scheduled window,
- because single-sided scheduled partial updates are rejected, repository partial / coalesce behavior cannot create a resulting reversed scheduled window through the normal service path.

Task348 only added smoke coverage for this existing behavior. It did not change runtime semantics.

## Current Guard Ordering

Appointment time validation happens before repository mutation and before downstream side effects.

The relevant side effects include:

- case appointment summary updates,
- timeline / workflow messages,
- audit records.

The appointment time guards therefore fail closed before state changes are written through the normal service flow.

## Known Non-goals

Task347, Task348, and Task349 do not:

- allow `scheduledEndAt` to equal `scheduledStartAt`,
- loosen scheduled time validation from strict `>` to `>=`,
- allow scheduled time partial updates,
- correct historical reversed scheduled time rows,
- correct historical reversed actual time rows,
- add a migration,
- add a schema or index change,
- add a DB-level time range constraint,
- change appointment status values,
- change visit result values,
- change the one-open appointment invariant,
- change the actual time guard,
- change Field Service Report completion,
- change `finalAppointmentId` inference,
- change Case status workflow,
- add customer-facing report behavior,
- add survey behavior,
- add billing / settlement behavior,
- add notification behavior,
- add AI decision behavior,
- add inventory / parts / WMS behavior.

## Interaction With Existing Guardrails

### One-open Appointment Guard

The one-open appointment guard is not weakened.

Task347 and Task348 do not change the definition of an open appointment and do not create a new path for multiple open appointments on the same Case.

### Dispatch Assignment Same-case Guard

Dispatch assignment same-case validation is not affected.

Appointment time validation does not change whether a dispatch assignment belongs to the same Case.

### Appointment Status / Visit Result Consistency

Task345's status / visit result consistency guard is not affected.

Appointment time validation does not allow `appointmentStatus = completed` without `visitResult = completed`, and does not allow `visitResult = completed` without `appointmentStatus = completed`.

### Field Service Report Finality / finalAppointmentId

Field Service Report finality and `finalAppointmentId` behavior are not affected.

The final appointment remains system-determined by the backend completion flow, and completed Field Service Reports remain protected by their existing immutability guard.

### Customer Channel Identity

No customer channel identity behavior is changed.

This task does not touch LINE, SMS, Email, App, Web link, reverse binding, contact history, or notification delivery.

### Organization Isolation / SaaS Readiness

No organization scope, tenant isolation, entitlement, seat billing, usage billing, AI Add-on, Enterprise SSO, or SaaS plan behavior is changed.

### AI / RAG

No AI / RAG behavior is changed.

AI remains advisory only and cannot decide appointment time correctness, mutate appointment state, or override validation.

## Smoke Coverage Summary

Task347 added smoke coverage for:

- rejecting `actualFinishedAt` earlier than `actualArrivalAt`,
- rejecting an invalid partial actual finish update against an existing actual arrival,
- accepting a valid actual finish update after an existing actual arrival.

Task348 added smoke coverage for:

- rejecting `scheduledEndAt` earlier than `scheduledStartAt`,
- rejecting a scheduled time partial update that only supplies one side of the scheduled range.

The smoke changes were added to `scripts/smoke/029_single_open_appointment_guard_smoke.js`.

The new smoke assertions require an API / DB fixture runtime to execute. They should only be run when a disposable local/test runtime is explicitly confirmed, never against shared / production / Zeabur DB.

## Historical Data Boundary

These tasks do not claim that historical data is clean.

Possible historical issues, if any, are out of scope:

- existing rows with `actual_finished_at < actual_arrival_at`,
- existing rows with `scheduled_end_at <= scheduled_start_at`,
- imported rows that bypassed service-layer validation,
- direct database writes that bypassed service-layer validation.

Any historical correction must be a separate task with data profiling, dry-run output, explicit DB / migration approval if needed, rollback planning, audit design, and customer-visible impact review.

## Future Task Candidates

These are future tasks only and must not be implemented as part of Task349.

### Scheduled Time Partial Update Policy

If the product later wants to allow partial scheduled time updates, create a runtime task that changes the service from pair-required validation to resulting-state validation.

That task should validate:

- existing `scheduledStartAt` + input `scheduledEndAt`,
- input `scheduledStartAt` + existing `scheduledEndAt`,
- input `scheduledStartAt` + input `scheduledEndAt`.

It must also decide whether single-sided scheduled updates should affect appointment status, case summary, timeline message, and audit action semantics.

### Strict `>` vs `>=` Scheduled Window Policy

Current scheduled time behavior requires `scheduledEndAt` to be later than `scheduledStartAt`.

If the product later wants to allow zero-duration appointment windows, create a separate policy task to evaluate operational impact before loosening runtime validation.

### Historical Time Data Profiling

If the team needs to understand historical appointment time quality, create a read-only profiling task.

The profiling task should count and classify reversed or zero-length scheduled / actual time rows without modifying data.

### Historical Time Data Correction

If correction is required after profiling, create a separate correction design task.

That task must define:

- correction rules,
- dry-run report,
- approval flow,
- audit log,
- rollback strategy,
- customer-visible impact,
- DB / migration authorization boundary.

### Live Smoke / Integration Execution

Task347 and Task348 smoke coverage should be executed only after explicit disposable local/test runtime confirmation.

No shared / production / Zeabur runtime should be used for fixture creation.

## Recommended Current Decision

Keep the current runtime behavior:

- actual time may be recorded progressively, but resulting actual time ranges must be valid when both actual timestamps exist,
- scheduled time must be provided as a pair and must form a strict valid appointment window,
- do not correct historical rows automatically,
- do not loosen scheduled time semantics without a dedicated policy task,
- do not run API / DB smoke without explicit disposable local/test runtime confirmation.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No DB-level time range constraint is added by Task349.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke runtime execution.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, or production data details.

Future profiling, smoke, or correction reports must continue to redact sensitive values and avoid leaking customer or provider data.

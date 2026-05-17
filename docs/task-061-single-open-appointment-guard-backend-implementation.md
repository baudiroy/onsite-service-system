# Task 061 — Single Open Appointment Guard Backend Implementation / Smoke

## Scope

Task 061 implements the first backend guard for the rule:

- One case can have multiple appointments over time.
- One case should not have more than one open / unfinished appointment at the same time.
- A new appointment can be created only after the previous appointment is completed, cancelled, no-show, or has a terminal visit result.

This task does not add migrations, change appointment enums, modify the field service report completion guard, change the one-case-one-field-service-report principle, build admin frontend UI, or expand attachment relations.

## Open Appointment Definition

An appointment is considered open when:

- `deleted_at IS NULL`
- `appointment_status NOT IN ('cancelled', 'completed', 'no_show')`
- and:
  - `visit_result IS NULL`, or
  - `visit_result NOT IN terminal visit results`

With the current enum set, a scheduled or rescheduled appointment remains open until it has a terminal appointment status or terminal visit result.

`appointment_status = rescheduled` is not treated as terminal because the current backend reschedules the same appointment row.

## Terminal Appointment Definition

An appointment is terminal when:

- `appointment_status IN ('cancelled', 'completed', 'no_show')`

or:

- `visit_result IN (...)`:
  - `completed`
  - `pending_parts`
  - `pending_quote`
  - `need_second_visit`
  - `customer_not_home`
  - `customer_cancelled`
  - `unable_to_repair`
  - `rescheduled`
  - `no_show`

Terminal visit results do not necessarily complete the whole case. They only mean the current visit attempt has a clear result, so the next appointment can be created.

## Repository Helper

`AppointmentRepository` now provides:

- `findOpenAppointmentsByCaseId(caseId, options = {}, client)`
- `hasOpenAppointmentForCase(caseId, options = {}, client)`

`options.excludeAppointmentId` can be used when checking an update to the current appointment.

The query filters same-case, non-deleted appointments and excludes terminal appointment statuses and terminal visit results. Results are ordered by:

1. `scheduled_start_at ASC`
2. `created_at ASC`

## Create Guard Behavior

`AppointmentService.createAppointment()` now checks for an existing open appointment after case access / organization scope validation and before inserting the new appointment.

If an open appointment exists:

- the new appointment is not inserted
- case appointment summary is not updated
- timeline message is not written
- audit log is not written
- response is a conflict error

Conflict message:

`此案件已有尚未結束的到府預約，請先完成、取消或標記結果後再建立下一筆預約。`

## Update / Reschedule Guard Behavior

Rescheduling the same open appointment is still allowed and is not treated as creating a second open appointment.

Cancelling the same appointment is still allowed.

Updating the same appointment with a terminal visit result is still allowed.

The minimal reopen guard only applies if a terminal appointment would be changed back into an open appointment. In that case, the service checks for another open appointment for the same case, excluding the current appointment id.

## Error Response

The first implementation uses the existing project `ConflictError` pattern:

- HTTP status: `409`
- error code: `CONFLICT`
- message: `此案件已有尚未結束的到府預約，請先完成、取消或標記結果後再建立下一筆預約。`

The error response does not include customer mobile, raw LINE identity, request payload, secrets, tokens, internal notes, or full customer snapshots.

## Smoke:029 Coverage

`npm run smoke:029` runs `scripts/smoke/029_single_open_appointment_guard_smoke.js`.

It verifies:

1. admin login
2. organization and dispatch unit fixture creation
3. primary case creation and dispatch-ready workflow
4. first scheduled appointment creation succeeds
5. second open appointment for the same case is rejected with conflict
6. rescheduling the first appointment succeeds
7. first appointment can be marked terminal with `visitResult = pending_parts`
8. second appointment can be created after the first terminal result
9. open appointment on another case is independent
10. second appointment can be marked `visitResult = completed`
11. service report can be completed with the second appointment as `finalAppointmentId`

`smoke:028` was adjusted only for compatibility with the new single-open rule. It now creates the second appointment after the first appointment has a terminal visit result, while preserving its original field service report completion guard coverage.

## Why No Migration / Partial Unique Index

No migration was added.

The first implementation keeps the single-open rule in service / repository logic because the open definition is a product workflow rule and may evolve. A DB partial unique index can be reconsidered later if the definition stabilizes and performance or data integrity requires it.

## Why Appointment Enums Were Not Changed

This task uses the existing production validator values. It does not add new appointment statuses or visit results.

Future values such as `on_site`, `in_progress`, `quote_required`, or `cancelled` as a visit result should be handled in a separate enum / workflow design task if needed.

## Admin Frontend Impact

Admin frontend may now receive a 409 conflict when attempting to create a new appointment while the previous appointment is still open.

Current admin UI can display backend error messages, but it still needs a future UI path for marking an appointment with a terminal `visitResult`, `nextAction`, and `incompleteReason`.

Recommended follow-up:

- expose a minimal appointment result update UI
- show copy such as `上一筆到府尚未結束，請先完成、取消或標記到府結果。`

## Relationship With Smoke:028

`smoke:028` still verifies:

- pending-parts appointment cannot complete the service report
- missing `finalAppointmentId` is rejected
- cross-case `finalAppointmentId` is rejected
- completed final appointment allows service report and case completion
- one case still has only one active field service report

Task 061 does not change `FieldServiceReportService` completion guard.

## Preserved Principles

- One case still has one official active field service report.
- `field_service_reports.case_id` active uniqueness remains unchanged.
- Service parts still belong to the single official field service report.
- Attachment / photo / signature relation expansion remains deferred.
- Billing / settlement rules are not changed.

## Next Step

Suggested next task:

**Task 062 — Appointment Visit Result Admin Update UI / Smoke**

This should give users a safe frontend path to mark an appointment terminal before creating the next appointment.


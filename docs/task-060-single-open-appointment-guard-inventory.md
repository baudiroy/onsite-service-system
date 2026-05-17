# Task 060 — Single Open Appointment Guard Inventory / Backend Rule Design

## Scope

This task is a read-only inventory and backend rule design for enforcing the future rule:

- One case can have multiple appointments over its lifecycle.
- One case should not have more than one open / unfinished appointment at the same time.
- A new appointment should normally be created only after the previous appointment has a clear terminal visit result.

This task does not implement the guard, add migrations, change API behavior, change admin frontend behavior, or change smoke tests.

The one-case-one-official-field-service-report principle remains unchanged. `field_service_reports.case_id` active uniqueness should remain in place.

Task D for attachment / photo / signature relation expansion remains deferred.

## Existing Appointment Backend Inventory

Relevant backend files:

- `src/routes/appointments.routes.js`
- `src/services/AppointmentService.js`
- `src/repositories/AppointmentRepository.js`
- `src/validators/dispatchAppointmentValidators.js`
- `src/mappers/appointmentMapper.js`
- `migrations/006_create_dispatch_appointment_tables.sql`
- `migrations/018_add_visit_result_fields_to_appointments.sql`

Current appointment API routes:

- `POST /api/v1/admin/cases/:caseId/appointments`
- `GET /api/v1/admin/cases/:caseId/appointments`
- `PATCH /api/v1/admin/appointments/:appointmentId`

Current create flow:

- `AppointmentService.createAppointment()` validates the scheduled time range.
- It verifies case access and resolves the dispatch assignment if provided.
- It creates a new appointment with `appointmentStatus: scheduled`.
- It updates the case summary to scheduled.
- It writes timeline and audit records.
- It does not currently check whether the same case already has another open appointment.

Current update / reschedule flow:

- `AppointmentService.rescheduleAppointment()` updates the existing appointment record.
- If `scheduledStartAt` is provided without an explicit appointment status, it sets status to `rescheduled`.
- `cancelAppointment()` calls the same update path with `appointmentStatus: cancelled`.
- The update API can accept Task A multi-visit fields, including `visitResult`, `nextAction`, `incompleteReason`, `actualArrivalAt`, and `actualFinishedAt`.
- It does not currently prevent reopening or leaving multiple appointments open.

## Current Appointment Status and Visit Result Values

Current `appointmentStatus` validator values:

- `scheduled`
- `rescheduled`
- `cancelled`
- `completed`
- `no_show`

Current `visitResult` validator values:

- `completed`
- `pending_parts`
- `pending_quote`
- `need_second_visit`
- `customer_not_home`
- `customer_cancelled`
- `unable_to_repair`
- `rescheduled`
- `no_show`

Current `nextAction` validator values:

- `close_case`
- `schedule_follow_up`
- `wait_for_parts`
- `wait_for_quote_approval`
- `contact_customer`
- `manager_review`
- `no_action`

Current fields useful for open / terminal decisions:

- `appointment_status`
- `visit_result`
- `scheduled_start_at`
- `scheduled_end_at`
- `actual_arrival_at`
- `actual_finished_at`
- `reschedule_reason`
- `next_action`
- `incomplete_reason`

There is no current `cancelled_at` column on appointments.

The current production enums do not include `assigned`, `on_site`, or `in_progress` appointment statuses. They also do not include `quote_required` or `cancelled` as `visitResult` values.

## Proposed Open Appointment Definition

For the first backend guard, define an open / unfinished appointment conservatively from the existing production fields:

An appointment is open when:

- `deleted_at IS NULL`
- `appointment_status` is not one of:
  - `cancelled`
  - `completed`
  - `no_show`
- and `visit_result` is null or not one of the terminal visit results listed below.

With the current enum set, this means `scheduled` and `rescheduled` appointments are open unless a terminal `visitResult` has been recorded.

`appointment_status = rescheduled` is currently ambiguous because the service uses it when changing the time on the same appointment. For this reason, `rescheduled` status alone should not be treated as terminal in the first guard. If an appointment is truly closed because it was rescheduled into a new visit, that should be expressed by a terminal `visitResult = rescheduled` or an explicit future workflow rule.

## Proposed Terminal Appointment Definition

An appointment is terminal when either:

1. `appointment_status` is one of:
   - `cancelled`
   - `completed`
   - `no_show`

2. Or `visit_result` is one of:
   - `completed`
   - `pending_parts`
   - `pending_quote`
   - `need_second_visit`
   - `customer_not_home`
   - `customer_cancelled`
   - `unable_to_repair`
   - `rescheduled`
   - `no_show`

These values mean the current visit attempt has reached a clear result. Some results do not complete the whole case, but they should allow the next appointment to be scheduled.

Examples:

- `visit_result = pending_parts` means this visit is finished and the case is waiting for parts.
- `visit_result = customer_not_home` means this visit attempt is finished and the customer must be contacted or rescheduled.
- `visit_result = completed` means this visit completed the service and can later be used as the `finalAppointmentId` for completing the official service report.

## Current Gap: Multiple Open Appointments Are Possible

The current backend can create multiple open appointments for the same case because `createAppointment()` does not query existing appointments before inserting a new one.

Current behaviors:

- Creating a second scheduled appointment while the first scheduled appointment is still open is not blocked.
- Updating an appointment to a terminal `visitResult` is supported by the API.
- Rescheduling is currently an update to the same appointment, not a separate new appointment.
- Cancelling an appointment sets `appointmentStatus = cancelled`, which should be terminal.
- Admin frontend currently does not expose editing `visitResult`, so after a backend guard is added, the UI may need a way to mark the previous appointment terminal before creating the next one.

## Backend Guard Design

### Create Appointment Guard

Suggested location:

- `AppointmentService.createAppointment(caseId, payload, actor, req)`

Suggested behavior:

1. After verifying case access and before creating the new appointment, query whether the case already has an open appointment.
2. If an open appointment exists, reject the create request.
3. Use `409 Conflict` or the existing project business error pattern.
4. Do not update case summary, timeline, or audit when the create is rejected.

Suggested user-facing message:

> 此案件已有尚未結束的到府預約，請先完成、取消或標記結果後再建立下一筆預約。

### Update Appointment Guard

Suggested location:

- `AppointmentService.rescheduleAppointment(appointmentId, payload, actor, req)`

Suggested behavior:

- Rescheduling the same appointment should not be blocked as a second open appointment.
- If a future API allows reopening a terminal appointment, the service should check whether another open appointment already exists for the same case.
- If update payload changes an appointment from terminal back to open, use the same guard with `excludeAppointmentId = current appointment id`.

The current repository update pattern uses `coalesce`, so explicit clearing of fields to null is not broadly supported. This reduces immediate reopen risk, but the guard should still be designed for future reopen behavior.

### Reschedule Behavior

Current behavior updates the same appointment record, so it should not trigger the single-open conflict.

If future reschedule behavior creates a new appointment row, the old appointment must first be terminal. For example:

- old appointment `visitResult = rescheduled`, or
- old appointment `appointmentStatus = cancelled`, depending on the final product rule.

## Repository Query Draft

Suggested repository helper:

```js
async findOpenAppointmentsByCaseId(caseId, options = {}, client) {
  const excludeAppointmentId = options.excludeAppointmentId || null;

  return query(
    `
      select *
      from appointments
      where case_id = $1
        and deleted_at is null
        and ($2::uuid is null or id <> $2)
        and appointment_status not in ('cancelled', 'completed', 'no_show')
        and (
          visit_result is null
          or visit_result not in (
            'completed',
            'pending_parts',
            'pending_quote',
            'need_second_visit',
            'customer_not_home',
            'customer_cancelled',
            'unable_to_repair',
            'rescheduled',
            'no_show'
          )
        )
      order by scheduled_start_at asc, created_at asc
    `,
    [caseId, excludeAppointmentId],
    client,
  );
}
```

A boolean wrapper can be added if the service only needs a yes/no result:

```js
async hasOpenAppointmentForCase(caseId, options = {}, client) {
  const openAppointments = await findOpenAppointmentsByCaseId(caseId, options, client);
  return openAppointments.length > 0;
}
```

## Index / Migration Consideration

No migration is recommended for the first implementation.

The existing indexes include:

- `idx_appointments_case_id`
- `idx_appointments_appointment_status`
- `idx_appointments_case_visit_sequence`
- `idx_appointments_visit_result`
- `idx_appointments_next_action`

If performance becomes a problem, a later migration could evaluate an index such as:

- `(case_id, appointment_status, visit_result) where deleted_at is null`

A DB-level partial unique index for "only one open appointment" is not recommended as the first step because the open definition depends on product workflow semantics and may evolve.

## Error Response Draft

Recommended response:

- HTTP status: `409 Conflict`
- Message:
  - `此案件已有尚未結束的到府預約，請先完成、取消或標記結果後再建立下一筆預約。`

Safe metadata, if the project error helper supports metadata:

- `existingAppointmentId`
- `existingAppointmentStatus`
- `existingVisitResult`
- `existingScheduledStartAt`

Do not include:

- customer mobile
- raw LINE user id
- request payloads
- tokens
- secrets
- internal notes
- full customer snapshot

## Smoke:029 / Task 061 Recommendation

Suggested next backend implementation task:

**Task 061 — Single Open Appointment Guard Backend Implementation / Smoke**

Suggested smoke scenarios:

1. Create the first scheduled appointment successfully.
2. Try to create a second appointment before the first is terminal; expect `409 Conflict`.
3. Update the first appointment with `visitResult = pending_parts`, `nextAction = wait_for_parts`, and an incomplete reason.
4. Create a second appointment successfully after the first has a terminal visit result.
5. Reschedule the same appointment and confirm it is not mistaken for a second open appointment.
6. Create appointments for a different case and confirm cross-case appointments do not conflict.
7. Mark the second appointment `visitResult = completed`.
8. Complete the service report using the completed second appointment as `finalAppointmentId`.
9. Confirm legacy no-appointment service report completion remains compatible.
10. Re-run `smoke:028` and confirm it still passes.

## Admin Frontend Impact

Current admin frontend state:

- Appointment create form can create scheduled appointments.
- Appointment update / cancel UI currently supports time, visit type, timezone, cancel/reschedule-related fields, and notes.
- Task 058 visit history displays multi-visit fields read-only.
- Task 059 service report completion auto-selects `finalAppointmentId` from appointments whose `visitResult = completed`.
- The UI does not yet expose editing `visitResult`, `nextAction`, or `incompleteReason`.

If the backend guard is implemented before the frontend can record terminal visit results, users may be blocked from creating a second appointment after a visit that ended with pending parts, customer not home, pending quote, or another non-completed terminal result.

Recommended frontend follow-up:

- Add a small appointment result update UI for marking the current appointment terminal.
- Show backend 409 messages clearly in the appointment create form.
- Add a hint such as:
  - `上一筆到府尚未結束，請先完成、取消或標記到府結果。`

## Why This Task Does Not Change Behavior

This task is intentionally read-only and documentation-only because the guard affects dispatch workflow, appointment editing UX, service report completion, and future smoke coverage.

The safer implementation order is:

1. Design the open / terminal definitions.
2. Add backend guard with clear error behavior.
3. Add smoke coverage.
4. Add or refine admin UI for marking an appointment's terminal visit result.

## Known Limitations

- `appointment_status = rescheduled` is currently ambiguous and should not be treated as terminal by itself.
- There is no `cancelled_at` field on appointments.
- Admin frontend does not yet provide a visible form for updating visit result and next action.
- This design does not enforce the rule at the database level.
- This design does not change service report completion guard or the one-case-one-report rule.

## Next Step

Proceed with:

**Task 061 — Single Open Appointment Guard Backend Implementation / Smoke**

Recommended implementation scope:

- Add repository helper for open appointment lookup.
- Add create appointment guard.
- Add minimal update/reopen guard if needed.
- Add `smoke:029`.
- Re-run `smoke:028`.


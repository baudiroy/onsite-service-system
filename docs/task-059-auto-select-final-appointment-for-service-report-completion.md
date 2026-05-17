# Task 059 - Auto-select Final Appointment for Service Report Completion

## Scope

Task 059 updates the admin Field Service Report completion UX so the frontend automatically selects a final appointment when the user completes a service report.

Included:

- Auto-select final appointment from loaded appointments.
- Submit `finalAppointmentId` with `serviceStatus=completed` when the case has appointments.
- Show completion confirmation copy explaining the selected final appointment.
- Block completion when appointments are loading, failed, or have no completed visit.
- Keep legacy no-appointment completion behavior.

Not included:

- No backend API change.
- No migration.
- No change to `FieldServiceReportService` completion guard.
- No appointment create/edit multi-visit fields.
- No manual finalAppointmentId picker in this task.
- No attachment / photo / signature relation work.
- No billing / settlement automation.
- No case auto-close.

## Why finalAppointmentId Should Be Automatic

The product rule is that a Case can have multiple appointments, but only one official Field Service Report.

Normal workflow should not require users to manually pick a final appointment every time. The frontend can infer the final appointment from completed visit records, while the backend remains the final validator.

Manual override is an admin exception workflow and should not be the default completion path.

## Auto-select Rules

The helper considers only appointments where:

```text
visitResult === completed
```

Selection rules:

1. If there are no completed appointments, return null.
2. If there is one completed appointment, use it.
3. If there are multiple completed appointments:
   - prefer the largest `visitSequence`.
   - if sequence is missing or tied, prefer the latest `actualFinishedAt`.
   - if actual finish time is missing or tied, prefer the latest `scheduledEndAt`.
   - if still tied, use the last completed appointment in the currently loaded appointments order.

The helper defensively handles:

- empty appointments array.
- missing visitSequence.
- missing or invalid date fields.
- unknown visitResult values.
- visitResult casing by checking lower-case completed.

Non-completed visit results are never selected:

- pending_parts
- pending_quote
- need_second_visit
- customer_not_home
- customer_cancelled
- unable_to_repair
- rescheduled
- no_show
- cancelled

## Payload Behavior

When `serviceStatus=completed`:

- If appointments exist, the frontend includes:

```json
{
  "serviceStatus": "completed",
  "finalAppointmentId": "AUTO_SELECTED_APPOINTMENT_ID"
}
```

- If there are no appointments, the frontend keeps legacy behavior and does not force `finalAppointmentId`.
- If serviceStatus is not completed, the frontend does not auto-send or mutate `finalAppointmentId`.
- The frontend does not send `undefined`.
- The frontend does not clear `finalAppointmentId` with null in this task.

## Validation Behavior

When `serviceStatus=completed`:

- If appointments are loading, the frontend blocks submit.
- If appointments failed to load, the frontend blocks submit.
- If appointments exist but none has `visitResult=completed`, the frontend blocks submit.
- If the selected final appointment has no id, the frontend blocks submit.
- If the selected final appointment is not a completed visit, the frontend blocks submit.

When no appointments exist:

- The frontend allows legacy completion and lets the backend compatibility guard decide.

## Completion Confirmation Copy

When a final appointment is auto-selected, the confirmation explains:

- A completed case with appointments needs a final appointment.
- The system has inferred the final completed visit.
- The appointment will be submitted as `finalAppointmentId`.
- The backend still validates same-case ownership and `visitResult=completed`.
- Completing the service report moves the case to completed.
- Completion does not automatically close the case.
- Completion does not automatically create billing or settlement.

## Manual Override

Manual override is not implemented in Task 059.

Reason:

- The normal flow should be automatic.
- Manual override is an admin exception path and needs clearer UX.
- Adding override now would mix completion guard UX with data correction workflows.

Recommended future task:

- Add a collapsed admin exception section for selecting a completed appointment manually.
- Restrict options to appointments with `visitResult=completed`.
- Keep backend guard as the final validator.

## Backend Guard Remains Final

Backend `FieldServiceReportService` remains the final source of truth:

- It verifies finalAppointmentId belongs to the same case.
- It verifies final appointment `visit_result` is completed.
- It rejects missing finalAppointmentId when the case has appointments.
- It preserves legacy no-appointment completion compatibility.

Task 059 does not weaken or bypass backend validation.

## Integration With Task 058

After successful service report completion, existing refresh behavior reloads:

- case detail.
- case list.
- timeline/messages.
- appointments.
- service report.
- billing data where currently wired.

Task 058 then marks the matching appointment with:

```text
最終完成到府
```

because `serviceReport.finalAppointmentId` is refreshed from the backend response.

## Empty / Loading / Error Behavior

Frontend submit behavior:

- appointment loading: block completion and show a friendly message.
- appointment error: block completion and ask user to reload appointment records.
- no completed appointment: block completion and ask user to complete appointment visitResult first.
- backend rejection: show backend `error.message`; requestId can be displayed through existing error handling in development.

No stack trace is shown.

## Why No Backend / Migration / Workflow Change

Task 059 only changes admin frontend completion UX.

It does not modify:

- backend appointment API.
- backend service report API.
- appointment schema.
- field service report schema.
- `field_service_reports.case_id` unique index.
- `FieldServiceReportService` completion guard.
- smoke `028`.

## One Official Field Service Report

Task 059 keeps the one-case-one-official-report rule.

It does not create additional service reports and does not turn appointments into service reports.

## Attachments Relation Deferred

Task D remains deferred.

Task 059 does not add:

- appointment_id to attachments.
- service_report_id to attachments.
- appointment-scoped upload/download flow.
- R2 changes.
- photo or signature relation changes.

## Next Step

Recommended next task:

```text
Task 060 - Single Open Appointment Guard Inventory / Backend Rule Design
```

That task should inventory and design rules for preventing multiple simultaneously open appointments for the same case.

## Validation

Expected checks:

```bash
npm run admin:check
npm run admin:build
npm run check
```

Smoke `028` should not be affected because Task 059 does not change backend logic.

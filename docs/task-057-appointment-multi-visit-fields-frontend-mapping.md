# Task 057 - Appointment Multi-visit Fields Frontend Mapping

## Scope

Task 057 adds frontend API mapping support for multi-dispatch / multi-visit appointment fields and service report final appointment linkage.

This task is intentionally limited to data mapping foundation:

- Update admin frontend API types.
- Preserve backend response fields in sanitizers.
- Add optional payload typings for future UI tasks.
- Do not add visible UI.
- Do not change backend APIs.
- Do not change backend workflow.
- Do not add migrations.
- Do not change smoke tests.

## Business Rule

The platform keeps the formal multi-dispatch rule:

- One Case can have many appointments / visits.
- One Case has one official Field Service Report.
- Field Service Report is the final case-level summary.
- Visit outcomes belong to appointments.
- `field_service_reports.case_id` unique index remains in place.

## Updated Frontend API Types

Updated file:

```text
admin/src/api/caseDispatch.ts
```

`Appointment` now preserves these backend Task A fields:

- `visitSequence?: number | null`
- `visitResult?: string | null`
- `incompleteReason?: string | null`
- `nextAction?: string | null`
- `actualArrivalAt?: string | null`
- `actualFinishedAt?: string | null`

The field names follow frontend/API DTO camelCase naming.

## sanitizeAppointment Mapping

`sanitizeAppointment()` now keeps:

- `visitSequence`
- `visitResult`
- `incompleteReason`
- `nextAction`
- `actualArrivalAt`
- `actualFinishedAt`

The backend mapper returns camelCase fields. The sanitizer also includes conservative snake_case fallback mapping:

- `visit_sequence` -> `visitSequence`
- `visit_result` -> `visitResult`
- `incomplete_reason` -> `incompleteReason`
- `next_action` -> `nextAction`
- `actual_arrival_at` -> `actualArrivalAt`
- `actual_finished_at` -> `actualFinishedAt`

The fallback is only for response preservation and does not make the frontend send snake_case payloads.

## Appointment Payload Typing

`CreateCaseAppointmentPayload` and `UpdateAppointmentPayload` now allow optional:

- `visitSequence`
- `visitResult`
- `incompleteReason`
- `nextAction`
- `actualArrivalAt`
- `actualFinishedAt`

Current UI forms do not use these fields yet. Existing create/update flows do not send undefined fields and do not change behavior.

## Field Service Report Type Mapping

Updated file:

```text
admin/src/api/fieldServiceReports.ts
```

`FieldServiceReport` now includes:

- `finalAppointmentId?: string | null`

## sanitizeFieldServiceReport Mapping

`sanitizeFieldServiceReport()` now keeps:

- `finalAppointmentId`

The backend mapper returns camelCase `finalAppointmentId`. The sanitizer also includes conservative snake_case fallback:

- `final_appointment_id` -> `finalAppointmentId`

## Service Report Payload Typing

`CreateServiceReportPayload` and `UpdateServiceReportPayload` now allow optional:

- `finalAppointmentId?: string | null`

Current Field Service Report UI does not yet provide a final appointment picker. This typing exists so the next UI task can submit the value without changing the API client again.

## Why No Visible UI Change

This task only prepares the frontend API layer. Visible UI changes are intentionally deferred because:

- Case detail needs a dedicated read-only visit history design.
- Service report completion needs a final appointment picker.
- Those UI changes should be reviewed separately to avoid mixing mapping, display, and workflow behavior.

## Why No Backend / Migration / Workflow Change

Backend foundation is already complete:

- Appointment DTO returns multi-visit fields.
- Field Service Report DTO returns `finalAppointmentId`.
- Completion guard requires a valid completed final appointment when the case has appointments.
- Smoke `028` has already verified the backend guard.

Task 057 does not change:

- backend appointment API.
- backend field service report API.
- `FieldServiceReportService` completion guard.
- migrations `018` or `019`.
- `field_service_reports.case_id` unique index.
- one-case-one-official-report behavior.

## Next Steps

Recommended next tasks:

1. `Task 058 - Multi-dispatch Read-only Visit History Panel`
   - Render appointment visit history in case detail.
   - Show visitSequence, visitResult, incompleteReason, nextAction, actualArrivalAt, actualFinishedAt.
   - Mark the appointment whose id equals `serviceReport.finalAppointmentId`.

2. `Task 059 - Final Appointment Picker for Service Report Completion`
   - Add final appointment selection to service report completion flow.
   - Prefer appointments where `visitResult=completed`.
   - Submit `finalAppointmentId` with `serviceStatus=completed`.
   - Keep backend completion guard as the final validator.

## Validation

Expected checks:

```bash
npm run admin:check
npm run admin:build
npm run check
```

This task should not affect smoke `028` because it does not change backend logic or smoke fixtures.

# Task 056 - Multi-dispatch Case Detail Read-only Inventory

## Scope

This task is a read-only inventory and gap analysis for showing multi-dispatch / multi-visit data in the admin `/cases` case detail view.

This task does not implement UI changes and does not change backend behavior.

Out of scope:

- No migration.
- No backend API change.
- No admin frontend implementation change.
- No change to the one-case-one-official Field Service Report rule.
- No change to `field_service_reports.case_id` active unique index.
- No service parts appointment relation.
- No attachment / photo / signature appointment or service report relation.
- No R2 / upload-url / download flow change.
- No smoke test change.

## Business Principle

The current formal multi-dispatch rule remains:

- One Case represents one repair/service request lifecycle.
- One Case can have many dispatch / appointment / visit records.
- One Case has one official Field Service Report.
- Field Service Report is the final case-level summary, not one report per visit.
- Visit outcomes such as missing parts, customer not home, pending quote, or follow-up required belong to appointment / dispatch visit records.
- `field_service_reports.case_id` uniqueness should be preserved.
- Task D for appointment/report attachment relation remains deferred.

## Inventory Scope

Files reviewed:

- `admin/src/pages/CaseManagementPage.tsx`
- `admin/src/api/caseDispatch.ts`
- `admin/src/api/fieldServiceReports.ts`
- `admin/src/api/cases.ts`
- `src/routes/appointments.routes.js`
- `src/routes/fieldService.routes.js`
- `src/validators/dispatchAppointmentValidators.js`
- `src/validators/fieldServiceValidators.js`
- `src/repositories/AppointmentRepository.js`
- `src/repositories/FieldServiceReportRepository.js`
- `src/services/AppointmentService.js`
- `src/services/FieldServiceReportService.js`
- `src/mappers/appointmentMapper.js`
- `src/mappers/fieldServiceMapper.js`
- `migrations/018_add_visit_result_fields_to_appointments.sql`
- `migrations/019_add_final_appointment_id_to_field_service_reports.sql`

## Current Case Detail Panels

The `/cases` case detail currently includes:

- Case basic data.
- Customer Snapshot.
- Customer LINE Identities panel.
- Time records, including `completedAt`.
- Workflow actions.
- Dispatch / Appointment panel.
- Field Service Report panel.
- Billing / Settlement panel.
- Close Workflow panel.
- Attachments panel.
- Timeline / Messages panel.

## Current Appointment Display

The Dispatch / Appointment panel currently loads appointments through:

```text
GET /api/v1/admin/cases/:caseId/appointments
```

Current visible appointment fields in case detail:

- appointment status.
- visit type.
- scheduledStartAt.
- scheduledEndAt.
- timezone.
- rescheduleReason.
- note.
- updatedAt.

Current appointment edit modal supports:

- scheduledStartAt.
- scheduledEndAt.
- visitType.
- timezone.
- appointmentStatus, currently only exposed for cancelling.
- rescheduleReason.
- note.

Current appointment create form supports:

- scheduledStartAt.
- scheduledEndAt.
- visitType.
- timezone.
- note.

The current UI does not display:

- visitSequence.
- visitResult.
- incompleteReason.
- nextAction.
- actualArrivalAt.
- actualFinishedAt.
- final marker by finalAppointmentId.

The current UI also does not create or update those multi-visit fields.

## Current Admin Frontend Appointment API Client Gap

`admin/src/api/caseDispatch.ts` defines `Appointment` without the new Task A fields:

- missing `visitSequence`.
- missing `visitResult`.
- missing `incompleteReason`.
- missing `nextAction`.
- missing `actualArrivalAt`.
- missing `actualFinishedAt`.

Its `sanitizeAppointment()` also strips these fields from the API response.

This means even if the backend returns the multi-visit fields, the current admin frontend cannot retain or render them.

Current frontend payload types also do not support:

- visitSequence.
- visitResult.
- incompleteReason.
- nextAction.
- actualArrivalAt.
- actualFinishedAt.

## Backend Appointment Response Status

Backend appointment foundation is already in place.

Migration:

```text
018_add_visit_result_fields_to_appointments.sql
```

Adds:

- `visit_sequence`
- `visit_result`
- `incomplete_reason`
- `next_action`
- `actual_arrival_at`
- `actual_finished_at`

Backend create/update validation accepts camelCase fields:

- `visitSequence`
- `visitResult`
- `incompleteReason`
- `nextAction`
- `actualArrivalAt`
- `actualFinishedAt`

Backend mapper `toAppointmentDTO()` returns camelCase fields:

- `visitSequence`
- `visitResult`
- `incompleteReason`
- `nextAction`
- `actualArrivalAt`
- `actualFinishedAt`

Conclusion:

- Backend response already exposes multi-visit fields.
- The immediate gap is frontend type / sanitizer / rendering, not backend DTO exposure.

## Current Field Service Report Display

The Field Service Report panel currently uses:

```text
GET /api/v1/admin/cases/:caseId/service-report
POST /api/v1/admin/cases/:caseId/service-report
PATCH /api/v1/admin/service-reports/:reportId
```

Current visible service report fields in case detail:

- case status.
- serviceStatus.
- diagnosisResult.
- repairAction.
- repairResult.
- engineerNote.
- customerNote.
- onsiteStartedAt.
- onsiteCompletedAt.
- createdAt.
- updatedAt.

Current Field Service Report panel does not display:

- finalAppointmentId.
- final appointment reference.
- final appointment visit result.
- final appointment scheduled or actual time.

Current service report form supports:

- diagnosisResult.
- repairAction.
- repairResult.
- engineerNote.
- customerNote.
- serviceStatus.

Current service report form does not support:

- finalAppointmentId picker.
- finalAppointmentId hidden or explicit submit value.

## Current Admin Frontend Field Service API Client Gap

`admin/src/api/fieldServiceReports.ts` defines `FieldServiceReport` without:

- `finalAppointmentId`.

Its `sanitizeFieldServiceReport()` also strips `finalAppointmentId` from the response.

Create/update payload types also do not include:

- `finalAppointmentId`.

Conclusion:

- Backend returns `finalAppointmentId`, but frontend currently drops it.
- UI cannot show which appointment is final.
- UI cannot submit `finalAppointmentId` when completing a service report.

## Backend Field Service Report Response Status

Backend final appointment foundation is already in place.

Migration:

```text
019_add_final_appointment_id_to_field_service_reports.sql
```

Adds:

- `field_service_reports.final_appointment_id` nullable.
- `idx_field_service_reports_final_appointment_id`.

Backend validation accepts:

- `finalAppointmentId` on service report create.
- `finalAppointmentId` on service report update.
- nullable `finalAppointmentId`, including clear behavior support at validator level.

Backend mapper `toFieldServiceReportDTO()` returns:

- `finalAppointmentId`.

Backend service behavior:

- Create/update verifies finalAppointmentId belongs to the same case when provided.
- Complete service report uses the completion guard.
- If the case has appointments, completion requires finalAppointmentId.
- The final appointment must belong to the same case.
- The final appointment `visit_result` must be `completed`.
- Legacy cases without appointments can still complete.

Conclusion:

- Backend response and guard are ready.
- The current frontend is not yet ready for service report completion on cases with appointments.

## Field Service Completion UI Gap

Current Field Service Report panel still allows choosing `serviceStatus=completed`, but it does not provide finalAppointmentId.

Because backend Task C completion guard is active:

- For cases with appointments, setting serviceStatus to completed from the current UI will fail unless the report already has a valid `finalAppointmentId`.
- The UI does not display a final appointment picker.
- The UI does not explain why a final appointment is required before completion.
- The current confirmation copy still says the backend will update the case to completed, but it does not mention the final appointment requirement.

This is a required follow-up gap before the admin UI can reliably complete service reports for multi-dispatch cases.

## Timeline / Messages Panel

The timeline/messages panel currently displays backend-generated case messages.

It does not currently display a structured multi-visit summary. It may still show workflow messages related to service report creation/completion or appointment changes if backend creates them.

For multi-dispatch read-only history, a structured appointment-derived panel is preferable to relying on timeline messages.

## Billing / Settlement Panel

Billing / Settlement currently remains case-level.

No current case detail UI links billing rows to appointment visit result or finalAppointmentId.

This is acceptable for the current business rule:

- BillingService remains common case-level workflow.
- Vendor/brand-specific multi-dispatch settlement rules should remain future work.

## Close Workflow Panel

Close workflow currently depends on case detail, billing, settlement, timeline, and case status readiness.

It does not currently inspect appointment visitResult or finalAppointmentId directly.

This is acceptable for now because backend service report completion guard prevents incorrect service report completion from making a case completed when appointments exist.

Future close readiness may optionally surface final appointment / multi-dispatch warnings for admin clarity.

## Customer Snapshot / LINE Identities Panel

Customer Snapshot and Customer LINE Identities panel are not directly affected by multi-dispatch display.

No customer mobile, customerId, raw lineUserId, or LINE credentials should be included in multi-dispatch links or visit history display.

## Gaps

Frontend data mapping gaps:

- `Appointment` type lacks Task A fields.
- `sanitizeAppointment()` drops Task A fields.
- appointment create/update payload types do not include Task A fields.
- `FieldServiceReport` type lacks `finalAppointmentId`.
- `sanitizeFieldServiceReport()` drops `finalAppointmentId`.
- service report create/update payload types do not include `finalAppointmentId`.

Frontend display gaps:

- Case detail does not show visitSequence.
- Case detail does not show visitResult.
- Case detail does not show incompleteReason.
- Case detail does not show nextAction.
- Case detail does not show actualArrivalAt / actualFinishedAt.
- Case detail does not mark the final appointment.
- Field Service Report panel does not show finalAppointmentId.
- Field Service Report panel does not resolve finalAppointmentId to an appointment row.

Frontend workflow gap:

- Field Service Report completion UI cannot choose finalAppointmentId.
- For cases with appointments, serviceStatus=completed will fail unless a valid finalAppointmentId already exists.

Permission / UX gap:

- Appointment list currently requires `appointments.manage`.
- There is no separate read-only appointment permission in the current frontend panel.
- A future read-only visit history panel may need to use the same backend permission initially or wait for an appointments read permission if product policy requires broader visibility.

## Read-only UI Draft: Multi-dispatch Visit History

Suggested section name:

- 多次到府紀錄
- or 到府歷程

Suggested location:

1. Inside the existing Dispatch / Appointment panel, below the current appointment list.
2. Or near the Field Service Report panel, because finalAppointmentId needs to be understood with visit history.

Recommended first implementation:

- Add a read-only visit history subsection inside Dispatch / Appointment.
- Keep Field Service Report as one official final report.
- Use the same appointment list already loaded by case detail.
- Highlight the appointment whose id equals `serviceReport.finalAppointmentId`.

Suggested columns:

- visitSequence: 第幾次到府.
- scheduledStartAt / scheduledEndAt: 預約時間.
- actualArrivalAt / actualFinishedAt: 實際到場 / 完成時間.
- appointmentStatus: 預約狀態.
- visitType: 到府類型.
- visitResult: 本次結果.
- incompleteReason: 未完成原因.
- nextAction: 下一步.
- final marker: 是否為 finalAppointmentId.
- note.

Suggested labels:

- `completed`: 已完成
- `pending_parts`: 缺料
- `pending_quote`: 需報價
- `need_second_visit`: 需二次到府
- `customer_not_home`: 客戶不在
- `customer_cancelled`: 客戶取消
- `unable_to_repair`: 無法維修
- `rescheduled`: 已改期
- `no_show`: 未到 / 空趟
- unknown/null: 未記錄

Additional display behavior:

- If `visitSequence` is null, sort/display by scheduledStartAt and show `-`.
- If `serviceReport.finalAppointmentId` is set but the matching appointment is not loaded due to pagination, show a warning such as "final appointment is outside the current page" or fetch enough appointments for history.
- Do not create links containing customer mobile, customerId, raw lineUserId, or internal metadata.

## Recommended Next Task 057

Recommended priority:

```text
Task 057 - Appointment Multi-visit Fields Frontend Mapping
```

Reason:

- Backend appointment DTO already exposes multi-visit fields.
- Backend service report DTO already exposes finalAppointmentId.
- The immediate blocker is that admin frontend API types and sanitizers drop these fields.
- Mapping first is the lowest-risk step before adding UI.

Suggested Task 057 scope:

- Update `admin/src/api/caseDispatch.ts`:
  - Add `visitSequence`, `visitResult`, `incompleteReason`, `nextAction`, `actualArrivalAt`, `actualFinishedAt` to `Appointment`.
  - Preserve those fields in `sanitizeAppointment()`.
  - Optionally add payload typings for future create/update support, without adding UI yet.
- Update `admin/src/api/fieldServiceReports.ts`:
  - Add `finalAppointmentId` to `FieldServiceReport`.
  - Preserve it in `sanitizeFieldServiceReport()`.
  - Optionally add finalAppointmentId to payload types for future UI.
- No visible UI change required in Task 057 unless intentionally scoped.
- Run `npm run admin:check` and `npm run admin:build`.

Then follow with:

```text
Task 058 - Multi-dispatch Read-only Visit History Panel
```

Suggested Task 058 scope:

- Render read-only visit history in case detail.
- Show Task A fields.
- Mark final appointment based on serviceReport.finalAppointmentId.
- Keep Field Service Report one per case.

Then:

```text
Task 059 - Final Appointment Picker for Service Report Completion
```

Suggested Task 059 scope:

- Add final appointment picker to Field Service Report completion flow.
- Only allow appointments with visitResult=completed by default.
- Show backend errors clearly.
- Do not alter backend completion guard.

## Risk Assessment

No immediate risk to smoke:028 from this documentation-only task.

Future frontend implementation risks:

- If service report completion UI is changed before finalAppointmentId mapping, users may continue hitting backend validation errors.
- If appointment history is implemented using only paginated current appointments, final appointment marker may be missing when final appointment is outside the current page.
- If UI treats Field Service Report as per-visit report, it would violate the formal business rule. Future tasks must keep one official report per case.
- If attachments are tied to visits too early, R2 upload/download and signature/photo semantics will expand scope significantly. Task D should remain separate.

## Known Limitations

- Case detail currently has no dedicated multi-dispatch read-only section.
- Frontend drops multi-visit appointment fields.
- Frontend drops serviceReport.finalAppointmentId.
- Field Service Report panel cannot complete multi-dispatch cases unless finalAppointmentId is already set by another path.
- Appointment list requires `appointments.manage` under the current UI/backend route permission model.
- Billing/settlement does not yet evaluate per-appointment visit result.
- Attachments/photos/signatures are still case-level.

## Validation

This inventory task should keep existing checks passing:

```bash
npm run admin:check
npm run admin:build
npm run check
```

No backend logic, migration, admin UI implementation, API behavior, or smoke test should be changed by this task.

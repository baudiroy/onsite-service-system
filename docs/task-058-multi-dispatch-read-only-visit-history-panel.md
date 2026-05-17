# Task 058 - Multi-dispatch Read-only Visit History Panel

## Scope

Task 058 adds the first read-only multi-dispatch / multi-visit display inside the admin `/cases` case detail view.

Included:

- Read-only `多次到府紀錄` section.
- Display appointment multi-visit fields from Task A / Task 057.
- Mark the appointment matching `serviceReport.finalAppointmentId`.
- Empty / loading / warning states.

Not included:

- No appointment create/edit fields for visit result.
- No finalAppointmentId picker.
- No service report completion flow change.
- No backend API change.
- No migration.
- No attachment / photo / signature relation change.
- No R2 / upload-url / download flow change.
- No change to one-case-one-official Field Service Report.

## Data Sources

The section reuses data already loaded by case detail:

- `appointments` from `GET /api/v1/admin/cases/:caseId/appointments`
- `serviceReport` from `GET /api/v1/admin/cases/:caseId/service-report`

No new API endpoint is added.

## Placement

The read-only section is placed inside the existing Dispatch / Appointment panel, below the existing appointment list and pagination, before the appointment create form.

This keeps appointment editing and visit history close together while avoiding changes to the Field Service Report workflow.

## Display Fields

Each appointment can show:

- visitSequence: 第幾次到府.
- scheduledStartAt / scheduledEndAt: 預約時間.
- actualArrivalAt / actualFinishedAt: 實際到場 / 實際完成時間.
- appointmentStatus: 預約狀態.
- visitType: 到府類型.
- visitResult: 本次結果.
- incompleteReason: 未完成原因.
- nextAction: 下一步.
- final marker: 是否為 `serviceReport.finalAppointmentId`.
- note.

Null / undefined / empty values render as:

```text
—
```

The section does not render raw `undefined` or `null` text.

## Visit Result Labels

Current label mapping:

- `completed`: 已完成
- `pending_parts`: 缺料
- `pending_quote`: 需報價
- `need_second_visit`: 需二次到府
- `customer_not_home`: 客戶不在
- `customer_cancelled`: 客戶取消
- `unable_to_repair`: 無法維修
- `rescheduled`: 已改期
- `no_show`: 未到 / 空趟
- `cancelled`: 已取消
- `other`: 其他
- empty/null: 未記錄

Unknown future values render defensively as the raw enum string instead of crashing.

## Next Action Labels

Current label mapping:

- `close_case`: 可結案
- `schedule_follow_up`: 安排二次到府
- `wait_for_parts`: 等待零件
- `wait_for_quote`: 等待報價
- `wait_for_quote_approval`: 等待報價核准
- `contact_customer`: 聯繫客戶
- `manager_review`: 主管確認
- `no_action`: 無下一步
- `other`: 其他
- empty/null: —

Unknown future values render defensively as the raw enum string.

## Final Appointment Marker

If `serviceReport.finalAppointmentId` exists and the current appointment list contains a matching appointment id, the matching appointment shows:

```text
最終完成到府
```

If `serviceReport.finalAppointmentId` exists but the currently loaded appointment page does not contain the matching appointment, the UI shows:

```text
目前列表未包含最終完成 appointment，可能因分頁或資料未載入。
```

If `serviceReport.finalAppointmentId` does not exist:

- open cases show `尚未指定最終完成 appointment。`
- completed cases show a warning that it may be a legacy case or data may not be loaded.

The UI does not guess the final appointment and does not call an additional endpoint.

## Sorting

Display order is conservative:

1. `visitSequence` ascending when present.
2. `scheduledStartAt` ascending.
3. `createdAt` ascending if needed through the shared fallback.
4. Original loaded order.

The backend query and pagination are unchanged.

## Empty / Loading / Error Behavior

The section reuses existing appointment state:

- Loading: `載入到府歷程中...`
- Empty: `目前尚無到府紀錄。`
- Error: existing appointments error remains displayed by the parent Appointment panel.

The section does not crash case detail if appointment loading fails.

## Permissions

Task 058 reuses the existing Dispatch / Appointment panel permission behavior.

At the time of this task, appointment list access is tied to `appointments.manage` in the frontend and backend route. This task does not introduce a new permission model.

Future work may evaluate `appointments.read` if product policy needs read-only visit history for users who cannot manage appointments.

## Why Read-only Only

This task intentionally avoids write behavior because appointment visit result editing and service report completion are separate workflow concerns.

Read-only display is enough to validate:

- appointment multi-visit fields are mapped correctly.
- finalAppointmentId can be understood in the case detail context.
- the UI still preserves one official Field Service Report per case.

## Why No Final Appointment Picker

Final appointment selection affects service report completion and backend guard behavior. It should be implemented separately.

Recommended follow-up:

```text
Task 059 - Final Appointment Picker for Service Report Completion
```

That task can:

- show completed appointment options.
- submit `finalAppointmentId` with `serviceStatus=completed`.
- explain backend validation errors.
- keep `FieldServiceReportService` as the final validator.

## One Official Field Service Report

Task 058 does not create additional service reports.

The Field Service Report remains one official case-level final summary. Appointment visit results remain on the appointment / dispatch visit layer.

## Attachments Relation Deferred

Task D remains deferred.

Task 058 does not add:

- `appointment_id` to attachments.
- `service_report_id` to attachments.
- appointment-scoped upload URLs.
- report-scoped download URLs.
- photo or signature viewer changes.

## Validation

Expected checks:

```bash
npm run admin:check
npm run admin:build
npm run check
```

Manual validation should confirm:

- Case detail shows `多次到府紀錄`.
- Empty values show `—`.
- The final appointment marker appears when the loaded appointments include `serviceReport.finalAppointmentId`.
- Existing appointment create / update / cancel still works.
- Field Service Report completion flow is not changed by this task.
- Smoke `028` is not affected.

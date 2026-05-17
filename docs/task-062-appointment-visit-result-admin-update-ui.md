# Task 062 — Appointment Visit Result Admin Update UI / Smoke

## Scope

Task 062 adds a minimal admin frontend UI for updating an appointment's visit result in the `/cases` case detail Dispatch / Appointment panel.

This UI lets an admin mark the current appointment with a terminal result such as completed, pending parts, customer not home, pending quote, no-show, or unable to repair. This supports the Task 061 backend guard where a case cannot create a new appointment while another appointment is still open.

This task does not add migrations, change backend appointment enums, modify the backend single-open guard, change the field service report completion guard, create multiple field service reports, or expand attachment relations.

## Why This UI Is Needed

Task 061 prevents a case from having more than one open appointment at the same time.

Without a visible appointment result update UI, users can be blocked by the 409 conflict:

`此案件已有尚未結束的到府預約，請先完成、取消或標記結果後再建立下一筆預約。`

The new UI gives users a safe way to mark the previous appointment terminal before creating the next appointment.

## Placement

The operation is available in the case detail Dispatch / Appointment panel:

- Appointment list cards show `更新到府結果` for open appointment records.
- If a record already has a visit result, the action is shown as `查看 / 修正結果`.
- The read-only `多次到府紀錄` section also provides the same action for eligible records.

The first version uses a conservative visibility strategy:

- show the action for appointments whose `appointmentStatus` is not `cancelled`, `completed`, or `no_show`
- allow correction when a visit result already exists but appointment status is still active-like
- do not show the action for clearly terminal appointment statuses

## Visit Result Options

The frontend uses the current backend enum values:

- `completed` — 已完成
- `pending_parts` — 缺料
- `pending_quote` — 需報價
- `need_second_visit` — 需二次到府
- `customer_not_home` — 客戶不在
- `customer_cancelled` — 客戶取消
- `unable_to_repair` — 無法維修
- `rescheduled` — 已改期
- `no_show` — 未到 / 空趟

No new backend enum values were added.

## Next Action Options

The frontend uses the current backend enum values:

- `close_case` — 可結案
- `schedule_follow_up` — 安排二次到府
- `wait_for_parts` — 等待零件
- `wait_for_quote_approval` — 等待報價核准
- `contact_customer` — 聯繫客戶
- `manager_review` — 主管確認
- `no_action` — 無下一步

## Validation Behavior

Frontend validation is intentionally light:

- `visitResult` is required.
- If both `actualArrivalAt` and `actualFinishedAt` are provided, finished time must be later than or equal to arrival time.
- For non-completed results, the UI recommends filling `incompleteReason` and `nextAction`, but does not hard-block submission.
- Backend validation remains the final authority.

## Payload Behavior

The modal calls:

- `PATCH /api/v1/admin/appointments/:appointmentId`

Payload may include:

- `visitResult`
- `incompleteReason`
- `nextAction`
- `actualArrivalAt`
- `actualFinishedAt`
- `note`

The frontend does not send undefined fields and does not send customer mobile, raw LINE user id, customer id, internal notes, or unrelated metadata.

## Open / Terminal Frontend Helper

The frontend defines helpers aligned with Task 061:

Terminal if:

- `appointmentStatus` is `cancelled`, `completed`, or `no_show`
- or `visitResult` is one of:
  - `completed`
  - `pending_parts`
  - `pending_quote`
  - `need_second_visit`
  - `customer_not_home`
  - `customer_cancelled`
  - `unable_to_repair`
  - `rescheduled`
  - `no_show`

Open if:

- not terminal

`appointmentStatus = rescheduled` is not treated as terminal by itself because current backend reschedule edits the same appointment row.

## Relationship With Task 061

Task 061 is the backend source of truth. It rejects creating a second open appointment for the same case.

Task 062 provides the UI path to mark the current appointment terminal so the user can then create the next appointment.

If appointment creation still receives 409, the UI shows the backend message and adds a hint:

`請先在上一筆到府紀錄中更新到府結果，再建立下一筆預約。`

## Relationship With Task 058

After updating an appointment result, the case detail refreshes operational state. The `多次到府紀錄` section then displays the updated:

- visit result
- incomplete reason
- next action
- actual arrival / finished times

## Relationship With Task 059

Task 059 auto-selects the final appointment from loaded appointments whose `visitResult = completed`.

After Task 062 marks an appointment completed, service report completion can use that appointment as `finalAppointmentId`.

This task does not add manual final appointment override.

## Permissions

The UI uses existing appointment management permission:

- `appointments.manage`

No new permission model was added.

## What This Task Does Not Do

- no migration
- no backend enum change
- no backend single-open guard change
- no service report completion guard change
- no automatic case close
- no automatic billing or settlement creation
- no AI automatic visit result decision
- no multi-report field service report model
- no attachment / photo / signature relation expansion

The one-case-one-official-field-service-report principle remains unchanged.

Task D attachment relation expansion remains deferred.

## Verification

Recommended manual flow:

1. Open `/cases`.
2. Open a case detail with an appointment.
3. Use `更新到府結果`.
4. Select `pending_parts`, add incomplete reason, and choose `wait_for_parts`.
5. Confirm `多次到府紀錄` shows the updated result.
6. Create the next appointment.
7. Mark the next appointment `completed`.
8. Complete the service report and confirm Task 059 auto-selects the completed appointment.

Backend smoke checks:

- `npm run smoke:029`
- `npm run smoke:028`

## Known Limitations

- The result update UI does not support attachment, photo, or signature scoping.
- It does not provide manual `finalAppointmentId` override.
- It does not change case status directly.
- It does not automatically create billing / settlement records.

## Next Step

Recommended next task:

**Task 063 — Appointment Result UX Smoke / Zeabur Manual Verification Guide**

This can formalize the manual admin frontend flow against the Zeabur API.


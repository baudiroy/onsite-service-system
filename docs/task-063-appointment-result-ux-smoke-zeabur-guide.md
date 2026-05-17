# Task 063 — Appointment Result UX Smoke / Zeabur Manual Verification Guide

## Scope

This guide verifies the end-to-end admin workflow that connects:

- Task 061 backend single-open appointment guard
- Task 062 appointment visit result update UI
- Task 058 read-only multi-dispatch visit history
- Task 059 service report final appointment auto-select
- Field Service Report completion flow

This task is documentation only. It does not add migrations, change backend APIs, change appointment enums, modify frontend UI, change the single-open guard, or change the one-case-one-official-field-service-report principle.

## Preconditions

Zeabur API must be reachable:

- `https://onsite-service-api.zeabur.app`

Admin frontend must be available locally or in the target environment.

The test admin user needs permissions for:

- `cases.read`
- `cases.update`
- `dispatch.manage`
- `appointments.manage`
- `service_reports.manage`

Before manual QA, confirm backend and smoke checks have passed:

```bash
npm run db:migrate
npm run check
npm run smoke:029
npm run smoke:028
```

For admin frontend validation, confirm:

```bash
npm run admin:check
npm run admin:build
```

## Zeabur Admin Frontend Startup

From the project root:

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

Open the printed local Vite URL and log in as an admin user.

Do not hardcode the Zeabur API URL in source code. Use the environment variable at runtime.

## Main Manual Verification Flow

### Step 1: Create A Test Case

- Create a customer and case, or use an existing safe test case.
- Move the case into an accepted / dispatch-ready state.
- Use clearly identifiable QA text such as `Task063 appointment result UX test`.

Expected:

- Case detail can be opened from `/cases`.
- Case is not completed or closed before the test starts.

### Step 2: Create Dispatch Assignment

- Choose or create a dispatch unit.
- Assign the case to the dispatch unit.

Expected:

- Dispatch assignment succeeds.
- Dispatch / Appointment panel is visible in case detail.

### Step 3: Create First Appointment

- Create the first scheduled appointment.
- Open the case detail Dispatch / Appointment panel.

Expected:

- The appointment appears in the appointment list.
- The `多次到府紀錄` section shows the first visit.
- `visitResult` is initially shown as `未記錄` or `—`.

### Step 4: Verify Single-open Guard UX

Before marking the first appointment terminal, try creating a second appointment for the same case.

Expected:

- Backend rejects the request with 409 Conflict.
- UI shows the backend message:

```text
此案件已有尚未結束的到府預約，請先完成、取消或標記結果後再建立下一筆預約。
```

- If the UI hint is shown, it should say:

```text
請先在上一筆到府紀錄中更新到府結果，再建立下一筆預約。
```

Expected safety behavior:

- No second appointment is created.
- Case summary is not incorrectly changed.
- No completed service report is created.

### Step 5: Mark First Appointment As Pending Parts

In the first appointment card or `多次到府紀錄`, click:

- `更新到府結果`

Fill:

- `visitResult = pending_parts`
- `nextAction = wait_for_parts`
- `incompleteReason = Task063 pending parts test`

Submit.

Expected:

- Update succeeds.
- Appointment remains part of the same case.
- `多次到府紀錄` shows:
  - result label: `缺料`
  - next action label: `等待零件`
  - incomplete reason: `Task063 pending parts test`
- Case is not completed.
- Service report is not completed.

### Step 6: Create Second Appointment

Create another appointment for the same case.

Expected:

- Creation succeeds because the first appointment now has a terminal visit result.
- `多次到府紀錄` shows both visits.
- No extra Field Service Report is created.

### Step 7: Mark Second Appointment As Completed

In the second appointment card or `多次到府紀錄`, click:

- `更新到府結果`

Fill:

- `visitResult = completed`
- `nextAction = no_action` or `close_case`
- `actualArrivalAt` and `actualFinishedAt` if available

Submit.

Expected:

- Update succeeds.
- `多次到府紀錄` shows second appointment as `已完成`.
- This completed appointment is eligible for Task 059 final appointment auto-select.
- This action alone does not close the case, complete the service report, or create billing / settlement.

### Step 8: Complete Field Service Report

Create the Field Service Report if it does not already exist.

Fill test content such as:

- `diagnosisResult`
- `repairAction`
- `repairResult`

Set:

- `serviceStatus = completed`

Expected Task 059 behavior:

- UI automatically selects the second completed appointment as `finalAppointmentId`.
- Completion confirmation text explains that this appointment will become the service report final appointment.
- Payload sent to the backend includes `finalAppointmentId`.
- Backend still validates that the final appointment belongs to the same case and has `visitResult = completed`.

Expected after submit:

- Service report completes successfully.
- Case status becomes `completed`.
- Case is not automatically closed.
- Billing / settlement is not automatically created.
- Case list refreshes.
- Timeline / messages refresh.
- `多次到府紀錄` marks the second appointment as `最終完成到府`.

### Step 9: Confirm No Automatic Close / Billing / Settlement

After completion:

- Case should be `completed`, not automatically `closed`.
- Billing / Settlement panel should not show newly auto-created records unless a user explicitly created them.
- Any billing, settlement, close workflow, or reconciliation action remains an explicit user or backend workflow action.

## Negative Scenarios

### No Completed Appointment

Try completing the Field Service Report when the case has appointments but none has `visitResult = completed`.

Expected:

- UI blocks completion before submit, or backend rejects it.
- Error message explains that no completed appointment is available.
- Case status remains unchanged.
- `completedAt` is not set.

### Appointment Loading / Error

Try completing the Field Service Report while appointments are still loading or appointment loading failed.

Expected:

- UI does not submit a completed service report.
- User is told to load appointment data before completing.

### Open Appointment Still Exists

Try creating a new appointment while the current appointment has no terminal visit result.

Expected:

- Backend returns 409 Conflict.
- UI displays the backend message and the guidance to update the previous visit result first.

### Pending Parts As Final Appointment

Try to complete a service report using an appointment whose `visitResult = pending_parts`.

Expected:

- Backend rejects completion.
- `smoke:028` already covers this guard.

### Cross-case finalAppointmentId

Try to complete a service report with an appointment from another case.

Expected:

- Backend rejects completion.
- `smoke:028` already covers this guard.

## Security Checklist

During manual QA, confirm:

- Browser console does not show token, password, secret, access token, refresh token, or full request payload.
- Browser console does not show customer mobile or raw LINE user id.
- URL does not include:
  - `appointmentId`
  - `finalAppointmentId`
  - customer mobile
  - `customerId`
  - raw `lineUserId`
- UI does not expose:
  - audit logs
  - AI raw payload
  - OCR raw output
  - billing data outside the billing panel
  - raw credentials
- The workflow does not create multiple active Field Service Reports for one case.

## Smoke Checks

Run these from the project root:

```bash
npm run check
npm run smoke:029
npm run smoke:028
npm run admin:check
npm run admin:build
```

Zeabur API smoke can be run with:

```bash
API_BASE_URL=https://onsite-service-api.zeabur.app \
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=ChangeMe123! \
npm run smoke:029
```

```bash
API_BASE_URL=https://onsite-service-api.zeabur.app \
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=ChangeMe123! \
npm run smoke:028
```

Do not print passwords, tokens, customer mobile, raw LINE user id, or full payloads in test output.

## Passing Criteria

The flow passes when:

- Single-open appointment guard is active.
- Appointment result UI can mark an appointment terminal.
- A terminal first appointment allows creating a second appointment.
- A completed second appointment can be selected by Task 059 auto-select.
- Service Report completion succeeds with `finalAppointmentId`.
- Task 058 visit history marks the final appointment.
- One case still has only one official active Field Service Report.
- `smoke:029` passes.
- `smoke:028` passes.
- `admin:check` and `admin:build` pass.

## Known Limitations

- This guide is manual QA, not automated browser E2E.
- No Playwright / browser automation smoke exists for this UI yet.
- Manual final appointment override is not implemented.
- Appointment result update UI does not handle appointment-scoped attachments, signatures, or photos.
- AI does not decide `visitResult`, final appointment, completion, billing, settlement, or close workflow.
- Fixtures created by smoke scripts are not automatically cleaned up.

## Next Step

Recommended follow-up:

**Task 064 — Appointment Result Admin UX Polish**

Suggested scope:

- Improve the wording around open appointment 409 recovery.
- Add clearer guidance for terminal visit results.
- Consider a lightweight readiness hint before creating the next appointment.
- Keep backend guard and Field Service Report completion guard unchanged.
- Keep one case = one official Field Service Report.


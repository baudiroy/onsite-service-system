# Task 065 — Appointment Result Manual QA / Admin Frontend Deployment Note

## Scope

This document is a QA and deployment note for verifying the multi-dispatch appointment result flow across Tasks 061 to 064.

It covers:

- backend single-open appointment guard
- admin appointment visit result update UI
- read-only multi-dispatch visit history
- service report `finalAppointmentId` auto-select
- appointment result UX polish and 409 recovery guidance

This task does not add functionality. It does not change backend APIs, frontend UI, migrations, appointment enums, workflow guards, billing, settlement, attachments, or AI behavior.

The product rule remains:

- one Case can have multiple appointments / visits
- one Case has one official Field Service Report
- visit outcomes belong to appointments
- the Field Service Report is the final case-level summary

## Local Admin Frontend Startup

Run the admin frontend locally and point it at the Zeabur API:

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

Use the printed Vite local URL to log in as an admin user.

Notes:

- `VITE_API_BASE_URL` should be supplied as a runtime environment variable.
- Do not hardcode the Zeabur API domain in source code.
- For a future deployed admin frontend, configure `VITE_API_BASE_URL` in that deployment environment.
- If the admin frontend is deployed separately, verify CORS, auth token storage, and API base URL behavior in that environment.

## Preflight Checks

Run backend checks and smoke tests:

```bash
npm run check
npm run smoke:029
npm run smoke:028
```

Run admin frontend checks:

```bash
npm run admin:check
npm run admin:build
```

Expected:

- `smoke:029` passes the single-open appointment guard flow.
- `smoke:028` passes the final appointment completion guard flow.
- admin check and build pass before manual UI QA.

## Permission Requirements

The QA user should have at least:

- `cases.read`
- `cases.update`
- `dispatch.manage`
- `appointments.manage`
- `service_reports.manage`

Depending on how test data is created, the user may also need:

- `customers.create`
- `customers.read`
- `dispatch_units.manage`
- `organizations.read`

Admin / system users can be used for full-scope verification.

## Main Manual QA Flow

### 1. Create Or Open A Test Case

- Create a customer and case, or open a safe existing test case.
- Move the case to an accepted / dispatch-ready state.
- Use clear QA naming such as `Task065 appointment result QA`.

Expected:

- Case detail opens from `/cases`.
- Case is not already completed or closed before testing.

### 2. Create Dispatch Assignment

- Select or create a dispatch unit.
- Assign the case.

Expected:

- Dispatch assignment succeeds.
- Dispatch / Appointment panel is available in case detail.

### 3. Create The First Appointment

- Create a scheduled appointment.
- Confirm it appears in the appointment list and the `多次到府紀錄` section.

Expected:

- `visitResult` is initially empty / `未記錄` / `—`.
- The appointment is considered open.

### 4. Verify Single-open Guard

Before marking the first appointment terminal, try to create a second appointment for the same case.

Expected:

- Backend returns 409 Conflict.
- UI shows the backend message:

```text
此案件已有尚未結束的到府預約，請先完成、取消或標記結果後再建立下一筆預約。
```

- UI also gives recovery guidance:

```text
請先在上一筆到府紀錄中更新到府結果，再建立下一筆預約。
```

Expected safety behavior:

- No second appointment is created.
- No service report is completed.
- No case close, billing, or settlement action occurs.

### 5. Mark First Appointment As Pending Parts

Use `更新到府結果` on the first appointment.

Fill:

- `visitResult = pending_parts`
- `nextAction = wait_for_parts`
- `incompleteReason = Task065 pending parts test`

Expected:

- Update succeeds.
- Appointment card shows `缺料`, `等待零件`, and the incomplete reason.
- `多次到府紀錄` shows the same updated result.
- The case remains open and is not completed.

### 6. Create The Second Appointment

Create another appointment for the same case.

Expected:

- Creation succeeds because the first appointment now has a terminal `visitResult`.
- The visit history shows both appointments.
- No second Field Service Report is created.

### 7. Mark Second Appointment As Completed

Use `更新到府結果` on the second appointment.

Fill:

- `visitResult = completed`
- `nextAction = no_action` or `close_case`
- `actualArrivalAt` and `actualFinishedAt` if available

Expected:

- Update succeeds.
- Appointment card and visit history show `已完成`.
- This appointment becomes eligible for Task 059 auto-select.
- This action alone does not complete the Field Service Report, close the case, or create billing / settlement.

### 8. Complete The Field Service Report

Create the Field Service Report if needed, then fill normal report fields such as:

- `diagnosisResult`
- `repairAction`
- `repairResult`

Set:

- `serviceStatus = completed`

Expected:

- Task 059 auto-selects the second completed appointment as `finalAppointmentId`.
- Confirmation text explains which appointment will be used.
- Backend accepts the completion only if the final appointment belongs to the same case and has `visitResult = completed`.
- Service report becomes `completed`.
- Case status becomes `completed`.
- `多次到府紀錄` marks the second appointment as `最終完成到府`.
- Case list and timeline / messages refresh.

### 9. Confirm No Automatic Close / Billing / Settlement

Expected:

- Case is completed, not automatically closed.
- Billing / settlement records are not automatically created.
- Close workflow, billing, settlement, and reconciliation remain explicit workflows.

## UX Polish Verification

Verify Task 064 behavior:

- open appointment readiness hint is visible when a case has an open appointment
- appointment create form explains why a second open appointment is blocked
- appointment cards show current visit result, next action, and incomplete reason
- appointment result modal explains the update only records the current appointment result
- modal explicitly says it does not complete the Field Service Report
- modal explicitly says it does not close the case
- modal explicitly says it does not create billing / settlement
- selected `visitResult` shows guidance
- selected `nextAction` shows guidance
- `completed` explains it can become a final appointment candidate
- non-completed terminal results explain that they do not complete the whole case
- 409 recovery copy is understandable and does not hide the backend error message

## Negative Scenarios

### No Completed Appointment

Try completing the Field Service Report when the case has appointments but none has `visitResult = completed`.

Expected:

- UI blocks completion or backend rejects it.
- Case status does not become `completed`.
- No completion timeline / audit is written by a failed completion attempt.

### Appointment Loading Or Error

Try completing a report while appointments are still loading or failed to load.

Expected:

- UI should not submit a completed service report without appointment context.
- Backend remains the final guard.

### Pending Parts As Final Appointment

Try to use an appointment with `visitResult = pending_parts` as final appointment.

Expected:

- Backend rejects it.
- `smoke:028` covers this path.

### Cross-case Final Appointment

Try to use an appointment from another case as `finalAppointmentId`.

Expected:

- Backend rejects it.
- `smoke:028` covers this path.

## Security Checklist

Confirm during manual QA:

- console does not show token, password, or secret values
- console does not show customer mobile, raw LINE user id, or full request payloads
- URL does not contain `appointmentId`
- URL does not contain `finalAppointmentId`
- URL does not contain customer mobile
- URL does not contain `customerId`
- URL does not contain raw LINE user id
- UI does not show audit logs in this flow
- UI does not show AI raw payload
- UI does not show OCR raw output
- UI does not show billing data in appointment result UI
- no flow creates multiple active Field Service Reports for one case
- AI does not decide `visitResult`
- AI does not complete cases, dispatch appointments, or decide payable amounts

## Zeabur / Deployment Notes

Backend API requirements:

- Zeabur backend API must be deployed with the latest Task 061 guard and Task 062 to 064 compatible code.
- `018_add_visit_result_fields_to_appointments.sql` must be applied.
- `019_add_final_appointment_id_to_field_service_reports.sql` must be applied.
- `npm run smoke:029` should pass against Zeabur.
- `npm run smoke:028` should pass against Zeabur.

Admin frontend options:

- If no admin frontend service is deployed, use local Vite with `VITE_API_BASE_URL=https://onsite-service-api.zeabur.app`.
- If admin frontend is deployed to Zeabur later, configure its runtime `VITE_API_BASE_URL` to point at the backend API.
- Do not hardcode the API domain into `admin/src`.
- Confirm CORS and auth token behavior after deployment.
- Confirm browser console output does not expose sensitive data.

Current deployment caveat:

- The existing Zeabur backend service serves the API.
- If there is no separate admin frontend service, admin UI changes are validated by local build and local Vite manual QA, not by the backend API service deployment itself.

## Smoke Checks

Run:

```bash
npm run check
npm run smoke:029
npm run smoke:028
npm run admin:check
npm run admin:build
```

Pass criteria:

- `smoke:029` confirms a second open appointment is blocked and a terminal visit result allows the next appointment.
- `smoke:028` confirms service report completion requires a valid completed final appointment when appointments exist.
- admin frontend check and build confirm TypeScript and build integrity.

## Known Limitations

- This is manual QA guidance, not automated browser E2E.
- There is no Playwright / browser automation suite for this admin flow yet.
- Manual `finalAppointmentId` override is not implemented.
- Appointment result update UI does not handle attachments, photos, or signatures.
- Attachment relation expansion to `appointment_id` / `service_report_id` remains deferred.
- AI does not participate in `visitResult` decisions.
- Smoke fixture rows may not be automatically cleaned up.

## Recommended Next Step

Most practical next task:

**Task 066 — Multi-dispatch Manual QA Stabilization / Bugfix Buffer**

Reason:

- The current project has strong backend smoke coverage but no dedicated admin browser E2E infrastructure.
- A short stabilization buffer gives room to run the manual QA flow, catch UI-specific friction, and fix small UX defects before investing in a larger E2E setup.

Future follow-up:

**Task 067 — Admin Frontend Multi-dispatch E2E Test Planning**

Use this once the admin frontend deployment target and browser automation approach are clear.

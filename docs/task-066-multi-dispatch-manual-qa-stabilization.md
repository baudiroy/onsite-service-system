# Task 066 — Multi-dispatch Manual QA Stabilization / Bugfix Buffer

## Scope

This task is a short stabilization buffer for the admin frontend multi-dispatch flow introduced across Tasks 058 to 065.

The review focuses on:

- Task 061 single-open appointment guard UX.
- Task 062 appointment visit result update UI.
- Task 058 read-only multi-dispatch visit history refresh.
- Task 059 service report `finalAppointmentId` auto-select behavior.
- Task 064 appointment result copy and guidance.
- Task 065 manual QA flow readiness.

This task does not add new features. It does not add migrations, change backend APIs, change appointment enums, change backend guards, create multiple Field Service Reports, add AI decision-making, or expand attachment / photo / signature relations.

The product rule remains:

- one Case can have multiple appointments / visits
- one Case has one official Field Service Report
- visit outcomes belong to appointments
- Field Service Report is the final case-level summary

## Manual QA Flow Reviewed

The Task 065 checklist was reviewed against the current frontend implementation and backend smoke coverage.

Primary flow:

1. Open `/cases`.
2. Create or open a test case.
3. Move the case into accepted / dispatch-ready state.
4. Create dispatch assignment.
5. Create the first appointment.
6. Try creating a second appointment before the first appointment is terminal.
7. Confirm single-open guard returns 409 and the UI shows recovery guidance.
8. Use `更新到府結果` to mark the first appointment as `pending_parts`.
9. Confirm visit history can show updated `visitResult`, `nextAction`, and `incompleteReason`.
10. Create the second appointment after the first one is terminal.
11. Mark the second appointment as `completed`.
12. Create or update the Field Service Report.
13. Set `serviceStatus = completed`.
14. Confirm Task 059 auto-selects the completed second appointment as `finalAppointmentId`.
15. Confirm case becomes `completed`.
16. Confirm visit history can mark the final appointment.
17. Confirm completion does not automatically close the case.
18. Confirm completion does not automatically create billing or settlement.

## Code-level Stabilization Findings

### 409 UX

The appointment create handler preserves the backend error message and adds recovery guidance when the response mentions an unfinished appointment.

Expected message remains:

```text
此案件已有尚未結束的到府預約，請先完成、取消或標記結果後再建立下一筆預約。
```

The frontend adds guidance that the user should update the previous visit result before creating the next appointment.

No code change was needed.

### Open Appointment Readiness Hint

The Dispatch / Appointment panel detects the first open appointment with `appointments.find(isOpenAppointment)` and shows a top-level hint.

The hint includes:

- the current open appointment description
- appointment status
- current visit result
- instruction to update the previous appointment result before creating the next appointment
- an `更新這筆到府結果` action when the user can manage appointments

No code change was needed.

### Appointment Cards

Appointment cards display:

- current visit result
- next action
- incomplete reason
- note / reschedule reason

This gives users enough context before they use `更新到府結果`.

No code change was needed.

### Appointment Result Modal

The result modal includes:

- a clear statement that the update only records the current appointment result
- a statement that it does not automatically complete the Field Service Report
- a statement that it does not close the case
- a statement that it does not create billing / settlement
- visit result guidance
- next action guidance
- a warning when editing an appointment that already has a result

No code change was needed.

### Refresh Behavior

After updating appointment result, the handler calls `refreshCaseOperationalState(caseId)`.

This refresh path covers the appointment list and related operational state used by:

- appointment cards
- read-only `多次到府紀錄`
- service report completion auto-select input

After Field Service Report submission, the handler also refreshes operational state.

This should allow Task 058 final marker to update after service report completion.

No code change was needed.

### Service Report Completion Auto-select

When `serviceStatus = completed`:

- appointments still loading blocks submission
- appointment loading error blocks submission
- cases with appointments require at least one completed appointment
- auto-selected appointment must have `visitResult = completed`
- payload includes `finalAppointmentId` when the case has appointments
- legacy no-appointment cases keep the old path

No code change was needed.

## Issues Found

No small code bug was found during code-level stabilization review.

No TypeScript, build, or smoke regression was found.

## Fixes Applied

No production code fixes were applied in this task.

Only this stabilization document was added.

## Manual Browser QA Status

Full browser click-through QA was not completed in this task.

Reason:

- The current Zeabur project exposes the backend API service.
- A dedicated deployed admin frontend service is not currently available in Zeabur.
- The admin frontend can still be verified locally with Vite by pointing `VITE_API_BASE_URL` at the Zeabur API.

Local manual QA command:

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

The current stabilization result is based on:

- Task 065 manual QA checklist review
- CaseManagementPage code-level review
- TypeScript check
- admin production build
- backend JavaScript syntax check
- Zeabur API smoke tests

## Security Check

The reviewed flow does not:

- log token, password, or secret values
- log customer mobile, raw LINE user id, or full payloads
- put `appointmentId` or `finalAppointmentId` in the URL
- put customer mobile, customer id, or raw LINE user id in the URL
- render audit logs in the appointment result flow
- render AI raw payload
- render OCR raw output
- render billing data in the appointment result flow
- create multiple active Field Service Reports for one case
- use AI to decide `visitResult`
- use AI to complete cases, dispatch appointments, or decide payable amounts

## Verification Commands

Run:

```bash
npm run admin:check
npm run admin:build
npm run check
npm run smoke:029
npm run smoke:028
```

Expected:

- `admin:check` passes.
- `admin:build` passes.
- `check` passes.
- `smoke:029` passes the single-open appointment guard flow.
- `smoke:028` passes the final appointment completion guard flow.

## Zeabur Runtime Verification

The backend Zeabur API should be validated with:

```bash
API_BASE_URL=https://onsite-service-api.zeabur.app \
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=ChangeMe123! \
npm run smoke:029

API_BASE_URL=https://onsite-service-api.zeabur.app \
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=ChangeMe123! \
npm run smoke:028
```

Admin frontend manual QA can be performed locally against the same Zeabur API until a dedicated admin frontend deployment target exists.

## Known Limitations

- This is not automated browser E2E.
- There is still no Playwright / browser automation infrastructure for this admin flow.
- Full click-through QA should be run once a tester can use local Vite or a deployed admin frontend target.
- Manual `finalAppointmentId` override is not implemented.
- Appointment result update UI does not handle attachments, photos, or signatures.
- Attachment relation expansion to `appointment_id` / `service_report_id` remains deferred.
- AI does not participate in `visitResult` decisions.
- Smoke fixture rows may not be automatically cleaned up.

## One-case-one-report Confirmation

This task does not change the Field Service Report model.

The rule remains:

- one Case has one official active Field Service Report
- `field_service_reports.case_id` active unique index remains part of the design
- appointment visit results do not create additional service reports

## AI Boundary Confirmation

AI remains AI-ready only in this flow.

AI does not:

- decide visit result
- complete appointments
- complete service reports
- close cases
- dispatch appointments
- create billing / settlement
- decide payable amounts

Future AI work should start with draft, suggestion, missing-field reminder, or feedback log flows.

## Recommended Next Step

Suggested next task:

**Task 067 — Admin Frontend Multi-dispatch Manual QA Execution**

Run the Task 065 checklist in a real browser session against local Vite and Zeabur API. If friction appears, fix only small UI issues.

Later, when the admin frontend deployment target and browser automation approach are clear:

**Task 068 — Admin Frontend Multi-dispatch E2E Test Planning**


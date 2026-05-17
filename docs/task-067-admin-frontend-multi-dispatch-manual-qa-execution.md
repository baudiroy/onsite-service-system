# Task 067 — Admin Frontend Multi-dispatch Manual QA Execution

## Scope

This task records browser manual QA for the admin frontend multi-dispatch flow.

The goal is to verify, with local Vite pointed at the Zeabur backend API, that the Task 061 to Task 064 workflow is usable from the admin UI:

- single-open appointment guard guidance
- appointment visit result update UI
- read-only multi-dispatch visit history refresh
- service report final appointment auto-select behavior
- one Case / one official Field Service Report rule

This task does not add new product behavior. It does not add migrations, change backend appointment enums, change backend single-open guard behavior, change Field Service Report completion guard behavior, add manual `finalAppointmentId` override, add AI decisions, or expand attachment / photo / signature relations.

## Environment

Admin frontend was run locally with Vite and pointed at the Zeabur API:

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

The local Vite server was available at:

```text
http://127.0.0.1:5175/
```

The API base URL was provided through runtime environment configuration. It was not hardcoded into source code.

## Preflight Checks

The following commands were executed before manual browser QA:

```bash
npm run admin:check
npm run admin:build
npm run check
npm run smoke:029
npm run smoke:028
```

Observed preflight status:

- `npm run admin:check`: PASS
- `npm run admin:build`: PASS
- `npm run check`: PASS
- `npm run smoke:029`: PASS
- `npm run smoke:028`: PASS

The smoke tests were run against the Zeabur backend API.

## Browser Manual QA Results

### Steps Completed

The following steps were completed in the browser against local Vite and Zeabur API:

1. Logged in to the admin frontend.
2. Opened `/cases`.
3. Opened a safe test case detail via `/cases?caseId=...`.
4. Confirmed the Dispatch / Appointment panel loads.
5. Confirmed an existing appointment is visible.
6. Confirmed the `多次到府紀錄` section displays the appointment.
7. Confirmed missing multi-visit fields render as `—` instead of `undefined` / `null`.
8. Confirmed open appointment readiness guidance is displayed.
9. Confirmed the appointment create area displays single-open appointment guidance.
10. Opened the `更新到府結果` modal for the first appointment.
11. Selected `visitResult = pending_parts`.
12. Selected `nextAction = wait_for_parts`.
13. Entered `incompleteReason = Task067 pending parts test`.
14. Submitted the update successfully.
15. Confirmed the appointment card refreshed and displayed:
    - visit result: 缺料
    - next action: 等待零件
    - incomplete reason: Task067 pending parts test
16. Confirmed the `多次到府紀錄` section refreshed with the same updated values.
17. Confirmed the action changed to `查看 / 修正結果`.
18. Confirmed operational state refreshed after the update.
19. Confirmed timeline / messages refreshed after the appointment result update.
20. Confirmed Task 064 guidance copy is visible in the result modal:
    - updating appointment result does not automatically complete Field Service Report
    - updating appointment result does not automatically close the case
    - updating appointment result does not automatically create billing / settlement

### Steps Not Fully Completed in Browser

The full browser click-through flow was not completed past the second appointment creation step.

Reason:

- The native datetime input in the appointment create form did not accept automated value entry reliably through the available desktop browser automation.
- The field appeared as a segmented browser-native datetime control, and direct automation filled neither the start nor end values consistently.
- This limitation was specific to the manual automation environment, not an observed product or API failure.

The remaining backend workflow is still covered by smoke tests:

- `smoke:029` verifies the second appointment can be created after the first appointment is terminal.
- `smoke:029` verifies the completed second appointment can be used as `finalAppointmentId`.
- `smoke:028` verifies final appointment completion guard behavior.

## UX Polish Verification

Verified in browser:

- open appointment readiness hint is visible
- appointment create form single-open guidance is visible
- appointment cards display visit result / next action / incomplete reason after update
- appointment result modal explains it only records appointment result
- appointment result modal explains it does not automatically complete Field Service Report
- appointment result modal explains it does not automatically close case
- appointment result modal explains it does not automatically create billing / settlement
- selected visit result guidance is visible
- selected next action guidance is visible
- non-completed terminal result guidance indicates it does not complete Field Service Report

Not fully verified in browser:

- direct UI 409 creation path, due datetime input automation limitation
- service report completion auto-select from the UI, due the same limitation blocking the complete second-appointment setup

Backend coverage for these paths remains in `smoke:029` and `smoke:028`.

## Issues Found

### Fixed: Narrow metadata grid wrapping

During browser QA, long English text in appointment metadata could wrap one character per line in a narrow case-detail panel.

The issue was caused by a grid column definition that could become too narrow.

Fix:

- `.attachment-meta-grid` now uses a safer responsive grid track:

```css
grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
```

After the fix, the appointment metadata text wraps normally in the case detail panel.

## Negative Scenarios

Manual browser status:

- open appointment not terminal before next appointment: UI guidance was visible; direct 409 path was not completed because datetime input automation was blocked.
- no completed appointment cannot complete Field Service Report: covered by `smoke:028` / `smoke:029`.
- `pending_parts` appointment cannot be final appointment: covered by `smoke:028`.
- cross-case final appointment rejected: covered by `smoke:028`.
- appointment loading / error does not submit completed report: not manually triggered in browser; covered by code-level guard review from Task 066.
- legacy no-appointment service report completion: covered by compatibility behavior in backend checks and previous smoke coverage.

## Security Check

No sensitive logging was added.

The reviewed flow does not:

- log token, password, or secret values
- log customer mobile, raw LINE user id, or full payloads
- put `appointmentId` in the URL during appointment result update
- put `finalAppointmentId` in the URL
- put customer mobile, customer id, or raw LINE user id in the URL
- render audit logs in the appointment result flow
- render AI raw payload
- render OCR raw output
- render billing data in the appointment result flow
- use AI to decide visit result
- automatically close cases
- automatically create billing or settlement

## One-case-one-report Confirmation

This task does not change the Field Service Report model.

The rule remains:

- one Case can have multiple appointments / visits
- one Case has one official active Field Service Report
- `field_service_reports.case_id` active unique index remains part of the design
- appointment visit results do not create additional service reports

## AI Boundary Confirmation

AI remains AI-ready only in this flow.

AI does not:

- decide appointment `visitResult`
- complete appointments
- complete service reports
- close cases
- dispatch appointments
- create billing / settlement
- decide payable amounts

Future AI work should start with draft, suggestion, missing-field reminder, or feedback log flows rather than automatic decisions.

## Verification Commands

After the manual QA and small CSS fix, run:

```bash
npm run admin:check
npm run admin:build
npm run check
npm run smoke:029
npm run smoke:028
```

Expected:

- `admin:check` passes
- `admin:build` passes
- `check` passes
- `smoke:029` passes
- `smoke:028` passes

Observed post-change verification:

- `npm run admin:check`: PASS
- `npm run admin:build`: PASS
- `npm run check`: PASS
- `npm run smoke:029`: PASS against Zeabur API, 12 / 12 passed
- `npm run smoke:028`: PASS against Zeabur API, 13 / 13 passed

Note:

- The first smoke attempt inside the restricted sandbox failed at network fetch.
- The same smoke commands passed after running with the required network permission against the Zeabur API.

## Known Limitations

- This remains manual browser QA, not automated E2E.
- There is no Playwright / browser automation infrastructure for this flow.
- The local browser automation environment could not reliably operate the native datetime input, so the full second-appointment UI path was not completed.
- Manual `finalAppointmentId` override is not implemented.
- Appointment result update UI does not handle attachments, photos, or signatures.
- Attachment relation expansion to `appointment_id` / `service_report_id` remains deferred.
- AI does not participate in `visitResult` decisions.
- Smoke fixture rows may not be automatically cleaned up.

## Recommended Next Step

Recommended next task:

**Task 068 — Admin Frontend Multi-dispatch Browser QA Follow-up / Date Input Stabilization**

Focus:

- make appointment datetime input easier to drive in manual QA
- add stable test data or selectors if the team later wants browser automation
- rerun the full browser flow from first appointment through Field Service Report completion

After the manual browser path is stable, a later task can plan lightweight E2E coverage.

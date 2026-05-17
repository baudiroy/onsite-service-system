# Task 104 - Case / Appointment / Field Service Report Consistency Review

## Scope

This review returns to the product and system mainline after the smoke fixture inventory handoff freeze in Task 103.

The review is documentation-only. It does not change runtime behavior, smoke script behavior, inventory query behavior, migrations, schema, indexes, production API behavior, auth, RBAC, AI behavior, or shared runtime data.

Inventory documentation remains frozen after Task 103 unless a real behavior or policy change occurs.

## Review Boundaries

- One Case has one formal Field Service Report.
- One Case can have multiple appointments / visits.
- One Case can have only one open appointment at the same time.
- `finalAppointmentId` should be system-determined in normal operator flow.
- AI remains AI-ready only. It may support future drafts, suggestions, checks, and learning fields, but it must not auto-dispatch, auto-complete, auto-settle, decide fees, or choose official completion outcomes.
- LINE is the current primary entry point, but case / appointment / report core behavior must preserve channel abstraction for future app support.
- Existing cases must remain compatible with future reverse LINE binding.
- Post-completion customer satisfaction survey design should attach to the case / final completion context, not require multiple formal reports.
- No destructive cleanup or shared runtime mutation was performed.
- No production data, credentials, customer contact values, raw LINE user ids, raw payloads, or full payloads are included in this review.

## Files Reviewed

### Migrations

- `migrations/002_create_cases.sql`
- `migrations/006_create_dispatch_appointment_tables.sql`
- `migrations/008_create_field_service_tables.sql`
- `migrations/012_create_line_integration_tables.sql`
- `migrations/013_add_organization_scope.sql`
- `migrations/018_add_visit_result_fields_to_appointments.sql`
- `migrations/019_add_final_appointment_id_to_field_service_reports.sql`

### Backend

- `src/repositories/CaseRepository.js`
- `src/repositories/AppointmentRepository.js`
- `src/repositories/DispatchRepository.js`
- `src/repositories/FieldServiceReportRepository.js`
- `src/services/CaseService.js`
- `src/services/AppointmentService.js`
- `src/services/DispatchService.js`
- `src/services/FieldServiceReportService.js`
- `src/controllers/AppointmentController.js`
- `src/controllers/FieldServiceReportController.js`
- `src/routes/appointments.routes.js`
- `src/routes/dispatch.routes.js`
- `src/routes/fieldService.routes.js`
- `src/validators/dispatchAppointmentValidators.js`
- `src/validators/fieldServiceValidators.js`
- `src/mappers/appointmentMapper.js`
- `src/mappers/fieldServiceMapper.js`

### Admin Frontend Read-only Review

- `admin/src/pages/CaseManagementPage.tsx`
- `admin/src/api/caseDispatch.ts`
- `admin/src/api/fieldServiceReports.ts`
- `admin/src/api/cases.ts`

### Smoke / Docs Evidence

- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`
- `scripts/smoke/browser/071_multi_dispatch_browser_smoke.js`
- `docs/multi-visit-field-service-design.md`
- `docs/task-056-multi-dispatch-case-detail-read-only-inventory.md`
- `docs/task-058-multi-dispatch-read-only-visit-history-panel.md`
- `docs/task-059-auto-select-final-appointment-for-service-report-completion.md`
- `docs/task-060-single-open-appointment-guard-inventory.md`
- `docs/task-061-single-open-appointment-guard-backend-implementation.md`
- `docs/task-062-appointment-visit-result-admin-update-ui.md`
- `docs/task-066-multi-dispatch-manual-qa-stabilization.md`
- `docs/future-existing-case-to-line-binding-memo.md`

## Executive Conclusion

The current implementation is broadly consistent with the product rules:

- The database and service layer enforce one active formal Field Service Report per Case.
- Appointments are case-scoped history records, so multi-visit / revisit flows do not require multiple formal cases or multiple formal reports.
- The one-open-appointment invariant is implemented in service / repository logic and covered by smoke tests.
- Admin frontend does not expose a manual `finalAppointmentId` picker. It auto-selects the most appropriate completed visit and submits that id only during service report completion.
- Backend still validates that a supplied `finalAppointmentId` belongs to the same case and has `visit_result = completed`.
- Multi-dispatch / multi-visit flows are compatible with one formal Case-level report.
- Channel abstraction is partially preserved through case `source`, `intake_line_channel_id`, notification channel enums, and scoped LINE identity tables. Future app support should extend this abstraction instead of hard-coding LINE into core case / report behavior.

The main consistency risks are not urgent runtime bugs, but future hardening items:

1. `finalAppointmentId` inference is currently frontend-auto-selected and backend-validated, not fully backend-inferred when omitted.
2. The one-open-appointment guard is service-level, with no DB-level concurrency constraint by design.
3. The lifecycle currently uses `visit_result` as the terminal visit signal, while `appointment_status` also has terminal values. This is workable, but future docs and APIs should keep this distinction explicit.

No migration or runtime fix is recommended inside Task 104.

## Consistency Matrix

| Area | Current expected rule | Code / migration evidence | Admin UI expectation | Test / smoke coverage | Risk level | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| Case to Field Service Report | One Case has one formal active Field Service Report. | `008_create_field_service_tables.sql` has partial unique index on `field_service_reports(case_id)` where not deleted. `FieldServiceReportService.createServiceReport()` rejects an existing report. | Case detail has a single service report panel for the current case. | `smoke:028` rejects second service report creation. | Low | Keep one active report per case. Do not introduce per-appointment formal reports. |
| Case to appointments / visits | One Case can have multiple appointment / visit history records. | `appointments.case_id` references `cases.id`; `AppointmentRepository.listAppointments()` lists case appointments. `018` adds visit result fields. | Case detail shows appointment list plus read-only multi-visit history. | `smoke:028`, `smoke:029`, and browser smoke create multiple appointments for one case. | Low | Continue treating appointments as visit history under one Case. |
| One open appointment guard | Same Case should have only one open / unfinished appointment at the same time. | `AppointmentService.assertNoOtherOpenAppointment()` calls `AppointmentRepository.findOpenAppointmentsByCaseId()`. Open means status is not `cancelled`, `completed`, or `no_show`, and visit result is not terminal. | Case detail shows open appointment guidance and tells the operator to finish, cancel, or mark result before creating another appointment. | `smoke:029` verifies second open appointment is rejected; `smoke:028` exercises terminal first visit then second appointment. | Medium | Current service-level guard is acceptable. If high-concurrency appointment creation becomes real, revisit DB-level or lock-based hardening. |
| Appointment status lifecycle | `scheduled` / `rescheduled` remain open unless appointment status is terminal or visit result is terminal. `rescheduled` status alone is not terminal. | DB and validators allow `scheduled`, `rescheduled`, `cancelled`, `completed`, `no_show`. Repository open query treats `rescheduled` as open unless terminal visit result is set. | UI lets operators edit / reschedule or cancel; visit result modal records actual visit outcome separately. | `smoke:029` reschedules first appointment and still blocks another open appointment until terminal result is set. | Low | Keep documenting that `visit_result` is the visit outcome, while `appointment_status` is scheduling state. |
| `finalAppointmentId` inference | Normal operator flow should be system-determined, not a manual picker. | `019` adds nullable `field_service_reports.final_appointment_id`. Backend validators accept the field; completion validates same case and `visit_result = completed`. | UI auto-selects the latest completed visit by sequence / actual finish / scheduled end and submits it only when completing the report. There is no manual picker. | `smoke:028` and browser smoke verify final completed appointment completion; `smoke:028` rejects missing, pending-parts, and cross-case final appointment ids. | Medium | Future hardening could move final appointment inference into backend completion logic so callers do not need to submit the id. Keep admin manual override absent. |
| Multi-dispatch | Multiple dispatch / visit attempts must not break one-open-appointment or one-report invariants. | Dispatch assignments are case-scoped; appointment guard is case-scoped, not dispatch-assignment-scoped. Field report remains case-scoped. | UI has dispatch / appointment panel and multi-visit history. | `smoke:028` and browser smoke cover multi-dispatch final appointment flow. | Low | Continue making final completion Case-level. If richer dispatch history is needed, extend dispatch history without changing formal report cardinality. |
| Report finalization | Field Service Report completion completes the Case but does not close the Case, create billing, create settlement, or perform AI decisions. | `FieldServiceReportService.completeServiceReport()` updates report to `completed` and case to `completed`; it does not call billing / settlement / AI decision logic. | UI confirmation says completion does not auto close case and does not auto create billing / settlement. | `smoke:028`, `smoke:029`, and browser smoke verify case becomes completed after report completion. | Low | Preserve human-confirmed downstream billing / settlement / close workflows. |
| Cancelled / rescheduled appointments | Cancelled / no-show / completed status and terminal visit results should not remain open. Cancelled or non-completed visits should not become final appointment. | Open query excludes terminal status and terminal visit results. Completion requires final appointment `visit_result = completed`. | UI marks non-completed visit results as needing next action and does not auto-complete report unless a completed visit exists. | `smoke:028` covers pending-parts rejection; `smoke:029` covers terminal pending-parts then new appointment. | Medium | Add future targeted test for cancelled/no-show not being accepted as `finalAppointmentId`. |
| Channel abstraction readiness | Core case / appointment / report model should not be LINE-only. | `cases.source` supports multiple sources; `cases.intake_line_channel_id` is optional; notification channels include line/sms/email/in_app; LINE identity tables are separate. | Case management core does not require LINE-specific fields for report completion. Customer pages mask LINE identity. | Existing LINE smokes cover LINE identity separately; current multi-visit smokes do not depend on LINE. | Low | Future app support should add channel identity abstraction around intake / notifications, not modify Case-report cardinality. |
| Existing case reverse LINE binding readiness | Existing Case / Customer should later bind to LINE identity without requiring LINE-originated case creation. | `customer_line_identities` is scoped by organization and line channel. `future-existing-case-to-line-binding-memo.md` documents future tokenized binding. | Current admin has customer LINE identity management, but no case-level binding invite flow yet. | `smoke:047` covers LINE identity admin API; reverse binding is future design only. | Medium | Future Task should design binding tokens / invitation flow without exposing raw LINE user ids or requiring all cases to originate from LINE. |
| Post-completion satisfaction survey readiness | Survey should attach to Case / final completion context, not require multiple formal reports. | Current schema has no survey table. `field_service_reports.final_appointment_id` and case completion fields provide an anchor for future trigger design. | No current survey UI. | No survey smoke coverage. | Medium | Future design should introduce a Case-level survey flow keyed to case completion and optionally final appointment context. Do not create per-visit formal reports for surveys. |

## Detailed Review Notes

### Data Model / Migrations

- `cases` is the product-level work item and keeps summary lifecycle fields such as `status`, `appointment_status`, `completion_status`, `scheduled_at`, and `completed_at`.
- `appointments` is the visit history layer. It supports multiple rows per case and now includes `visit_sequence`, `visit_result`, `incomplete_reason`, `next_action`, `actual_arrival_at`, and `actual_finished_at`.
- `field_service_reports` is the formal service report layer. The active-report unique index on `case_id` matches the one formal report per Case rule.
- `field_service_reports.final_appointment_id` is nullable for legacy compatibility and references `appointments(id)`.
- There is no DB-level one-open-appointment constraint. This matches the existing Task 060 / 061 decision to keep the evolving open definition in service logic first.

### API / Service Workflow

- Appointment creation always creates `appointment_status = scheduled` and first checks for another open appointment in the same Case.
- Appointment update / reschedule uses the same endpoint for schedule edits, cancellation, and visit result updates.
- A visit result in the terminal set makes the appointment no longer open even if `appointment_status` remains `scheduled` or `rescheduled`.
- Service report creation is Case-level and rejects duplicate active reports.
- Service report completion is Case-level. For cases with appointments, it requires a final appointment id and validates that the appointment belongs to the same Case and has `visit_result = completed`.
- Completion updates the Case to `completed`, but does not close the Case or create billing / settlement records.

### Admin Frontend Expectation

- Case detail does not imply one appointment per Case. It has appointment list and a multi-visit history section.
- Case detail does not imply one appointment creates one formal report. The service report panel remains one per Case.
- There is no manual `finalAppointmentId` picker. The UI chooses the final completed appointment automatically when the operator sets the report to `completed`.
- The UI warns when appointments are still loading, appointment loading failed, or no completed visit exists.
- The UI shows the final appointment marker when the loaded appointment page contains the matching `serviceReport.finalAppointmentId`.
- The UI warns if the final appointment id exists but is outside the current loaded page.
- Current case / report UI does not require LINE identity for core workflow.

### Future Compatibility

#### Channel Abstraction

The core workflow is not LINE-only. Cases have a multi-source `source`, an optional LINE channel intake field, and separate LINE identity / event tables. Notification foundations already use a channel enum that includes non-LINE channels.

Future app support should extend channel identity and notification routing without moving LINE-specific ids into core report completion behavior.

#### Existing Case Reverse LINE Binding

The current data model is compatible with future reverse binding because cases can exist without LINE intake and customers can later be linked to scoped LINE identities. The existing future memo recommends tokenized binding, organization/channel scoping, audit logs, and redaction.

No Task 104 code change is needed, but future binding design should avoid exposing raw LINE user ids in admin handoff, URLs, logs, or report payloads.

#### Post-completion Customer Satisfaction Survey

Survey is not implemented yet. The current Case-level report and `finalAppointmentId` provide a reasonable future trigger anchor:

- Case reaches `completed`.
- Formal report has `service_status = completed`.
- If appointments exist, the report has a final appointment context.

The survey should be Case-level or completion-context-level. It should not require multiple formal Field Service Reports.

## Test / Smoke Coverage Review

| Coverage item | Current coverage | Gap / recommendation |
| --- | --- | --- |
| Case with multiple appointments | Covered by `smoke:028`, `smoke:029`, and browser smoke. | None urgent. |
| One open appointment guard | Covered by `smoke:029`. | Add future concurrency-level coverage only if concurrent appointment creation becomes realistic. |
| Reschedule does not create multiple open appointments | Covered by `smoke:029`, including reschedule then second appointment rejection until terminal result. | None urgent. |
| Cancel then create new appointment | Partially covered by terminal-result path, not direct cancel path. | Add future targeted smoke for cancel then create new appointment. |
| Complete appointment then finalize report | Covered by `smoke:028`, `smoke:029`, and browser smoke. | None urgent. |
| Multiple appointments with final appointment selection | Covered by API smokes and browser smoke. | Future backend-owned inference test if inference moves server-side. |
| Cancelled appointment is not final appointment | Not directly covered. Pending-parts and cross-case rejection are covered. | Add future targeted smoke for cancelled/no-show final appointment rejection. |
| Multi-dispatch does not create multiple open appointments | Covered by `smoke:028` and browser smoke flow. | None urgent. |
| Field Service Report remains one formal report per Case | Covered by duplicate service report rejection in `smoke:028`. | None urgent. |
| Browser smoke covers main admin workflow | Browser smoke covers appointment result, second appointment, service report completion, final marker, and case completion. | Full customer/case/dispatch creation remains API-assisted; acceptable for current lightweight browser smoke. |
| Channel abstraction | Separate LINE identity smokes exist; case/report smokes are not LINE-dependent. | Future app/channel abstraction tests when the feature is designed. |
| Post-completion survey | Not implemented. | Future survey design and tests after product scope is opened. |

## Recommended Future Tests

These are recommendations only. Task 104 does not add or change tests.

1. Cancel appointment, then create a new appointment for the same Case.
2. No-show appointment, then create a new appointment for the same Case.
3. Attempt service report completion with a cancelled appointment as `finalAppointmentId`.
4. Attempt service report completion with a no-show appointment as `finalAppointmentId`.
5. Attempt service report completion when appointment has `appointment_status = completed` but missing or non-completed `visit_result`, to lock in that `visit_result` is the formal completion signal.
6. If future backend inference is added, complete service report without sending `finalAppointmentId` and verify the backend selects the correct completed visit deterministically.
7. Future survey trigger smoke after survey design exists.

## Risk Register

| Risk | Level | Why it matters | Suggested follow-up |
| --- | --- | --- | --- |
| Backend accepts `finalAppointmentId` in API payloads. | Medium | Admin UI is automatic, but direct API clients can still provide the field. Backend validation prevents cross-case and non-completed-visit completion, but it is not fully backend-inferred. | Task 105 could design backend-owned final appointment inference / stricter API contract. |
| One-open appointment guard is not DB-enforced. | Medium | Service logic is clear, but concurrent writes could theoretically race. | Revisit only if real concurrency becomes a problem; no migration now. |
| Appointment lifecycle has both `appointment_status` and `visit_result` terminal concepts. | Low / Medium | This is intentional from Task 060 / 061, but future operators may confuse scheduling status with visit outcome. | Keep docs and UI wording explicit; future tests should lock in `visit_result` as final service completion signal. |
| Final appointment marker can be outside loaded appointment page. | Low | UI warns, but operators may need to page through history. | If cases commonly have many visits, add direct final appointment summary fetch. |
| Survey flow is not yet modeled. | Medium | Future survey must know which completion context triggered it. | Design survey as Case-level completion workflow, optionally referencing final appointment. |

## Task 104 Conclusion

No runtime change is required from this review.

The current product model remains aligned with the main principles:

- One Case has one formal active Field Service Report.
- One Case can have multiple appointments / visits.
- One Case can have only one open appointment in service-level workflow.
- `finalAppointmentId` is automatically selected by the admin operator flow and backend-validated, with a recommended future hardening path toward backend-owned inference.
- Multi-dispatch / multi-visit does not break the formal Case-level report invariant.
- Channel abstraction, reverse LINE binding, and post-completion survey remain future-compatible but not fully implemented.

## Suggested Task 105

Task 105 - Backend-owned finalAppointmentId inference design / API contract hardening.

Recommended focus:

- Decide whether service report completion should infer `finalAppointmentId` server-side when omitted.
- Define deterministic ordering for multiple completed appointments.
- Decide whether direct API payload `finalAppointmentId` should remain allowed, become internal-only, or be accepted only as a backend-validated override in a future explicit admin correction flow.
- Preserve no manual admin picker by default.
- Preserve one Case to one formal Field Service Report.
- Do not add AI automatic completion decisions.
- Do not add migration unless the API contract design proves a schema change is necessary.

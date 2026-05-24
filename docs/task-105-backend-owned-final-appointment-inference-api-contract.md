# Task 105 - Backend-owned finalAppointmentId Inference API Contract

## Scope

This is a design-first API contract review for Field Service Report completion.

Task 105 does not change runtime behavior, backend `src/`, admin frontend code, migrations, DB schema, indexes, smoke tests, production API behavior, AI behavior, or inventory documentation. Inventory docs remain frozen after Task 103.

The design keeps the established product rules:

- One Case has one formal active Field Service Report.
- One Case can have multiple appointments / visits.
- One Case can have only one open appointment at a time.
- `finalAppointmentId` should normally be system-determined.
- No manual admin picker is introduced.
- No AI automatic dispatch, completion, settlement, fee decision, or cleanup decision is introduced.
- LINE remains a channel, not the core case/report model.
- Future reverse LINE binding and post-completion survey flows must remain compatible.

## Files Reviewed

- `src/services/FieldServiceReportService.js`
- `src/controllers/FieldServiceReportController.js`
- `src/routes/fieldService.routes.js`
- `src/validators/fieldServiceValidators.js`
- `src/repositories/FieldServiceReportRepository.js`
- `src/repositories/AppointmentRepository.js`
- `src/mappers/fieldServiceMapper.js`
- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`
- `scripts/smoke/browser/071_multi_dispatch_browser_smoke.js`
- `docs/task-059-auto-select-final-appointment-for-service-report-completion.md`
- `docs/multi-visit-field-service-design.md`
- `docs/task-104-case-appointment-field-service-report-consistency-review.md`

## Current Behavior Summary

### 1. Does completion require finalAppointmentId when appointments exist?

Yes.

`FieldServiceReportService.ensureCompletionFinalAppointment()` checks whether the Case has active appointments. If it does, completion requires a `finalAppointmentId`, either from the request payload or from the existing report row.

### 2. What happens if finalAppointmentId is omitted today?

If the Case has appointments and the existing report does not already have `final_appointment_id`, completion is rejected with a validation error.

If the Case has no appointments, completion can proceed without `finalAppointmentId` for legacy compatibility.

If the Case has appointments and the report already has a stored `final_appointment_id`, omitted payload uses the stored value and validates it.

### 3. What happens if finalAppointmentId is supplied today?

The backend validates:

- the appointment exists and is not deleted,
- the appointment belongs to the same Case as the report,
- when completing the report, the appointment has `visit_result = completed`.

For non-completion updates, the backend currently validates only that the supplied appointment belongs to the same Case.

### 4. Which invalid finalAppointmentId cases are already rejected?

Already rejected for completion:

- cross-case appointment,
- missing / not found appointment,
- `visit_result` not `completed`,
- `pending_parts`,
- `no_show`,
- `rescheduled`,
- missing `visit_result`,
- any other non-completed visit result.

`appointment_status = completed` alone is not enough; `visit_result` remains the formal service-completion signal.

### 5. Can a direct API client supply finalAppointmentId?

Yes.

`createServiceReportValidator` and `updateServiceReportValidator` currently accept nullable optional `finalAppointmentId`. The service strictly validates it, but direct API clients can still provide the value.

### 6. Is there an admin frontend manual picker?

No.

The admin UI auto-selects a completed visit when completing a report. It does not provide a manual `finalAppointmentId` picker.

### 7. Is legacy no-appointment completion still supported?

Yes.

If a Case has no appointments, report completion can proceed without `finalAppointmentId`.

### 8. Why is finalAppointmentId nullable?

It preserves compatibility for legacy reports / cases without appointments and for staged migration from frontend-owned inference to backend-owned inference.

## Problem / Risk Statement

The current model is safe but incomplete from an API ownership perspective:

- The backend is the validator but not yet the inference owner.
- The admin frontend currently performs final appointment inference and sends the selected id.
- Direct API clients can still supply `finalAppointmentId`.
- Multiple completed visits need deterministic backend ordering before backend inference can become the source of truth.

This does not currently break the one-Case-one-report rule, because completion is backend-validated. The gap is contract clarity and future client consistency.

## Proposed Backend-owned Inference Rule

### When to infer

Backend should infer `finalAppointmentId` only during service report completion.

Recommended rule:

1. If `serviceStatus !== completed`, do not infer.
2. If the Case has no appointments, preserve legacy completion without `finalAppointmentId`.
3. If the Case has appointments and request payload supplies `finalAppointmentId`, validate and use it for now.
4. If the Case has appointments and request payload omits `finalAppointmentId`, infer the final appointment from eligible completed visits in the same Case.
5. If no eligible completed appointment exists, reject completion.

### Eligible final appointment

An appointment is eligible only when all are true:

- `appointments.case_id = field_service_reports.case_id`,
- `appointments.deleted_at IS NULL`,
- `appointments.visit_result = 'completed'`,
- the appointment belongs to the actor-visible Case through existing organization access checks.

The following are not eligible:

- cross-case appointments,
- deleted appointments,
- `visit_result IS NULL`,
- `visit_result != completed`,
- `pending_parts`,
- `pending_quote`,
- `need_second_visit`,
- `customer_not_home`,
- `customer_cancelled`,
- `unable_to_repair`,
- `rescheduled`,
- `no_show`,
- cancelled appointment status,
- no-show appointment status,
- `appointment_status = completed` with missing or non-completed `visit_result`.

### Deterministic ordering

Use only existing columns. Recommended SQL ordering:

```sql
ORDER BY
  visit_sequence DESC NULLS LAST,
  actual_finished_at DESC NULLS LAST,
  actual_arrival_at DESC NULLS LAST,
  scheduled_end_at DESC NULLS LAST,
  created_at DESC,
  id DESC
```

Rationale:

- `visit_sequence` best expresses operational visit order when present.
- `actual_finished_at` best expresses actual completion time.
- `actual_arrival_at` is a useful secondary actual-time signal.
- `scheduled_end_at` is the next best scheduling signal.
- `created_at` preserves stable fallback order.
- `id DESC` prevents DB natural order from becoming the tie-breaker.

Do not use DB natural order.

## Recommended API Contract

Recommended option: **Option A - accept supplied id with strict validation, infer when omitted.**

This is the lowest-risk staged contract because it adds backend-owned inference without breaking existing admin frontend or smoke flows.

### Complete service report request

`finalAppointmentId` should remain optional in the request body during Phase 2.

Behavior:

| Scenario | Recommended behavior |
| --- | --- |
| Case has no appointments, `finalAppointmentId` omitted | Allow legacy completion. Response includes `finalAppointmentId = null`. |
| Case has appointments, exactly one eligible completed appointment, `finalAppointmentId` omitted | Backend infers that appointment and completes the report. |
| Case has appointments, multiple eligible completed appointments, `finalAppointmentId` omitted | Backend picks one using deterministic ordering. |
| Case has appointments, no eligible completed appointment, `finalAppointmentId` omitted | Reject. Do not complete report or Case. |
| Supplied `finalAppointmentId` belongs to same Case and `visit_result = completed` | Accept for backward compatibility. |
| Supplied `finalAppointmentId` missing / not found | Reject. |
| Supplied `finalAppointmentId` belongs to another Case | Reject. |
| Supplied `finalAppointmentId` has non-completed visit result | Reject. |

### Error behavior

Recommended error behavior:

- No eligible completed appointment: `ValidationError`, field `finalAppointmentId`, code such as `no_completed_appointment`.
- `finalAppointmentId` not found: keep current `NotFoundError('Appointment not found.')`.
- Cross-case appointment: keep current validation code `appointment_case_mismatch`.
- Non-completed visit result: keep current validation code `final_appointment_not_completed`.
- Duplicate active report: keep current `ConflictError('Service report already exists for this case.')`.
- Report already completed: current code does not explicitly reject idempotent / repeated completion. A future hardening task may decide whether repeated completion is allowed, idempotent, or rejected.
- Case already closed: current completion flow checks organization access but does not explicitly reject closed/completed case state at update time. Future hardening can define that contract separately.

In all rejection cases:

- do not set report `service_status = completed`,
- do not set `onsite_completed_at`,
- do not set Case `status = completed`,
- do not set Case `completed_at`,
- do not write completed timeline message,
- do not write completed audit event.

### Response behavior

On successful completion:

- response includes completed `serviceStatus`,
- response includes resolved `finalAppointmentId`,
- response does not include raw customer contact values,
- response does not include raw LINE user id,
- response does not include credentials, tokens, secrets, or raw payloads.

## Supplied finalAppointmentId Policy Recommendation

### Option A - Recommended now

Allow supplied `finalAppointmentId` but keep strict validation. Infer when omitted.

Pros:

- Backward compatible with current admin frontend.
- Existing smoke tests can be updated incrementally.
- No migration required.
- No admin frontend change required in the same task.
- Direct API misuse remains bounded by backend validation.

Cons:

- Direct API clients can still attempt to choose final appointment.
- Full "backend-owned" semantics are partly staged rather than absolute.

### Option B - Do not accept supplied finalAppointmentId

Completion API ignores or rejects supplied `finalAppointmentId`; backend always infers.

Pros:

- Strongest system-owned contract.
- Simplifies normal client responsibility.

Cons:

- Breaking change for current admin frontend and smoke tests.
- Requires coordinated frontend and API rollout.
- Needs decision on legacy reports that already store final appointment ids.

### Option C - Supplied finalAppointmentId only for explicit correction flow

Normal completion API infers. A separate future admin correction endpoint can set / correct final appointment with explicit audit.

Pros:

- Clean long-term contract.
- Manual correction becomes visible and auditable.

Cons:

- Requires new product UX and API design.
- Not needed for current Task 105.

### Recommendation

Use Option A for Phase 2. Revisit Option C only after backend inference is stable and after a real correction workflow is needed.

Do not use Option B as the immediate next step because it would create a coordinated breaking change without enough benefit.

## Admin Frontend Impact

No manual picker should be added.

Under Option A:

- current admin UI can keep sending auto-selected `finalAppointmentId`,
- backend inference can be added without immediate frontend changes,
- future admin UI may omit `finalAppointmentId` when completing the report,
- UI can still auto-select for display / confirmation copy, but the backend becomes the source of truth,
- final marker display should continue to use `serviceReport.finalAppointmentId` from the response,
- existing warning for final appointment outside the loaded page can remain.

Under a future stricter contract:

- UI should stop sending `finalAppointmentId` during normal completion,
- UI should still block obvious no-completed-visit cases for operator friendliness, but backend remains final authority,
- any explicit correction flow must be separate, audited, and not a default picker.

## Implementation Plan

### Phase 1 - Design-only / docs

This Task 105 document.

- Document current behavior.
- Document backend-owned inference rule.
- Document deterministic ordering.
- Document API contract recommendation.
- Document tests and phased plan.
- No runtime change.

### Phase 2 - Backend inference implementation

Recommended future implementation:

1. Add `AppointmentRepository.findFinalCompletedAppointmentByCaseId(caseId, client)`.
2. Query only active appointments with `visit_result = 'completed'`.
3. Apply deterministic ordering:

```sql
ORDER BY
  visit_sequence DESC NULLS LAST,
  actual_finished_at DESC NULLS LAST,
  actual_arrival_at DESC NULLS LAST,
  scheduled_end_at DESC NULLS LAST,
  created_at DESC,
  id DESC
LIMIT 1
```

4. Update `FieldServiceReportService.ensureCompletionFinalAppointment()`:
   - if supplied id exists, validate current behavior,
   - if omitted and Case has appointments, infer with repository method,
   - if no eligible appointment, reject,
   - if no appointments, preserve legacy no-id behavior.
5. Keep one active report per Case.
6. Keep no migration.
7. Keep no AI decision.
8. Update targeted smoke expectations.

### Phase 3 - Admin frontend contract simplification

Optional future frontend task:

- stop sending `finalAppointmentId` during normal completion,
- keep no manual picker,
- keep UI confirmation copy,
- display final marker from response,
- keep warning when final appointment is outside the currently loaded appointment page,
- do not add LINE-specific coupling.

### Phase 4 - Optional stricter contract

Future policy decision only:

- Decide whether supplied `finalAppointmentId` should become internal-only.
- If correction is needed, design a separate explicit admin correction endpoint.
- Correction flow must be audited.
- Correction flow should only allow completed visits from the same Case.
- Still do not add a default manual picker.

## Test / Smoke Design

Recommended tests for Phase 2 implementation:

1. Complete report without `finalAppointmentId` when exactly one completed appointment exists -> backend infers it.
2. Complete report without `finalAppointmentId` when multiple completed appointments exist -> backend uses deterministic latest rule.
3. Complete report without `finalAppointmentId` when no completed appointments exist -> rejected; Case remains not completed.
4. Supplied `finalAppointmentId` same Case + `visit_result = completed` -> accepted under Option A.
5. Supplied `finalAppointmentId` cross-case -> rejected.
6. Supplied `finalAppointmentId` cancelled / no_show / pending_parts / missing `visit_result` -> rejected.
7. `appointment_status = completed` but `visit_result` missing or non-completed -> rejected.
8. No appointments legacy Case -> current compatibility behavior remains.
9. Duplicate service report creation remains rejected.
10. One Case still has one formal active Field Service Report.
11. Admin UI still has no manual picker.
12. Browser smoke still shows final appointment marker after completion.

Recommended smoke updates:

- Update `smoke:028` to add omitted-id inference success cases.
- Keep existing supplied-id success and rejection cases while Option A remains active.
- Keep `smoke:029` coverage for one-open-appointment guard and final appointment completion.
- Browser smoke can remain UI-focused; it may be updated later when admin frontend omits the id.

## Migration / Schema Decision

No migration is required for the recommended Phase 2 implementation.

No DB schema or index change is required:

- `appointments.case_id` already exists.
- `appointments.visit_result` already exists.
- `appointments.visit_sequence`, `actual_finished_at`, `actual_arrival_at`, `scheduled_end_at`, `created_at`, and `id` already exist.
- `field_service_reports.final_appointment_id` already exists and is nullable.
- `field_service_reports.case_id` active unique index remains the correct one-report-per-Case guard.

Do not add DB-level one-open-appointment constraints in this task. That is a separate concurrency hardening discussion.

## Security / Redaction Note

Completion contract and test output must not expose:

- `DATABASE_URL`,
- passwords or password hashes,
- tokens or secrets,
- customer mobile / phone / tel,
- raw LINE user id,
- LINE channel secret / access token,
- full payload / raw payload,
- production data details.

The final appointment inference query should use ids internally and return only the normal service report DTO.

## Non-goals

Task 105 and the recommended Phase 2 must not:

- create multiple formal Field Service Reports for one Case,
- weaken one-open-appointment guard,
- add manual final appointment picker,
- add manual correction UI,
- add AI automatic completion decision,
- add AI automatic dispatch / settlement / fee decisions,
- add cleanup or shared runtime mutation,
- add migration unless a later task proves unavoidable,
- change DB schema / indexes,
- hard-code LINE into core Case / Report completion,
- implement survey,
- implement reverse LINE binding,
- expand inventory docs.

## Task 105 Recommendation

Proceed with design-only in Task 105.

Recommended Task 106:

```text
Task 106 - Backend-owned finalAppointmentId inference minimal implementation
```

Task 106 should implement Option A with the deterministic ordering above, add targeted smoke coverage, and keep admin frontend unchanged unless the backend contract change proves stable.

## Task 106 Implementation Note

Task 106 implements the recommended Option A backend contract with no migration, schema change, index change, admin frontend change, or inventory docs change.

Implemented completion-time resolution order:

1. If the request supplies a non-null `finalAppointmentId`, the backend validates it strictly and uses it.
2. Else if the existing report row already has `final_appointment_id`, the backend validates it strictly and uses it.
3. Else if the Case has appointments, the backend infers the final appointment from eligible completed visits.
4. Else if the Case has no appointments, the legacy no-appointment completion path remains allowed without `finalAppointmentId`.

Explicit `null` in a completion request is treated as omitted. It does not clear an existing `final_appointment_id` during completion.

Eligible inferred appointments must:

- belong to the same Case,
- have `visit_result = completed`,
- not be soft-deleted.

Appointments with cancelled, no-show, pending-parts, follow-up, missing, or non-completed visit result are not eligible. `appointment_status = completed` alone is not enough.

The implemented deterministic ordering is:

```sql
ORDER BY
  visit_sequence DESC NULLS LAST,
  actual_finished_at DESC NULLS LAST,
  actual_arrival_at DESC NULLS LAST,
  scheduled_end_at DESC NULLS LAST,
  created_at DESC,
  id DESC
LIMIT 1
```

The `id DESC` tie-breaker is retained so inference never depends on DB natural order.

Task 106 smoke coverage updates:

- `smoke:028` verifies omitted `finalAppointmentId` inference when exactly one completed visit is eligible.
- `smoke:028` verifies deterministic inference when multiple completed visits exist.
- `smoke:028` keeps no-completed-visit rejection coverage.
- `smoke:028` keeps supplied same-Case completed `finalAppointmentId` compatibility coverage.
- `smoke:028` keeps cross-Case and non-completed final appointment rejection coverage.
- `smoke:029` remains the one-open-appointment guard smoke.

Legacy no-appointment completion behavior remains supported by the service contract; Task 106 does not add a new fixture for that path.

Security and response behavior remain unchanged:

- completed report responses include the resolved `finalAppointmentId` when one exists,
- no raw payload is added to the response,
- no customer mobile, raw LINE user id, credential, token, secret, or database URL is exposed,
- no AI automatic decision is introduced.

## Task 107 Admin Frontend Contract Simplification Note

Task 107 simplifies the Admin Frontend completion contract after Task 106 made backend inference available.

Implemented Admin Frontend behavior:

- normal service report completion no longer sends `finalAppointmentId`,
- completion payload omits the `finalAppointmentId` key entirely rather than sending `null` or `undefined`,
- backend inference is the source of truth for omitted `finalAppointmentId`,
- the admin UI does not add a final appointment picker,
- operators cannot manually select or override `finalAppointmentId`,
- completed visits may still be shown as display-only context before completion,
- final marker display continues to use the completed report response / refreshed report `finalAppointmentId`.

Backend compatibility remains unchanged:

- supplied `finalAppointmentId` is still accepted by the backend for direct API compatibility,
- supplied ids remain strictly validated,
- omitted ids are inferred by backend using the Task 106 deterministic ordering,
- no backend inference ordering change is made in Task 107.

Task 107 verification focus:

- Admin completion request omits `finalAppointmentId`,
- backend inference completion still succeeds,
- response contains the resolved `finalAppointmentId`,
- final marker still appears in the visit history,
- no manual picker appears,
- `smoke:028` and `smoke:029` backend guards remain passing,
- browser smoke verifies the frontend request shape and final marker behavior.

Task 107 keeps the same non-goals:

- no migration,
- no schema or index change,
- no destructive cleanup,
- no AI automatic decision,
- no manual correction UI,
- no manual override endpoint,
- no inventory docs expansion,
- no LINE-specific coupling in core Case / Report completion.

## Task 108 No Eligible Completed Visit Error-path Note

Task 108 reviews and covers the Admin UI error path after Admin Frontend completion requests started omitting `finalAppointmentId`.

Covered error condition:

- Case has appointments,
- no appointment has `visit_result = completed`,
- Admin UI attempts to complete the Field Service Report without sending `finalAppointmentId`,
- backend rejects completion with the existing no eligible completed appointment validation.

Expected behavior remains:

- completion payload still omits `finalAppointmentId`,
- backend remains the source of truth for final appointment inference,
- report remains not completed,
- Case remains not completed / not closed,
- `completed_at` is not set,
- final appointment marker is not shown,
- no manual picker appears,
- user sees a safe service report error message,
- appointment / visit history remains visible.

Task 108 browser smoke coverage:

- `smoke:071:browser` creates a dedicated no-completed-visit fixture,
- verifies the completion PATCH request does not include `finalAppointmentId`,
- verifies backend rejects the request,
- verifies the UI shows an error instead of success,
- verifies API state remains not completed after rejection,
- verifies no final marker and no manual picker appear.

Task 108 does not change backend runtime behavior, inference ordering, migrations, schema, indexes, inventory docs, or AI behavior.

## Task 109 Completed Report Repeat Completion / Idempotency Note

Task 109 hardens completed report repeat completion behavior with the reject-repeat-completion contract.

Chosen already-completed contract:

- If `service_status` is already `completed`, the completion endpoint rejects repeat completion.
- The rejection happens before final appointment resolution / inference.
- The rejection happens before report update, case update, timeline message creation, or audit creation.
- The response uses the existing conflict-style error path and does not include sensitive data.

Why this contract:

- It avoids treating direct API retry as permission to rerun completion side effects.
- It prevents supplied `finalAppointmentId` compatibility from becoming a post-completion override path.
- It is simpler and safer than an idempotent read-only return until a dedicated idempotency key / retry contract exists.

Stability guarantees for completed reports:

- `finalAppointmentId` remains stable after first successful completion.
- `onsiteCompletedAt` remains stable after first successful completion.
- Case `completedAt` remains stable after first successful completion.
- Repeat completion does not create duplicate timeline messages.
- Repeat completion does not create a second formal Field Service Report.
- Completed reports are not reopened or moved back to `in_progress` by the normal update endpoint.

Task 109 smoke coverage:

- `smoke:028` completes a report once with backend-inferred `finalAppointmentId`.
- `smoke:028` retries completion with omitted `finalAppointmentId` and expects rejection.
- `smoke:028` verifies report `finalAppointmentId`, report completed timestamp, case completed timestamp, case status, and timeline message count remain unchanged after rejection.
- `smoke:028` verifies a normal update cannot reopen a completed report back to `in_progress`.
- `smoke:028` retries completion with a different supplied same-Case completed `finalAppointmentId` on an already completed report and verifies it cannot override the stored final appointment.
- Existing no-eligible-completed-visit and supplied-id validation coverage remains in place.

Admin UI behavior remains:

- completion payload omits `finalAppointmentId`,
- no final appointment manual picker exists,
- UI remains response / refreshed-report driven for final marker display,
- backend rejection should be shown as a safe error instead of a second success state.

Future survey compatibility:

- post-completion survey should trigger only on the first successful transition to completed,
- repeat completion must not trigger survey again,
- final appointment context should remain stable after completion.

Task 109 does not add migration, schema change, index change, manual correction UI, manual override endpoint, AI automatic decision, inventory docs expansion, or LINE-specific coupling in core Case / Report completion.

## Task 110 Cross-reference

Task 110 defines the future post-completion survey first-transition trigger contract in `docs/task-110-post-completion-survey-trigger-first-transition-design.md`.

Task 110 keeps survey design separate from the completion API:

- survey trigger source of truth is the first successful backend Case service completion transition,
- repeat completion conflict does not trigger survey,
- survey context uses the completed report's stable `finalAppointmentId`,
- delivery channel resolution remains future and channel-agnostic,
- no survey runtime, notification sending, migration, schema change, or inventory docs expansion is introduced.

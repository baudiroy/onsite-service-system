# Task 154 - First-Transition Conditional Update Implementation Planning / No Runtime Implementation

## Background

Task154 follows Task153 and the PM review recommendation. Task153 confirmed that Task109's already-completed guard protects repeat completion after a completed report is visible, but it does not yet provide a strict concurrent first-transition guard when two completion requests read the same in-progress report before either commits.

This task is planning-only. It defines the future implementation shape for first-transition hardening, but does not modify backend runtime, migrations, schema, Admin frontend, smoke tests, or survey runtime.

## No-runtime-change Statement

Task154 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify smoke or browser smoke scripts,
- edit Migration 020 SQL,
- add or apply migrations,
- connect to DB,
- run psql,
- run `npm run db:migrate`,
- execute DDL,
- implement row locks,
- implement conditional completion updates,
- implement survey repositories, services, feature flags, workers, delivery resolvers, response intake, or AI runtime,
- approve local dry-run, shared apply, runtime writes, survey sending, or historical backfill,
- modify Task087 inventory docs,
- mutate shared runtime data.

## Current Code Touchpoints For Future Implementation

Reviewed touchpoints:

- `src/services/FieldServiceReportService.js`
- `src/repositories/FieldServiceReportRepository.js`
- `src/repositories/CaseRepository.js`
- `src/db/transaction.js`
- `src/repositories/BaseRepository.js`
- `docs/task-153-first-transition-concurrency-hardening-review-no-runtime-change.md`
- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`

Current completion flow in `FieldServiceReportService.completeServiceReport()`:

1. Starts `withTransaction`.
2. Reads the report through `getReportOrThrow()`, which calls `getServiceReportById()`.
3. Rejects if `existing.service_status === 'completed'`.
4. Resolves / validates `finalAppointmentId`.
5. Calls generic `updateServiceReport()` with `serviceStatus: 'completed'`.
6. Updates Case service summary.
7. Creates timeline message.
8. Creates audit record.
9. Returns the completed report DTO.

Current repository behavior:

- `getServiceReportById()` uses a plain `SELECT`, with no `FOR UPDATE`.
- `updateServiceReport()` updates by `id` and `deleted_at IS NULL`; it does not require `service_status <> 'completed'`.
- `withTransaction()` provides commit / rollback boundaries, but does not by itself prevent two transactions from reading the same in-progress report before either completion update commits.

## Recommended Future Implementation Strategy

Recommended target for survey-runtime readiness:

**Option C - row lock plus completion-specific conditional update.**

Rationale:

- Row lock ensures final appointment inference and validation run after the report row is serialized for completion.
- Conditional update makes the write statement itself represent first-transition semantics.
- Side effects can be gated only on a successful first-transition returned row.
- It does not require a migration, schema change, or index.
- It keeps future survey intent / outbox writes anchored to the same winning transaction.

Lower-risk pre-survey fallback:

**Option B - completion-specific conditional update only** may be acceptable if the next approved task wants the smallest runtime patch before survey writes. However, for eventual survey runtime implementation, Option C remains the cleaner target because it avoids inference and side-effect planning before a serialized completion boundary.

## Future Repository Changes

Add completion-specific methods to `FieldServiceReportRepository`.

### 1. Locked Read

Suggested method:

```text
getServiceReportByIdForUpdate(reportId, client)
```

Behavior:

```sql
SELECT *
FROM field_service_reports
WHERE id = $1
  AND deleted_at IS NULL
FOR UPDATE
```

Notes:

- This method should only be called inside an open transaction.
- It should return the same row shape as `getServiceReportById()`.
- It should not replace normal read methods for list/detail endpoints.
- If no row is found, existing not-found handling should remain.

### 2. First-transition Completion Update

Suggested method:

```text
completeServiceReportFirstTransition(reportId, data, client)
```

Behavior:

```sql
UPDATE field_service_reports
SET diagnosis_result = coalesce($2, diagnosis_result),
    repair_action = coalesce($3, repair_action),
    repair_result = coalesce($4, repair_result),
    service_status = 'completed',
    engineer_note = coalesce($5, engineer_note),
    customer_note = coalesce($6, customer_note),
    installation_checklist = coalesce($7, installation_checklist),
    onsite_started_at = coalesce($8, onsite_started_at),
    onsite_completed_at = $9,
    final_appointment_id = CASE WHEN $10 THEN $11 ELSE final_appointment_id END,
    updated_by = $12
WHERE id = $1
  AND deleted_at IS NULL
  AND service_status <> 'completed'
RETURNING *
```

Implementation notes:

- Use existing column names and mapper conventions.
- Keep `id DESC` / inference ordering unchanged; Task154 does not change appointment inference.
- Require explicit `onsite_completed_at` for completion instead of preserving null.
- Preserve the existing `finalAppointmentId` resolution rule:
  - supplied id accepted only before first completion and strictly validated,
  - omitted id can use existing report value or backend inference,
  - explicit `null` during completion is treated as omitted and must not clear existing value.
- If no row returns, treat it as an already-completed conflict and do not run side effects.

## Future Service Flow

Future `FieldServiceReportService.completeServiceReport()` should use this order:

1. Start transaction.
2. Read the report with `getServiceReportByIdForUpdate(reportId, client)`.
3. Check Case access.
4. If locked report is already `completed`, throw the existing conflict before inference or mutation.
5. Resolve / validate `finalAppointmentId` from:
   - request supplied id,
   - existing report `final_appointment_id`,
   - eligible completed appointments in the same Case,
   - legacy no-appointment allowance.
6. Call `completeServiceReportFirstTransition(reportId, completionData, client)`.
7. If the conditional update returns no row, throw the existing conflict before Case update, timeline, audit, survey intent, or outbox.
8. Update Case service summary.
9. Create exactly one completion timeline message.
10. Create exactly one `service_report.completed` audit record.
11. Future survey runtime, if enabled later, writes survey intent / outbox only after the report first-transition update and Case update succeed, and still inside the same transaction.
12. Commit transaction.
13. Return completed report DTO.

## Conflict Behavior

Future losing concurrent requests should use the same safe semantic family as Task109:

- status: conflict,
- message: service report is already completed or completion already processed,
- no sensitive data,
- no final appointment re-inference,
- no supplied `finalAppointmentId` override,
- no report update,
- no Case update,
- no timeline / audit / survey / outbox side effects.

Exact wording should follow the existing project error style when the runtime patch is implemented.

## Side-effect Boundary

The future implementation must gate all side effects on the successful returned first-transition row.

No side effect may run before the first-transition update is confirmed, except read-only validation.

Protected side effects:

- Case status / completion update,
- completion timeline message,
- `service_report.completed` audit record,
- future survey intent creation,
- future event outbox creation,
- future notification or delivery scheduling.

This preserves:

- report completed timestamp stability,
- Case completed timestamp stability,
- finalAppointmentId stability,
- one formal active Field Service Report per Case,
- no duplicate survey trigger on concurrent duplicate completion.

## Admin Frontend Contract

No Admin frontend change is planned for this hardening.

Admin remains expected to:

- omit `finalAppointmentId` from completion payload,
- avoid `finalAppointmentId: null` and `finalAppointmentId: undefined` keys,
- show final marker from response / refreshed report data,
- provide no manual picker,
- provide no manual override,
- show safe error handling for conflict responses.

## Existing Smoke Coverage To Preserve

Existing smoke coverage should remain passing when future runtime hardening is implemented:

- `smoke:028`
  - omitted `finalAppointmentId` backend inference,
  - deterministic latest completed visit selection,
  - no eligible completed visit rejection,
  - supplied same-case completed final appointment accepted before first completion,
  - cross-case and non-completed supplied final appointment rejected,
  - repeat completion rejected without mutating report / Case / final appointment,
  - repeat completion with a different supplied final appointment cannot override completed report.
- `smoke:029`
  - one-open-appointment guard remains intact.
- `smoke:071:browser`
  - Admin completion payload omits `finalAppointmentId`,
  - backend inference completion succeeds,
  - no eligible completed visit path shows safe UI error,
  - no manual picker appears.

## Future Test Plan For The Runtime Patch

Recommended minimum tests for the future implementation task:

1. Two concurrent completion requests for the same in-progress report: exactly one succeeds and one receives conflict.
2. The winning request sets report `onsite_completed_at`, Case `completed_at`, finalAppointmentId, timeline, and audit once.
3. The losing request does not update report, Case, timeline, audit, survey intent, or outbox.
4. Losing request with a different supplied `finalAppointmentId` cannot override the winner.
5. Backend-inferred final appointment remains stable after concurrent duplicate completion.
6. Repeat completion after commit still returns the Task109 conflict behavior.
7. No eligible completed visit still rejects before completion transition and side effects.
8. Existing `smoke:028`, `smoke:029`, and `smoke:071:browser` remain passing.
9. Future survey-runtime local/test mode writes at most one survey intent and one outbox row.
10. Feature flags disabled: no survey rows are written even when first transition succeeds.
11. Error responses contain no customer mobile, raw LINE user id, raw payload, token, password, secret, or database URL.

Concurrency tests should target local/test fixtures only. They should not run against shared Zeabur runtime unless a separate explicit non-destructive verification approval exists.

## Migration / Schema Decision

Task154 recommends no migration, no schema change, and no index change for first-transition hardening.

The planned row lock and conditional update use existing `field_service_reports` columns:

- `id`
- `deleted_at`
- `service_status`
- existing report payload columns
- `onsite_completed_at`
- `final_appointment_id`
- `updated_by`

Migration 020 remains paused and unrelated to this runtime hardening plan.

## Relationship To Migration 020 / Survey Runtime

This hardening should be treated as a prerequisite before future survey runtime writes.

It does not approve:

- Migration 020 local dry-run,
- Migration 020 apply,
- survey intent writes,
- event outbox writes,
- survey sending,
- LINE / APP / SMS / email delivery,
- runtime feature flags,
- shared DB verification.

Future survey runtime should only observe `firstTransitionSucceeded = true` after the completion-specific update returns a row and Case completion succeeds in the same transaction.

## Non-goals

Task154 does not:

- implement first-transition hardening,
- implement survey runtime,
- implement survey sending,
- implement notification delivery,
- change backend inference ordering,
- weaken supplied `finalAppointmentId` validation,
- add manual final appointment picker,
- add manual override endpoint,
- implement reverse LINE binding,
- implement survey response intake,
- implement AI automatic decision-making,
- expand inventory docs,
- touch shared runtime data.

## Recommended Next Task

If the user explicitly approves runtime hardening, the next implementation task can be:

`Task 155 - First-Transition Conditional Update Runtime Hardening / No Migration`

Suggested scope:

- add `getServiceReportByIdForUpdate()`,
- add `completeServiceReportFirstTransition()`,
- update `completeServiceReport()` to use locked read plus conditional update,
- add targeted concurrency coverage,
- run `npm run check`, `npm run admin:check`, `npm run smoke:028`, `npm run smoke:029`, and `npm run smoke:071:browser` if environment allows.

If runtime hardening is not explicitly approved, stay on docs-only product mainline planning.

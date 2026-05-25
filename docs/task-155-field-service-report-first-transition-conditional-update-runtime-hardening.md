# Task 155 - Field Service Report First-Transition Conditional Update Runtime Hardening

## Background

Task155 implements the runtime hardening planned in Task153 and Task154 for Field Service Report completion first-transition concurrency.

Task109 already rejected repeat completion after a completed report is visible. Task155 closes the remaining near-concurrent gap where two completion requests could both read an in-progress report before either committed.

This task does not add migration, schema, index, survey runtime, survey sending, Admin manual picker, or inventory-doc changes.

## What Changed

Backend completion now uses:

1. a locked report read,
2. an already-completed check while holding the row lock,
3. existing finalAppointmentId resolution / validation,
4. a completion-specific conditional first-transition update,
5. Case update / timeline / audit side effects only after the first-transition update returns a row.

## Repository Changes

Updated `src/repositories/FieldServiceReportRepository.js`.

Added:

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

Added:

```text
completeServiceReportFirstTransition(reportId, data, client)
```

The method updates `field_service_reports` only when the row is not already completed:

```sql
WHERE id = $1
  AND deleted_at IS NULL
  AND service_status <> 'completed'
```

If no row is returned, the service treats the request as a conflict and does not run Case update, timeline, audit, or future survey side effects.

## Service Flow Changes

Updated `src/services/FieldServiceReportService.js`.

Added:

```text
getReportOrThrowForUpdate(reportId, client)
```

`completeServiceReport()` now:

1. starts a transaction,
2. reads the report with `getReportOrThrowForUpdate()`,
3. checks Case access,
4. rejects already-completed reports before finalAppointmentId inference,
5. resolves / validates finalAppointmentId using the existing Task106 rules,
6. calls `completeServiceReportFirstTransition()`,
7. rejects if the conditional first-transition update returns no row,
8. updates Case service summary,
9. creates the completion timeline message,
10. records `service_report.completed` audit,
11. returns the completed report DTO.

## finalAppointmentId Behavior

Task155 preserves Task106 / Task107 / Task109 behavior:

- omitted `finalAppointmentId` is backend-inferred when eligible completed appointments exist,
- existing report `final_appointment_id` can be validated and reused,
- legacy no-appointment Case behavior is preserved,
- supplied same-Case completed finalAppointmentId remains accepted before first completion,
- cross-Case or non-completed finalAppointmentId remains rejected,
- completed report finalAppointmentId cannot be overwritten by repeat or concurrent losing requests,
- Admin Frontend still does not need to send `finalAppointmentId`.

## Losing Concurrent Request Behavior

With row lock plus conditional update:

- one request wins the first transition,
- losing requests observe the completed state after waiting on the locked row or fail the conditional update,
- losing requests receive safe conflict behavior,
- losing requests do not update report or Case,
- losing requests do not create duplicate timeline or audit records,
- losing requests cannot re-infer or override finalAppointmentId,
- future survey intent / event outbox writes must remain gated behind the same winning first-transition path.

## Side-effect Gating

The following side effects remain after the successful first-transition update:

- Case completion summary update,
- completion timeline message,
- `service_report.completed` audit record,
- future survey intent / outbox writes if a later task implements them.

This preserves:

- report `onsiteCompletedAt` stability,
- Case `completedAt` stability,
- finalAppointmentId stability,
- one formal Field Service Report per Case,
- no duplicate future survey trigger for repeat or concurrent duplicate completion.

## Smoke Coverage Added

Updated `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`.

Added coverage:

1. Create a Case with one completed appointment and one in-progress service report.
2. Send two near-concurrent completion PATCH requests for the same report.
3. Assert exactly one succeeds and one returns conflict.
4. Assert inferred finalAppointmentId is stable.
5. Assert report completed timestamp remains stable.
6. Assert Case is completed once.
7. Assert completion timeline message delta is exactly one.

Existing smoke coverage remains responsible for:

- omitted finalAppointmentId inference,
- deterministic latest completed visit selection,
- no eligible completed visit rejection,
- supplied same-Case completed finalAppointmentId compatibility,
- cross-Case and non-completed final appointment rejection,
- repeat completion conflict after commit,
- completed report cannot be reopened,
- repeat completion with different supplied finalAppointmentId cannot override.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

The hardening uses existing `field_service_reports` columns and PostgreSQL row-lock / conditional-update behavior.

Migration 020 remains paused and was not dry-run or applied.

## Survey Runtime Decision

No survey runtime was implemented.

No survey intent writes.

No event outbox writes.

No worker.

No delivery resolver.

No survey sending.

Task155 only protects the future first-transition boundary that survey runtime may later depend on.

## Admin Frontend Impact

No Admin frontend code change.

Admin completion contract remains:

- completion payload omits `finalAppointmentId`,
- final marker is response / refreshed-report driven,
- no manual final appointment picker,
- no manual override,
- safe conflict handling remains backend-driven.

## Non-goals

Task155 does not:

- add migration,
- change schema or indexes,
- apply Migration 020,
- run DB DDL,
- implement survey runtime,
- send survey,
- send LINE / APP / SMS / email,
- change finalAppointmentId inference ordering,
- weaken supplied finalAppointmentId validation,
- add Admin manual picker,
- implement reverse LINE binding,
- implement AI automatic decision-making,
- expand inventory docs,
- mutate shared runtime data.

## Verification Scope

Required verification:

- `npm run check`
- `node --check scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `npm run smoke:028`
- `npm run smoke:029`

Recommended when environment allows:

- `npm run admin:check`
- `node --check scripts/smoke/browser/071_multi_dispatch_browser_smoke.js`
- `npm run smoke:071:browser`
- `git diff --check`

No inventory verification, Migration 020 verification, shared DB live verification, or survey runtime test is required for Task155.

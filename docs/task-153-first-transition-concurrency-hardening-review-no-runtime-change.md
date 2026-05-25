# Task 153 - First-Transition Concurrency Hardening Review / No Runtime Change

## Background

Task153 follows Task152 and the PM review recommendation. Task109 hardened repeat completion after a report is already completed, but PM review identified a separate future risk: two near-simultaneous completion requests may both read the report before either one commits.

This review is documentation-only. It does not implement locking, conditional updates, survey runtime writes, Migration 020 dry-run/apply, or any DB schema change.

## No-runtime-change Statement

Task153 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify smoke or browser smoke scripts,
- edit Migration 020 SQL,
- add or apply migrations,
- execute DDL,
- connect to DB,
- run psql,
- run `npm run db:migrate`,
- change schema or indexes,
- implement row locks,
- implement conditional completion updates,
- implement survey repositories, services, feature flags, workers, delivery resolvers, response intake, or AI runtime,
- approve local dry-run, shared apply, runtime writes, survey sending, or historical backfill,
- modify Task087 inventory docs,
- mutate shared runtime data.

## Review Inputs

Reviewed:

- `src/services/FieldServiceReportService.js`
- `src/repositories/FieldServiceReportRepository.js`
- `src/repositories/CaseRepository.js`
- `src/db/transaction.js`
- `src/repositories/BaseRepository.js`
- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
- `docs/task-140-survey-runtime-transaction-boundary-recovery-model-no-runtime-change.md`
- `docs/task-143-survey-first-completion-service-contract-no-runtime-change.md`

## Current Completion Flow Summary

Current `FieldServiceReportService.completeServiceReport()` runs inside `withTransaction`.

Conceptual order:

1. Read service report with `getServiceReportById()`.
2. Check access to the Case.
3. If `existing.service_status === 'completed'`, reject with conflict.
4. Resolve / validate `finalAppointmentId`.
5. Set `completedAt`.
6. Update `field_service_reports` through `updateServiceReport()`.
7. Update `cases` service summary to completed.
8. Create completed timeline message.
9. Create `service_report.completed` audit record.
10. Return completed report DTO.

Task109 correctly prevents repeat completion after a committed completed state is visible.

## Concurrency Finding

Current code does not yet provide a strict first-transition concurrency guard.

Observed details:

- `getServiceReportById()` uses a plain `SELECT` and does not lock the report row.
- `updateServiceReport()` updates by `id` and `deleted_at IS NULL`; it does not include a condition such as `service_status <> 'completed'`.
- `withTransaction()` provides transaction boundaries, but it does not by itself prevent two transactions from both reading `in_progress` before either commits.
- `CaseRepository.updateServiceSummary()` uses `completed_at = coalesce($4, completed_at)`, but that only protects existing stored Case completion time from null writes. It does not prevent duplicate completion side effects.

Risk scenario:

1. Request A reads report as `in_progress`.
2. Request B reads the same report as `in_progress` before A commits.
3. Both pass the already-completed guard.
4. Both resolve / validate `finalAppointmentId`.
5. Both attempt completion update.
6. Without a conditional status guard, the later transaction can still update the already-completed row after waiting for the row lock.
7. Both may create timeline / audit side effects.
8. A future survey runtime could attempt duplicate survey intent / outbox writes or conflict on uniqueness.

This is not a current survey sending risk because survey runtime is not implemented, Migration 020 is not applied, and no survey writes occur. It is a blocker before future survey runtime integration.

## Desired First-Transition Contract

Future runtime should make completion first-transition explicit and deterministic:

- only one transaction may successfully transition a report from non-completed to completed,
- the transition result should expose a clear `firstTransition = true` signal,
- losing concurrent requests should fail closed as already completed / conflict,
- losing requests must not update report timestamps,
- losing requests must not update Case completion,
- losing requests must not create timeline / audit / survey intent / outbox side effects,
- losing requests must not re-infer or overwrite `finalAppointmentId`,
- future survey trigger must observe only the winning first transition.

## Future Implementation Options

### Option A - Row Lock Then Existing Update

Add a repository method such as:

```text
getServiceReportByIdForUpdate(reportId, client)
```

It would use:

```sql
SELECT *
FROM field_service_reports
WHERE id = $1
  AND deleted_at IS NULL
FOR UPDATE
```

Service flow:

1. Begin transaction.
2. Lock the report row with `FOR UPDATE`.
3. Re-check `service_status`.
4. Resolve / validate `finalAppointmentId`.
5. Update report / Case / timeline / audit / future survey writes.
6. Commit.

Pros:

- conceptually simple,
- makes finalAppointmentId inference run after the report row lock,
- preserves current update method shape with minimal change.

Cons:

- still depends on service code always using the lock method before completion,
- does not make the update statement self-protecting if another caller uses it incorrectly.

### Option B - Conditional First-transition Update

Add a repository method such as:

```text
completeServiceReportFirstTransition(reportId, data, client)
```

It would use a conditional update:

```sql
UPDATE field_service_reports
SET service_status = 'completed',
    onsite_completed_at = $2,
    final_appointment_id = CASE WHEN $3 THEN $4 ELSE final_appointment_id END,
    updated_by = $5
WHERE id = $1
  AND deleted_at IS NULL
  AND service_status <> 'completed'
RETURNING *
```

If no row returns, the service treats the request as already completed / conflict and stops before side effects.

Pros:

- database statement directly represents first-transition,
- losing concurrent requests naturally return no row,
- side effects can be gated on returned row.

Cons:

- finalAppointmentId inference may still happen before the update unless combined with a lock,
- existing generic `updateServiceReport()` remains unsafe for completion unless completion stops using it.

### Option C - Row Lock Plus Conditional Update

Use both:

1. lock the report row with `FOR UPDATE`,
2. re-check `service_status`,
3. resolve / validate `finalAppointmentId`,
4. call a completion-specific conditional update,
5. gate side effects on successful returned row.

Recommendation:

Use Option C for future runtime hardening if survey runtime writes will share the same transaction. It is slightly more explicit but gives the strongest service-layer and database-statement protection without requiring a schema migration.

For a lower-risk pre-survey runtime patch, Option B may be sufficient if completion uses only the new completion-specific repository method and tests cover concurrent duplicate requests.

## Future Survey Runtime Dependency

Before future survey writes are implemented, completion must expose a clear first-transition boundary.

Future `SurveyFirstCompletionService` should only run when:

- the report row was successfully transitioned by the current transaction,
- the completed report row has stable `finalAppointmentId`,
- Case completion update has succeeded,
- the same transaction will also write survey intent / outbox if enabled,
- no prior completed state was visible or observed after lock.

Repeat completion, losing concurrent completion, rejected no-eligible-visit completion, and failed transactions must not write survey intent or outbox rows.

## Case Completion Timestamp Stability

Current repeat-completion guard protects already completed requests after commit. Future concurrency hardening must also ensure:

- `field_service_reports.onsite_completed_at` is not overwritten by losing concurrent requests,
- `cases.completed_at` is not overwritten by losing concurrent requests,
- completion timeline messages are not duplicated,
- audit records are not duplicated for losing requests.

## Test Plan For Future Runtime Hardening

Recommended future tests:

1. Two concurrent completion requests for the same in-progress report: exactly one succeeds, one receives conflict.
2. Winning request sets `finalAppointmentId`, report completed timestamp, Case completed timestamp, timeline, and audit once.
3. Losing request does not update report, Case, timeline, audit, survey intent, or outbox.
4. Losing request with a different supplied `finalAppointmentId` cannot override the winning final appointment.
5. Backend-inferred final appointment remains stable after concurrent duplicate completion.
6. Repeat completion after commit still returns the Task109 conflict behavior.
7. No eligible completed visit still rejects before completion transition and side effects.
8. Future survey runtime enabled in local/test mode writes at most one survey intent and one outbox row.
9. Feature flags disabled: no survey rows are written even when first transition succeeds.
10. Error responses contain no sensitive data.

Concurrency smoke should be local/test only and should not target shared Zeabur runtime unless explicitly approved for non-destructive verification.

## Migration / Schema Decision

No migration is required for the recommended first-transition runtime hardening if implemented with row locks and/or conditional update.

Do not add a DB constraint or index in Task153. Any future DB-level constraint strategy should be a separate task with explicit migration approval.

## Current Decision

Task153 records first-transition concurrency hardening as a future runtime prerequisite before survey writes.

Current state remains:

- no code change,
- no migration change,
- no DB connection,
- no DDL,
- no survey runtime,
- no survey sending,
- Migration 020 paused,
- inventory docs frozen.

## Recommended Next Branch

After Task153, safe options:

1. Return to product mainline with Existing Case Reverse LINE Binding Product Design / No Runtime Change.
2. If the user explicitly wants to stay on completion hardening, prepare a future implementation task for first-transition conditional update / row-lock hardening, still without survey runtime.

Without explicit runtime approval, do not implement the hardening yet.

# Task 130 - Migration 020 Local-only Dry-run Planning / No Shared Apply

## Executive Summary

Task130 plans a possible local-only Migration 020 dry-run. It does not execute DDL, connect to DB, apply migration, or approve shared runtime apply.

This is documentation-only / planning-only:

- no migration apply,
- no DDL execution,
- no DB connection,
- no psql,
- no `npm run db:migrate`,
- no runtime behavior change,
- no API change,
- no Admin UI change,
- no smoke change,
- no survey sending,
- no LINE / APP / SMS / email push,
- no AI automatic decision,
- no inventory docs expansion.

## Source Review Summary

Reviewed:

- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `docs/task-129-migration-020-static-sql-re-review-no-apply.md`
- `docs/task-128-migration-020-static-sql-patch-no-apply.md`
- `docs/task-127-migration-020-static-sql-review-no-apply.md`
- `docs/task-126-survey-intent-event-outbox-migration-020-file-authoring-no-apply.md`
- `docs/task-125-survey-intent-event-outbox-migration-020-draft-ddl-convention-review.md`
- `docs/task-124-survey-intent-event-outbox-migration-020-file-authoring-plan-no-apply.md`
- `docs/task-123-survey-migration-020-policy-atomicity-retention-gate-closure-review.md`
- `docs/task-122-survey-intent-event-outbox-migration-020-draft-ddl-risk-review.md`
- `docs/task-121-survey-intent-event-outbox-migration-020-proposal-review.md`
- `package.json`
- `src/db/migrate.js`
- migrations 001-019 convention samples

Static command review:

- `npm run check` runs backend JavaScript syntax checks only.
- `npm run admin:check` runs Admin TypeScript checks only.
- `npm run db:migrate` runs `node src/db/migrate.js`.
- `src/db/migrate.js` requires `DATABASE_URL`, connects to the target database, ensures `schema_migrations`, and applies all unapplied migration files in order.

Therefore any actual dry-run execution must be a separate task with explicit local/disposable DB confirmation. Task130 does not execute that command.

## No-apply / No-DDL Statement

Task130 did not:

- run `npm run db:migrate`,
- run psql,
- connect to a DB,
- execute DDL,
- apply Migration 020,
- alter actual schema or indexes in any environment.

Any future dry-run must be explicitly scoped to a disposable local/test DB and must never target shared Zeabur runtime or production.

## Local-only Dry-run Safety Policy

Future local-only dry-run may proceed only when all of the following are true:

1. Target DB is explicitly local or disposable test.
2. Target DB is not shared Zeabur runtime.
3. Target DB is not production.
4. `DATABASE_URL` exists but its value is never printed.
5. Environment identity can be summarized safely without revealing credentials.
6. Dry-run command fails closed if the target cannot be proven local/disposable.
7. No broad cleanup is used.
8. No shared runtime data is deleted, updated, unlinked, disabled, or mutated.
9. Survey sending remains disabled.
10. Outbox worker remains disabled.
11. Delivery resolver remains disabled.
12. Runtime writes to survey tables remain disabled.
13. Historical backfill remains disabled.
14. Dry-run success does not approve shared apply.
15. Dry-run success does not approve runtime writes or survey delivery.

## Environment Guard Proposal

Future Task131 should require an explicit guard checklist before any DDL execution:

| Guard | Required answer | Safe reporting rule |
| --- | --- | --- |
| Runtime target | local or disposable test only | Report category only. |
| Shared runtime | confirmed not shared Zeabur | Do not print connection value. |
| Production | confirmed not production | Do not print connection value. |
| Explicit opt-in | `ALLOW_LOCAL_MIGRATION_DRY_RUN=1` or equivalent | Report env var name only. |
| DB URL presence | exists | Do not print value. |
| DB host/name summary | masked local/disposable summary only | Mask anything uncertain. |
| Current migration state | 001-019 applied before 020 | Safe count/version summary only. |
| DB data | no real customer data | No row samples. |
| Outbound credentials | not required and not used | Do not print values. |
| Outbox worker | not running | Process summary only if safe. |
| Delivery resolver | not running | Process summary only if safe. |
| Backend runtime writes | disabled for survey tables | Config names only, no secrets. |
| Teardown | local-only/disposable only | Never shared destructive cleanup. |

If any guard is unknown, future dry-run must be skipped and reported as blocked.

## Draft Command Plan

The following is a planning artifact only.

```text
DRAFT COMMANDS ONLY
DO NOT EXECUTE IN TASK130
LOCAL/DISPOSABLE TEST DB ONLY
DO NOT USE SHARED ZEABUR RUNTIME
DO NOT PRINT DATABASE_URL
```

Possible future Task131 flow:

1. Confirm local/disposable environment with explicit opt-in flag.
2. Confirm `DATABASE_URL` exists without printing it.
3. Confirm the migration runner target is not shared Zeabur or production.
4. Confirm no backend runtime, outbox worker, delivery resolver, or outbound sender is running against the target.
5. Option A: apply migrations 001-020 to an empty disposable DB.
6. Option B: apply Migration 020 on top of a disposable DB already at migrations 001-019.
7. Inspect schema objects only.
8. Confirm no survey rows and no outbox rows were inserted by the migration.
9. Report schema-only safe summary.
10. Teardown disposable DB or preserve it only for local debugging.

Future command examples must remain in the future dry-run task and must include no secret values. Task130 intentionally does not include executable command lines that touch DB.

Open command question:

- The current migration runner applies all unapplied migrations in order and has no built-in status-only or apply-through-version command. Future dry-run may need either a prepared disposable DB state or a guarded local wrapper script, but Task130 does not implement one.

## Schema Verification Checklist

Future local-only dry-run should verify the following schema objects.

### `survey_intents`

- table exists,
- required columns exist,
- `final_appointment_id` is nullable,
- `trigger_event_type` default is `case.service_completion.first_transitioned`,
- `trigger_event_type` CHECK allows only canonical event name,
- old event name is absent,
- `intent_status` CHECK values match Migration 020,
- `policy_status` CHECK values match Migration 020,
- `safe_context_summary` JSONB object check exists,
- unique organization + idempotency key exists,
- unique organization + case + service report exists,
- no `deleted_at`,
- no `ON DELETE CASCADE`,
- expected indexes exist,
- updated-at trigger exists.

### `event_outbox`

- table exists,
- required columns exist,
- `event_type` default is `case.service_completion.first_transitioned`,
- `event_type` CHECK allows only canonical event name,
- `aggregate_type` CHECK allows only `case`,
- `payload` JSONB object check exists,
- status CHECK values match Migration 020,
- lock fields exist,
- attempt fields exist,
- `last_error` is bounded,
- unique organization + event type + idempotency key exists,
- ready / aggregate / lock / survey intent / processed indexes exist,
- no provider delivery result fields,
- no raw contact/channel/provider fields,
- no `ON DELETE CASCADE`,
- updated-at trigger exists.

### Global

- Migration 020 is recorded only in disposable DB migration bookkeeping.
- No application data rows are inserted by Migration 020.
- No `survey_intents` rows are inserted.
- No `event_outbox` rows are inserted.
- No historical backfill occurs.
- No outbound sending occurs.
- No runtime process is touched.

## Rollback / Teardown Plan

Local / disposable DB only:

- drop the disposable database,
- reset the local test database,
- rerun migrations from scratch,
- discard a local-only DB container or volume if explicitly local and disposable,
- preserve local DB only for short-lived debugging if needed.

Shared Zeabur / production:

- no destructive rollback,
- no table drop without an explicit later task,
- no row deletion cleanup,
- no `survey_intents` or `event_outbox` deletion,
- prefer feature flag disable / forward-fix,
- migration apply to shared remains blocked.

This local teardown policy must not become precedent for shared runtime cleanup.

## Pass / Fail Criteria

Pass criteria for a future local-only dry-run:

1. Migration applies in disposable local/test DB only.
2. Required tables exist.
3. Required constraints and indexes exist.
4. Canonical event name is present.
5. Old event name is absent.
6. No `ON DELETE CASCADE` is present in Migration 020 objects.
7. No forbidden schema fields are present.
8. No survey rows are inserted.
9. No outbox rows are inserted.
10. No historical backfill occurs.
11. No runtime writes occur.
12. No sending occurs.
13. No sensitive output is printed.
14. Teardown succeeds, or disposable DB is preserved only for local debugging.

Fail criteria:

1. Migration attempts to touch shared or production DB.
2. Migration command cannot prove local/disposable target.
3. DDL error occurs.
4. Required table, constraint, index, or trigger is missing.
5. Old event name remains in live schema.
6. `ON DELETE CASCADE` appears in Migration 020 objects.
7. Forbidden schema field appears.
8. Migration inserts data rows unexpectedly.
9. Any outbound sending attempt occurs.
10. Any sensitive output is printed.
11. Any runtime/API/Admin/smoke change becomes required to run the dry-run.

## Remaining Blockers Before Actual Dry-run Execution

Before Task131 can execute any local-only DDL, it must close these blockers:

1. Exact local/disposable DB setup.
2. Exact migration runner command.
3. Whether the runner should apply all migrations or only Migration 020 on top of 001-019.
4. Whether the runner can report status without connecting to shared DB.
5. How migration versions are recorded and inspected safely.
6. How schema inspection will avoid printing sensitive values.
7. How target summary will mask connection details.
8. How to prove the target is not shared Zeabur.
9. How to prove the target is not production.
10. How to guarantee no real customer data exists.
11. Whether `gen_random_uuid()` dependency exists after baseline migrations.
12. Whether all referenced tables exist before 020 in local dry-run order.
13. Whether a temporary wrapper is needed for fail-closed local target validation.
14. Whether the user wants Task131 to execute local-only dry-run or remain guard closure.

## Final Recommendation

Task130 recommendation:

- Ready for Task131 local-only dry-run execution / no shared apply only if the user explicitly approves a disposable local/test DB target and guard strategy.
- If target proof or teardown policy remains unclear, Task131 should instead be Local-only Dry-run Guard Closure / No Apply.

Migration 020 remains not approved for shared apply, runtime writes, survey sending, delivery resolver, outbox worker, Admin UI, or historical backfill.

## Non-goals

Task130 does not:

- modify the migration file,
- add another migration,
- apply migration,
- execute DDL,
- connect to DB,
- run psql or `npm run db:migrate`,
- modify actual schema/indexes,
- modify runtime/API/Admin/smoke,
- add survey sending,
- add notification sending,
- add LINE / APP push,
- add AI runtime,
- change repeat completion guard,
- change `finalAppointmentId` inference,
- make survey appointment-level,
- expand inventory docs,
- perform destructive cleanup.

## Verification Summary

Recommended verification:

- `npm run check`,
- `npm run admin:check`,
- `git diff --check`,
- static command safety scan,
- static sensitive scan,
- static no-apply wording scan.

No smoke, migration apply, psql, shared DB verification, inventory verification, Admin UI tests, or runtime tests are required for Task130.

## Next Task Recommendation

Task 131 - Migration 020 Local-only Dry-run Guard Closure / No Apply, unless the user explicitly approves a disposable local/test DB target for actual dry-run execution.

Task131 should not touch shared runtime. It should either close the remaining guard questions or, with explicit target approval, execute a schema-only local dry-run and report safe summary only.

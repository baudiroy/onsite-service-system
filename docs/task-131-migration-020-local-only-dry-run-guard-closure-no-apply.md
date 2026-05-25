# Task 131 - Migration 020 Local-only Dry-run Guard Closure / No Apply

## Executive Summary

Task131 closes local-only dry-run guards. It does not execute DDL, connect to DB, apply migration, or approve shared runtime apply.

This task exists because the user asked to continue tasks, but did not explicitly approve a disposable local/test DB target or any DDL execution. Therefore Task131 remains documentation-only / guard-closure-only.

No migration apply, DDL execution, DB connection, psql, `npm run db:migrate`, runtime change, API change, Admin UI change, smoke change, survey sending, LINE / APP push, AI runtime, destructive cleanup, or inventory docs expansion was performed.

## Source Review Summary

Reviewed:

- `docs/task-130-migration-020-local-only-dry-run-planning-no-shared-apply.md`
- `docs/task-129-migration-020-static-sql-re-review-no-apply.md`
- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `package.json`
- `src/db/migrate.js`
- `docs/task-126-survey-intent-event-outbox-migration-020-file-authoring-no-apply.md`
- `docs/task-125-survey-intent-event-outbox-migration-020-draft-ddl-convention-review.md`
- `docs/task-124-survey-intent-event-outbox-migration-020-file-authoring-plan-no-apply.md`
- `docs/task-123-survey-migration-020-policy-atomicity-retention-gate-closure-review.md`
- `docs/task-122-survey-intent-event-outbox-migration-020-draft-ddl-risk-review.md`
- `docs/task-121-survey-intent-event-outbox-migration-020-proposal-review.md`

Important command facts:

- `npm run check` does not apply migrations.
- `npm run admin:check` does not apply migrations.
- `npm run db:migrate` is separate and must not be executed in Task131.
- The migration runner connects to `DATABASE_URL` and applies all unapplied migrations in order.

## No-apply / No-DDL Statement

Task131 did not:

- run `npm run db:migrate`,
- run psql,
- connect to a DB,
- execute DDL,
- apply Migration 020,
- alter actual schema or indexes in any environment.

## Authorization Gate Review

Current authorization status:

| Authorization item | Current status | Conclusion |
| --- | --- | --- |
| Continue tasks | User approved continuing tasks. | Enough for docs-only work. |
| DDL execution | Not explicitly approved. | Blocks dry-run execution. |
| Disposable local/test DB target | Not provided. | Blocks dry-run execution. |
| Running `npm run db:migrate` | Not explicitly approved. | Blocks dry-run execution. |
| Shared Zeabur exclusion proof | Not provided for a DB target. | Blocks dry-run execution. |
| Production exclusion proof | Not provided for a DB target. | Blocks dry-run execution. |

Therefore Task131 must remain no-apply / no-DDL.

Future dry-run execution requires explicit approval that states:

- a disposable local/test DB target exists,
- shared Zeabur is not the target,
- production is not the target,
- DDL execution against the disposable DB is allowed,
- `DATABASE_URL` value must never be printed,
- runtime writes and survey sending remain disabled.

## Hard Guard Checklist

All of these hard gates must be closed before any future local-only dry-run execution:

1. Explicit user approval for local/disposable DDL execution.
2. Explicit local/disposable DB target.
3. Confirmation target is not shared Zeabur.
4. Confirmation target is not production.
5. `DATABASE_URL` exists but value is never printed.
6. Safe masked target summary only, if any.
7. Current DB has no real customer data.
8. Current DB is resettable / disposable.
9. Migration runner command is known.
10. Migration runner does not trigger runtime writes.
11. No outbox worker is running.
12. No delivery resolver is running.
13. No backend runtime path is writing survey tables.
14. No survey sending is enabled.
15. No LINE / APP / SMS / email provider credentials are required.
16. No historical backfill is enabled.
17. No Admin/API/smoke changes are required.
18. Teardown plan is local-only.
19. Failure abort conditions are defined.
20. Safe output format is defined.

## Fail-closed Rules

Future dry-run must abort immediately if:

1. Target cannot be proven local/disposable.
2. Target appears to be shared Zeabur.
3. Target appears production-like.
4. `DATABASE_URL` is missing.
5. `DATABASE_URL` would need to be printed to verify.
6. Migration runner behavior is unclear.
7. `db:migrate` would apply more than intended without visibility.
8. Current migration state cannot be confirmed safely.
9. DB contains real customer data.
10. Outbound provider credentials are active and could be used.
11. Any outbox worker, resolver, or notification sender is running.
12. Any command would print sensitive values.
13. Any command would touch shared runtime.
14. Any command would require destructive cleanup to undo.

## Environment Proof Design

Acceptable non-sensitive proof:

- DB target type: local / disposable test / CI ephemeral.
- Host summary: localhost / docker service / masked test host.
- DB name summary: masked, with local/test indicator if safe.
- Runtime marker: `LOCAL_MIGRATION_DRY_RUN=1`.
- Explicit flag: `ALLOW_LOCAL_MIGRATION_DRY_RUN=1`.
- Confirmation shared runtime flags are absent.
- Confirmation production flags are absent.

Not acceptable:

- printing full `DATABASE_URL`,
- printing password,
- printing token,
- printing customer data,
- printing raw LINE user id,
- printing full payload,
- using shared Zeabur target.

## Future Task132 Command Guard Proposal

The following is a planning artifact only.

```text
DRAFT ONLY
DO NOT EXECUTE IN TASK131
LOCAL/DISPOSABLE ONLY
DO NOT USE SHARED ZEABUR
DO NOT PRINT DATABASE_URL
```

Future Task132 preflight sequence, if explicitly approved:

1. Confirm explicit DDL dry-run approval is recorded.
2. Confirm local/disposable target marker.
3. Confirm `db:migrate` command behavior.
4. Confirm current migration state in disposable DB.
5. Apply migrations 001-020 to empty disposable DB, or apply 020 on top of disposable 001-019.
6. Inspect schema only.
7. Record safe summary.
8. Stop without runtime writes.
9. Teardown local DB or preserve disposable DB for debugging only.

Task131 does not execute any DB-touching command.

## Future Dry-run Safe Output Template

```text
Task XXX local-only migration dry-run complete.

Scope:
- Target: local / disposable test only
- Shared Zeabur: not used
- Production: not used
- DATABASE_URL: not printed
- Migration: 020
- DDL executed: yes/no depending future task
- Runtime writes: no
- Survey sending: no
- Outbox worker: not running
- Resolver: not running
- Historical backfill: no

Schema summary:
- survey_intents table: created / not created
- event_outbox table: created / not created
- canonical event name: present / not present
- old event name: absent / present
- ON DELETE CASCADE: absent / present
- forbidden fields: absent / present

Safety:
- no customer mobile printed
- no raw LINE user id printed
- no credentials printed
- no full payload printed

Note:
- Local dry-run success does not approve shared apply.
- Local dry-run success does not approve runtime writes.
- Local dry-run success does not approve survey sending.
```

## Task132 Decision Matrix

| Gate | Current status | Required evidence | Can proceed to execution? | Blocking if unresolved? | Notes |
| --- | --- | --- | --- | --- | --- |
| Explicit user DDL approval | Not present | User approval for disposable local/test DDL | No | Yes | Continue docs-only if absent. |
| Disposable local/test DB | Not provided | Target category and masked proof | No | Yes | No DB value should be printed. |
| No shared Zeabur | Not proven for a target | Safe target proof | No | Yes | Shared runtime apply remains blocked. |
| No production | Not proven for a target | Safe target proof | No | Yes | Production-like targets abort. |
| DB target proof without leaking URL | Not available | Masked target summary | No | Yes | Never print full connection string. |
| Migration runner known | Reviewed | `src/db/migrate.js` behavior documented | Yes | No | It applies all unapplied migrations. |
| Current migration state check | Not available without DB | Safe schema_migrations summary | No | Yes | Future task must avoid shared DB. |
| No outbound worker | Not proven | Process/config summary | No | Yes | Must be off for dry-run. |
| No resolver | Not proven | Process/config summary | No | Yes | Must be off for dry-run. |
| No runtime writes | Not proven | Config/process summary | No | Yes | Completion runtime must not write survey rows. |
| No historical backfill | Planned no | Static and runtime confirmation | Not yet | Yes | Migration itself inserts no rows. |
| Teardown plan | Planned | Local-only teardown steps | Partial | Yes | Must not imply shared cleanup. |
| Safe output template | Defined | Template in this note | Yes | No | Use for future dry-run handoff. |

## Remaining Blockers

Before actual local-only dry-run execution:

1. Explicit user approval for local/disposable DDL execution.
2. Exact disposable DB target.
3. Masked target proof without printing `DATABASE_URL`.
4. Proof target is not shared Zeabur.
5. Proof target is not production.
6. Safe current migration state inspection method.
7. Confirmation no real customer data exists.
8. Confirmation no outbox worker / resolver / sender is running.
9. Confirmation no runtime writes to survey tables are enabled.
10. Final local-only teardown plan.

## Final Recommendation

Task132 may execute local-only dry-run only after explicit user approval and guard evidence.

If those approvals and proofs are still absent, Task132 should remain no-apply guard closure / preflight checklist finalization.

## Non-goals

Task131 does not:

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

No smoke, migration apply, psql, shared DB verification, inventory verification, Admin UI tests, or runtime tests are required for Task131.

## Next Task Recommendation

Task 132 - Migration 020 Local-only Dry-run Preflight Checklist Finalization / No Apply, unless the user explicitly approves a disposable local/test DB and DDL dry-run.

Without explicit approval, Task132 should keep closing preflight details and should not execute DDL.

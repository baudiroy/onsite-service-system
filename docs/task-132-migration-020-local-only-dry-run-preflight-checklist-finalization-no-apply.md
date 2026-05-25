# Task 132 - Migration 020 Local-only Dry-run Preflight Checklist Finalization / No Apply

## Executive Summary

Task132 finalizes preflight for a possible local-only Migration 020 dry-run. It does not execute DDL, connect to DB, apply migration, or approve shared runtime apply.

The user has requested continuing tasks, but has not explicitly approved DDL execution and has not provided a disposable local/test DB target. Therefore Task132 remains documentation-only / preflight-finalization-only.

No migration file edit, migration apply, DDL execution, DB connection, psql, `npm run db:migrate`, runtime change, API change, Admin UI change, smoke change, survey sending, LINE / APP push, AI runtime, destructive cleanup, or inventory docs expansion was performed.

## Source Review Summary

Reviewed:

- `docs/task-131-migration-020-local-only-dry-run-guard-closure-no-apply.md`
- `docs/task-130-migration-020-local-only-dry-run-planning-no-shared-apply.md`
- `docs/task-129-migration-020-static-sql-re-review-no-apply.md`
- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `package.json`
- `src/db/migrate.js`

Supporting references:

- `docs/task-128-migration-020-static-sql-patch-no-apply.md`
- `docs/task-127-migration-020-static-sql-review-no-apply.md`
- `docs/task-126-survey-intent-event-outbox-migration-020-file-authoring-no-apply.md`
- `docs/task-125-survey-intent-event-outbox-migration-020-draft-ddl-convention-review.md`
- `docs/task-124-survey-intent-event-outbox-migration-020-file-authoring-plan-no-apply.md`
- `docs/task-123-survey-migration-020-policy-atomicity-retention-gate-closure-review.md`
- `docs/task-122-survey-intent-event-outbox-migration-020-draft-ddl-risk-review.md`
- `docs/task-121-survey-intent-event-outbox-migration-020-proposal-review.md`

Command safety summary:

- `npm run check` does not apply migrations.
- `npm run admin:check` does not apply migrations.
- `npm run db:migrate` is the migration apply command and is not executed in Task132.

## No-apply / No-DDL / No-DB Statement

Task132 did not:

- run `npm run db:migrate`,
- run psql,
- connect to a DB,
- execute DDL,
- apply Migration 020,
- alter actual schema or indexes in any environment.

## Final Preflight Checklist

### 1. Authorization Preflight

- User explicitly approved local-only DDL execution.
- User explicitly confirmed disposable local/test DB target.
- User explicitly confirmed shared Zeabur is not target.
- User explicitly confirmed production is not target.
- User explicitly approved running migration command against disposable DB only.
- User explicitly confirmed `DATABASE_URL` value must not be printed.
- User explicitly confirmed local dry-run success does not approve shared apply.
- User explicitly confirmed local dry-run success does not approve runtime writes.
- User explicitly confirmed local dry-run success does not approve survey sending.

### 2. Target Environment Preflight

- Target is local / disposable test / CI ephemeral.
- Target is not shared Zeabur.
- Target is not production.
- Target has no real customer data.
- Target can be reset / discarded.
- Target does not require destructive shared cleanup.
- Target does not include live outbound provider credentials.
- Target does not run backend service with survey write path.
- Target does not run outbox worker.
- Target does not run delivery resolver.
- Target does not run notification sender.

### 3. Connection Safety Preflight

- `DATABASE_URL` exists.
- `DATABASE_URL` value is never printed.
- Only masked target summary may be reported.
- No password / token / secret is printed.
- No customer mobile is printed.
- No raw LINE user id is printed.
- No full payload is printed.
- Any command that would print env values must not be run.
- Any command requiring full `DATABASE_URL` disclosure must fail closed.

### 4. Migration Runner Preflight

- `npm run db:migrate` is the only migration apply command.
- `npm run db:migrate` is not executed in Task132.
- Future Task133 must confirm migration runner target before running.
- Future Task133 must confirm current disposable DB migration state.
- Future Task133 must confirm migrations 001-019 can be applied safely in disposable DB.
- Future Task133 must confirm Migration 020 apply does not require runtime/API/Admin changes.
- Future Task133 must confirm migration does not seed data.
- Future Task133 must confirm migration does not enable sending.
- Future Task133 must confirm migration does not backfill historical cases.

### 5. Runtime Isolation Preflight

- Backend runtime writes disabled or not running.
- Outbox worker not running.
- Delivery resolver not running.
- Notification sender not running.
- LINE / APP / SMS / email sending not running.
- Admin UI not required.
- Smoke scripts not required.
- Survey response intake not running.
- AI runtime not running.
- No feature flag enables survey runtime writes.

### 6. Schema Verification Preflight

Future dry-run verification must be schema-only:

- Check `survey_intents` table exists.
- Check `event_outbox` table exists.
- Check canonical event name exists.
- Check old event name absent.
- Check no `ON DELETE CASCADE`.
- Check no forbidden schema fields.
- Check required unique constraints.
- Check required indexes.
- Check updated-at triggers.
- Check no survey rows inserted.
- Check no outbox rows inserted.
- Check no historical backfill.
- Check no provider delivery fields.

### 7. Teardown / Rollback Preflight

- Local/disposable teardown plan exists.
- Disposable DB can be dropped / reset locally.
- No shared runtime cleanup.
- No destructive rollback on shared Zeabur.
- No deletion of shared `survey_intents` / `event_outbox` rows.
- No unlink / disable / delete / update in shared runtime.
- If local dry-run fails, local DB can be discarded safely.
- Future shared apply rollback must be a separate task and forward-fix is preferred.

## Fail-closed Checklist

Future dry-run must abort if any of the following is true:

1. No explicit user approval for DDL execution.
2. No explicit disposable local/test DB target.
3. Target cannot be proven local/disposable.
4. Target may be shared Zeabur.
5. Target may be production.
6. `DATABASE_URL` would need to be printed.
7. `DATABASE_URL` is missing.
8. Migration runner behavior is unclear.
9. Current migration state cannot be safely verified.
10. DB may contain real customer data.
11. Outbound provider credentials may be active.
12. Backend runtime write path may be active.
13. Outbox worker may be running.
14. Delivery resolver may be running.
15. Notification sender may be running.
16. Any command would touch shared runtime.
17. Any command would require destructive cleanup to undo.
18. Any command would print sensitive values.
19. Any command would modify runtime/API/Admin/smoke.
20. Any command would send survey / LINE / APP / SMS / email.

## Approval Packet Template

The following is a future user approval packet template. It must not include a real `DATABASE_URL`.

```text
Migration 020 Local-only Dry-run Approval Packet

Required confirmations:
- I approve local-only DDL execution for Migration 020.
- Target DB is disposable local/test only.
- Target DB is not shared Zeabur.
- Target DB is not production.
- DATABASE_URL value must not be printed.
- Dry-run may run migration apply only against this disposable DB.
- Dry-run must not enable runtime writes.
- Dry-run must not start outbox worker/resolver.
- Dry-run must not send survey or provider messages.
- Dry-run success does not approve shared apply.
- Dry-run success does not approve runtime writes.
- Dry-run success does not approve survey sending.

Safe target summary:
- Target type: local / disposable test / CI ephemeral
- Host summary: masked
- DB name summary: masked
- Current migration baseline: 019 or fresh empty
- Teardown plan: drop/reset disposable DB only
```

## Future Task133 Command Packet

The following is a planning artifact only.

```text
DRAFT ONLY
DO NOT EXECUTE IN TASK132
EXECUTE ONLY AFTER EXPLICIT USER APPROVAL
LOCAL/DISPOSABLE ONLY
DO NOT USE SHARED ZEABUR
DO NOT PRINT DATABASE_URL
```

Sections for a future Task133 command packet:

1. Preflight confirm approval.
2. Preflight confirm local/disposable target.
3. Preflight confirm no shared/prod target.
4. Migration apply command placeholder.
5. Schema inspection command placeholder.
6. Safe summary output.
7. Local teardown command placeholder.
8. Abort conditions.

No actual `DATABASE_URL`, secret, customer data, or DB-touching command is included in Task132.

## Safe Output Template

```text
Task XXX local-only migration dry-run complete.

Scope:
- Target type: local/disposable only
- Shared Zeabur used: no
- Production used: no
- DATABASE_URL printed: no
- Migration applied: yes/no depending future task
- DDL executed: yes/no depending future task
- Runtime writes: no
- Outbox worker: no
- Resolver: no
- Survey sending: no
- Historical backfill: no

Schema summary:
- survey_intents: schema-only result
- event_outbox: schema-only result
- canonical event name: present / not present
- old event name: absent / present
- ON DELETE CASCADE: absent / present
- forbidden fields: absent / present

Safety:
- Sensitive output: none

Note:
- Local dry-run success does not approve shared apply.
- Local dry-run success does not approve runtime writes.
- Local dry-run success does not approve survey sending.
```

## Task133 Decision Matrix

| Gate | Required evidence | Status in Task132 | Must be satisfied before Task133 execution? | Fail-closed if missing? | Notes |
| --- | --- | --- | --- | --- | --- |
| Explicit DDL approval | User approval text | Missing | Yes | Yes | Task132 cannot execute. |
| Disposable local/test DB | Safe target proof | Missing | Yes | Yes | Must not be shared runtime. |
| No shared Zeabur | Safe target proof | Missing | Yes | Yes | Shared apply remains blocked. |
| No production | Safe target proof | Missing | Yes | Yes | Production-like target aborts. |
| Masked `DATABASE_URL` policy | Approval and process rule | Defined | Yes | Yes | Value must not be printed. |
| Migration runner known | `src/db/migrate.js` review | Known | Yes | Yes | Applies all unapplied migrations. |
| Current migration baseline | Safe schema_migrations summary | Missing | Yes | Yes | Requires DB access in future task. |
| No real customer data | Target evidence | Missing | Yes | Yes | Disposable DB only. |
| No outbound credentials | Config/process summary | Missing | Yes | Yes | Provider sending remains off. |
| No runtime writes | Config/process summary | Missing | Yes | Yes | Survey runtime is not enabled. |
| No outbox worker | Process/config summary | Missing | Yes | Yes | Worker must not run. |
| No resolver | Process/config summary | Missing | Yes | Yes | Resolver must not run. |
| No sending | Process/config summary | Missing | Yes | Yes | No LINE / APP / SMS / email send. |
| No historical backfill | Static and runtime confirmation | Static yes; runtime missing | Yes | Yes | Migration itself inserts no rows. |
| Local teardown plan | Local-only reset/drop plan | Drafted | Yes | Yes | No shared cleanup precedent. |
| Safe output template | Template in this note | Defined | Yes | Yes | Schema-only summary. |
| Sensitive scan | No actual secrets in docs | Required per task | Yes | Yes | No raw values. |

## Remaining Blockers

Before actual local-only dry-run execution:

1. User must explicitly approve local/disposable DDL execution.
2. User must provide or confirm disposable local/test DB target.
3. Target must be proven not shared Zeabur.
4. Target must be proven not production.
5. Safe current migration baseline inspection must be possible.
6. No real customer data must be present.
7. Runtime writes, outbox worker, resolver, notification sender, and provider sending must be off.
8. Local-only teardown plan must be confirmed.

## Final Recommendation

Task133 may execute local-only dry-run only after explicit user approval and disposable DB evidence.

If those approvals and proofs remain absent, Task133 should be Migration 020 Local-only Dry-run Authorization Handoff / No Apply.

## Non-goals

Task132 does not:

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

No smoke, migration apply, psql, shared DB verification, inventory verification, Admin UI tests, or runtime tests are required for Task132.

## Next Task Recommendation

Task 133 - Migration 020 Local-only Dry-run Authorization Handoff / No Apply.

Because explicit DDL approval and disposable DB evidence are still absent, Task133 should prepare a user-facing authorization request and should not execute DDL.

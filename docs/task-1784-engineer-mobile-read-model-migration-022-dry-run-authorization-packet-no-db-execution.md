# Task1784 - Engineer Mobile Read-Model Migration 022 Dry-Run Authorization Packet / No DB Execution

Status: completed locally / authorization packet only / no source runtime change / no migration change / no DB execution.

## Scope

Task1784 prepares a strict authorization packet for a future disposable local/test DB dry-run of:

- `migrations/022_create_engineer_mobile_read_model.sql`

This task does not authorize execution. It only records the checklist, approval phrase elements, stop conditions, and static guard needed before a separate future dry-run task can be considered.

Modified files:

- `tests/engineerMobile/engineerMobileReadModelMigration022DryRunAuthorization.static.test.js`
- `docs/task-1784-engineer-mobile-read-model-migration-022-dry-run-authorization-packet-no-db-execution.md`

Runtime/source files changed: none.

Migration files changed: none.

Files inspected read-only:

- `migrations/022_create_engineer_mobile_read_model.sql`
- `docs/task-1782-engineer-mobile-read-model-migration-022-static-readiness-guard-no-db-no-apply.md`
- `docs/task-1778-engineer-mobile-read-model-path-decision-guard-no-db-no-migration.md`

## Current Task Boundary

No DB execution is authorized by Task1784.

No migration dry-run is authorized by Task1784.

No migration apply is authorized by Task1784.

No real DB connection is authorized by Task1784.

No SQL execution, `psql`, `db:migrate`, DDL, schema/index change, or shared runtime smoke is authorized by Task1784.

Migration 022 is not assumed applied anywhere.

## Future Dry-Run Authorization Requirements

A future dry-run may proceed only if every condition below is explicitly true in that future task:

1. The target is a disposable local/test DB only.
2. The target is not shared, staging, production, Zeabur, or any persistent customer/org data DB.
3. DB URL / credentials must never be printed, pasted into chat, written to docs, committed, or logged.
4. The migration target is exactly `migrations/022_create_engineer_mobile_read_model.sql`.
5. Runtime writes remain disabled.
6. Provider sending remains disabled.
7. No smoke test against shared runtime is included.
8. No migration apply to shared, staging, production, Zeabur, or any persistent customer/org data DB is included.
9. Future dry-run command examples must be placeholder-only and must not contain real credentials or DB URLs.
10. One Case / one formal FSR boundary remains untouched.
11. `finalAppointmentId` remains system-owned/admin override only.

Generic approval phrases are insufficient. The future approval must explicitly name all of these elements:

- disposable DB
- migration 022
- dry-run allowed
- no credential printing

## Stop Conditions

Stop before any DB-adjacent command if any condition below is true:

- explicit approval is missing
- approval does not name disposable DB
- approval does not name migration 022
- approval does not say dry-run allowed
- approval does not forbid credential printing
- `DATABASE_URL` points to shared, staging, production, Zeabur, or any persistent customer/org data DB
- a DB URL, password, token, secret, connection string, or credential would be printed
- the migration target differs from `migrations/022_create_engineer_mobile_read_model.sql`
- the command would apply beyond a disposable local/test DB
- the command would run `psql`, `db:migrate`, DDL, schema/index changes, or smoke against shared runtime without a separately approved future task
- runtime writes, provider sending, API route mounting, or global app/server/router wiring would be enabled

## Placeholder-Only Future Command Examples

These examples are documentation placeholders only. Do not run them as part of Task1784.

Example dry-run shape:

```bash
DATABASE_URL=<DISPOSABLE_LOCAL_TEST_DATABASE_URL> <DRY_RUN_TOOL> --migration migrations/022_create_engineer_mobile_read_model.sql --dry-run
```

Example verification shape:

```bash
<VERIFY_TOOL> --target <DISPOSABLE_LOCAL_TEST_DB_ALIAS> --migration migrations/022_create_engineer_mobile_read_model.sql --no-credential-printing
```

The placeholders above must be replaced only inside a future explicitly authorized task, and the resulting command output must still not print a real DB URL or credential.

## Core Boundary Confirmation

One Case / one formal FSR boundary remains untouched.

`field_service_reports.case_id` uniqueness remains untouched.

This task cannot create a second formal Field Service Report.

`finalAppointmentId` remains system-owned/admin override only and must not be exposed, inferred, selected, or mutated.

Engineer Mobile read-model dry-run preparation remains read-side migration readiness work; it is not Field Service Report creation, update, or completion submission.

## Non-goals

- No source/runtime changes.
- No migration changes.
- No migration creation.
- No migration dry-run.
- No migration apply.
- No DDL.
- No schema/index changes.
- No real DB connection.
- No real SQL execution.
- No `psql`.
- No `db:migrate`.
- No smoke.
- No global route mount.
- No provider sending.
- No LINE / SMS / email / webhook.
- No AI / RAG.
- No billing / settlement.
- No admin UI.
- No package changes.
- No broad staging.
- No commit.
- No push.
- No staging of held historical docs.

## Verification

Targeted checks for this task:

- `/Users/global/.nvm/versions/node/v24.16.0/bin/node --test tests/engineerMobile/engineerMobileReadModelMigration022DryRunAuthorization.static.test.js`
- `/Users/global/.nvm/versions/node/v24.16.0/bin/node --test tests/engineerMobile/engineerMobileReadModelMigration022Readiness.static.test.js tests/engineerMobile/engineerMobileReadModelPathDecision.static.test.js`
- `/Users/global/.nvm/versions/node/v24.16.0/bin/node /Users/global/.nvm/versions/node/v24.16.0/lib/node_modules/npm/bin/npm-cli.js run check`
- `git diff --check -- tests/engineerMobile/engineerMobileReadModelMigration022DryRunAuthorization.static.test.js docs/task-1784-engineer-mobile-read-model-migration-022-dry-run-authorization-packet-no-db-execution.md`

No DB-backed checks and no smoke are part of Task1784.

# Task1840 Engineer Mobile Migration 023 Disposable DB Dry-Run Authorization Packet / No DB Execution

## Status

Task1840 is authorization-packet-only.

No DB execution in Task1840. No migration dry-run in Task1840. No migration apply in Task1840. No SQL execution in Task1840. No psql in Task1840. No npm run db:migrate in Task1840. No DATABASE_URL printing in Task1840.

Task1840 creates a safety envelope for a future disposable local/test DB dry-run of `migrations/023_engineer_mobile_visit_action_persistence_fields.sql`. It does not execute the migration, verify schema against a DB, open a DB connection, edit the migration file, or change runtime code.

## Target Migration

- `migrations/023_engineer_mobile_visit_action_persistence_fields.sql`

The target is the accepted Task1838 draft migration for Engineer Mobile visit action appointment-level persistence fields. This packet does not modify the migration file and does not execute it.

## Future Dry-Run Authorization Gate

A future dry-run may proceed only after explicit approval naming a disposable local/test DB only.

The required approval phrase must be substantially equivalent to:

> I approve a disposable local/test DB dry-run of migration 023 only. Do not use shared Zeabur, staging, or production. Do not print DATABASE_URL or credentials. Do not send providers. Stop on any destructive SQL.

Generic phrases are insufficient authorization, including:

- ok
- go ahead
- run it
- approved
- do it
- continue
- 可以
- 繼續
- 請繼續
- 下一步

## Required Future Target Boundary

Any future dry-run task must confirm all of the following before DB-adjacent commands:

- Future dry-run requires explicit approval naming disposable local/test DB only.
- Future dry-run must not use shared runtime DB.
- No shared Zeabur / staging / production target.
- Future dry-run must not print credentials or DB URLs.
- Future dry-run must not send providers.
- Future dry-run must not create Completion Report / Field Service Report.
- Future dry-run must not mutate finalAppointmentId.
- Future dry-run must stop on any unexpected destructive SQL.
- A real DATABASE_URL, passwords, tokens, secrets, connection strings, or credentials must never be printed.

## Forbidden In Task1840

- DB execution
- migration dry-run
- migration apply
- SQL execution
- psql
- npm run db:migrate
- DB connection
- DATABASE_URL printing
- shared Zeabur / staging / production target
- migration file edits
- SQL file edits
- source/runtime code changes
- src/ changes
- repository/controller/global route/global mount
- Express import/listen call
- smoke test
- real persistence/write execution
- audit log persistence
- provider sending
- AI/RAG
- billing/settlement
- admin UI
- package or lockfile changes
- seed changes
- Completion Report / Field Service Report creation/publication
- finalAppointmentId mutation
- customer-visible publication
- staging / commit / push
- cleanup/reset/stash/revert
- touching the 7 held historical docs

## Example-Only Command Envelope

The following is an example-only command envelope and is not executed in Task1840. It uses placeholders only and must not be copied into a real command without a separate approved future task.

```bash
DATABASE_URL=<DISPOSABLE_LOCAL_TEST_DB_URL> <DRY_RUN_TOOL> --migration migrations/023_engineer_mobile_visit_action_persistence_fields.sql --dry-run
```

The placeholder `<DISPOSABLE_LOCAL_TEST_DB_URL>` is documentation-only. A real DB URL must not be written into docs, chat, git output, logs, or test output.

## Stop Conditions For Future Dry-Run

Stop before any DB-adjacent command if:

- explicit approval is missing
- approval does not name disposable local/test DB
- approval does not name migration 023
- approval does not say dry-run only
- approval does not forbid credential printing
- the target appears to be shared runtime, Zeabur, staging, production, or any persistent customer/org data DB
- the migration target differs from `migrations/023_engineer_mobile_visit_action_persistence_fields.sql`
- the command would apply rather than dry-run
- the command would print `DATABASE_URL`, passwords, tokens, secrets, connection strings, or credentials
- the command would send provider traffic
- the command would create Completion Report / Field Service Report data
- the command would expose, infer, select, or mutate `finalAppointmentId`
- unexpected destructive SQL appears

## Core Boundaries Preserved

- One Case may have multiple appointments / dispatch visits.
- One Case ultimately has only one formal Field Service Report.
- `field_service_reports.case_id` uniqueness remains untouched.
- This task cannot create a second formal Field Service Report.
- `finalAppointmentId` remains system-owned/admin override only.
- `finalAppointmentId` must not be exposed, inferred, selected, or mutated by this task or by a future dry-run.

## Verification

Task1840 verification should run:

- `node --test tests/engineerMobile/engineerMobileMigration023DryRunAuthorization.static.test.js`
- `git diff --check -- docs/task-1840-engineer-mobile-migration-023-disposable-db-dry-run-authorization-packet-no-db-execution.md tests/engineerMobile/engineerMobileMigration023DryRunAuthorization.static.test.js`
- precise credential/sensitive scan limited to the two touched Task1840 files

Task1840 must not run `psql`, `npm run db:migrate`, migration dry-run, migration apply, SQL execution, DB connection, smoke, or runtime execution.

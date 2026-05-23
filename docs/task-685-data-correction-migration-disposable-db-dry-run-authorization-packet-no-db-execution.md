# Task 685 — Data Correction Migration Disposable DB Dry-run Authorization Packet / No DB Execution

## Status

Status: authorization packet only / no DB execution / no migration dry-run.

This document does not authorize a database connection, SQL execution, migration apply, migration dry-run, provider sending, browser smoke, or runtime traffic.

## Current Migration Draft

Current draft path:

- `migrations/021_create_data_correction_persistence_schema.sql`

The migration draft is authoring-only and remains unapplied. Future dry-run or apply requires a separate explicit task and approval.

## Required Explicit Authorization Before Dry-run

Before any future migration dry-run, the user must explicitly authorize all of the following conditions:

- target is disposable local/test DB only
- target is not shared Zeabur, production, staging, or any shared runtime DB
- DB URL and credentials must not be printed
- migration dry-run command is explicitly listed
- rollback / destroy DB policy is accepted for the disposable target
- no provider sending
- no browser smoke
- no runtime traffic
- no customer data
- no real token, secret, LINE credential, provider credential, or AI provider credential
- PM will review dry-run output summary only, not raw secrets

## Generic Phrases Are Not Authorization

The following generic phrases must not be treated as authorization for DB connection, SQL execution, migration apply, or migration dry-run:

```text
continue
go ahead
可以
繼續
下一步
請繼續
請給下一個 task
```

Authorization must explicitly name disposable local/test DB dry-run and must explicitly exclude shared Zeabur, production, staging, and shared runtime DB targets.

## Forbidden Commands Now

Task685 explicitly forbids running:

```text
npm run db:migrate
psql
任何 DB connection
任何 migration apply
任何 migration dry-run
任何 SQL execution
```

## Future Allowed Dry-run Command Shape

The following is an example only and is not authorized by Task685:

```text
DATABASE_URL=<disposable-local-test-db-url> npm run db:migrate -- --dry-run
```

Rules for any future task that uses this command shape:

- example only in Task685
- never print `DATABASE_URL`
- not authorized by Task685
- only a future explicit disposable local/test DB dry-run task may authorize execution

## Stop Conditions

Stop immediately before any command execution if:

- `DATABASE_URL` appears to point to a shared, production, staging, Zeabur, or shared runtime DB
- command would apply instead of dry-run
- output includes secrets, credentials, tokens, or raw sensitive values
- migration attempts to alter core tables
- any provider sending would occur
- any app runtime, browser smoke, or customer-facing traffic would start

## Next Step Candidates

Future branches may choose one of these paths:

- Disposable DB dry-run task only after explicit authorization.
- Continue runtime API / persistence adapter work without DB execution.

Neither branch is authorized by Task685.

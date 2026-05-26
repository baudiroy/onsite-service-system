# Task1631 Repair Intake DB Dry-Run Blocker Resolution Plan

Status: docs-only blocker resolution plan, no DB action, no runtime change.

## PM Direction

Task1631 acceptance target:

- Add exactly one docs-only blocker resolution plan.
- Leave the file unstaged.
- No source/test/runtime edits.
- No DB action.

## Blocker Summary

Task1630 attempted the first bounded Repair Intake Migration 026 disposable local/test DB rollback dry-run.

It safely blocked before DB connection because:

- `DATABASE_URL` was missing.
- Docker was unavailable on the local machine.
- No safe local/test/disposable DB target could be proven.

Static preconditions succeeded:

- latest commit was `306d794 Document repair intake local test DB target packet`;
- staged area was empty;
- tracked worktree was clean;
- only the 7 held historical docs remained untracked;
- migration 026 static boundary test passed.

No DB connection, `psql`, SQL execution, schema introspection, migration apply, route mount, server listen, smoke, provider, AI/RAG, billing, admin, staging, or commit occurred.

## Resolution Goal

Unblock a future Migration 026 rollback dry-run by providing exactly one safe local/test/disposable DB path.

The next dry-run should proceed only after the DB target can be classified without printing secrets.

## Acceptable Resolution Paths

### Path A: User Provides Safe Local/Test DATABASE_URL

The user can provide a local/test/disposable `DATABASE_URL` through the environment.

Required properties:

- host is `localhost`, `127.0.0.1`, `::1`, or explicit Docker-local;
- DB name clearly includes `test`, `local`, `disposable`, or `dev`;
- DB has no customer data;
- DB is safe for rollback dry-run and disposable validation;
- credentials are not printed in terminal output, PM reports, or docs.

Recommended DB names:

- `repair_intake_test`
- `repair_intake_disposable`
- `repair_intake_local`

### Path B: Install Or Enable Local Docker

If Docker becomes available, a future task may create a disposable Postgres container for the dry-run.

Required properties:

- container is local-only;
- DB name is `repair_intake_disposable` or equivalent;
- credentials are throwaway;
- no customer data is loaded;
- task-created container is removed after validation.

### Path C: Existing Local Developer Postgres

If a local Postgres server already exists, create or point to a disposable DB.

Required properties:

- host is local;
- DB name is test/local/disposable/dev;
- no production dump;
- no customer data;
- safe rollback behavior;
- user confirms the DB may be used for migration dry-run.

## Required Safe Classification Before DB Connection

Future task must classify:

- `DATABASE_URL present: yes/no`
- `target source: env / disposable docker / unavailable`
- `host class: localhost / docker-local / unsafe / unknown`
- `database class: test / disposable / local / unsafe / unknown`
- `credentials printed: no`
- `production/shared/customer DB suspicion: yes/no`

Stop before DB connection if the target is unsafe or unknown.

## Future Task Shape After Resolution

Once a safe DB target exists, rerun Task1630-style dry-run:

1. Preflight git status and diff checks.
2. Run migration 026 static boundary test.
3. Classify DB target without printing secrets.
4. Run migration 026 inside `BEGIN` / `ROLLBACK`.
5. Optionally run read-only post-rollback table introspection.
6. Confirm no permanent unintended schema changes.
7. Confirm worktree remains clean.

## Stop Conditions

Stop and report if:

- `DATABASE_URL` is missing;
- Docker is unavailable;
- DB host is remote or unknown;
- DB name is not clearly test/local/disposable/dev;
- target looks production/shared/staging/customer;
- credentials would be printed;
- migration static test fails;
- rollback transaction cannot be guaranteed;
- SQL dry-run fails;
- unrelated file changes appear.

## Out Of Scope

- No DB connection in this task.
- No `psql`.
- No SQL dry-run.
- No migration apply.
- No `npm run db:migrate`.
- No source/test/runtime edit.
- No repository implementation.
- No route mount.
- No server listen.
- No smoke/shared runtime.
- No provider / LINE / SMS / email / webhook action.
- No AI/RAG/vector action.
- No billing/settlement action.
- No admin/frontend action.
- No customer-visible rollout.
- No staging, commit, push, reset, stash, clean, or revert.

## Acceptance For This Task

Task1631 is acceptable if:

- this blocker resolution plan is created;
- the file remains unstaged;
- no source/test/runtime/migration/package files are edited;
- no DB connection or SQL execution occurs;
- no credentials are printed;
- the 7 held historical docs remain untouched.

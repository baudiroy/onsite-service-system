# Task1628 Repair Intake Local/Test DB Target Provisioning Packet

Status: docs-only provisioning packet, no DB connection, no SQL.

## PM Direction

Task1628 acceptance target:

- Add one docs-only local/test DB target provisioning packet.
- Leave the file unstaged.
- No DB connection.
- No SQL execution.
- No source/test edits.

## Why This Packet Exists

Task1627 entered the Repair Intake full-runtime integration fast-lane and verified:

- migration 026 static boundary test passes;
- no approved local/test/disposable `DATABASE_URL` was present;
- SQL dry-run was safely skipped;
- no DB credentials were printed;
- no production/shared/staging DB was touched.

This packet defines the minimum safe DB target requirements before any future `psql` dry-run, repository-to-real-local-DB integration, or migration readiness check may proceed.

## Required DB Target Classification

Future DB dry-run tasks may proceed only if the DB target can be classified as local/test/disposable without printing secrets.

Allowed host classes:

- `localhost`
- `127.0.0.1`
- `::1`
- local Docker Postgres host
- explicitly local development host

Allowed database-name classes:

- includes `test`
- includes `local`
- includes `disposable`
- includes `dev`
- explicitly documented as disposable for this task

Disallowed target markers:

- `prod`
- `production`
- `staging`
- `shared`
- customer-data database
- external managed production database
- any target whose purpose cannot be proven from safe metadata

## Secret Handling

Codex must not print:

- full `DATABASE_URL`;
- password;
- access token;
- connection string with credentials;
- cloud provider secret;
- customer data.

Safe report fields:

- `DATABASE_URL present: yes/no`
- `classification: local_test_disposable / not_proven_safe / missing / invalid_url`
- `hostClass: local_or_docker / remote_or_unknown / unavailable`
- `databaseClass: test_disposable_named / not_test_disposable_named / unavailable`
- `unsafeNameHint: true/false`

## Recommended Provisioning Options

### Option A: User Provides Existing Local/Test DATABASE_URL

User or PM provides `DATABASE_URL` in the runtime environment, but Codex may only classify it and must not print it.

Required safe properties:

- host is local or Docker-local;
- DB name clearly indicates test/local/disposable/dev;
- DB does not contain customer data;
- user confirms it is non-production and disposable.

### Option B: Local Docker Postgres

Use a local Docker Postgres instance dedicated to Repair Intake dry-run.

Suggested safe properties:

- container is local only;
- DB name: `repair_intake_disposable` or `repair_intake_test`;
- credentials are throwaway local credentials;
- no customer data loaded;
- container can be destroyed after validation.

Codex should still not print full connection strings.

### Option C: Existing Local Developer Postgres

Use a local developer Postgres server with a disposable DB.

Suggested safe properties:

- host: `localhost` or `127.0.0.1`;
- DB name: `repair_intake_test`, `repair_intake_local`, or `repair_intake_disposable`;
- no production dump;
- no customer data;
- safe to rollback and drop if needed.

## Future Task Preconditions

Before any future DB dry-run task:

```bash
git log -1 --oneline
git diff --cached --name-only
git diff --name-only
git diff --check
git status --short -- src tests fixtures migrations admin package.json package-lock.json
git status --short
```

Expected:

- staged area empty;
- tracked worktree clean;
- only the 7 held historical docs may remain untracked unless PM assigns otherwise;
- no source/test/migration dirty diff.

## Future Static Test

Run before any DB connection:

```bash
node --test tests/repairIntake/repairIntakeMigration026StaticBoundary.static.test.js
```

If this fails, stop before any DB connection.

## Future SQL Dry-Run Shape

Only if DB target is proven local/test/disposable:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1
```

The SQL body should use:

```sql
BEGIN;
\i migrations/026_create_repair_intake_persistence_tables.sql
ROLLBACK;
```

Stop instead of running if the migration contains non-transaction-safe SQL or if the target cannot be proven safe.

## Future Optional Read-Only Introspection

Only after rollback dry-run succeeds:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'repair_intake_drafts',
    'repair_intake_draft_case_conversions',
    'repair_intake_idempotency_records',
    'repair_intake_audit_events'
  )
ORDER BY table_name;
```

This must not mutate DB state outside the rollback dry-run.

## Stop Conditions

Stop immediately if:

- `DATABASE_URL` is missing and no safe target is provided;
- `DATABASE_URL` is invalid;
- host is remote or unknown;
- DB name does not clearly indicate test/local/disposable/dev;
- target appears production/shared/staging;
- credentials would be printed;
- production or customer data may be present;
- migration file is missing;
- static migration test fails;
- rollback transaction cannot be guaranteed;
- SQL dry-run fails;
- unrelated file changes appear.

## Out Of Scope

- No DB connection in this task.
- No `psql` in this task.
- No SQL dry-run in this task.
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

Task1628 is acceptable if:

- this docs-only packet is created;
- the file remains unstaged;
- no source/test/runtime/migration/package files are edited;
- no DB connection or SQL execution occurs;
- no credentials are printed;
- the 7 held historical docs remain untouched.

# Task2129 - Customer Access Audit Migration Creation Authorization Packet

## Status

- Documentation-only authorization packet for a future Customer Access audit migration creation task.
- This task does not create a migration file.
- This task does not authorize DB execution, migration apply, migration dry-run, or runtime persistence integration.
- No runtime, source, test, package, migration file, DB, SQL, repository/query, audit persistence, DB writer, route/controller/global mount, production mount, app/server/public routes, smoke, listener, network, Zeabur/env, provider, admin, AI, billing, settlement, payment, invoice, package, or package-lock work was performed.
- The 7 held historical docs remain untracked and untouched.

## Current Baseline

Existing migration convention:

- Migrations are numbered SQL files under `migrations/`.
- Read-only inspection in Task2127 observed current sequence through `026_create_repair_intake_persistence_tables.sql`.

Future candidate migration filename:

- `migrations/027_create_customer_access_audit_events.sql`

Future migration task must re-inspect `migrations/` before creating a file to avoid numbering collision.

## Future Task2130 Candidate Scope - Not Authorized Yet

Candidate future scope:

- Create exactly one migration file only:
  - `migrations/027_create_customer_access_audit_events.sql`, or adjusted next number if re-inspection shows a new migration exists.
- Create table concept:
  - `customer_access_audit_events`
- Include only DDL for the audit events table and indexes.

Candidate future scope must not include:

- seed data
- data backfill
- triggers
- functions
- policies unless explicitly authorized later
- runtime code
- repository implementation
- DB execution

## Required Future Table Columns For DDL Review

Future DDL review must account for:

- `id`
- `event_type`
- `occurred_at`
- `request_id`
- `actor_type`
- `organization_id`
- `customer_id`
- `case_id`
- `report_id`
- `decision`
- `reason_code`
- `route`
- `method`
- `source`
- `metadata_json`
- `created_at`

Exact SQL types must follow existing schema conventions discovered during the future migration task.

## Required Future Constraints And Checks To Consider

Future migration review must consider:

- `event_type` constrained to accepted Customer Access audit event types if existing project convention allows check constraints.
- `decision` constrained to `allow`, `deny`, `success`, or `failure` if convention allows.
- `method` constrained to `GET` if convention allows.
- `reason_code` constrained to safe allowlist or null if convention allows.
- `metadata_json` uses json/jsonb according to existing convention.
- `organization_id` presence rules reviewed against existing organization isolation convention.
- No raw request/header/token/body/query/customer identity/provider/AI/private fields.

## Required Future Indexes To Consider

Future migration review must consider:

- `organization_id, created_at`
- `organization_id, case_id, created_at`
- `organization_id, report_id, created_at`
- `event_type, created_at`
- `request_id` if query need is confirmed
- `created_at` for retention/cleanup

Index names must follow existing convention.

## Future Migration Static Review Requirements

Future static review must include:

- `git diff --check`
- Inspect migration file text only.
- No DB command.
- No migration apply.
- No migration dry-run.
- No `psql`.
- No `DATABASE_URL`.
- No env or Zeabur inspection.
- No secrets printed.
- Ensure migration does not include customer raw data columns.
- Ensure migration does not include runtime code or provider references.

## Hard Stop Conditions

Stop and report before creating or changing anything if:

- `migrations/` numbering changed.
- Existing schema conventions are unclear.
- Required DB types cannot be inferred safely.
- DDL would require changing existing tables.
- Organization isolation cannot be represented safely.
- Any DB execution seems necessary.

Any DB execution requires a future explicit authorization task.

## Explicit Non-Goals

- No migration file creation.
- No SQL execution.
- No DB touch.
- No repository implementation.
- No audit persistence writer implementation.
- No runtime persistence integration.
- No route/controller/global mount changes.
- No production mount.
- No smoke, endpoint probe, server, listener, network, Zeabur, or env work.
- No provider, admin, AI, billing, package, or package-lock work.

## Verification

Executed commands for this docs-only authorization packet:

```sh
git diff --check -- docs/task-2129-customer-access-audit-migration-creation-authorization-packet-no-migration-file-no-db-execution.md
git status --short --branch
```

Results:

- `git diff --check -- docs/task-2129-customer-access-audit-migration-creation-authorization-packet-no-migration-file-no-db-execution.md`: PASS.
- `git status --short --branch`: branch `main...origin/main` with only the Task2129 doc plus the 7 held historical docs untracked before commit.

Node tests were not required or run because this task is documentation-only and no source or test files were changed.

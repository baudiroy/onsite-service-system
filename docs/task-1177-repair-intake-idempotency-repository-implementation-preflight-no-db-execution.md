# Task1177 - Repair Intake Idempotency Repository Implementation Preflight / No DB Execution

## Status

Completed locally. Not staged.

This is a docs-only implementation preflight for the next safest repository step: Repair Intake idempotency repository implementation with injected synthetic `dbClient`.

This task does not create repository source.

It does not execute DB commands, SQL, migration dry-run, migration apply, `psql`, or `db:migrate`.

It does not modify source/runtime files, tests, migration SQL files, package files, routes, APIs, providers, admin files, AI, billing, repository writers, or DB behavior.

It does not perform git staging, commit, cleanup, revert, reset, or stash.

## Accepted Baseline

Task1176 draft repository + contract commit stack checkpoint is accepted.

Migration 026 is committed but not executed.

Route propagation remains explicit-injection-only.

Idempotency repository contract exists from the prior accepted branch, but may still be untracked/uncommitted locally unless separately staged.

No real idempotency repository implementation exists yet.

## Proposed Future Repository Seam

Proposed future source file:

`src/repairIntake/repairIntakeIdempotencyRepository.js`

Proposed future test file:

`tests/repairIntake/repairIntakeIdempotencyRepository.unit.test.js`

The future repository should:

- accept injected `dbClient` only;
- avoid global DB imports;
- avoid `process.env`;
- avoid `DATABASE_URL`;
- avoid provider/admin/AI/billing/package coupling.

## Future Methods

### `findExistingDraftToCaseResult(input)`

Recommended first implementation.

Expected behavior:

- read-only `SELECT` against `repair_intake_idempotency_records`;
- parameterized query;
- organization, tenant, operation, and idempotency scope;
- safe handling of nullable tenant scope;
- return `null` or no-existing-compatible value when no record exists;
- return safe replay-like result when a completed replay record exists;
- never expose raw row, SQL internals, credentials, phone/address/customer PII, LINE markers, `finalAppointmentId`, or stack traces.

### `recordDraftToCaseResult(input)`

Future writer method.

This method must be treated as not implemented until writer/transaction policy is accepted, or implemented only with explicit writer authorization.

If implemented later, it must use parameterized `INSERT` or `UPSERT`, transaction policy, idempotency uniqueness scope, retention/expiration policy, and sanitized result output.

Recommendation: start with the read-only find method first unless PM explicitly authorizes writer behavior.

## Future SQL Boundary

No SQL execution is allowed in this task.

Future read-only implementation may include a `SELECT` query string in source.

Future implementation must not interpolate user input into SQL strings.

Writer behavior requires a separate policy and bounded task.

## Prerequisites Before Future Source Task

- Decide whether first implementation is find-only or find + record.
- Define transaction boundary for record behavior.
- Use idempotency uniqueness scope from migration 026.
- Define retention and expiration behavior.
- Keep production, staging, shared, and runtime DB forbidden.
- Use unit tests with synthetic `dbClient` before any DB execution.

## Fail-Closed Rules

- No global DB import.
- No `DATABASE_URL`.
- No `process.env`.
- No `psql`.
- No `db:migrate`.
- No DB execution.
- No writer method without explicit authorization.
- No source creation until the next bounded task.
- No route/API/provider/admin/AI/billing/package changes.

## Recommended Next Bounded Task

Create read-only idempotency repository find implementation with injected synthetic `dbClient` and unit tests, still no DB execution.

Exact future allowed files:

- `src/repairIntake/repairIntakeIdempotencyRepository.js`
- `tests/repairIntake/repairIntakeIdempotencyRepository.unit.test.js`
- `docs/task-1178-repair-intake-idempotency-repository-read-only-find-implementation-no-db-execution.md`

The future task should continue to forbid DB connection, SQL execution against real DB, migration dry-run/apply, `psql`, `db:migrate`, repository writer behavior, route/API/provider/admin/AI/billing changes, staging, and commit unless separately assigned.

## Local Git Warning

Task1177 remains untracked and unstaged.

`git diff --cached --name-only` must remain empty.

Existing unrelated dirty and untracked files remain untouched.

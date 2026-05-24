# Task1191 - Repair Intake Idempotency Repository Writer Implementation / No DB Execution

## Status

Completed locally. Not staged.

This task implements isolated synthetic-`dbClient` writer behavior for `recordDraftToCaseResult(input)` in the Repair Intake idempotency repository.

It does not wire the writer into application flow, routes, controllers, services, providers, admin, AI, billing, or real DB execution.

It does not modify migration SQL, package files, contract source, contract tests, app/server files, route files, controller files, or shared repository files.

It does not perform git staging, commit, cleanup, revert, reset, stash, DB connection, SQL execution, migration dry-run, migration apply, `psql`, or `db:migrate`.

## Implemented Files

- `src/repairIntake/repairIntakeIdempotencyRepository.js`
- `tests/repairIntake/repairIntakeIdempotencyRepository.unit.test.js`
- `tests/repairIntake/repairIntakeIdempotencyRepositoryBoundary.static.test.js`
- `docs/task-1191-repair-intake-idempotency-repository-writer-implementation-no-db-execution.md`

## Writer Behavior

`recordDraftToCaseResult(input)` now:

- uses only the injected `dbClient.query(sql, params)`;
- validates input before query execution;
- requires organization, operation, idempotency key, safe request fingerprint, and a safe result or case reference;
- uses parameterized `INSERT INTO repair_intake_idempotency_records`;
- uses the migration 026 organization, nullable tenant, operation, and idempotency key uniqueness scope;
- uses `ON CONFLICT ... DO NOTHING` to remain duplicate-key safe without destructive write behavior;
- returns a sanitized recorded-like result;
- falls back to sanitized input-derived output when an idempotent duplicate returns no row;
- sanitizes rejected query failures through `RepairIntakeIdempotencyRepositoryError`;
- preserves existing `findExistingDraftToCaseResult(input)` read behavior.

## Safety Boundaries

- No global DB import.
- No `process.env`.
- No `DATABASE_URL`.
- No raw request body.
- No credentials, tokens, cookies, authorization headers, or secrets.
- No phone, address, customer name, customer phone, customer PII, LINE global identity, or `finalAppointmentId`.
- No raw SQL, SQL params, raw rows, raw DB errors, or stack traces in returned output.
- No transaction orchestration.
- No app-service, route, controller, provider, admin, AI, or billing wiring.
- No real DB execution.

## Test Updates

Repository unit coverage now verifies:

- existing find behavior still passes;
- valid writer input calls `dbClient.query` exactly once;
- writer SQL is parameterized and does not interpolate organization, idempotency key, or fingerprint values;
- params include organization, tenant, operation, idempotency key, safe request fingerprint, and sanitized result/case reference data;
- invalid writer input fails before query;
- rejected writer query throws a sanitized repository error;
- writer output does not leak raw row, raw SQL, credentials, raw request data, PII, LINE identity, `finalAppointmentId`, or stack traces.

Static boundary coverage now verifies:

- repository-local writer SQL marker is present;
- `INSERT INTO repair_intake_idempotency_records`, `ON CONFLICT`, `DO NOTHING`, and `RETURNING` are allowed/required;
- destructive markers remain blocked;
- forbidden imports and runtime coupling remain blocked;
- unsafe marker leakage remains blocked.

## Contract Compatibility Note

The existing idempotency repository contract integration still does not forward a safe request fingerprint to the repository writer.

Therefore the contract integration remains fail-closed with no writer query, which preserves the current contract test without modifying forbidden contract files.

A future bounded task must update the contract surface if PM wants contract-level writer success behavior.

## Verification Plan

- `node --test tests/repairIntake/repairIntakeIdempotencyRepository.unit.test.js`
- `node --test tests/repairIntake/repairIntakeIdempotencyRepositoryBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeIdempotencyRepositoryContractIntegration.unit.test.js`
- `git diff --cached --name-only`
- `git status --short -- src/repairIntake/repairIntakeIdempotencyRepository.js tests/repairIntake/repairIntakeIdempotencyRepository.unit.test.js tests/repairIntake/repairIntakeIdempotencyRepositoryBoundary.static.test.js docs/task-1191-repair-intake-idempotency-repository-writer-implementation-no-db-execution.md`

## Local Git Warning

`git diff --cached --name-only` must remain empty.

Task1191 remains unstaged and uncommitted.

Unrelated dirty and untracked files remain untouched.

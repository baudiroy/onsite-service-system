# Task1193 - Repair Intake Idempotency Contract Writer Forwarding / No DB Execution

## Status

Completed locally. Not staged.

This task updates the Repair Intake idempotency repository contract so `recordDraftToCaseResult(input)` forwards only safe writer fields to an injected repository writer.

It does not execute DB commands, SQL, migration dry-run, migration apply, `psql`, or `db:migrate`.

It does not wire writer behavior into app flow, application services, routes, controllers, app/server bootstrap, providers, admin, AI, or billing.

It does not modify migration SQL, package files, repository implementation tests outside the allowed read-only verification set, or forbidden full-chain tests.

## Implemented Files

- `src/repairIntake/repairIntakeIdempotencyRepositoryContract.js`
- `tests/repairIntake/repairIntakeIdempotencyRepositoryContract.unit.test.js`
- `tests/repairIntake/repairIntakeIdempotencyRepositoryContractBoundary.static.test.js`
- `tests/repairIntake/repairIntakeIdempotencyRepositoryContractIntegration.unit.test.js`
- `docs/task-1193-repair-intake-idempotency-contract-writer-forwarding-no-db-execution.md`

## Contract Writer Forwarding

The contract writer path now:

- requires `idempotencyKey`;
- requires `organizationId`;
- requires a safe `requestFingerprint` or `safeRequestFingerprint`;
- requires a safe result or case reference;
- forwards only sanitized writer fields to `repository.recordDraftToCaseResult`;
- maps `requestFingerprint` to `safeRequestFingerprint` for repository writer compatibility;
- preserves safe organization, tenant, request, actor, operation, draft, case, result, case reference, and metadata fields;
- strips unsafe raw request, raw DB, SQL/query, credential/header/cookie, PII, LINE, `finalAppointmentId`, stack, and error internals;
- returns sanitized recorded envelopes from repository writer results;
- remains fail-closed before repository writer when required safe fields are missing.

## Integration Behavior

The contract integration now covers the success path through the synthetic repository writer and synthetic `dbClient`.

The integration verifies:

- repository writer receives sanitized writer input;
- `safeRequestFingerprint` reaches the repository writer;
- the synthetic writer calls `dbClient.query` exactly once;
- writer SQL remains parameterized;
- unsafe markers do not leak through the repository call or response;
- missing safe fingerprint fails before repository writer and before `dbClient.query`.

## Preserved Behavior

- Existing find replay behavior is preserved.
- Existing no-existing behavior is preserved.
- Existing invalid-input behavior is preserved.
- Existing find failure behavior is preserved.
- Existing repository writer unit/static tests remain compatible.
- No contract full-chain tests are modified.

## Boundaries

- No DB connection.
- No SQL execution.
- No migration SQL edit.
- No migration dry-run/apply.
- No `psql`.
- No `db:migrate`.
- No app-service / route / controller / app / server wiring.
- No global DB import.
- No provider/admin/AI/billing/package changes.
- No cleanup/revert/reset/stash.
- No staging or commit.

## Local Git Warning

`git diff --cached --name-only` must remain empty.

Task1193 remains unstaged and uncommitted.

Unrelated dirty and untracked files remain untouched.

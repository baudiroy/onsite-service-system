# Task1192 - Repair Intake Idempotency Writer Contract Forwarding Policy Gate / No Runtime Change

## Status

Completed locally. Not staged.

This docs-only policy gate records the contract-level forwarding rules required before idempotency writer success behavior may be exposed through the repository contract.

It does not edit source files, tests, migration SQL, package files, routes, controllers, services, providers, admin, AI, billing, or app flow.

It does not perform git staging, commit, cleanup, revert, reset, stash, DB connection, SQL execution, migration dry-run, migration apply, `psql`, or `db:migrate`.

## Accepted Baseline

- Task1191 is accepted.
- Repository writer `recordDraftToCaseResult(input)` now exists, but is repository-local only.
- Contract integration still passes.
- Contract-level record success is not wired because the current contract does not forward the safe request fingerprint required by the repository writer.
- No DB execution occurred.
- No app-flow wiring occurred.

## Problem Statement

The repository writer requires safe writer input, including idempotency key, organization scope, operation type, safe request fingerprint, and a safe result or case reference.

The current contract sanitizer and forwarding layer does not provide the complete safe request fingerprint to the repository writer.

Directly relaxing the contract sanitizer could leak raw request data, raw result data, SQL details, credentials, customer PII, LINE identifiers, `finalAppointmentId`, stack traces, or DB internals if done carelessly.

Contract writer forwarding therefore needs an explicit allow-list and fail-closed behavior before source changes are authorized.

## Forwarding Policy Decision

The contract may forward only these safe fields to the repository writer:

- `idempotencyKey`
- `organizationId`
- `tenantId`
- `requestId`
- `actorId`
- `operationType`
- safe `caseId`
- safe `caseRef`
- safe result summary
- safe `requestFingerprint`
- safe metadata only if already sanitized and allow-listed

The contract must never forward:

- raw request body
- raw DB rows
- SQL or query details
- SQL params
- credentials
- headers
- cookies
- authorization data
- tokens or secrets
- phone
- address
- customer name
- customer phone
- customer PII
- LINE identifiers
- LINE tokens
- `finalAppointmentId`
- stack traces
- raw error internals

## Future Bounded Source Task

Task1193 may update only:

- `src/repairIntake/repairIntakeIdempotencyRepositoryContract.js`
- `tests/repairIntake/repairIntakeIdempotencyRepositoryContract.unit.test.js`
- `tests/repairIntake/repairIntakeIdempotencyRepositoryContractBoundary.static.test.js`
- `tests/repairIntake/repairIntakeIdempotencyRepositoryContractIntegration.unit.test.js`
- `docs/task-1193-repair-intake-idempotency-contract-writer-forwarding-no-db-execution.md`

Task1193 must still forbid:

- real DB execution;
- migration dry-run/apply;
- `psql`;
- `db:migrate`;
- app-service, route, controller, app, or server wiring;
- provider/admin/AI/billing/package changes;
- global DB imports;
- raw input forwarding;
- sanitizer bypass.

## Acceptance Requirements For Future Task1193

- Contract record success path calls repository writer with sanitized fields only.
- Repository writer query is called exactly once through synthetic `dbClient` in integration.
- Unsafe markers do not leak through input, repository call, returned envelope, failure envelope, or metadata.
- Existing find replay, no-existing, invalid-input, and failure behavior remains preserved.
- Existing repository writer unit/static tests remain compatible.
- Contract static guard blocks unsafe writer forwarding.
- Missing safe `requestFingerprint` or missing safe result/case reference remains fail-closed before repository query.

## Fail-Closed Rule

If safe `requestFingerprint` is missing, the contract writer path must remain fail-closed.

If safe result reference or safe `caseRef` is missing, the contract writer path must remain fail-closed.

Do not bypass the sanitizer.

Do not forward raw input.

Do not infer sensitive identity fields from raw payloads.

No DB execution, migration apply, app-flow wiring, or repository contract forwarding source change is authorized by this document.

## Local Git Warning

`git diff --cached --name-only` must remain empty.

Task1192 remains untracked and unstaged.

Unrelated dirty and untracked files remain untouched.

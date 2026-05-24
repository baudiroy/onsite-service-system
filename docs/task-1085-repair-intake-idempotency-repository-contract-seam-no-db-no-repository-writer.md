# Task1085 - Repair Intake Idempotency Repository Contract Seam / No DB No Repository Writer

## Status

Completed locally. Not staged.

## Scope

Added a pure idempotency repository contract seam for future idempotency persistence. This is a contract wrapper only. It does not implement a repository, write to DB, mount routes, change API shape, or introduce provider/admin/AI/billing work.

## Implemented Files

- `src/repairIntake/repairIntakeIdempotencyRepositoryContract.js`
- `tests/repairIntake/repairIntakeIdempotencyRepositoryContract.unit.test.js`
- `docs/task-1085-repair-intake-idempotency-repository-contract-seam-no-db-no-repository-writer.md`

## Contract Behavior

The module exports:

- `RepairIntakeIdempotencyRepositoryContractError`
- `createRepairIntakeIdempotencyRepositoryContract(options)`

The factory accepts an injected repository-like object directly, or under `idempotencyRepository`, `idempotencyStore`, or `repository`.

The injected object must expose both methods:

- `findExistingDraftToCaseResult(input)`
- `recordDraftToCaseResult(input)`

Missing or invalid dependencies throw a sanitized contract setup error with:

- `REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_REQUIRED`

## Find Existing Behavior

`findExistingDraftToCaseResult(input)`:

- requires plain object input
- requires `idempotencyKey`
- sanitizes lookup fields before delegation
- calls only injected `findExistingDraftToCaseResult`
- returns a sanitized no-existing envelope for null, undefined, or non-object result
- returns a sanitized replay-ready envelope for object result
- returns a sanitized find-failed envelope for thrown or rejected errors

Reason codes:

- `REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_INPUT_INVALID`
- `REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_FIND_FAILED`
- `REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_NO_EXISTING_RESULT`
- `REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_REPLAY_READY`

## Record Behavior

`recordDraftToCaseResult(input)`:

- requires plain object input
- requires `idempotencyKey`
- requires a useful object `result` or `caseRef`
- sanitizes record fields before delegation
- calls only injected `recordDraftToCaseResult`
- returns a sanitized recorded envelope for valid object result
- returns a sanitized record-failed envelope for invalid record result
- returns a sanitized record-failed envelope for thrown or rejected errors

Reason codes:

- `REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_INPUT_INVALID`
- `REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_RECORD_FAILED`
- `REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_RECORDED`

## Sanitization

Safe fields include:

- `idempotencyKey`
- `draftId`
- `caseId`
- `caseRef`
- `organizationId`
- `tenantId`
- `requestId`
- `actorId`
- `status`
- `submitted`
- `result`
- `metadata`
- `warnings`
- `recordId`
- `requiredActions`
- `action`
- `plan`
- `auditEvent`

Unsafe fields and markers are not forwarded or returned:

- raw values and rows
- SQL/query/DB fields
- database URLs
- authorization, cookie, and headers
- phone, address, customer fields
- LINE identifiers and access tokens
- `finalAppointmentId`
- stack and error objects
- repository and connection objects
- token and secret markers

## Boundaries Held

- No global route mount.
- No production route registration.
- No listen/server startup.
- No DB, SQL, migration, psql, or db:migrate.
- No real repository implementation.
- No repository writer.
- No imports from `src/repositories/**` or `src/db/**`.
- No API shape or OpenAPI expansion.
- No admin changes.
- No provider sending.
- No AI/RAG.
- No billing, settlement, payment, or invoice changes.
- No staging, cleanup, revert, reset, or stash.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeIdempotencyRepositoryContract.unit.test.js
node --test tests/repairIntake/repairIntakeCaseRepositoryContractFullChainBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCaseRepositoryContractFullSyntheticChain.integration.test.js
node --test tests/repairIntake/repairIntakeCaseRepositoryContractBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCaseRepositoryContract.unit.test.js
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.

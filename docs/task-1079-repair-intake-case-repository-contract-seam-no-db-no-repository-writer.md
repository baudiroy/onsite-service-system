# Task1079 - Repair Intake Case Repository Contract Seam / No DB No Repository Writer

## Status

Completed locally. Not staged.

## Scope

Added a pure Repair Intake case repository contract seam for future Case creation persistence. This task does not implement a repository, does not import repository or DB modules, and does not connect the contract to the existing runtime chain.

## Implemented Files

- `src/repairIntake/repairIntakeCaseRepositoryContract.js`
- `tests/repairIntake/repairIntakeCaseRepositoryContract.unit.test.js`
- `docs/task-1079-repair-intake-case-repository-contract-seam-no-db-no-repository-writer.md`

## Contract Behavior

`createRepairIntakeCaseRepositoryContract(options)` validates an injected repository-like dependency and returns a contract object exposing:

- `createCaseFromDraft(input)`

Accepted dependency shapes:

- direct object with `createCaseFromDraft(input)`
- `{ caseRepository: { createCaseFromDraft(input) } }`
- `{ repository: { createCaseFromDraft(input) } }`

Missing repository objects or missing/non-function `createCaseFromDraft` fail closed by throwing `RepairIntakeCaseRepositoryContractError` with:

- `REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_REQUIRED`

Invalid creation input fails closed before delegation with:

- `REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_INPUT_INVALID`

Null, undefined, and non-object repository results return a sanitized failure envelope with:

- `REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CREATE_FAILED`

Thrown or rejected repository errors return a sanitized failure envelope with:

- `REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CREATE_FAILED`

Successful case-like results return a sanitized created envelope with:

- `REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CASE_CREATED`

## Sanitization

Safe creation and result fields are limited to:

- `draftId`
- `caseId`
- `caseRef`
- `organizationId`
- `tenantId`
- `requestId`
- `actorId`
- `status`
- `source`
- `sourceDraftId`
- `draft`
- `plan`
- `summary`
- `metadata`
- `warnings`

Unsafe fields and markers are not forwarded and are not returned:

- `raw`
- `rawRow`
- `rawRows`
- `sql`
- `query`
- `paramsSql`
- `db`
- `databaseUrl`
- `DATABASE_URL`
- `authorization`
- `cookie`
- `headers`
- `phone`
- `address`
- `customerPhone`
- `customerName`
- `lineUserId`
- `lineAccessToken`
- `finalAppointmentId`
- `stack`
- `error`
- `repository`
- `connection`

Nested `draft`, `plan`, `caseRef`, `summary`, `metadata`, and array values are recursively sanitized by unsafe field name.

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
node --test tests/repairIntake/repairIntakeCaseRepositoryContract.unit.test.js
node --test tests/repairIntake/repairIntakeDraftRepositoryContractFullChainBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftRepositoryContractFullSyntheticChain.integration.test.js
node --test tests/repairIntake/repairIntakeDraftRepositoryContractDraftReader.integration.test.js
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.

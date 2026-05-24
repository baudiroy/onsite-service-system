# Task1072 - Repair Intake Draft Repository Contract Seam / No DB No Repository Writer

## Status

Completed locally. Not staged.

## Scope

Added a pure Repair Intake draft repository contract seam for future draft reading. This task does not implement a repository, does not import repository or DB modules, and does not connect the contract to the existing runtime chain.

## Implemented Files

- `src/repairIntake/repairIntakeDraftRepositoryContract.js`
- `tests/repairIntake/repairIntakeDraftRepositoryContract.unit.test.js`
- `docs/task-1072-repair-intake-draft-repository-contract-seam-no-db-no-repository-writer.md`

## Contract Behavior

`createRepairIntakeDraftRepositoryContract(options)` validates an injected repository-like dependency and returns a contract object exposing:

- `findDraftForConversion(input)`

Accepted dependency shapes:

- direct object with `findDraftForConversion(input)`
- `{ draftRepository: { findDraftForConversion(input) } }`
- `{ repository: { findDraftForConversion(input) } }`

Missing repository objects or missing/non-function `findDraftForConversion` fail closed by throwing `RepairIntakeDraftRepositoryContractError` with:

- `REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_REQUIRED`

Invalid lookup input fails closed before delegation with:

- `REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_INPUT_INVALID`

Null, undefined, and non-object repository results return a sanitized not-found envelope with:

- `REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_DRAFT_NOT_FOUND`

Thrown or rejected repository errors return a sanitized failure envelope with:

- `REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_READ_FAILED`

Successful draft-like results return a sanitized ready envelope with:

- `REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_DRAFT_READY`

## Sanitization

Safe lookup and result fields are limited to:

- `draftId`
- `organizationId`
- `tenantId`
- `requestId`
- `actorId`
- `status`
- `source`
- `sourceRef`
- `intakeSource`
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

Nested `summary`, `metadata`, and array values are recursively sanitized by unsafe field name.

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
node --test tests/repairIntake/repairIntakeDraftRepositoryContract.unit.test.js
node --test tests/repairIntake/repairIntakeSyntheticRouteReadinessBoundary.static.test.js
node --test tests/repairIntake/repairIntakeSyntheticRouteReadiness.unit.test.js
node --test tests/repairIntake/repairIntakeSyntheticAppCompositionHarnessSmokeBoundary.static.test.js
node --test tests/repairIntake/repairIntakeSyntheticAppCompositionHarness.smoke.test.js
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.

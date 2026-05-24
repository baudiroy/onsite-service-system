# Task1083 - Repair Intake Case Repository Contract Full Chain Static Boundary Guard / No DB No Repository Writer

## Status

Completed locally. Not staged.

## Scope

Added a static boundary guard for the Task1082 case repository contract full synthetic chain integration test. This guard keeps the integration test anchored to injected synthetic seams and prevents drift into DB, repository writer, global route mount, provider, API shape, AI/RAG, billing, or admin work.

## Implemented Files

- `tests/repairIntake/repairIntakeCaseRepositoryContractFullChainBoundary.static.test.js`
- `docs/task-1083-repair-intake-case-repository-contract-full-chain-static-boundary-guard-no-db-no-repository-writer.md`

## Guard Coverage

The static test inspects:

- `tests/repairIntake/repairIntakeCaseRepositoryContractFullSyntheticChain.integration.test.js`

It asserts the Task1082 integration test keeps the expected contract-chain markers:

- `createRepairIntakeDraftRepositoryContract`
- `createRepairIntakeCaseRepositoryContract`
- `createRepairIntakeDraftReaderPortAdapter`
- `createRepairIntakeCasePlannerPortAdapter`
- `createRepairIntakeCaseCreatorPortAdapter`
- `createRepairIntakeAuditWriterPortAdapter`
- `createRepairIntakeIdempotencyPortAdapter`
- `createRepairIntakeDraftToCaseApplicationService`
- `createRepairIntakeDraftToCaseController`
- `createRepairIntakeDraftToCaseApiModule`
- `mountRepairIntakeDraftToCaseApiModule`

It also asserts mounted submit scenarios remain present:

- no-existing submit through the synthetic mount
- idempotency replay through the synthetic mount
- case repository failure behavior
- expected call order from idempotency find through idempotency record
- replay suppression so downstream draft, planner, case, audit, and record ports are not called

## Boundary Checks

The guard strips explicit unsafe fixture and redaction assertion blocks before checking forbidden runtime coupling markers. Sensitive marker strings must remain confined to unsafe fixtures or redaction assertions.

Forbidden markers checked include:

- app/server/routes imports and paths
- repository and DB imports and paths
- listen/server startup markers
- network and environment markers
- SQL and DB client markers
- concrete repository constructor markers
- provider sending markers
- AI/vector markers
- billing, invoice, and payment markers

## Boundaries Held

- No production source files modified.
- No existing tests modified.
- No migrations.
- No admin changes.
- No package changes.
- No global route mount.
- No production route registration.
- No listen/server startup.
- No DB, SQL, migration, psql, or db:migrate.
- No real repository implementation.
- No repository writer.
- No imports from `src/repositories/**` or `src/db/**`.
- No API shape or OpenAPI expansion.
- No provider sending.
- No AI/RAG.
- No billing, settlement, payment, or invoice changes.
- No staging, cleanup, revert, reset, or stash.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeCaseRepositoryContractFullChainBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCaseRepositoryContractFullSyntheticChain.integration.test.js
node --test tests/repairIntake/repairIntakeCaseRepositoryContractCaseCreator.integration.test.js
node --test tests/repairIntake/repairIntakeCaseRepositoryContractBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCaseRepositoryContract.unit.test.js
node --test tests/repairIntake/repairIntakeDraftRepositoryContractFullChainBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.

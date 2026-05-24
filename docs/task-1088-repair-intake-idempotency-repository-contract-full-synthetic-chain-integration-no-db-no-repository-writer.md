# Task1088 - Repair Intake Idempotency Repository Contract Full Synthetic Chain Integration / No DB No Repository Writer

## Status

Completed locally. Not staged.

## Scope

Added a full synthetic chain integration test proving the Task1085 idempotency repository contract can sit at the idempotency boundary together with the Task1072 draft repository contract and Task1079 case repository contract. This remains fully injected and synthetic. It does not modify production source and does not introduce DB, repository writer, global route mount, API shape, provider, AI/RAG, billing, or admin work.

## Implemented Files

- `tests/repairIntake/repairIntakeIdempotencyRepositoryContractFullSyntheticChain.integration.test.js`
- `docs/task-1088-repair-intake-idempotency-repository-contract-full-synthetic-chain-integration-no-db-no-repository-writer.md`

## Full Synthetic Chain

The test builds this chain:

```text
synthetic raw draft repository-like object
-> createRepairIntakeDraftRepositoryContract
-> draftReader adapter

synthetic raw case repository-like object
-> createRepairIntakeCaseRepositoryContract
-> caseCreator adapter

synthetic raw idempotency repository-like object
-> createRepairIntakeIdempotencyRepositoryContract
-> idempotencyPort adapter

casePlanner adapter
auditWriter adapter
applicationService
controller
API module
HTTP mount adapter
synthetic mount target
```

No app/server/routes global mount is used.

## Verified Behavior

Submit route with no existing idempotency result:

- valid submit preconditions are present
- call order is raw idempotency find, raw draft repository, planner, raw case repository, auditWriter, raw idempotency record
- raw idempotency lookup and record payloads are sanitized
- raw draft repository lookup is sanitized
- raw case repository creation input is sanitized
- planner and audit payloads are sanitized
- response is sanitized

Submit replay:

- raw idempotency find returns a replay candidate
- raw draft repository, planner, raw case repository, audit, and raw idempotency record are not called
- replay response is sanitized

Idempotency find failure:

- raw idempotency find throws or rejects unsafe DB/SQL/credential/customer/LINE/finalAppointmentId/stack markers
- contract and adapter keep the behavior sanitized
- mounted submit safely falls through as no-existing behavior and completes through the synthetic chain
- no raw error text or unsafe markers leak

Idempotency record failure:

- raw idempotency record throws or rejects unsafe DB/SQL/credential/customer/LINE/finalAppointmentId/stack markers after case creation
- contract and adapter keep the behavior sanitized
- mounted submit keeps the existing applicationService behavior and returns the sanitized submit response
- no raw error text or unsafe markers leak

## Sanitization

Safe idempotency lookup fields forwarded:

- `idempotencyKey`
- `draftId`
- `organizationId`
- `tenantId`
- `requestId`

Safe idempotency record fields forwarded:

- lookup fields
- sanitized `result`

Safe draft lookup fields forwarded:

- `draftId`
- `organizationId`
- `tenantId`
- `requestId`
- `actorId`

Safe case creation fields forwarded:

- `draftId`
- `organizationId`
- `tenantId`
- `requestId`
- sanitized `draft`
- sanitized `plan`

Inter-port payloads are asserted to exclude:

- raw rows and raw body
- SQL, DB, query, and paramsSql markers
- credentials and authorization headers
- phone, address, and customer data
- LINE markers
- `finalAppointmentId`
- stack traces and raw error text
- raw repository/connection objects
- token markers

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
node --test tests/repairIntake/repairIntakeIdempotencyRepositoryContractFullSyntheticChain.integration.test.js
node --test tests/repairIntake/repairIntakeIdempotencyRepositoryContractPort.integration.test.js
node --test tests/repairIntake/repairIntakeIdempotencyRepositoryContractBoundary.static.test.js
node --test tests/repairIntake/repairIntakeIdempotencyRepositoryContract.unit.test.js
node --test tests/repairIntake/repairIntakeCaseRepositoryContractFullChainBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCaseRepositoryContractFullSyntheticChain.integration.test.js
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.

# Task1082 - Repair Intake Case Repository Contract Full Synthetic Chain Integration / No DB No Repository Writer

## Status

Completed locally. Not staged.

## Scope

Added an integration test proving the Task1079 case repository contract can sit at the case-create boundary inside the existing full synthetic chain, together with the Task1072 draft repository contract. This remains fully injected and synthetic. It does not modify production source and does not introduce DB, repository writer, global route mount, API shape, provider, AI/RAG, billing, or admin work.

## Implemented Files

- `tests/repairIntake/repairIntakeCaseRepositoryContractFullSyntheticChain.integration.test.js`
- `docs/task-1082-repair-intake-case-repository-contract-full-synthetic-chain-integration-no-db-no-repository-writer.md`

## Full Synthetic Chain

The test builds this chain:

```text
synthetic raw draft repository-like object
-> createRepairIntakeDraftRepositoryContract
-> draftReader adapter

synthetic raw case repository-like object
-> createRepairIntakeCaseRepositoryContract
-> caseCreator adapter

casePlanner adapter
auditWriter adapter
idempotencyPort adapter
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
- call order is idempotency find, raw draft repository, planner, raw case repository, auditWriter, idempotency record
- raw draft repository lookup is sanitized
- raw case repository creation input is sanitized
- planner, audit, and idempotency payloads are sanitized
- response is sanitized

Submit replay:

- idempotency find returns a replay candidate
- raw draft repository, planner, raw case repository, audit, and idempotency record are not called
- replay response is sanitized

Case repository failure:

- raw case repository throws or rejects unsafe DB/SQL/credential/customer/LINE/finalAppointmentId/stack markers
- mounted submit route returns sanitized failure status/reason
- no raw error text or unsafe markers leak

## Sanitization

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
node --test tests/repairIntake/repairIntakeCaseRepositoryContractFullSyntheticChain.integration.test.js
node --test tests/repairIntake/repairIntakeCaseRepositoryContractCaseCreator.integration.test.js
node --test tests/repairIntake/repairIntakeCaseRepositoryContractBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCaseRepositoryContract.unit.test.js
node --test tests/repairIntake/repairIntakeDraftRepositoryContractFullChainBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftRepositoryContractFullSyntheticChain.integration.test.js
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.

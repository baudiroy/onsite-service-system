# Task1076 - Repair Intake Draft Repository Contract Full Synthetic Chain Integration / No DB No Repository Writer

## Status

Completed locally. Not staged.

## Scope

Added an integration test proving the Task1072 draft repository contract can sit at the draft-read boundary inside the existing full synthetic chain. This remains fully injected and synthetic. It does not modify production source and does not introduce DB, repository writer, global route mount, API shape, provider, AI/RAG, billing, or admin work.

## Implemented Files

- `tests/repairIntake/repairIntakeDraftRepositoryContractFullSyntheticChain.integration.test.js`
- `docs/task-1076-repair-intake-draft-repository-contract-full-synthetic-chain-integration-no-db-no-repository-writer.md`

## Full Synthetic Chain

The test builds this chain:

```text
synthetic raw repository-like object
-> createRepairIntakeDraftRepositoryContract
-> createRepairIntakeDraftReaderPortAdapter
-> casePlanner adapter
-> caseCreator adapter
-> auditWriter adapter
-> idempotencyPort adapter
-> applicationService
-> controller
-> API module
-> HTTP mount adapter
-> synthetic mount target
```

No app/server/routes global mount is used.

## Verified Behavior

Plan route:

- dispatches through mounted synthetic handler
- raw repository receives sanitized lookup only
- planner receives sanitized draft summary only
- caseCreator, auditWriter, and idempotency record are not called
- response is sanitized

Submit route with no existing idempotency result:

- valid submit preconditions are present
- call order is idempotency find, raw repository, planner, caseCreator, auditWriter, idempotency record
- raw repository lookup is sanitized
- planner, creator, audit, and idempotency payloads are sanitized
- response is sanitized

Submit replay:

- idempotency find returns a replay candidate
- raw repository, planner, creator, audit, and idempotency record are not called
- replay response is sanitized

Repository contract failure:

- raw repository throws or rejects unsafe DB/SQL/credential/customer/LINE/finalAppointmentId/stack markers
- mounted plan route returns sanitized failure status/reason
- no raw error text or unsafe markers leak

## Sanitization

Safe lookup fields forwarded:

- `draftId`
- `organizationId`
- `tenantId`
- `requestId`
- `actorId`

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
node --test tests/repairIntake/repairIntakeDraftRepositoryContractFullSyntheticChain.integration.test.js
node --test tests/repairIntake/repairIntakeDraftRepositoryContractDraftReader.integration.test.js
node --test tests/repairIntake/repairIntakeDraftRepositoryContractBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftRepositoryContract.unit.test.js
node --test tests/repairIntake/repairIntakeSyntheticRouteReadinessBoundary.static.test.js
node --test tests/repairIntake/repairIntakeSyntheticRouteReadiness.unit.test.js
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.

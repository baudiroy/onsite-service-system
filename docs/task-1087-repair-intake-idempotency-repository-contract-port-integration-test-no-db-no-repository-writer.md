# Task1087 - Repair Intake Idempotency Repository Contract + IdempotencyPort Adapter Integration Test / No DB No Repository Writer

## Status

Completed locally. Not staged.

## Scope

Added an integration-style test proving the pure Task1085 idempotency repository contract can be used as the injected idempotency storage dependency behind the existing idempotencyPort adapter. This remains a fully injected synthetic chain and does not introduce DB, repository writer, runtime wiring, global route mount, API shape, provider, AI/RAG, admin, or billing work.

## Implemented Files

- `tests/repairIntake/repairIntakeIdempotencyRepositoryContractPort.integration.test.js`
- `docs/task-1087-repair-intake-idempotency-repository-contract-port-integration-test-no-db-no-repository-writer.md`

## Integration Chain

The test builds this chain:

```text
synthetic raw idempotency repository-like object
-> createRepairIntakeIdempotencyRepositoryContract
-> createRepairIntakeIdempotencyPortAdapter
-> findExistingDraftToCaseResult / recordDraftToCaseResult
```

No DB or repository writer is used.

## Verified Behavior

Find no-existing:

- idempotencyPort adapter receives valid lookup input
- repository contract sanitizes lookup before raw repository call
- raw repository returns null
- contract returns sanitized no-existing behavior
- idempotencyPort adapter returns existing adapter no-existing envelope
- unsafe fields and markers do not leak

Find replay-ready:

- raw repository returns unsafe replay-like result
- repository contract sanitizes the result
- idempotencyPort adapter returns sanitized replay-ready envelope
- unsafe fields and markers do not leak

Record result:

- idempotencyPort adapter receives valid record input with `idempotencyKey` and safe `caseRef` or `result`
- repository contract sanitizes record input before raw repository call
- raw repository returns unsafe recorded-like result
- repository contract sanitizes the result
- idempotencyPort adapter returns sanitized recorded envelope
- unsafe fields and markers do not leak

Thrown/rejected behavior:

- raw repository find throws or rejects unsafe error markers
- contract catches and sanitizes the failure
- idempotencyPort adapter returns sanitized no-existing behavior based on its existing invalid-store-result handling
- raw repository record throws or rejects unsafe error markers
- contract catches and sanitizes the failure
- idempotencyPort adapter returns sanitized record-failed reason behavior
- no raw error text, stack, DB/SQL, credential, customer/LINE, or `finalAppointmentId` markers leak

## Sanitization

Safe lookup fields forwarded to the raw repository through the contract:

- `idempotencyKey`
- `draftId`
- `organizationId`
- `tenantId`
- `requestId`
- sanitized `metadata`

The existing idempotencyPort adapter sends actor data under `actor`; the Task1085 repository contract does not forward that top-level `actor` object to the raw repository. This preserves the current adapter shape without modifying production source.

Safe record fields forwarded:

- lookup fields
- sanitized `result`
- sanitized `caseRef`

Unsafe fields and markers are not forwarded or returned:

- raw rows
- SQL, DB, query, and paramsSql markers
- credentials and authorization headers
- phone, address, and customer data
- LINE markers
- `finalAppointmentId`
- stack traces and raw error text
- raw repository and connection objects
- token/secret markers

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
node --test tests/repairIntake/repairIntakeIdempotencyRepositoryContractPort.integration.test.js
node --test tests/repairIntake/repairIntakeIdempotencyRepositoryContractBoundary.static.test.js
node --test tests/repairIntake/repairIntakeIdempotencyRepositoryContract.unit.test.js
node --test tests/repairIntake/repairIntakeIdempotencyPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.

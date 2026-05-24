# Task1081 - Repair Intake Case Repository Contract + CaseCreator Adapter Integration Test / No DB No Repository Writer

## Status

Completed locally. Not staged.

## Scope

Added an integration-style test proving the pure Task1079 case repository contract can sit behind the existing caseCreator port adapter as an injected case creation dependency. This task is test/docs only and does not modify production source.

## Implemented Files

- `tests/repairIntake/repairIntakeCaseRepositoryContractCaseCreator.integration.test.js`
- `docs/task-1081-repair-intake-case-repository-contract-case-creator-integration-test-no-db-no-repository-writer.md`

## Integration Chain

The test builds this injected chain:

```text
synthetic raw case repository-like object
-> createRepairIntakeCaseRepositoryContract
-> createRepairIntakeCaseCreatorPortAdapter
-> createCaseFromDraft
```

No DB, repository writer, app route, server, provider, AI/RAG, billing, or admin module is imported.

## Verified Behavior

Success path:

- caseCreator receives unsafe creation input with draft and plan.
- caseCreator narrows creation input to safe fields.
- case repository contract sanitizes before calling the synthetic raw case repository.
- raw repository returns unsafe case-like object.
- case repository contract sanitizes the case result.
- caseCreator returns a sanitized caseRef envelope.

Invalid result path:

- raw repository returns null.
- case repository contract returns a sanitized create-failed envelope.
- caseCreator consumes the sanitized envelope without leaking unsafe fields.

Thrown/rejected path:

- raw repository throws or rejects with unsafe DB, SQL, credential, customer, LINE, finalAppointmentId, and stack markers.
- case repository contract converts the error to a sanitized create-failed envelope.
- caseCreator consumes the sanitized envelope without leaking raw error text.

## Sanitization

Safe creation fields verified:

- `draftId`
- `organizationId`
- `tenantId`
- `requestId`
- `actorId`
- sanitized `draft`
- sanitized `plan`

Unsafe fields and markers verified as not forwarded or returned:

- raw rows
- SQL/DB markers
- credentials
- phone/address/customer data
- LINE markers
- `finalAppointmentId`
- stack traces
- raw repository object

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
node --test tests/repairIntake/repairIntakeCaseRepositoryContractCaseCreator.integration.test.js
node --test tests/repairIntake/repairIntakeCaseRepositoryContractBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCaseRepositoryContract.unit.test.js
node --test tests/repairIntake/repairIntakeCaseCreatorPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCaseCreatorPortAdapter.unit.test.js
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.

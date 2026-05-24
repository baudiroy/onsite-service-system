# Task1211 - Repair Intake Case Repository Consumer Injected Repository Only / No DB / No Route

## Purpose

Task1211 adds a small runtime consumer layer for the Repair Intake case repository contract. The consumer proves that the case repository can be used only through an explicit injected dependency and can return a safe local envelope without opening any database connection, mounting a route, adding a controller, or exposing a public API shape.

## Runtime Boundary

- Added `src/repairIntake/repairIntakeCaseRepositoryConsumer.js`.
- The consumer requires an explicitly injected repository-like object with `createCaseFromDraft`.
- The consumer uses the existing `repairIntakeCaseRepositoryContract` as the normalization and output-container boundary from Task1208.
- Missing repository or missing `createCaseFromDraft` returns a safe `invalid_dependency` envelope.
- Empty or no-case repository output returns a safe non-success envelope.
- Repository failure returns a generic safe failure envelope without raw error details.
- Successful synthetic repository output returns only sanitized case identifiers, tenant/organization/request/actor references, summary, metadata, and warnings.

## Explicit Non-Scope

- No DB connection.
- No migration.
- No route, controller, app, server, or global mount.
- No public API shape change.
- No provider sending.
- No AI/RAG.
- No billing or settlement runtime.
- No admin code.
- No customer-visible DTO yet.
- No default repository writer or repository-backed persistence.

## Verification

- `node --test tests/repairIntake/repairIntakeCaseRepositoryConsumer.unit.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepositoryConsumerBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepositoryContract.unit.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepositoryContractBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepositoryContractIntegration.unit.test.js`
- `git diff --check`
- `git diff --cached --check`

## Future Approval Required

Any future route/controller mounting, customer-visible DTO, app/server wiring, repository-backed persistence, DB execution, migration, provider sending, AI/RAG call, billing/settlement path, smoke/shared runtime coverage, staging/commit cleanup, or public API exposure must be assigned as a separate PM-approved bounded task.

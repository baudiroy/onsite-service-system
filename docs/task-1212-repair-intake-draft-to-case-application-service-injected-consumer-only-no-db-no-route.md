# Task1212 - Repair Intake Draft-To-Case Application Service Injected Consumer Only / No DB / No Route

## Purpose

Task1212 adds a narrow application-service layer above the Task1211 injected repository consumer. It proves that a synthetic draft-to-Case request can be validated at the application boundary and delegated to the safe repository consumer without adding a database connection, route, controller, app/server mount, public API response contract, permission runtime, provider call, AI/RAG call, or billing/settlement path.

## Dependency Chain

- Task1208: repository contract output boundary.
- Task1211: injected repository consumer boundary.
- Task1212: injected application service boundary.

## Runtime Boundary

- Added `createRepairIntakeDraftToCaseInjectedConsumerApplicationService` to `src/repairIntake/repairIntakeDraftToCaseApplicationService.js`.
- The service requires an explicitly injected `caseRepositoryConsumer`.
- The injected consumer must expose `createCaseFromDraft`.
- The service accepts a synthetic request with `organizationId`, `actorId`, `repairIntakeDraftId`, optional `draftInput`, and optional request metadata.
- The service validates only minimal application-level fields:
  - `organizationId` is required.
  - `actorId` is required.
  - `repairIntakeDraftId` is required.
  - `draftInput` must be an object when provided.
- The service delegates repository-result normalization to Task1211 and Task1208 boundaries.
- The service returns safe envelopes for invalid input, invalid dependency, consumer success, consumer skipped/no-case, and consumer failure/throw.
- The service does not mutate request objects or consumer result objects.

## Explicit Non-Scope

- No DB execution.
- No migration.
- No route, controller, app, server, or global mount.
- No provider sending.
- No AI/RAG.
- No billing or settlement runtime.
- No customer-visible DTO.
- No permission/auth runtime.
- No public API exposure.
- No package changes.

## Verification

- `node --test tests/repairIntake/repairIntakeDraftToCaseApplicationService.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepositoryConsumer.unit.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepositoryConsumerBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepositoryContract.unit.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepositoryContractBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepositoryContractIntegration.unit.test.js`
- `git diff --check`
- `git diff --cached --check`

## Future Approval Required

Permission/authorization gates must be added before any public route or controller consumes this service. Any route/controller integration, app/server mount, customer-visible DTO, DB execution, migration, provider sending, AI/RAG call, billing/settlement path, smoke/shared runtime coverage, staging/commit cleanup, or public API exposure requires separate PM approval.

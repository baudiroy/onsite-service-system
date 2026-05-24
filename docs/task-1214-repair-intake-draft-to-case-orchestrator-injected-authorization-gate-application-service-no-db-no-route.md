# Task1214 - Repair Intake Draft-To-Case Orchestrator Injected Authorization Gate + Application Service / No DB / No Route

## Purpose

Task1214 adds a small pure orchestrator that composes the Task1213 authorization gate and the Task1212 draft-to-Case application service. The orchestrator enforces that authorization is checked before draft-to-Case execution while still avoiding route, controller, API, database, provider, AI/RAG, billing, settlement, and real auth/session/JWT rollout.

## Dependency Chain

- Task1208: repository contract output boundary.
- Task1211: injected repository consumer.
- Task1212: injected draft-to-Case application service.
- Task1213: injected authorization gate.
- Task1214: injected orchestrator.

## Required Order

Authorization must run before draft-to-Case execution. If authorization is denied, invalid, fails, or throws, the orchestrator returns a safe non-success envelope and does not call the application service.

## Runtime Boundary

- Added `src/repairIntake/repairIntakeDraftToCaseOrchestrator.js`.
- The orchestrator requires an explicitly injected `authorizationGate`.
- The orchestrator requires an explicitly injected `draftToCaseApplicationService`.
- The authorization gate must expose `authorizeDraftToCase`.
- The application service must expose `submitDraftToCase`.
- The orchestrator accepts a synthetic request with `organizationId`, `actorId`, `repairIntakeDraftId`, `source`, `actorRole`, and optional `draftInput`.
- The orchestrator returns sanitized safe envelopes for invalid dependency, authorization denied, authorization invalid input, authorization failure/throw, application service success, application service skipped/no-case, and application service failure/throw.
- The orchestrator does not mutate the request object, authorization result, or application service result.

## Explicit Non-Scope

- No DB execution.
- No migration.
- No route, controller, app, server, or global mount.
- No provider sending.
- No AI/RAG.
- No billing or settlement runtime.
- No customer-visible DTO.
- No real auth/session/JWT runtime.
- No hard-coded role matrix or organization bypass.
- No public API exposure.
- No package changes.

## Verification

- `node --test tests/repairIntake/repairIntakeDraftToCaseOrchestrator.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseOrchestratorBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseAuthorizationGate.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseAuthorizationGateBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseApplicationService.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepositoryConsumer.unit.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepositoryConsumerBoundary.static.test.js`
- `git diff --check`
- `git diff --cached --check`

## Future Approval Required

A future task may add static composition contract or adapter-only coverage if PM approves it separately. Any route/controller integration, app/server mount, customer-visible DTO, DB execution, migration, provider sending, AI/RAG call, billing/settlement path, smoke/shared runtime coverage, staging/commit cleanup, public API exposure, or real auth/session/JWT runtime requires separate PM approval.

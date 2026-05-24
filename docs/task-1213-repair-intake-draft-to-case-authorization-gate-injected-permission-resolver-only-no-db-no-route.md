# Task1213 - Repair Intake Draft-To-Case Authorization Gate Injected Permission Resolver Only / No DB / No Route

## Purpose

Task1213 adds a small pure authorization gate for the Repair Intake draft-to-Case flow. The gate is required before any future route, controller, or public API work so that draft-to-Case execution can pass through an explicit permission boundary.

## Dependency Chain

- Task1208: repository contract output boundary.
- Task1211: injected repository consumer.
- Task1212: injected draft-to-Case application service.
- Task1213: injected authorization gate.

## Runtime Boundary

- Added `src/repairIntake/repairIntakeDraftToCaseAuthorizationGate.js`.
- The gate requires an explicitly injected `permissionResolver`.
- The resolver must expose `canCreateCaseFromRepairIntakeDraft(context)`.
- The gate accepts a synthetic authorization context with `organizationId`, `actorId`, `repairIntakeDraftId`, `source`, and `actorRole`.
- The gate validates only minimal authorization input:
  - `organizationId` is required.
  - `actorId` is required.
  - `repairIntakeDraftId` is required.
- The gate returns safe envelopes for allowed, denied, invalid input, invalid dependency, and resolver failure/throw.
- Resolver throw is treated as a generic safe failure without leaking raw error details.
- The gate does not mutate authorization context objects or resolver result objects.
- The gate does not make permission decisions internally beyond fail-closed dependency and input handling.

## Explicit Non-Scope

- No DB execution.
- No migration.
- No route, controller, app, server, or global mount.
- No provider sending.
- No AI/RAG.
- No billing or settlement runtime.
- No customer-visible DTO.
- No real auth/session/JWT runtime.
- No hard-coded role matrix.
- No public API exposure.
- No package changes.

## Verification

- `node --test tests/repairIntake/repairIntakeDraftToCaseAuthorizationGate.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseAuthorizationGateBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseApplicationService.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepositoryConsumer.unit.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepositoryConsumerBoundary.static.test.js`
- `git diff --check`
- `git diff --cached --check`

## Future Approval Required

Task1214 may compose the authorization gate and application service in a pure orchestrator only if PM approves it separately. Any route/controller integration, app/server mount, customer-visible DTO, DB execution, migration, provider sending, AI/RAG call, billing/settlement path, smoke/shared runtime coverage, staging/commit cleanup, public API exposure, or real auth/session/JWT runtime requires separate PM approval.

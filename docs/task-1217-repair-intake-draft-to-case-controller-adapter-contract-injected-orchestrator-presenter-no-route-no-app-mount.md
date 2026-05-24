# Task1217 - Repair Intake Draft-To-Case Controller Adapter Contract Injected Orchestrator + Presenter / No Route / No App Mount

## Purpose

Task1217 adds a pure controller-adapter contract showing how a future route or controller may invoke the injected Task1214 orchestrator and Task1216 presenter. It does not register routes, mount app/server runtime, introduce HTTP method/path behavior, or expose customer-visible runtime.

## Dependency Chain

- Task1208: repository contract output boundary.
- Task1211: repository consumer.
- Task1212: application service.
- Task1213: authorization gate.
- Task1214: orchestrator.
- Task1215: synthetic integration.
- Task1216: public result presenter.
- Task1217: controller adapter contract.

## Runtime Boundary

- Added `src/repairIntake/repairIntakeDraftToCaseControllerAdapter.js`.
- The adapter requires an explicitly injected `orchestrator`.
- The adapter requires an explicitly injected `publicResultPresenter`.
- The orchestrator must expose `submitDraftToCase`.
- The presenter may be a function or expose `presentRepairIntakeDraftToCaseResult`.
- The adapter accepts only a synthetic request-like object with safe domain fields.
- The adapter builds a sanitized internal request, calls orchestrator first, then presenter, and returns presenter output only.
- Orchestrator throw is mapped through the presenter as a generic failure.
- Presenter throw returns a hardcoded minimal generic safe failure envelope.
- The adapter does not mutate the input, orchestrator result, or presenter result.

## Explicit No-Go

- No route registration.
- No app/server mount.
- No Express/Fastify/Koa request/response object.
- No public route path or HTTP method.
- No DB or migration.
- No provider sending.
- No Admin runtime.
- No AI/RAG.
- No billing or settlement runtime.
- No customer-visible runtime rollout.
- No real auth/session/JWT runtime.
- No package changes.

## Verification

- `node --test tests/repairIntake/repairIntakeDraftToCaseControllerAdapter.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseControllerAdapterBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePublicResultPresenter.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseOrchestratorContractIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseOrchestrator.unit.test.js`
- `git diff --check`
- `git diff --cached --check`

## Future Approval Required

A route mount adapter remains blocked until separate PM approval. Any real HTTP controller must add auth/session/context resolver first and must be approved separately. Any route/controller integration, app/server mount, customer-visible runtime, DB execution, migration, provider sending, AI/RAG call, billing/settlement path, smoke/shared runtime coverage, staging/commit cleanup, public API exposure, or real auth/session/JWT runtime requires separate PM approval.

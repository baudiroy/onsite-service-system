# Task1218 - Repair Intake Draft-To-Case Full Synthetic Adapter Integration / No Route / No HTTP

## Purpose

Task1218 validates the full injected draft-to-Case adapter chain using synthetic in-memory dependencies only. It proves a synthetic request can pass through the Task1217 controller adapter, Task1214 orchestrator, Task1213 authorization gate, Task1212 application service, Task1211 repository consumer, Task1208 repository contract boundary, and Task1216 presenter to produce a safe public-shaped result.

## Validated Chain

Synthetic request -> Task1217 controller adapter -> Task1214 orchestrator -> Task1213 authorization gate -> Task1212 application service -> Task1211 repository consumer -> Task1208 repository contract boundary -> Task1216 presenter -> safe public-shaped result.

## Covered Behavior

- Allowed authorization + repository success returns safe public success with only allowed public fields.
- Authorization denial stops before repository execution and returns safe public denied.
- Repository skipped/no-case returns safe public not-created.
- Repository throw with a raw sensitive message returns generic safe public failure without raw leakage.
- Unsafe request fields are not forwarded to permission resolver or repository path.
- Authorization resolver is called before repository path, and presenter runs after orchestrator path.
- Original synthetic request remains unchanged.

## Explicit Non-Scope

- No route registration.
- No HTTP server.
- No Express/Fastify/Koa request/response object.
- No DB execution.
- No migration.
- No SQL, psql, or db:migrate.
- No provider sending.
- No Admin runtime.
- No AI/RAG.
- No billing or settlement runtime.
- No customer-visible runtime.
- No real auth/session/JWT runtime.
- No package changes.

## Verification

- `node --test tests/repairIntake/repairIntakeDraftToCaseFullSyntheticAdapterIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseControllerAdapter.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseControllerAdapterBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePublicResultPresenter.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseOrchestratorContractIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseOrchestrator.unit.test.js`
- `git diff --check`
- `git diff --cached --check`

## Future Approval Required

A route-readiness closure/checkpoint or separately approved HTTP adapter plan may follow. Actual route/controller mount remains blocked until separate PM approval. Any app/server mount, customer-visible runtime, DB execution, migration, provider sending, AI/RAG call, billing/settlement path, smoke/shared runtime coverage, staging/commit cleanup, public API exposure, or real auth/session/JWT runtime requires separate PM approval.

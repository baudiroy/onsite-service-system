# Task1234 - Repair Intake Draft-To-Case Route Readiness Gate / No Route / No Runtime Change

## Purpose

Task1234 records the route-readiness decision gate before any real Repair Intake draft-to-Case route or controller mount.

This task is documentation plus static guard only. It does not add route files, controller files, app/server integration, HTTP framework usage, auth runtime, DB execution, migration, provider sending, Admin code, AI/RAG, billing/settlement runtime, customer-visible rollout, token parsing, JWT verification, push, or production source changes.

## Current Committed Baseline

- `035f1cf Add repair intake draft-to-case injected runtime chain`
- `05661ff Document repair intake draft-to-case branch closure`
- `ac9d513 Document repair intake draft-to-case push decision gate`

## Current Implemented Non-HTTP Chain

- Repository contract/output boundary.
- Repository consumer.
- Application service.
- Authorization gate.
- Orchestrator.
- Public result presenter.
- Controller adapter contract.
- Request context resolver.
- Synthetic handler.
- HTTP result mapper.
- Full synthetic `{ statusCode, body }` integration.

## Explicit Route Readiness Blockers Still Unresolved

- Real auth/session/JWT context resolver is not implemented.
- Route/controller mount is not approved.
- Route path and HTTP method are not approved.
- Production app/server integration is not approved.
- DB-backed repository verification is not approved.
- Migration or dry-run is not approved.
- Customer-visible API contract is not approved.
- Permission resolver must be wired to real organization isolation before route exposure.
- Audit log strategy for the draft-to-Case route is not approved.
- Rate limit, abuse handling, and idempotency behavior are not approved.

## Minimum Approval Checklist Before Any Route Task

- Exact route path.
- Exact HTTP method.
- Auth/session context source.
- Permission resolver source.
- Organization isolation enforcement.
- Request DTO fields.
- Response DTO fields.
- Idempotency behavior.
- Audit log event shape.
- Safe-deny/error message keys.
- DB target and migration status.
- Smoke/integration test scope.
- Explicit PM approval to touch route/controller/app/server files.

## Proposed Future Route Task Shape

This is not authorized in Task1234. A future route task should be separately approved and should keep these boundaries:

- Use an injected route adapter only.
- Do not access repositories directly from the route layer.
- Call the existing path in order: context resolver to synthetic handler to HTTP mapper.
- Do not send providers.
- Do not call AI/RAG.
- Do not touch billing or settlement.
- Do not bypass the authorization gate.

## Current No-Go

- No route registration.
- No controller folder integration.
- No app/server mount.
- No Express/Fastify/Koa request/response runtime.
- No DB execution.
- No migration.
- No provider sending.
- No Admin code.
- No AI/RAG.
- No billing or settlement runtime.
- No customer-visible runtime rollout.
- No real auth/session/JWT runtime.
- No token parsing or JWT verification.
- No push.

## Verification

- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteReadinessGate.static.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git log -3 --oneline`
- `git diff --cached --name-only`
- `git diff --name-only`

## Handoff Boundary

The committed Repair Intake draft-to-Case work is ready for a future explicit route decision, but it is not route-mounted. Any route/controller/app/server work must be assigned as a separate PM-approved bounded task with exact route path, method, auth/session source, permission resolver, organization isolation, request/response contract, idempotency behavior, audit event shape, DB/migration state, and test scope.

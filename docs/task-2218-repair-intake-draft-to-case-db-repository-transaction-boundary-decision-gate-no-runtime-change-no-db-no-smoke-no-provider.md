# Task2218 Repair Intake Draft-to-Case DB Repository Transaction Boundary Decision Gate

## Scope

- Adds this no-runtime-change DB/repository transaction boundary decision gate for Repair Intake draft-to-case.
- Adds a focused static guard for the current transaction authorization boundary.
- Does not implement DB writes, repository behavior, migrations, SQL execution, transaction logic, audit persistence, runtime wiring, providers, notifications, AI/RAG, billing, package changes, smoke probes, server/listener startup, or environment inspection.
- Does not authorize Task2219 or any future task.

## Current Boundary

- The current Repair Intake draft-to-case route remains admin/injected-only and hardened at `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`.
- The route remains permission-gated by `requirePermission` / `cases.create`.
- The route, API module, controller, application service, and synthetic handler remain injected-port based.
- The current route/admin/API/controller/application/synthetic boundary does not directly import DB packages, migration files, or repository implementations.
- Existing lower-level runtime-port and repository files are not modified by this task and are not expanded by this decision gate.

## Non-Authorized DB Transaction Boundary

- No DB/repository transaction behavior is authorized by this task.
- No SQL execution or SQL string construction for runtime is authorized by this task.
- No migration/schema change is authorized by this task.
- No repository implementation change is authorized by this task.
- No audit persistence is authorized by this task.
- Task2218 does not authorize audit persistence in the same transaction, in an independent write, or as best-effort behavior.
- Future DB/repository implementation requires a separate exact PM task.

## Future Decisions Required Before DB-Backed Implementation

- Source table/read model for Repair Intake draft.
- Target Case creation tables and required fields.
- Transaction boundary and rollback behavior.
- Idempotency/replay behavior.
- Organization isolation enforcement.
- Permission and actor attribution.
- Audit write coupling: same transaction vs independent/best-effort.
- Validation and conflict handling.
- Migration/schema/dry-run authorization.
- Smoke/staging/prod rollout authorization.

## Static Guard Coverage

- `tests/repairIntake/repairIntakeDraftToCaseDbRepositoryTransactionBoundaryDecisionGate.static.test.js` asserts current draft-to-case source files do not directly import DB packages.
- The guard asserts route/admin/API/controller/application/synthetic boundary files do not contain SQL execution or migration markers.
- The guard asserts repository implementation imports stay outside the route/admin/API/controller/application/synthetic boundary.
- The guard asserts the current route/admin/API/controller/application/synthetic boundary remains injected-port based.
- The guard inventories the existing DB-capable runtime ports factory as pre-existing lower-level code and does not authorize expanding it.
- The guard ties audit persistence back to Task2217 and confirms Task2218 does not implement or authorize audit persistence.

## Authorization Boundary

PM must still authorize one exact task at a time. This decision gate does not authorize Task2219, DB/repository implementation, transaction implementation, migrations, SQL execution, audit persistence, runtime exposure, smoke probes, provider work, or any future task.

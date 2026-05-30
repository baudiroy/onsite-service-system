# Task2219 Repair Intake Draft-to-Case DB Runtime Port Contract Inventory

## Scope

- Adds a no-runtime-change inventory of the existing DB runtime port and repository contract surface for Repair Intake draft-to-case.
- Adds a static inventory guard that reads current source files only.
- Does not implement DB behavior, SQL execution, migrations, repository changes, transaction logic, audit persistence, runtime wiring, providers, notifications, AI/RAG, billing, package changes, smoke probes, server/listener startup, or environment inspection.
- Does not authorize Task2220 or any future task.

## Inventory Summary

### admin route boundary

- Current admin route is `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`.
- It remains guarded by `requirePermission` / `cases.create`.
- It resolves runtime ports through injected route composition and does not directly import repository implementations.
- This seam is already hardened by Task2187-Task2218 through route, permission, trusted context, public exposure, safe-error, audit, and DB decision gates.

### API module / controller adapter / application service boundary

- API module creates safe controller/routes and registration around injected controller behavior.
- Controller accepts an injected application service only.
- Application service depends on injected `draftReader`, `casePlanner`, `caseCreator`, `auditWriter`, and optional `idempotencyPort`.
- Controller adapter and synthetic handler stay pure/injected/synthetic only and keep public output sanitized.
- This boundary is already hardened by Task2187-Task2218.

### injected runtime ports / runtime port factory

- `repairIntakeDraftToCaseInjectedRuntimeComposer.js` composes injected ports into the application service and HTTP module.
- `repairIntakeDraftToCaseRuntimePortsFactory.js` is DB-capable but not authorized for execution by this task.
- The runtime port factory can build draft, idempotency, case creation, conversion writer, and audit port surfaces from an injected query client.
- Task2219 inventories this lower-level surface only; it does not authorize using it, expanding it, or wiring it into runtime traffic.

### repository contract modules

- `repairIntakeDraftRepositoryContract.js` provides the draft lookup contract for `findDraftForConversion`.
- `repairIntakeCaseRepositoryContract.js` provides the case creation contract for `createCaseFromDraft`.
- `repairIntakeIdempotencyRepositoryContract.js` provides replay/read and writer contracts for draft-to-case idempotency.
- These contract modules are injected and sanitized seams. They are not DB execution authorization by themselves.

### audit writer port adapter boundary

- `repairIntakeAuditWriterPortAdapter.js` remains an injected audit writer port adapter around `auditPort.recordDraftToCaseDecision`.
- Task2217 remains the governing audit persistence decision gate.
- Task2219 does not authorize audit persistence.

### idempotency / request correlation boundary

- `repairIntakeIdempotencyPortAdapter.js` keeps idempotency lookup/recording behind an injected idempotency store.
- `repairIntakeDraftToCaseRequestContextResolver.js` keeps request context and draft input sanitized and server-owned.
- Request id, idempotency key, trusted organization, actor, role, source, and draft id handling are already hardened by Task2187-Task2218.

### public presenter / HTTP mapper boundary

- `repairIntakeDraftToCasePublicResultPresenter.js` maps internal results to a narrow public result.
- `repairIntakeDraftToCaseHttpResultMapper.js` maps that public result to HTTP status/body.
- The public success/error envelope remains allowlisted and sanitized.
- This seam is already hardened by Task2187-Task2218.

## Current Authorization Labels

- Already hardened by Task2187-Task2218: route exposure, public/open route gate, admin route composition, safe errors, request DTO, trusted context, permission denial, idempotency, request correlation, audit context, public presenter, HTTP mapper, audit persistence decision gate, and DB transaction decision gate.
- Pure/injected/synthetic only: route/admin/API/controller/application/synthetic boundaries and public presentation seams.
- DB-capable but not authorized for execution by this task: runtime ports factory and repository implementation surfaces behind injected ports.
- Future decisions are still required before DB-backed execution.

## Future Decisions Still Required Before DB-Backed Execution

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

## Static Inventory Guard Coverage

- `tests/repairIntake/repairIntakeDraftToCaseDbRuntimePortContractInventory.static.test.js` asserts route/admin/API/controller/application/synthetic boundaries remain injected-port based.
- The guard asserts repository implementation imports are not pulled into route/admin/API/controller/application/synthetic boundaries.
- The guard inventories the DB-capable runtime port factory without importing or executing it.
- The guard inventories repository contract modules as injected and sanitized seams.
- The guard inventories audit writer, idempotency, request correlation, public presenter, and HTTP mapper boundaries.
- The guard asserts Task2219 adds no DB execution, migration, SQL, runtime execution, or audit persistence implementation markers.

## Authorization Boundary

PM must still authorize one exact task at a time. This inventory does not authorize Task2220, DB-backed execution, repository implementation changes, transaction implementation, migrations, SQL execution, audit persistence, runtime exposure, smoke probes, provider work, or any future task.

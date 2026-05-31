# Task2324 Repair Intake Draft-to-Case Runtime Ports Factory DB-Backed Seam Wiring

## Scope

Task2324 wires accepted DB-backed Repair Intake draft-to-case seams into the runtime ports factory using injected dependencies only.

No DB command, real DB connection, migration, route, server, smoke, endpoint, provider, package, or deploy behavior is introduced.

## Changed Boundary

- Source boundary: `src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js`.
- The factory continues to require an explicit injected `dbClient` and `idGenerator`.
- The factory now also returns app-level adapter ports for the accepted seams:
  - `draftReader`
  - `idempotencyPort`
  - `casePlanner`
  - `caseCreator`
  - `auditWriter`
- The factory now returns `caseCreatorRepository` only when an explicit injected `transactionRunner` is provided.

## Composition Behavior

- `draftReader` is composed from the accepted DB-backed draft repository and draft reader port adapter.
- `idempotencyPort` is composed from the accepted DB-backed idempotency repository/store and idempotency port adapter.
- `caseCreator` remains compatible with the existing application-service `createCaseFromDraft` port.
- `caseCreatorRepository` wires the accepted Task2321 transaction skeleton behind injected `caseRepository`, draft link repository, audit writer, and `transactionRunner` seams.
- Composition does not call fake query or transaction clients.
- Missing `transactionRunner` omits `caseCreatorRepository` while preserving existing runtime factory outputs.

## Verification Coverage

- Added `tests/repairIntake/repairIntakeDraftToCaseRuntimePortsFactoryDbBackedSeams.unit.test.js`.
- Added `tests/repairIntake/repairIntakeDraftToCaseRuntimePortsFactoryDbBackedSeams.static.test.js`.
- Unit tests prove fake-only composition, no composition-time DB/transaction calls, explicit transaction dependency behavior, focused fake invocation of draft reader/idempotency/case creator transaction skeleton ports, and no dependency mutation.
- Static tests assert no `DATABASE_URL`, `process.env`, direct DB pool creation, app/server/listener imports, migration execution strings, smoke/endpoint/deploy/Zeabur markers, provider sending, AI/RAG, billing, package coupling, or real runtime coupling.

## Runtime Statement

- No DB commands were run.
- No SQL was executed against a real DB.
- No real DB connection was created.
- No migration was created, dry-run, or applied.
- No server/listener was started.
- No smoke or endpoint probes were run.
- No provider, AI/RAG, billing, admin frontend, Customer Access, Engineer Mobile, package, or package-lock files were changed.

## Follow-Up Boundary

Task2324 does not authorize route wiring, migration, real database execution, deploy, smoke, or provider sending. Future work still requires PM approval one exact task at a time.

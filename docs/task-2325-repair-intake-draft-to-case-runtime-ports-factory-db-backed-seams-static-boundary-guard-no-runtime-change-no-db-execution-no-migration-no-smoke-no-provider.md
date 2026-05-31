# Task2325 Repair Intake Draft-to-Case Runtime Ports Factory DB-Backed Seams Static Boundary Guard

## Scope

Task2325 adds a text-only static boundary guard for the DB-backed seam composition accepted in Task2324.

No runtime, source, route, repository, migration, package, provider, or test behavior was changed beyond adding this guard and this documentation.

## Guarded Boundary

- Runtime factory: `src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js`
- Task2324 focused unit/static tests and documentation
- Accepted DB-backed seam tests for:
  - draft reader organization and tenant scope
  - idempotency organization, draft, operation, key, and tenant scope
  - case creator injected transaction skeleton

## Static Coverage

The new guard verifies that:

- the factory still requires an explicit injected `dbClient`
- the factory still requires an explicit `idGenerator`
- draft reader, idempotency, planner, case creator, case creator repository, and audit writer ports remain wired through accepted adapter/repository seams
- `caseCreatorRepository` is only exposed when an explicit injected `transactionRunner` is present
- missing `transactionRunner` omits `caseCreatorRepository` while preserving the existing factory output surface
- Task2324 tests continue to prove no composition-time fake query or transaction calls
- Task2324 tests continue to prove injected dependency objects are not mutated
- existing focused seam tests continue to cover org/tenant/idempotency/transaction boundaries

## Forbidden Coupling Guarded

The static guard asserts that the runtime factory source does not introduce:

- `DATABASE_URL` or `process.env`
- direct DB pool creation or `pg` imports
- app/server/listener imports
- migration execution strings
- smoke, endpoint, deploy, Zeabur, or `/healthz` markers
- provider sending
- AI/RAG/OpenAI/vector DB runtime behavior
- billing, settlement, payment, or invoice behavior
- package or package-lock coupling

## Runtime Statement

- No DB commands were run.
- No SQL was executed against a real DB.
- No real DB connection was created.
- No migration was created, dry-run, or applied.
- No server/listener was started.
- No smoke or endpoint probes were run.
- No env, Zeabur, or secrets were inspected.
- No provider, AI/RAG, billing, admin frontend, Customer Access, Engineer Mobile, package, or package-lock files were changed.

## Follow-Up Boundary

Task2325 freezes Task2324's runtime ports factory seam boundary only. It does not authorize route wiring, real database execution, migration work, endpoint smoke, provider sending, audit persistence implementation, or any next runtime slice. Future work still requires PM approval one exact task at a time.

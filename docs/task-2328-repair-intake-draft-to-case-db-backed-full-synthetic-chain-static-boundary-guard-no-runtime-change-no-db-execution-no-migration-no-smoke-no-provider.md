# Task2328 Repair Intake Draft-to-Case DB-Backed Full Synthetic Chain Static Boundary Guard

## Scope

Task2328 adds a text-only static guard for the full fake/synthetic DB-backed Repair Intake draft-to-case chain accepted in Task2326 and checkpointed in Task2327.

No runtime, source, route, repository, migration, package, provider, or production behavior was changed.

## Guarded Boundary

The new guard reads source, test, and docs as text only:

- `tests/repairIntake/repairIntakeDraftToCaseDbBackedFullSyntheticChain.unit.test.js`
- `src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js`
- `src/repairIntake/repairIntakeDraftToCaseApplicationService.js`
- `src/repairIntake/repairIntakeDraftToCaseApiModule.js`
- Task2326 doc
- Task2327 checkpoint
- Task2328 doc

It does not import or execute the runtime factory, application service, API module, DB clients, migration code, server code, or provider code.

## Static Coverage

The guard freezes that the Task2326 full synthetic test:

- composes runtime ports factory, application service, and API module
- uses fake/injected query clients only
- uses fake/injected transaction runner only
- avoids route mount, server, and listener behavior
- avoids real DB clients and migration runners
- covers draft reader query, idempotency lookup, idempotency record, fake transaction create/link/audit/commit, and safe application/API output
- covers cross-organization draft rows, wrong idempotency replay scope, transaction create/link/audit/commit failures, malformed draft rows, malformed case writer results, and malformed idempotency writer results
- keeps Task2326's application-service object-shaped port failure fix visible
- keeps unsafe leakage and no-mutation coverage visible

## Forbidden Coupling Guarded

The guard asserts no forbidden coupling is introduced into the guarded synthetic chain:

- no `DATABASE_URL`
- no `process.env`
- no direct DB pool creation
- no route mount/server/listener behavior
- no migration execution strings
- no smoke, endpoint, deploy, or Zeabur markers
- no provider sending
- no package or package-lock coupling

## Runtime Statement

- No DB commands were run.
- No SQL was executed against a real DB.
- No real DB connection was created.
- No migration was created, dry-run, or applied.
- No server/listener was started.
- No smoke or endpoint probes were run.
- No env, Zeabur, or secrets were inspected.
- No provider sending occurred.
- No package or package-lock files were changed.

## Follow-Up Boundary

Task2328 freezes the full fake/synthetic DB-backed chain coverage only. It does not authorize route mounting, real DB execution, migration work, smoke testing, provider sending, audit persistence implementation, or deploy. Future work still requires PM approval one exact task at a time.

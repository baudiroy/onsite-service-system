# Task2326 Repair Intake Draft-to-Case DB-Backed Full Synthetic Chain

## Scope

Task2326 adds a focused fake-only synthetic chain test for the accepted Repair Intake draft-to-case DB-backed seams.

No route, repository implementation, migration, package, provider, or production DB behavior was changed.

A narrow application-service fail-closed fix was added after the synthetic chain proved that `{ ok: false }` results from the case creator, audit writer, or idempotency record port could otherwise be treated as successful object-shaped responses.

## Synthetic Chain Covered

The new test composes:

- `createRepairIntakeDraftToCaseRuntimePorts`
- `createRepairIntakeDraftToCaseApplicationService`
- `createRepairIntakeDraftToCaseApiModule`
- fake query client
- fake transaction runner
- fake case repository writer
- fake case creator audit writer

The API module is exercised through an injected controller facade that calls the real application service and returns a safe handler envelope. No route mount, server, or listener is created.

## Successful Flow Proven

The test proves a successful fake-only draft-to-case submit path:

- draft reader reads the matching organization and draft through the fake query client
- idempotency lookup and record use the scoped fake query client
- case creator repository transaction skeleton runs through the fake transaction runner
- create/link/audit/commit sequence is represented
- application/API output remains safe and compatible with the existing handler envelope

## Fail-Closed Coverage

The test also proves fail-closed behavior for:

- cross-organization draft row
- wrong idempotency replay scope
- transaction create failure
- transaction link failure
- transaction audit failure
- transaction commit failure with rollback attempt
- malformed draft row
- malformed case writer result
- malformed idempotency writer result

## Narrow Source Fix

`src/repairIntake/repairIntakeDraftToCaseApplicationService.js` now treats object-shaped port results with `ok: false` or `status: failed` as failed port results during submit. This keeps the application service fail-closed when an accepted seam returns a sanitized failure envelope instead of throwing.

The change is limited to the accepted draft-to-case application-service seam and does not change route paths, route mounting, controller code, repository implementations, DB clients, migrations, providers, env, package files, or server/listener behavior.

## No Raw Leakage And No Mutation

The test asserts safe outputs and downstream inputs do not expose:

- raw DB rows
- raw body/service payloads
- SQL, stack, or database errors
- token/password/secret fields
- provider payloads
- AI/RAG/OpenAI/vector markers
- billing/settlement/payment/invoice markers
- customer private/contact/address fields
- audit internals

The test also snapshots request, fake row, and fake dependency objects to prove they are not mutated by the chain.

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

Task2326 does not authorize route mounting, real DB execution, migration work, smoke testing, provider sending, audit persistence implementation, or deploy. Future work still requires PM approval one exact task at a time.

# Task2321 Repair Intake Draft-to-Case DB-Backed Case Creator Transaction Skeleton

## Scope

Task2321 adds a transaction-capable skeleton to the Repair Intake case creator repository adapter using injected transaction interfaces only.

This task does not execute a database, create or run migrations, start a server, run smoke probes, add routes, or send providers.

## Changed Boundary

- Source boundary: `src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.js`.
- The adapter still depends on injected case repository, draft repository, audit writer, transaction runner, and clock seams.
- Existing `runInTransaction` / `transaction` callback runners remain supported.
- A manual injected transaction seam is now also supported through `begin` / `commit` / `rollback` style methods.

## Behavior

- Trusted server-owned `command` input is required.
- `organizationId` remains required.
- `tenantId` is carried through the command, case candidate, and draft-link call when present.
- Client-controlled `requestBody`, `draftInput`, `body`, `client`, `headers`, `query`, and `rawBody` fields are rejected before transaction work.
- Case creation, draft linking, and audit writing run inside the injected transaction callback/skeleton.
- Commit is called only through the injected transaction object or runner.
- Rollback is attempted on create/link/audit failures and on commit failure when the injected transaction seam supports rollback.
- Rollback failure is swallowed and does not expose raw details.
- Begin/commit/create/link/audit failures fail closed with sanitized reason codes.
- Inputs and repository result objects are not mutated.

## Verification Coverage

- Added `tests/repairIntake/repairIntakeCaseCreatorDbBackedTransactionSkeleton.unit.test.js`.
- Added `tests/repairIntake/repairIntakeCaseCreatorDbBackedTransactionBoundary.static.test.js`.
- Unit tests use fake in-memory transaction objects only.
- Static tests assert no direct DB pool creation, no env/Zeabur/secrets usage, no route/controller/public/open-route behavior, no migration execution strings, no provider sending, no AI/RAG, no billing, no audit persistence implementation, and no idempotency implementation changes.

## Runtime Statement

- No DB commands were run.
- No real DB connection was created.
- No SQL was executed against a database.
- No migration was created, dry-run, or applied.
- No server/listener was started.
- No smoke or endpoint probes were run.
- No provider, AI/RAG, billing, admin frontend, Customer Access, Engineer Mobile, package, or package-lock files were changed.

## Follow-Up Boundary

Task2321 does not authorize any route wiring, migration, real database execution, deploy, or runtime smoke. Future work still requires PM approval one exact task at a time.

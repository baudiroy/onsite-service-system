# Task2318 Repair Intake Draft-to-Case DB-Backed Idempotency Port Static Boundary Guard

## Scope

Task2318 adds a static boundary guard for the Task2317 DB-backed idempotency adapter/repository seam.

This task is docs and tests only. It does not change runtime/source behavior.

## Guard Coverage

The static guard freezes these Task2317 boundaries:

- trusted top-level `organizationId`, `repairIntakeDraftId`/`draftId`, `idempotencyKey`, and optional `tenantId` context
- no client-controlled `body`, `draftInput`, `query`, `headers`, or `client` scope override
- lookup scoped by organization id, operation type, idempotency key, draft id, and tenant when present
- record/write scoped by organization id, idempotency key, draft id, tenant when present, and safe request fingerprint
- malformed scoped DB rows are not backfilled from lookup or record context
- missing/malformed context, cross-org rows, wrong-tenant rows, wrong-draft rows, wrong-idempotency-key rows, malformed write results, and repository/query errors fail closed
- missing write rows do not invent successful recorded envelopes
- raw DB rows, SQL, stack traces, database errors, token/password/secret, provider payloads, AI/RAG, billing, audit internals, customer private/contact/address fields, and raw service payloads remain covered by unsafe leakage tests
- inputs and raw row/result objects are not mutated

## No Runtime Execution

The guard reads source, test, and doc files as text only. It does not import or execute DB/runtime/provider code.

No DB commands, SQL execution against a database, migrations, smoke tests, endpoint probes, server/listener startup, env/Zeabur/secrets inspection, provider sending, package changes, or runtime/source changes are authorized by this task.

# Task2320 Repair Intake Draft-to-Case Case Creator Repository Contract Pre-Transaction Guard

## Scope

Task2320 adds a pre-transaction contract/static guard around the Repair Intake draft-to-case case creator repository boundary.

This task is intentionally limited to the pre-transaction contract boundary, focused tests, and documentation. It does not start or implement the case creator transaction path.

## Added Guard Coverage

- Added `tests/repairIntake/repairIntakeCaseCreatorRepositoryPreTransactionContract.unit.test.js`.
- Added `tests/repairIntake/repairIntakeCaseCreatorRepositoryPreTransactionBoundary.static.test.js`.
- The unit guard exercises the existing repository contract and repository seam with synthetic injected dependencies only.
- The static guard checks the existing case creator/repository/planner/adapter boundary sources for injected seams, trusted scope markers, allowlisted field handling, fail-closed markers, and forbidden runtime coupling markers.

## Contract Assertions

- Trusted `organizationId` and `tenantId` are represented through the safe creation command path when present.
- Client-controlled `requestBody`, `draftInput`, `body`, `client`, `headers`, `query`, and `rawBody` fields cannot provide or override trusted scope.
- Creation input forwarded to the injected dependency is restricted to safe contract fields.
- Malformed command input fails closed before dependency execution.
- Malformed dependency results fail closed.
- Thrown or rejected dependency errors fail closed.
- Raw DB rows, SQL, stack traces, database error details, provider payloads, token/password/secret fields, private customer/contact/address fields, raw service payloads, billing payloads, and audit internals are not exposed.
- Input command objects and dependency result objects are not mutated.

## Source Hardening

- Expanded the existing sanitizer deny-lists in the case repository contract, repository, creator port adapter, and planner port adapter for client/request-body, provider payload, billing payload, password/secret/token, raw repository/result/service payload, and database-error fields.
- Hardened the case repository contract so repository results with `ok: false`, non-object results, or missing safe case references fail closed instead of being normalized as created envelopes.
- This is not a transaction implementation and does not add DB, route, server, provider, AI/RAG, billing, or migration execution behavior.

## Boundary Assertions

- The repository contract remains injected and contract based.
- Pre-transaction files do not introduce route/controller/public route behavior.
- Pre-transaction files do not introduce direct DB execution, server/listener, env, provider, AI/RAG, billing, or admin coupling.
- Migration execution strings are not introduced.
- Provider sending markers are not introduced.
- Task2320 does not authorize a transaction implementation.

## Runtime Statement

- Runtime/source changes are limited to sanitizer deny-list expansion and contract fail-closed handling at the pre-transaction seam.
- No DB commands were run.
- No migration commands were run.
- No smoke or endpoint probes were run.
- No server/listener was started.
- No provider, AI/RAG, billing, Customer Access, Engineer Mobile, admin frontend, package, or migration files were changed.

## Follow-Up Boundary

Future work must still be authorized by PM one exact task at a time. Importantly, this Task2320 guard does not authorize Task2321 or any transaction implementation.

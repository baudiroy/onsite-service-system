# Task2315 Repair Intake Draft-to-Case DB-Backed Draft Reader Port Adapter

Status: completed implementation slice

Task2315 hardens the smallest DB-backed Repair Intake draft reader seam behind the existing injected port boundary. It changes source behavior narrowly in the draft reader adapter and DB-backed draft repository only.

## Changed Files

- `src/repairIntake/repairIntakeDraftReaderPortAdapter.js`
- `src/repairIntake/repairIntakeDraftRepository.js`
- `tests/repairIntake/repairIntakeDraftReaderPortAdapterDbBacked.unit.test.js`
- `tests/repairIntake/repairIntakeDraftReaderPortAdapter.unit.test.js`
- `tests/repairIntake/repairIntakeDraftRepository.unit.test.js`
- `docs/task-2315-repair-intake-draft-to-case-db-backed-draft-reader-port-adapter-no-db-execution-no-migration-no-smoke-no-provider.md`

## Boundary Changed

- The draft reader adapter now accepts `repairIntakeDraftId` as the preferred trusted draft id source, with `draftId` and route params as fallback trusted server-owned sources.
- The draft reader adapter now requires a trusted `organizationId` before calling the repository.
- The draft reader adapter now fails closed when the repository returns a failure envelope, a malformed draft, or a draft whose id/organization/tenant scope does not match the trusted lookup.
- The DB-backed draft repository now requires `organizationId` and always includes `organization_id` in the parameterized lookup.
- The DB-backed draft repository now returns `null` for rows whose id, organization, or requested tenant does not match the trusted lookup.

## Final Behavior

- Successful draft reads use an injected query client only.
- The DB lookup is parameterized by draft id and organization id, with tenant id included when provided.
- Missing draft id, missing organization id, missing rows, malformed rows, cross-organization rows, wrong-tenant rows, and query failures fail closed.
- Output remains sanitized and compatible with the existing draft-to-case application service expectations.
- Raw DB rows, SQL text values, stack traces, database errors, provider payloads, AI/RAG fields, billing fields, audit internals, token/password/secret fields, and customer private/contact/address fields are not exposed.
- Input objects and returned row objects are not mutated.

## Non-Authorized Scope

Task2315 does not authorize or perform DB execution against a real database, SQL execution against a database, migration creation, migration dry-run/apply, environment or secret inspection, Zeabur inspection, server/listener startup, smoke tests, endpoint probes, shared runtime, deploy, staging/prod traffic, provider sending, audit persistence, case creator transaction implementation, idempotency persistence, route path/mount changes, public/open/customer route expansion, auth/session changes, rate limiting, payload-size/body-parser changes, permission model changes, package changes, Customer Access behavior, Engineer Mobile behavior, admin frontend, billing, or AI/RAG runtime behavior.

## Verification Scope

Verification is limited to focused unit/static/injected-chain tests with fake/in-memory dependencies and text-only static guards. No real DB, migration, smoke, server, endpoint, provider, env, Zeabur, or secrets command is authorized by this task.

## Held Docs

The same 7 held historical untracked docs remain outside Task2315 scope and must stay untouched unless PM explicitly authorizes that exact action.

# Task2316 Repair Intake Draft-to-Case DB-Backed Draft Reader Static Boundary Guard

Status: static guard only

Task2316 adds a no-runtime-change static guard for the Task2315 DB-backed draft reader seam. It reads source, test, and doc files as text only and does not import or execute DB, runtime, provider, server, migration, smoke, endpoint, env, Zeabur, or secrets code.

## Added Files

- `tests/repairIntake/repairIntakeDraftReaderDbBackedBoundary.static.test.js`
- `docs/task-2316-repair-intake-draft-to-case-db-backed-draft-reader-static-boundary-guard-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md`

## Static Boundary Coverage

- Freezes trusted `repairIntakeDraftId` priority in the draft reader adapter.
- Freezes trusted `organizationId` requirement before repository read.
- Freezes fail-closed handling for malformed input, repository failure envelopes, malformed drafts, and draft id / organization / tenant mismatch.
- Confirms body, draft input, query, and header-like client-controlled fields do not become trusted organization or draft sources.
- Freezes DB-backed repository requirement for `organizationId`.
- Freezes parameterized query shape for draft id + organization id, with tenant id included when present.
- Confirms missing, malformed, cross-organization, and wrong-tenant rows return null or safe failure.
- Confirms raw DB rows and raw query errors are not returned directly.
- Confirms the Task2315 focused unit test still covers success, fail-closed cases, raw leakage protection, trusted-context override prevention, and no mutation.
- Confirms source files do not introduce direct runtime/env/provider/migration/server behavior.

## Non-Authorized Scope

Task2316 changes no runtime/source behavior. It does not authorize or perform DB execution, SQL execution against a database, real DB connection creation, migration creation, migration dry-run/apply, env or secret inspection, Zeabur inspection, server/listener startup, smoke tests, endpoint probes, shared runtime, deploy, staging/prod traffic, provider sending, audit persistence, case creator transaction implementation, idempotency persistence, route path/mount changes, public/open/customer route expansion, auth/session changes, rate limiting, payload-size/body-parser changes, permission model changes, package changes, Customer Access behavior, Engineer Mobile behavior, admin frontend, billing, or AI/RAG runtime behavior.

## Authorization Boundary

Task2316 does not authorize Task2317 or any future implementation slice. PM must still authorize one exact task at a time.

## Held Docs

The same 7 held historical untracked docs remain outside Task2316 scope and must stay untouched unless PM explicitly authorizes that exact action.

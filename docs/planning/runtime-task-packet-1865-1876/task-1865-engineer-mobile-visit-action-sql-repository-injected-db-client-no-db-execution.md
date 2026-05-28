# DRAFT PM Task Specification

Status:
- Draft only.
- Not authorization to execute.
- Must not be run unless PM explicitly assigns this exact task.
- Any DB / migration / seed / deploy / smoke action requires separate explicit approval.

Global restrictions:
- Do not print `DATABASE_URL`, `JWT_SECRET`, tokens, private keys, provider keys, passwords, passphrases, or Zeabur secrets.
- Do not touch LINE / OpenAI / R2 provider integrations unless a specific future task explicitly scopes them.
- Do not create or publish Completion Report / Field Service Report.
- Do not mutate `finalAppointmentId`.
- Do not create customer-visible publication behavior.
- Do not bypass organization isolation.
- Do not touch the 7 held historical untracked docs.
- Do not run DB / migration / seed / deploy / smoke unless the exact assigned task explicitly allows it and PM/user approval is present.

# Task1865 — Engineer Mobile Visit Action SQL Repository Implementation / Injected DB Client / No DB Execution

## Phase

Phase 1 — SQL Repository Runtime Implementation / 不連 DB 的 repository 實作.

## Current accepted baseline

- Task1861 route wiring is deployed and reachable on Zeabur.
- Runtime route: `POST /engineer-mobile/appointments/:appointmentId/actions/:action`.
- Zeabur `/healthz` = HTTP 200.
- Unauthenticated route probes return HTTP 403 safe deny, not 404.
- Task1864 migration 023 dry-run accepted:
  - disposable local Docker PostgreSQL only.
  - migrations 001–019 baseline applied only in disposable DB.
  - migrations 020 / 021 / 022 / 024 / 025 not executed.
  - migration 023 ran inside `BEGIN ... ROLLBACK` only.
  - dry-run PASS and rollback verified.
  - no Zeabur/shared/prod DB touched.
  - no secrets printed.
- No real SQL repository implementation exists yet.

## Goal

Implement the Engineer Mobile visit action SQL repository adapter using an injected DB client interface.

This task must not connect to any real DB, run migrations, run seed, or start runtime.

## Scope

1. Inspect existing Engineer Mobile repository contracts/adapters/services.
2. Add or complete the SQL repository adapter for visit action persistence fields introduced by migration 023.
3. Use injected `dbClient` only.
4. Keep adapter isolated from global pool/runtime connection creation.
5. Add unit tests with synthetic `dbClient` only.
6. Add static boundary tests.
7. Add a concise task doc:
   - `docs/task-1865-engineer-mobile-visit-action-sql-repository-injected-db-client-no-db-execution.md`.

## Functional requirements

- Repository should support only the minimal persistence operations needed by the existing Engineer Mobile visit action service.
- Preserve organization isolation / engineer assignment expectations already enforced by service/query boundary.
- Persist or update only migration-023 visit-action fields explicitly required by the service.
- Do not introduce schema assumptions beyond migration 023.
- Use parameterized queries only.
- Return normalized result envelopes.
- Do not expose raw DB rows directly to higher HTTP layers.
- Failure results must be sanitized and compatible with existing service/handler/presenter behavior.
- Do not change public API response shape unless existing tests require it.

## Tests

Add unit tests using synthetic `dbClient` for:

- Accepted update path.
- No matching appointment / safe not-found or denied path.
- Persistence failure path.
- Transaction/client error path if applicable.
- Parameterized query usage.
- Raw SQL errors not exposed.

Add static boundary tests proving:

- No direct `DATABASE_URL` usage.
- No global pool construction.
- No `src/app.js` or `src/server.js` import.
- No migration execution.
- No provider sending.
- No Completion Report / FSR creation.
- No `finalAppointmentId` mutation.
- No customer-visible publication behavior.

## Verification

Run:

- Relevant Engineer Mobile visit-action tests.
- `npm run check`.

## Commit

If tests pass, commit only Task1865 files.

Suggested commit message:

```text
Task1865 engineer mobile visit action sql repository
```

## Completion report must include

- Files changed.
- Summary of repository operations implemented.
- Test results.
- `npm run check` result.
- Commit hash if committed.
- Confirmation no DB connection.
- Confirmation no migration/seed.
- Confirmation no runtime start.
- Confirmation no Zeabur changes.
- Confirmation no secrets printed.
- Confirmation no Completion Report / FSR / `finalAppointmentId` / customer-visible publication behavior.
- Confirmation 7 held historical untracked docs untouched.

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

# Task1866 — Engineer Mobile Visit Action SQL Repository Contract Hardening / No DB Execution

## Phase

Phase 1 — SQL Repository Runtime Implementation / 不連 DB 的 repository 實作.

## Prerequisite

Task1865 must be completed and PM accepted.

## Goal

Harden the SQL repository contract and boundary tests after Task1865.

No real DB execution is allowed.

## Scope

1. Review Task1865 repository adapter and tests.
2. Strengthen repository result-envelope contract tests.
3. Strengthen static boundary tests around DB safety and project invariants.
4. Add task doc:
   - `docs/task-1866-engineer-mobile-visit-action-sql-repository-contract-hardening-no-db-execution.md`.

## Contract hardening requirements

Verify:

- Parameterized query usage.
- Sanitized DB/client failures.
- No raw DB row exposure.
- No direct `DATABASE_URL` usage.
- No global pool construction.
- No `src/app.js` or `src/server.js` import.
- No migration execution.
- No provider sending.
- No Completion Report / FSR creation.
- No `finalAppointmentId` mutation.
- No customer-visible publication behavior.
- Existing handler/presenter failure behavior remains compatible.

## Tests

- Synthetic/injected `dbClient` tests only.
- No real database.
- No migration dry-run.
- No runtime start.
- Re-run relevant Engineer Mobile visit-action tests.
- Run `npm run check`.

## Commit

If tests pass, commit only Task1866 files.

Suggested commit message:

```text
Task1866 harden engineer mobile visit action sql repository contract
```

## Completion report must include

- Files changed.
- Contract hardening summary.
- Test results.
- `npm run check` result.
- Commit hash if committed.
- Confirmation no DB/SQL/migration/seed.
- Confirmation no runtime start.
- Confirmation no Zeabur/deploy/smoke.
- Confirmation no secrets printed.
- Confirmation no Completion Report / FSR / `finalAppointmentId` / customer-visible publication behavior.
- Confirmation 7 held historical untracked docs untouched.

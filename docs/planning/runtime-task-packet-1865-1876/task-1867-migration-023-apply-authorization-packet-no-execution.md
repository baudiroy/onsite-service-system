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

# Task1867 — Migration 023 Apply Authorization Packet / No Execution

## Phase

Phase 2 — Migration Authorization Gate / migration 授權與目標檢查.

## Prerequisite

Task1865 and Task1866 should be PM accepted.

## Goal

Create an authorization packet/checklist for any future migration 023 apply.

This task must not connect to a DB or execute SQL.

## Scope

Create a task doc describing the exact approval requirements and safety boundaries for applying migration 023 to a named target.

Suggested doc path:

- `docs/task-1867-migration-023-apply-authorization-packet-no-execution.md`.

## Required content

The authorization packet must include:

- Current migration 023 dry-run evidence from Task1864.
- Statement that migration 023 has not been applied to Zeabur/shared/prod DB.
- Exact approved target requirement:
  - disposable local/test DB, or
  - explicitly named Zeabur test DB / approved environment.
- Explicitly forbidden targets:
  - production DB,
  - shared DB,
  - unknown Zeabur DB,
  - any target inferred from generic “continue” instructions.
- Exact approval phrase required before execution.
- Rule that `DATABASE_URL` and credentials must never be printed.
- Rule that seed/smoke/provider sending are out of scope.
- Rollback/stop conditions.

## Suggested approval phrase

```text
I approve applying migration 023 to the explicitly named target: <TARGET_NAME>. Do not use any other DB. Do not print DATABASE_URL or secrets. Do not run seed or runtime smoke.
```

## Verification

- `git status --short`.
- `npm run check`.

## Commit

If check passes, commit only Task1867 documentation.

Suggested commit message:

```text
Task1867 add migration 023 apply authorization packet
```

## Completion report must include

- Created doc path.
- Commit hash if committed.
- `npm run check` result.
- Confirmation no DB connection.
- Confirmation no SQL/migration/seed execution.
- Confirmation no secrets printed.
- Confirmation no push.
- Confirmation 7 held historical untracked docs untouched.

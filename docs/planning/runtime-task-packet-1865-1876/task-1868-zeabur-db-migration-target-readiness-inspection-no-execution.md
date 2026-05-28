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

# Task1868 — Zeabur DB Migration Target Readiness Inspection / No Execution

## Phase

Phase 2 — Migration Authorization Gate / migration 授權與目標檢查.

## Prerequisite

Task1867 must be completed and PM accepted.

## Goal

Inspect whether a safe migration target exists for migration 023.

This task is inspection only. No DB connection, no SQL execution, and no secret printing.

## Scope

Using Zeabur UI/browser only if explicitly needed, inspect and report non-secret target readiness.

## Required checks

- Confirm whether there is a PostgreSQL service intended for test/staging/production.
- Identify the target by safe non-secret name only.
- Confirm whether target is disposable/test or shared/prod.
- Confirm whether migration 023 has already been applied, if discoverable without DB connection.
- Confirm whether `DATABASE_URL` is configured by name/reference only, without revealing value.
- Confirm no seed or provider variables are being used for this task.

## Forbidden

- Do not print `DATABASE_URL` or credentials.
- Do not connect to DB.
- Do not run `psql`.
- Do not run `npm run db:migrate`.
- Do not run `npm run db:seed`.
- Do not trigger deploy.
- Do not modify Zeabur env vars.

## Output recommendation

Recommend one of:

- Proceed to Task1869 only after explicit target approval.
- Pause because target is ambiguous.
- Use disposable local/test DB instead.
- Do not use shared/prod target.

## Verification

- `git status --short`.
- No code/doc commit required unless PM explicitly asks for a doc record.

## Completion report must include

- Target readiness summary.
- Safe target name if visible.
- Whether target is disposable/test/shared/prod/unknown.
- Whether explicit user approval is still required.
- Confirmation no DB connection.
- Confirmation no SQL/migration/seed execution.
- Confirmation no Zeabur env changes.
- Confirmation no secrets printed.
- Confirmation no file changes.
- Confirmation 7 held historical untracked docs untouched.

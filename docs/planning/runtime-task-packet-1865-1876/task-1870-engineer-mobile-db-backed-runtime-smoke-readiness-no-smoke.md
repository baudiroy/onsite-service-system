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

# Task1870 — Engineer Mobile DB-backed Runtime Smoke Readiness / No Smoke

## Phase

Phase 4 — DB-backed Runtime Smoke / DB-backed smoke 準備與執行.

## Prerequisite

Task1869 must be completed and PM accepted, or PM must explicitly decide that no DB-backed smoke can proceed.

## Goal

Prepare a DB-backed runtime smoke plan after migration 023 has been applied to an approved target.

This task is readiness planning only. Do not execute smoke.

## Scope

- Inspect required runtime prerequisites.
- Identify needed test user/admin/engineer/appointment records.
- Identify safe endpoint sequence.
- Identify whether seed is needed and whether it requires separate approval.
- Identify whether smoke target is Zeabur, disposable local/test, or another approved target.

## Smoke plan should cover

- `GET /healthz`.
- Auth login / auth me, if required.
- Minimal Engineer Mobile visit-action DB-backed path.
- Expected safe-deny cases.
- Expected accepted action path only if safe fixture data exists.
- No destructive fixture smoke.
- No provider sending.

## Forbidden

- Do not run smoke.
- Do not run seed.
- Do not run migration.
- Do not connect to DB unless explicitly approved.
- Do not print secrets.
- Do not modify env vars.

## Output

Recommend:

- Proceed to Task1871 only after explicit target and smoke approval.
- Or pause for seed/admin/bootstrap prerequisite.
- Or create a separate seed authorization task.

## Verification

- `git status --short`.
- `npm run check` only if docs/code changed.

## Completion report must include

- Smoke readiness summary.
- Prerequisites and missing data.
- Proposed smoke target.
- Explicit approval phrase needed for Task1871.
- Confirmation no smoke executed.
- Confirmation no DB/migration/seed executed.
- Confirmation no secrets printed.
- Confirmation 7 held historical untracked docs untouched.

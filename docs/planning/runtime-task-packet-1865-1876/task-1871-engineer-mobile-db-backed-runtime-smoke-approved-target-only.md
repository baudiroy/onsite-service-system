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

# Task1871 — Engineer Mobile DB-backed Runtime Smoke / Approved Target Only

## Phase

Phase 4 — DB-backed Runtime Smoke / DB-backed smoke 準備與執行.

## Execution gate

This task cannot run unless PM/user explicitly approves the smoke target and scope.

Suggested approval phrase:

```text
I approve running the Engineer Mobile DB-backed runtime smoke against <TARGET_NAME> only. Do not run destructive fixture smoke. Do not run provider sending. Do not print secrets.
```

## Goal

Execute minimal DB-backed runtime smoke against the approved target only.

## Scope

- `GET /healthz`.
- Minimal authenticated/auth-required route behavior.
- Minimal visit-action DB-backed path only if safe test data exists.
- Sanitized result capture only.

## Forbidden

- No destructive fixture smoke.
- No unapproved seed.
- No migration.
- No provider sending.
- No secret printing.
- No broad production data dumps.
- No raw SQL output in report.

## Expected behavior

- `/healthz` returns 200.
- Unauthenticated route remains safe deny.
- Authenticated path either:
  - succeeds for approved fixture data, or
  - safely denies/not found for missing/ineligible data.
- No raw internal errors, stacks, SQL, credentials, or provider data exposed.

## Completion report must include

- Approved target name, non-secret only.
- Endpoints tested.
- HTTP status results.
- Sanitized response summaries.
- Whether DB-backed persistence was observed, without raw DB dumps.
- Confirmation no destructive fixture smoke.
- Confirmation no provider sending.
- Confirmation no migration/seed.
- Confirmation no secrets printed.
- Confirmation 7 held historical untracked docs untouched.

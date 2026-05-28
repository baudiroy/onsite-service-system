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

# Task1869 — Migration 023 Apply To Approved Target / Explicit Approval Only

## Phase

Phase 3 — Controlled Migration Execution / 明確批准後才執行 migration.

## Execution gate

This task **cannot be executed** unless the user provides the exact explicit approval phrase with a named target.

Required approval phrase:

```text
I approve applying migration 023 to the explicitly named target: <TARGET_NAME>. Do not use any other DB. Do not print DATABASE_URL or secrets. Do not run seed or runtime smoke.
```

## Goal

Apply migration 023 only to the explicitly approved target.

## Scope

- Migration 023 only.
- Approved target only.
- Sanitized output only.
- No seed.
- No runtime smoke.
- No provider sending.

## Pre-checks

Before execution:

- Confirm git baseline.
- Confirm exact approved target name.
- Confirm approval phrase is present.
- Confirm migration 023 filename.
- Confirm no other migration is included.
- Confirm `DATABASE_URL` is not printed.

## Execution constraints

- Do not apply any migration other than 023 unless the existing migration tool requires completed prior migrations and PM has explicitly scoped it.
- Do not run seed.
- Do not run app/server.
- Do not run smoke.
- Do not run provider sending.
- Capture sanitized PASS/FAIL only.
- If target identity is ambiguous, stop.
- If migration state is unknown and cannot be safely verified without revealing secrets, stop.

## Rollback/stop conditions

Stop immediately if:

- The target differs from the approved target.
- The DB appears shared/prod and approval did not explicitly name it.
- Any secret would be printed.
- The migration tool attempts to run additional unapproved migrations.
- Seed/smoke/provider commands are triggered.

## Completion report must include

- Approved target name, non-secret only.
- Migration file applied.
- Sanitized result PASS/FAIL.
- Whether any warnings/notices occurred, sanitized.
- Confirmation no secrets printed.
- Confirmation no seed.
- Confirmation no smoke.
- Confirmation no provider sending.
- Confirmation no code/file changes unless separately documented.
- Confirmation 7 held historical untracked docs untouched.

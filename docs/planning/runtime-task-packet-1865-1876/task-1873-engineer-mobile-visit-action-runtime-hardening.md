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

# Task1873 — Engineer Mobile Visit Action Runtime Hardening

## Phase

Phase 5 — Audit + Runtime Hardening / 稽核與 runtime 強化.

## Goal

Harden Engineer Mobile visit action runtime behavior after repository, migration, smoke, and audit boundaries are understood.

## Scope

Potential hardening areas:

- Error envelopes.
- RequestId propagation.
- Safe-deny consistency.
- Idempotency/race handling if needed.
- Unsupported action behavior.
- Duplicate action behavior.
- Sanitized service/repository failures.
- Route/presenter compatibility.

## Constraints

- No schema change unless separately approved.
- No broad API response redesign.
- No provider sending.
- No Completion Report / FSR generation.
- No `finalAppointmentId` mutation.
- No customer-visible publication behavior.
- No secrets printed.

## Tests

- Unit tests for each hardening behavior.
- HTTP/route tests if runtime behavior changes.
- Static boundaries for forbidden domains.
- `npm run check`.

## Commit

If implementation occurs and tests pass, commit only Task1873 files.

Suggested commit message:

```text
Task1873 harden engineer mobile visit action runtime
```

## Completion report must include

- Hardening changes made.
- Files changed.
- Tests run.
- `npm run check` result.
- Commit hash if committed.
- Confirmation no schema/migration/seed unless separately approved.
- Confirmation no provider sending.
- Confirmation no FSR/finalAppointmentId/customer-visible publication behavior.
- Confirmation no secrets printed.
- Confirmation 7 held historical untracked docs untouched.

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

# Task1872 — Engineer Mobile Visit Action Audit Log Boundary

## Phase

Phase 5 — Audit + Runtime Hardening / 稽核與 runtime 強化.

## Prerequisite

Task1871 should be PM accepted, or PM must explicitly assign audit boundary work before DB-backed smoke completion.

## Goal

Inspect and, if needed, implement the minimal audit logging boundary for Engineer Mobile visit actions.

## Scope

- Identify existing audit log conventions.
- Define what visit-action events should be audited.
- Keep audit payload sanitized.
- Preserve organization isolation.
- Do not expose customer-visible data.
- Do not trigger provider sending.

## Allowed implementation

Only if PM assigns this as an implementation task:

- Add minimal audit writer integration using existing patterns.
- Use injected dependencies where possible.
- Add synthetic tests.
- Add static boundary tests.

## Forbidden

- No Completion Report / FSR generation.
- No `finalAppointmentId` mutation.
- No customer-visible publication behavior.
- No provider sending.
- No schema/migration change unless separately approved.
- No secrets printed.

## Tests

- Audit payload includes safe IDs/action/status/requestId.
- Audit payload excludes secrets/raw DB/errors/customer-visible report content.
- Failure to write audit does not expose raw errors.
- Organization isolation is preserved.

## Completion report must include

- Whether this was inspection-only or implementation.
- Files changed if any.
- Audit fields and exclusions.
- Tests run.
- `npm run check` result if code changed.
- Confirmation no provider sending.
- Confirmation no FSR/finalAppointmentId/customer-visible publication behavior.
- Confirmation no secrets printed.
- Confirmation 7 held historical untracked docs untouched.

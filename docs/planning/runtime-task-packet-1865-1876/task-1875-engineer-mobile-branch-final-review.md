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

# Task1875 — Engineer Mobile Branch Final Review

## Phase

Phase 6 — Zeabur Release + Branch Closure / Zeabur 發布檢查與分支收尾.

## Goal

Perform final branch acceptance review for the Engineer Mobile visit action runtime phase.

No new runtime changes unless PM opens a separate bounded fix task.

## Review areas

- Route wiring status.
- Repository implementation status.
- Migration 023 status.
- Smoke status.
- Audit/hardening status.
- Tests/check status.
- Zeabur deployment status.
- GitHub synchronization status.
- Remaining risks and deferrals.

## Invariants to confirm

- One Case = one formal Completion Report / FSR remains intact.
- Appointment lifecycle and `finalAppointmentId` remain backend/system-owned.
- Organization isolation remains mandatory.
- Customer-visible publication behavior was not introduced.
- AI/RAG/provider integrations were not accidentally introduced.
- LINE is not hard-coded as global identity.
- Secrets were not printed or committed.

## Output

Create a branch final review doc if PM assigns docs output.

Possible doc path:

- `docs/task-1875-engineer-mobile-visit-action-branch-final-review.md`.

## Completion report must include

- Acceptance recommendation.
- Completed task list.
- Outstanding deferrals.
- Risk summary.
- Whether branch can close.
- Whether a bounded fix task is needed.
- Confirmation no runtime changes unless separately assigned.
- Confirmation no secrets printed.
- Confirmation 7 held historical untracked docs untouched.

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

# Task1874 — Engineer Mobile Visit Action Zeabur Release Checkpoint

## Phase

Phase 6 — Zeabur Release + Branch Closure / Zeabur 發布檢查與分支收尾.

## Goal

Verify the deployed Zeabur release and GitHub baseline for the Engineer Mobile visit action branch.

This is release verification. No new feature work.

## Scope

Check:

- Local HEAD and `origin/main`.
- Latest accepted commit hash.
- Zeabur deployed commit if visible.
- `/healthz` status.
- Engineer Mobile route safe behavior.
- Whether migration 023 state matches PM records.
- Whether seed/smoke/audit/hardening tasks are complete or explicitly deferred.

## Forbidden

- No new runtime feature work.
- No migration/seed unless already approved in earlier tasks.
- No provider sending.
- No secrets printed.
- No Zeabur env changes unless separately approved.

## Completion report must include

- GitHub commit status.
- Zeabur deployed commit/status.
- Health check result.
- Route behavior summary.
- Migration/seed/smoke status.
- Known risks or deferrals.
- Confirmation no secrets printed.
- Confirmation no unintended deploy/migration/seed/provider actions.
- Recommendation to proceed to Task1875 or open a bounded fix task.

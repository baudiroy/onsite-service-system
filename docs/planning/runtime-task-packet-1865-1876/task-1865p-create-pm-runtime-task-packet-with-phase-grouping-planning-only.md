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

# Task1865P — Create PM Runtime Task Packet MD Files with Phase Grouping / Planning Only / No Runtime

## Phase

Phase 0 — Planning Packet / 任務包建立.

## Goal

Create the planning-only PM runtime task packet for Task1865 through Task1876, grouped by phase.

This is docs/planning only. It does not authorize any runtime work.

## Required directory

```text
docs/planning/runtime-task-packet-1865-1876/
```

## Required files

- `README.md`.
- `task-1865-engineer-mobile-visit-action-sql-repository-injected-db-client-no-db-execution.md`.
- `task-1866-engineer-mobile-visit-action-sql-repository-contract-hardening-no-db-execution.md`.
- `task-1867-migration-023-apply-authorization-packet-no-execution.md`.
- `task-1868-zeabur-db-migration-target-readiness-inspection-no-execution.md`.
- `task-1869-migration-023-apply-to-approved-target-explicit-approval-only.md`.
- `task-1870-engineer-mobile-db-backed-runtime-smoke-readiness-no-smoke.md`.
- `task-1871-engineer-mobile-db-backed-runtime-smoke-approved-target-only.md`.
- `task-1872-engineer-mobile-visit-action-audit-log-boundary.md`.
- `task-1873-engineer-mobile-visit-action-runtime-hardening.md`.
- `task-1874-engineer-mobile-visit-action-zeabur-release-checkpoint.md`.
- `task-1875-engineer-mobile-branch-final-review.md`.
- `task-1876-next-branch-selection-checkpoint.md`.

## Phase grouping to include

- Phase 0 — Planning Packet / 任務包建立: Task1865P.
- Phase 1 — SQL Repository Runtime Implementation / 不連 DB 的 repository 實作: Task1865–1866.
- Phase 2 — Migration Authorization Gate / migration 授權與目標檢查: Task1867–1868.
- Phase 3 — Controlled Migration Execution / 明確批准後才執行 migration: Task1869.
- Phase 4 — DB-backed Runtime Smoke / DB-backed smoke 準備與執行: Task1870–1871.
- Phase 5 — Audit + Runtime Hardening / 稽核與 runtime 強化: Task1872–1873.
- Phase 6 — Zeabur Release + Branch Closure / Zeabur 發布檢查與分支收尾: Task1874–1875.
- Phase 7 — Next Branch Selection / 下一條功能線選擇: Task1876.

## Verification

Run:

- `git status --short`.
- `npm run check`.

## Commit

If check passes, commit only the planning packet files.

Suggested commit message:

```text
Task1865P add phased PM runtime task packet
```

## Completion report must include

- Created files.
- Phase grouping summary.
- Commit hash if committed.
- `npm run check` result.
- Git status summary.
- Confirmation planning-only.
- Confirmation no runtime/source changes.
- Confirmation no DB/migration/seed/deploy.
- Confirmation no secrets printed.
- Confirmation 7 held historical untracked docs untouched.

# Runtime Task Packet 1865–1876

This packet pre-writes the next Engineer Mobile runtime phase as separated Markdown task specifications.

These files are **planning specifications only**. They are not authorization for Codex to execute future phases. PM must assign each task explicitly, and PM must accept the previous task before the next task begins.

## Current baseline

- GitHub + Zeabur connection phase completed.
- Task1861 route wiring committed and pushed: `4bd7e7072d4c84acb49af03b9c08b92541ea474f`.
- Runtime route deployed and reachable: `POST /engineer-mobile/appointments/:appointmentId/actions/:action`.
- Zeabur `/healthz` returns HTTP 200.
- Unauthenticated Engineer Mobile visit-action probes return HTTP 403 safe deny, not 404.
- Task1864 migration 023 disposable local/test Docker PostgreSQL dry-run PASS.
- Migration 023 has **not** been applied to Zeabur/shared/prod DB.
- No seed has been run.
- No real SQL repository implementation exists yet unless Task1865 later completes.
- No provider sending is authorized.
- Completion Report / FSR, `finalAppointmentId`, and customer-visible publication behavior remain out of scope.

## Execution principles

- One task at a time unless PM explicitly authorizes a bounded mini-batch.
- Each executable task should have its own commit and completion report.
- PM acceptance is required after each task.
- Phase gates cannot be skipped.
- Draft task files are not execution authorization.
- DB / migration / seed / deploy / smoke require separate explicit approval.
- No secrets may be printed, copied into reports, or stored in docs.

## Phase roadmap

| Phase | Tasks | Purpose | Allowed work | Explicitly forbidden work | Gate before next phase |
| --- | --- | --- | --- | --- | --- |
| Phase 0 — Planning Packet / 任務包建立 | Task1865P | Create this packet only | Docs/planning files | Runtime, DB, migration, deploy, smoke | Packet committed and PM accepted |
| Phase 1 — SQL Repository Runtime Implementation / 不連 DB 的 repository 實作 | Task1865–1866 | Implement and harden injected-dbClient SQL repository adapter using synthetic tests only | Runtime source, unit tests, boundary tests, task docs | Real DB, migration, seed, Zeabur, deploy, smoke | Repository tests/check PASS and PM accepted |
| Phase 2 — Migration Authorization Gate / migration 授權與目標檢查 | Task1867–1868 | Prepare migration apply approval packet and inspect safe target readiness | Docs/readiness/inspection only | DB connection, SQL execution, secret printing | Explicit target and PM/user approval |
| Phase 3 — Controlled Migration Execution / 明確批准後才執行 migration | Task1869 | Apply migration 023 only after explicit target approval | Migration 023 only against approved target | Seed, smoke, provider sending, other migrations | Sanitized PASS/FAIL and PM accepted |
| Phase 4 — DB-backed Runtime Smoke / DB-backed smoke 準備與執行 | Task1870–1871 | Prepare and execute minimal approved DB-backed runtime smoke | Smoke plan, approved minimal smoke | Destructive fixture smoke, provider sending, unapproved DB | Smoke result accepted |
| Phase 5 — Audit + Runtime Hardening / 稽核與 runtime 強化 | Task1872–1873 | Audit boundary and runtime hardening | Bounded audit/hardening | FSR creation, finalAppointmentId mutation, customer-visible publication | Hardening tests/check PASS |
| Phase 6 — Zeabur Release + Branch Closure / Zeabur 發布檢查與分支收尾 | Task1874–1875 | Verify deployed release and close Engineer Mobile branch | Release verification, branch review | New feature work unless separately assigned | Branch accepted/closed |
| Phase 7 — Next Branch Selection / 下一條功能線選擇 | Task1876 | Choose next major runtime branch | Planning decision | Runtime execution | Next branch selected |

## Files in this packet

- `task-1865p-create-pm-runtime-task-packet-with-phase-grouping-planning-only.md`.
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

## Recommended sequence

1. Phase 0: Task1865P.
2. Phase 1: Task1865 → Task1866.
3. Phase 2: Task1867 → Task1868.
4. Phase 3: Task1869.
5. Phase 4: Task1870 → Task1871.
6. Phase 5: Task1872 → Task1873.
7. Phase 6: Task1874 → Task1875.
8. Phase 7: Task1876.

## Batch policy

The only safe early mini-batch is Phase 0 + Phase 1:

- Task1865P.
- Task1865.
- Task1866.

Hard stop after Task1866. Do not start Task1867 without PM review.

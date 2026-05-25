# Task1620 Repair Intake Next Runtime Slice Decision Review

Status: docs-only decision review, no runtime, no DB.

## Current State

- Latest commit: `8e95e16 Document final repair intake runtime reentry handoff`
- Staged area: empty.
- Tracked worktree: clean.
- Held historical docs: 7 files remain untracked.
- Repair Intake runtime re-entry branch is closed and handed off.

## What Is Now Ready

- Repair Intake docs cleanup is complete.
- No-DB adapter hardening is complete.
- Route/runtime no-DB branch is checkpointed.
- Limited unit subset previously passed:
  - 119 tests.
  - 0 failed.
- Permission-denied injected route composition test passed.
- Final PM handoff is committed.

## What Is Still Not Approved

- DB connection.
- `psql`.
- SQL dry-run/apply.
- Migration dry-run/apply.
- `npm run db:migrate`.
- Global route mount.
- Smoke/shared runtime.
- Provider sending.
- LINE/SMS/email/webhook sending.
- AI/RAG/vector.
- Billing/settlement.
- Admin UI.
- Customer-visible rollout.

## Candidate Next Runtime Slices

### Candidate A: Injected Route/Repository Runtime With Fake Clients Only

- No DB.
- No global mount.
- No provider.
- One route composition path.
- Explicit injected fake repository ports.

### Candidate B: Route/API Static Guard Hardening

- No source runtime change.
- Static boundary test for API module, route registrar, or mount target.

### Candidate C: Disposable DB/Migration Authorization Packet

- Docs-only authorization packet.
- No DB execution yet.

### Candidate D: Pause Repair Intake And Switch Module

- Likely next module: Engineer Mobile Workbench.

## Recommended PM Choice

- Recommend Candidate A only if the user wants to keep moving toward runtime implementation.
- Recommend Candidate B if the user wants one more safety increment before runtime.
- Recommend Candidate C only if the user is preparing for DB/migration, not executing it.
- Recommend Candidate D if PM wants to rebalance across modules.

Do not jump directly to DB/migration/global route rollout.

## Guardrails

- One Case can have at most one formal Field Service Report.
- Do not create a second formal Field Service Report.
- Preserve `field_service_reports.case_id` uniqueness.
- `finalAppointmentId` remains backend/system-owned except explicit admin override.
- Repair Intake draft-to-Case must not bypass Case creation rules.
- Organization isolation, permission checks, safe-deny behavior, and audit remain mandatory.
- AI remains advisory only.
- LINE/channel identity must not be hard-coded globally.
- SaaS/entitlement-safe boundaries remain mandatory.

## Recommended Next Bounded Task After Task1620

- If Candidate A: read-only exact file-touch plan for injected route/repository fake-client runtime path.
- If Candidate B: static guard test planning for API module, route registrar, or mount adapter.
- If Candidate C: disposable DB authorization packet, docs-only, no execution.
- If Candidate D: Engineer Mobile Workbench current status inventory.

# Task1611 Repair Intake Route / Repository Runtime Planning Gate

Status: planning gate only, docs-only, no runtime, no DB.

## Current State

- Latest commit: `906885f Document repair intake runtime reentry handoff`
- Staged area: empty.
- Tracked worktree: clean.
- Held historical docs: 7 files remain untracked and should remain uncommitted unless PM assigns an explicit staging or cleanup task.
- Repair Intake runtime re-entry branch is clean and checkpointed.

## Runtime Re-entry Confidence

- Limited no-DB Repair Intake unit subset passed: 119 tests, 0 failed.
- DB or migration execution was not performed.
- Adapter hardening completed:
  - Idempotency repository no-row fallback test.
  - Draft repository adapter transaction no-row safety test.
  - Case repository adapter no-row source and test fix.
  - Case creator downstream failure preservation source and test fix.
  - Transaction runner domain failure propagation source and test fix.
  - Audit writer downstream failure and transaction query tests.

## Runtime Planning Gate

The next phase may consider a bounded Repair Intake route/repository runtime step, but it must not begin with:

- DB or migration execution.
- Global public route rollout.
- Smoke or shared runtime execution.
- Provider sending.
- AI, RAG, or vector work.
- Billing or settlement work.
- Admin UI work.

Any route/repository runtime work must remain opt-in, injected, and no real DB unless separately approved by PM.

## Candidate Next Paths

- Candidate A: read-only inventory of route mount and runtime composition files before any runtime patch.
- Candidate B: no-DB unit or integration test around injected route composition with fake repositories.
- Candidate C: static boundary guard for route mount target or preflight, with no global app mount.
- Candidate D: if PM explicitly wants runtime implementation, a single opt-in injected route/repository wiring patch with fake clients only, no DB, and no global mount.

## Required Guardrails

- One Case can have at most one formal Field Service Report.
- Do not create a second formal Field Service Report.
- Preserve `field_service_reports.case_id` uniqueness.
- `finalAppointmentId` remains backend/system-owned except explicit admin override.
- Repair Intake draft-to-Case must not bypass Case creation rules.
- Organization isolation, permission checks, safe-deny behavior, and audit remain mandatory.
- AI remains advisory only.
- LINE/channel identity must not be hard-coded globally.
- No customer-visible rollout without separate approval.

## Recommendation

The next smallest task should be Candidate A: read-only route/runtime composition inventory. Do not jump directly to DB/migration/global route rollout.

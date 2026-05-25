# Task1572 - Runtime Re-entry Readiness Review After Docs Cleanup

## Scope

This is a docs-only runtime re-entry decision packet after the documentation cleanup stream. It does not edit source, runtime, test, admin, migration, package, provider, smoke, AI/RAG, billing, or settlement files. It does not run DB commands, migrations, SQL dry-runs, smoke tests, providers, servers, listeners, or customer-visible runtime actions.

## Current Repository State

- Latest commit expected: `d0be476 Document repair intake case repository preflight`.
- Staged area expected: empty.
- Tracked worktree expected: clean.
- Remaining untracked docs expected: exactly 7 intentionally held historical docs.
- Current runtime re-entry status: ready for a bounded planning or source-inspection slice, not ready for DB execution, migration apply, provider sending, global route rollout, smoke/shared runtime, AI/RAG, billing, or admin UI.

## Held Docs Decision

Keep these docs uncommitted unless PM explicitly requests a separate historical archive pass:

- `docs/task-331-repair-intake-case-creation-branch-readiness-gate-review-no-runtime-change.md`
- `docs/task-913-runtime-branch-patch-inclusion-master-checkpoint-no-runtime-change.md`
- `docs/task-980-management-docs-batch-dry-run-verification-task964-task975-task978-no-git-mutation.md`
- `docs/task-988-remaining-worktree-post-commit-inventory-docs-only-no-git-mutation.md`
- `docs/task-1106-runtime-branch-portfolio-pm-checkpoint-no-runtime-change.md`
- `docs/task-1147-existing-migration-inventory-staging-readiness-review-no-staging-no-runtime-change.md`
- `docs/task-1148-existing-migration-inventory-static-content-review-no-db-no-staging.md`

Rationale: these files are stale historical snapshots or cross-branch checkpoints. Keeping them uncommitted avoids mixing historical inventory into the active Repair Intake runtime/repository chain.

## Runtime Re-entry Recommendation

The next implementation stream should be Repair Intake draft-to-Case repository and persistence runtime planning, but still bounded. The first post-cleanup slice should stay small and should avoid execution-heavy areas.

Recommended first bounded runtime-ish slice:

- File-level static/source inspection for already tracked Repair Intake draft repository and case repository code, with no edits.
- Or pure repository contract test planning for the already tracked modules, with no DB.

If code is touched later, the task must remain bounded by:

- No DB connection.
- No migration execution.
- No global app mount.
- No provider sending.
- No customer-visible rollout.
- No second formal FSR.

## Guardrails

- One Case has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness must not be touched.
- `finalAppointmentId` remains backend/system-owned except explicit admin override.
- A Case may have multiple appointments and dispatch visits.
- Repair Intake draft-to-Case must not bypass Case creation rules.
- AI remains advisory only.
- LINE/channel identity must not be hard-coded as global identity.
- Organization isolation, permission, safe-deny, and audit boundaries remain mandatory.
- SaaS-ready and entitlement-safe boundaries remain mandatory.

## Proposed Next Candidates

Candidate A: Source-only inventory of Repair Intake persistence/repository implementation files, no edits.

Candidate B: Pure static boundary guard review for Repair Intake repository modules, no DB.

Candidate C: Bounded unit tests using injected fake repositories/clients only, no real DB.

DB or migration execution is not a candidate without separate explicit approval.

## Non-goals

- No source/runtime/test edits in Task1572.
- No DB.
- No migration.
- No smoke.
- No provider.
- No global route mount.
- No admin/frontend.
- No AI/RAG/vector.
- No billing/settlement.
- No cleanup of held docs.

## Completion Checklist

- Created exactly one docs-only Task1572 packet.
- Staging remains empty.
- Tracked worktree changes are limited to this new Task1572 doc.
- The 7 held historical docs remain untracked.
- No source/runtime/test/admin/migration/package edits were made.
- No DB/migration/smoke/provider/server/listen action was performed.
- No cleanup/reset/stash/revert action was performed.

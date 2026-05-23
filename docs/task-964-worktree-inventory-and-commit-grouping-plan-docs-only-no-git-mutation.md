# Task964 Worktree Inventory and Commit Grouping Plan

## Scope

This is a docs-only inventory/checkpoint task. It is not a cleanup task and not a commit task.

No git staging, commit, reset, clean, restore, checkout, delete, move, or restage action was performed.

Only this document is created by Task964.

## Current Worktree Snapshot

Read-only inventory commands showed:

- `git status --short` entries: 944
- Expanded untracked file count: 1401
- Tracked modified files: 12
- Tracked diff stat summary: 12 files changed, 1907 insertions, 112 deletions

Expanded untracked top-level distribution:

- `docs`: 921
- `tests`: 340
- `src`: 133
- `migrations`: 5
- `fixtures`: 2

Tracked modified files:

- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
- `migrations/README.md`
- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`
- `src/app.js`
- `src/repositories/DispatchRepository.js`
- `src/repositories/FieldServiceReportRepository.js`
- `src/routes/index.js`
- `src/routes/public.routes.js`
- `src/server.js`
- `src/services/AppointmentService.js`
- `src/services/FieldServiceReportService.js`

Untracked task docs by task-number range:

- Task100-199: 90
- Task200-299: 100
- Task300-399: 73
- Task400-499: 99
- Task500-599: 80
- Task600-699: 101
- Task700-799: 178
- Task800-899: 105
- Task900-999: 64

Notable untracked source/test clusters:

- `tests/engineerMobile`: 82
- `tests/dataCorrection`: 75
- `tests/customerAccess`: 70
- `tests/brandChannel`: 40
- `src/customerAccess`: 27
- `tests/repairIntake`: 26
- `tests/engineerMobileWorkbench`: 22
- `src/repairIntake`: 22
- `src/engineerMobile`: 22
- `src/dataCorrection`: 20
- `tests/docs`: 10
- `src/brandChannel`: 10
- `tests/security`: 7
- `tests/unit`: 6
- `src/utils`: 6
- `src/security`: 6
- `src/routes`: 5
- `src/controllers`: 5

## Accepted Patch-Stack Interpretation

The dirty worktree appears to be a large accepted local patch stack, not disposable temporary output.

Blind cleanup is unsafe. Do not run cleanup or reversal commands against this worktree without a separate bounded authorization.

Task921-Task963 accepted files remain local / uncommitted / untracked and must be included before final merge or handoff.

The tracked runtime/bootstrap/smoke/migration-adjacent modifications should not be bundled blindly with docs-only or isolated module commits.

## Proposed Grouping Plan

This plan proposes batches only. It does not stage or commit them.

### Group A: Documentation Structure and Global Project Docs

Candidate paths:

- `docs/PROJECT_SHORT_INSTRUCTION.md`
- `docs/PROJECT_GUARDRAILS.md`
- `docs/README.md`
- `docs/TASK_ARCHIVE_INDEX.md`
- `docs/TASK_FILE_CATALOG.md`
- `docs/design/**`

Risk level: medium. These files define project navigation and guardrails, so they should be reviewed as a coherent documentation foundation.

### Group B: Historical Docs-Only Task Records

Candidate paths:

- `docs/task-110-*.md` through pre-runtime task docs
- task docs that explicitly say `no-runtime-change`, `docs-only`, `design`, `readiness`, `checkpoint`, or `handoff`

Risk level: low to medium. Large volume makes blind inclusion hard to review, even if many files are docs-only.

### Group C: Customer Access Accepted Runtime Branches

Candidate paths:

- `src/customerAccess/**`
- related `src/routes/customerAccessRoutes.js`
- related `src/controllers/customerAccessController.js`
- related `src/utils/customerFacing*.js`
- `tests/customerAccess/**`
- `docs/task-908-*.md` through `docs/task-920-*.md`

Risk level: medium. Contains runtime-adjacent code and tests; should not be mixed with unrelated docs-only commits.

### Group D: Engineer Mobile Task921-Task933

Candidate paths:

- `src/engineerMobile/**`
- `src/routes/engineerMobile*.js`
- `src/controllers/engineerMobile*.js`
- `tests/engineerMobile/**`
- `docs/task-921-*.md` through `docs/task-933-*.md`

Risk level: medium. PM has treated Task921-Task933 as accepted and closed; do not reopen behavior while grouping.

### Group E: Repair Intake No-DB Submission Task934-Task949

Candidate paths:

- no-DB Repair Intake submission modules in `src/repairIntake/**`
- related tests in `tests/repairIntake/**`
- `docs/task-934-*.md` through `docs/task-949-*.md`

Risk level: medium. This group should preserve the no-DB/no-API-shape-change boundary.

### Group F: Repair Intake Repository/Runtime/API-Prep Task950-Task963

Candidate paths:

- repository, audit, idempotency, runtime dependency, application service, controller, route factory, route registrar modules in `src/repairIntake/**`
- related unit/static/integration tests in `tests/repairIntake/**`
- `docs/task-950-*.md` through `docs/task-963-*.md`

Risk level: medium to high. The branch is accepted / checkpointed / paused after Task963, but it intentionally stops before global route mounting, app/server bootstrap, OpenAPI/DTO, DB execution, migrations, smoke runtime, provider sending, AI/admin/billing, or production rollout.

### Group G: Data Correction Accepted Branches

Candidate paths:

- `src/dataCorrection/**`
- `src/routes/dataCorrectionRoutes.js`
- `src/controllers/dataCorrectionController.js`
- `tests/dataCorrection/**`
- `docs/task-700-*.md` through `docs/task-907-*.md` where applicable

Risk level: medium to high. Includes governance, writer, audit, repository, and app/server option work. Keep DB/migration/persistence authorization boundaries explicit.

### Group H: Brand Channel / Security / Boundary Utilities

Candidate paths:

- `src/brandChannel/**`
- `tests/brandChannel/**`
- `src/security/**`
- `tests/security/**`
- `src/boundaries/**`
- `src/guards/**`
- `src/resolvers/**`

Risk level: medium. Review for cross-cutting behavior and permission/security impact before merging.

### Group I: Migrations and Fixtures Requiring Separate Review

Candidate paths:

- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `migrations/021_create_data_correction_persistence_schema.sql`
- `migrations/022_create_engineer_mobile_read_model.sql`
- `migrations/024_create_brand_referral_contact_events.sql`
- `migrations/025_create_data_correction_decision_audit_events.sql`
- `fixtures/**`

Risk level: high. Migrations and fixtures need explicit schema review, disposable DB dry-run authorization, and separate inclusion decisions. Do not bundle with docs-only or module-only commits.

### Group J: Tracked Runtime/Bootstrap/Smoke Modifications Requiring Separate Review

Candidate paths:

- `src/app.js`
- `src/server.js`
- `src/routes/index.js`
- `src/routes/public.routes.js`
- `src/repositories/DispatchRepository.js`
- `src/repositories/FieldServiceReportRepository.js`
- `src/services/AppointmentService.js`
- `src/services/FieldServiceReportService.js`
- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`
- `migrations/README.md`
- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`

Risk level: high. These tracked changes touch runtime/bootstrap/routes/smoke/migration-adjacent surfaces and should not be bundled blindly with isolated module work.

## Risk Flags

- `src/app.js`, `src/server.js`, `src/routes/**`, smoke scripts, migrations, repository files, and service files must not be bundled blindly with docs-only or isolated module commits.
- Untracked migrations and fixtures need separate review before inclusion.
- Route/bootstrap/API changes require explicit PM review before runtime rollout.
- Task921-Task963 accepted files are still local / uncommitted / untracked.
- The worktree must not be cleaned, reverted, relocated, or restaged blindly.

## Recommended Next PM Decision

Options only; no action has been taken:

- Continue with docs-only organization and produce more detailed per-group file manifests.
- Authorize explicit `git add` batches for selected reviewed groups.
- Authorize actual commits in reviewed groups.
- Resume runtime only after patch-stack grouping is accepted.

## Verification

Required commands:

```bash
git diff -- docs/task-964-worktree-inventory-and-commit-grouping-plan-docs-only-no-git-mutation.md
git diff --check -- docs/task-964-worktree-inventory-and-commit-grouping-plan-docs-only-no-git-mutation.md
git status --short
git status --short -- docs/task-964-worktree-inventory-and-commit-grouping-plan-docs-only-no-git-mutation.md
```

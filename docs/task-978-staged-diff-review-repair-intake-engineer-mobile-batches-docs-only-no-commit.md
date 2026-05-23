# Task978 - Staged Diff Review for Repair Intake and Engineer Mobile Batches / Docs Only / No Commit

## Scope

This review summarizes the current staged index after Task976 and Task977.

Task978 is docs-only. It must remain untracked and unstaged until PM gives a later explicit staging decision.

## Current Staged Index Summary

- Total staged paths: 118.
- Staged diff stat: 118 files changed, 24196 insertions(+).
- Staged diff check: `git diff --cached --check` passed with no output.
- Staged path split:
  - Repair Intake: 78 paths from Task970 / Task965.
  - Engineer Mobile: 40 paths from Task971 / Task966.

All staged paths are new additions in the index.

## Staged Path Groups

### Repair Intake

- Docs: 30 paths.
  - `docs/task-934-*` through `docs/task-963-*`.
- Source: 22 paths under `src/repairIntake`.
  - `repairIntakeCaseCreatorRepositoryAdapter.js`
  - `repairIntakeCaseRepositoryAdapter.js`
  - `repairIntakeDraftCaseApplicationServiceFactory.js`
  - `repairIntakeDraftCaseAuditWriterAdapter.js`
  - `repairIntakeDraftCaseCandidateBuilder.js`
  - `repairIntakeDraftCaseControllerAdapter.js`
  - `repairIntakeDraftCaseCreatorInputNormalizer.js`
  - `repairIntakeDraftCaseEligibility.js`
  - `repairIntakeDraftCaseIdempotencyCheckerAdapter.js`
  - `repairIntakeDraftCasePlanningService.js`
  - `repairIntakeDraftCasePreflightService.js`
  - `repairIntakeDraftCaseRouteFactory.js`
  - `repairIntakeDraftCaseRuntimeDependencyFactory.js`
  - `repairIntakeDraftCaseSubmissionAuditEventBuilder.js`
  - `repairIntakeDraftCaseSubmissionCommandGuard.js`
  - `repairIntakeDraftCaseSubmissionEnvelopeNormalizer.js`
  - `repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer.js`
  - `repairIntakeDraftCaseSubmissionResultNormalizer.js`
  - `repairIntakeDraftCaseSubmissionService.js`
  - `repairIntakeDraftRepositoryAdapter.js`
  - `repairIntakeDraftToCaseRouteRegistrar.js`
  - `repairIntakeTransactionRunnerAdapter.js`
- Tests: 26 paths under `tests/repairIntake`.
  - Repository adapter, application factory, controller, route factory, route registrar, submission, preflight, planning, eligibility, normalizer, idempotency, audit event, and transaction runner coverage.
  - Static boundary coverage for injected-only, no-db submission, and route registrar boundaries.

### Engineer Mobile

- Docs: 13 paths.
  - `docs/task-921-*` through `docs/task-933-*`.
- Source: 7 paths under `src/engineerMobile`.
  - `engineerAssignedAppointmentDetailAppAdapter.js`
  - `engineerAssignedAppointmentDetailProjectionHandler.js`
  - `engineerAssignedAppointmentDetailProjectionService.js`
  - `engineerAssignedAppointmentsAppAdapter.js`
  - `engineerAssignedAppointmentsProjectionHandler.js`
  - `engineerAssignedAppointmentsProjectionService.js`
  - `engineerPreDepartureActionEligibility.js`
- Tests: 20 paths under `tests/engineerMobile`.
  - Assigned appointments projection service, handler, app adapter, and branch closure coverage.
  - Assigned appointment detail projection service, handler, app adapter, and branch closure coverage.
  - Read-only branch master patch inclusion coverage.
  - Pre-departure action eligibility, delegation, and final handoff coverage.

## Boundary Confirmation

The staged index does not include the following out-of-scope areas:

- Data Correction paths.
- Customer Access paths.
- Task964 through Task975 staging-prep docs.
- Task967 through Task969 API-prep continuation paths.
- Tracked bootstrap/runtime files.
- `src/app.js`.
- `src/server.js`.
- `src/routes/index.js`.
- `src/routes/public.routes.js`.
- Smoke scripts.
- Migrations or fixtures.
- Package files.
- Task902.
- Admin, provider, AI/RAG, or billing files.

The broader worktree still contains existing local, modified, untracked, and unstaged patch stack content. Task978 does not try to clean, reset, restore, move, delete, or restage that stack.

## Commit-Readiness Notes

From a path-boundary and whitespace-check perspective, the current staged set appears commit-ready for PM review:

- The staged path count matches the expected 118 paths.
- The staged split matches the expected 78 Repair Intake paths plus 40 Engineer Mobile paths.
- `git diff --cached --check` passed with no output.
- The staged set excludes the explicitly forbidden areas listed above.

PM still needs to decide whether to commit these two staged batches together, split them before commit, stage additional verified batches first, or adjust the index with explicit reset authorization.

Task978 itself is intentionally unstaged.

## Read-Only Verification Captured

- `git diff --cached --name-only`: completed; staged set contains the expected 118 paths.
- `git diff --cached --name-only | wc -l`: `118`.
- `git diff --cached --stat`: `118 files changed, 24196 insertions(+)`.
- `git diff --cached --check`: passed with no output.
- `git diff --cached --name-status`: all 118 staged paths are added (`A`).
- `git status --short`: completed; current staged entries are the two accepted batches, while broader dirty/untracked worktree content remains outside this task.

## Next PM Decision Options

- Authorize commit of the current 118 staged paths.
- Split the staged index before commit.
- Stage additional verified batches first.
- Adjust or unstage paths only with explicit reset authorization.
- Pause.

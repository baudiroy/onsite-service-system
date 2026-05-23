# Task965 First-Batch Staging Manifest for Repair Intake Runtime Stack

## Purpose

This document is a staging manifest only. It is not a staging task and not a commit task.

No git mutation was performed. No `git add`, commit, reset, clean, restore, delete, move, or restage action was performed.

This manifest proposes a first future staging batch focused only on the coherent Repair Intake draft-to-Case runtime stack from Task934 through Task963.

## Recommended First Batch

Recommended future batch name:

`repair-intake-draft-to-case-task934-963-runtime-stack`

### Source Paths

Recommended `src/repairIntake` paths:

- `src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.js`
- `src/repairIntake/repairIntakeCaseRepositoryAdapter.js`
- `src/repairIntake/repairIntakeDraftCaseApplicationServiceFactory.js`
- `src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js`
- `src/repairIntake/repairIntakeDraftCaseCandidateBuilder.js`
- `src/repairIntake/repairIntakeDraftCaseControllerAdapter.js`
- `src/repairIntake/repairIntakeDraftCaseCreatorInputNormalizer.js`
- `src/repairIntake/repairIntakeDraftCaseEligibility.js`
- `src/repairIntake/repairIntakeDraftCaseIdempotencyCheckerAdapter.js`
- `src/repairIntake/repairIntakeDraftCasePlanningService.js`
- `src/repairIntake/repairIntakeDraftCasePreflightService.js`
- `src/repairIntake/repairIntakeDraftCaseRouteFactory.js`
- `src/repairIntake/repairIntakeDraftCaseRuntimeDependencyFactory.js`
- `src/repairIntake/repairIntakeDraftCaseSubmissionAuditEventBuilder.js`
- `src/repairIntake/repairIntakeDraftCaseSubmissionCommandGuard.js`
- `src/repairIntake/repairIntakeDraftCaseSubmissionEnvelopeNormalizer.js`
- `src/repairIntake/repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer.js`
- `src/repairIntake/repairIntakeDraftCaseSubmissionResultNormalizer.js`
- `src/repairIntake/repairIntakeDraftCaseSubmissionService.js`
- `src/repairIntake/repairIntakeDraftRepositoryAdapter.js`
- `src/repairIntake/repairIntakeDraftToCaseRouteRegistrar.js`
- `src/repairIntake/repairIntakeTransactionRunnerAdapter.js`

### Test Paths

Recommended `tests/repairIntake` paths:

- `tests/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.unit.test.js`
- `tests/repairIntake/repairIntakeCaseCreatorRepositoryAdapterBoundary.static.test.js`
- `tests/repairIntake/repairIntakeCaseRepositoryAdapter.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseApplicationServiceFactory.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseCandidateBuilder.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseControllerAdapter.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseCreatorInputNormalizer.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseEligibility.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseIdempotencyCheckerAdapter.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js`
- `tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionFlow.integration.test.js`
- `tests/repairIntake/repairIntakeDraftCasePlanningService.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCasePreflightService.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseRouteFactory.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseRuntimeDependencyFactory.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseSubmissionAuditEventBuilder.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseSubmissionCommandGuard.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseSubmissionEnvelopeNormalizer.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseSubmissionResultNormalizer.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js`
- `tests/repairIntake/repairIntakeDraftRepositoryAdapter.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseRouteRegistrar.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseRouteRegistrarBoundary.static.test.js`
- `tests/repairIntake/repairIntakeTransactionRunnerAdapter.unit.test.js`

`tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js` spans multiple tasks. It was introduced for the no-DB submission static boundary and later amended for later-phase runtime modules including application service factory, controller adapter, route factory, and related runtime/API-prep surfaces. Include it once with this Repair Intake batch.

### Documentation Paths

Recommended Repair Intake Task934-Task963 docs:

- `docs/task-934-repair-intake-draft-case-eligibility-runtime-guard-no-db-no-api-shape-change.md`
- `docs/task-935-repair-intake-draft-case-preflight-service-injected-reader-no-db-no-api-shape-change.md`
- `docs/task-936-repair-intake-draft-case-candidate-builder-pure-runtime-mapper-no-db-no-api-shape-change.md`
- `docs/task-937-repair-intake-draft-case-planning-service-runtime-orchestration-no-persist-no-api-shape-change.md`
- `docs/task-938-repair-intake-draft-case-submission-service-injected-case-creator-no-default-writer-no-db.md`
- `docs/task-939-repair-intake-draft-case-submission-result-normalizer-extracted-runtime-sanitizer-no-behavior-expansion.md`
- `docs/task-940-repair-intake-draft-case-submission-command-guard-pure-runtime-gate-no-db-no-api-shape-change.md`
- `docs/task-941-repair-intake-draft-case-creator-input-normalizer-extracted-runtime-sanitizer-no-behavior-expansion.md`
- `docs/task-942-repair-intake-draft-case-submission-audit-event-builder-pure-runtime-candidate-no-audit-persistence.md`
- `docs/task-943-repair-intake-draft-case-submission-audit-event-attachment-internal-runtime-envelope-no-audit-persistence.md`
- `docs/task-944-repair-intake-draft-case-submission-idempotency-checker-seam-injected-checker-no-store-no-db.md`
- `docs/task-945-repair-intake-draft-case-submission-envelope-normalizer-extracted-runtime-shape-guard-no-behavior-expansion.md`
- `docs/task-946-repair-intake-draft-to-case-no-db-submission-branch-checkpoint-no-runtime-change.md`
- `docs/task-947-repair-intake-draft-to-case-no-db-submission-flow-integration-test-synthetic-dependencies-no-production-change.md`
- `docs/task-948-repair-intake-draft-to-case-no-db-submission-static-boundary-test-import-guard-no-production-change.md`
- `docs/task-949-repair-intake-draft-to-case-no-db-submission-branch-final-checkpoint-update-no-runtime-change.md`
- `docs/task-950-repair-intake-draft-to-case-repository-case-creator-adapter-injected-repositories-no-api-no-migration.md`
- `docs/task-951-repair-intake-case-creator-repository-adapter-static-boundary-test-injected-only-guard-no-runtime-change.md`
- `docs/task-952-repair-intake-draft-repository-adapter-contract-injected-db-client-shape-no-db-execution-no-migration.md`
- `docs/task-953-repair-intake-case-repository-adapter-contract-injected-db-client-shape-no-db-execution-no-migration.md`
- `docs/task-954-repair-intake-transaction-runner-adapter-contract-injected-db-client-transaction-shape-no-db-execution-no-migration.md`
- `docs/task-955-repair-intake-draft-to-case-audit-writer-adapter-contract-injected-db-client-shape-no-db-execution-no-api.md`
- `docs/task-956-repair-intake-draft-to-case-idempotency-checker-adapter-contract-injected-db-client-shape-no-db-execution-no-migration.md`
- `docs/task-957-repair-intake-draft-to-case-runtime-dependency-factory-injected-adapters-composition-no-api-no-db-execution.md`
- `docs/task-958-repair-intake-draft-to-case-application-service-factory-runtime-composition-no-route-no-api-shape.md`
- `docs/task-959-repair-intake-draft-to-case-controller-adapter-injected-application-service-no-route-registration-no-openapi.md`
- `docs/task-960-repair-intake-draft-to-case-route-factory-injected-controller-no-app-bootstrap-no-openapi.md`
- `docs/task-961-repair-intake-draft-to-case-injected-router-registrar-no-app-bootstrap-no-openapi.md`
- `docs/task-962-repair-intake-draft-to-case-route-registrar-static-boundary-test-no-app-bootstrap-no-openapi.md`
- `docs/task-963-repair-intake-draft-to-case-runtime-adapter-api-prep-checkpoint-no-runtime-change.md`

## Explicit Exclusions

Exclude Engineer Mobile Task921-Task933:

- `docs/task-921-*.md` through `docs/task-933-*.md`
- `src/engineerMobile/**`
- `src/routes/engineerMobile*.js`
- `src/controllers/engineerMobile*.js`
- `tests/engineerMobile/**`

Exclude unrelated Data Correction and Customer Access branches:

- `src/dataCorrection/**`
- `tests/dataCorrection/**`
- `src/customerAccess/**`
- `tests/customerAccess/**`
- `docs/task-700-*.md` through `docs/task-920-*.md` except future PM-approved cross-branch checkpoint docs

Exclude tracked modified bootstrap/runtime files:

- `src/app.js`
- `src/server.js`
- `src/routes/index.js`
- `src/routes/public.routes.js`
- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`
- `migrations/README.md`
- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
- repository/service tracked changes unless explicitly reviewed as part of a separate runtime/bootstrap batch

Exclude untracked migrations and fixtures unless explicitly reviewed later:

- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `migrations/021_create_data_correction_persistence_schema.sql`
- `migrations/022_create_engineer_mobile_read_model.sql`
- `migrations/024_create_brand_referral_contact_events.sql`
- `migrations/025_create_data_correction_decision_audit_events.sql`
- `fixtures/**`

## Suggested Future Git Add Command

Do not run this command in Task965. It is a proposed command for a future PM-authorized staging task only.

```bash
git add \
  src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.js \
  src/repairIntake/repairIntakeCaseRepositoryAdapter.js \
  src/repairIntake/repairIntakeDraftCaseApplicationServiceFactory.js \
  src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js \
  src/repairIntake/repairIntakeDraftCaseCandidateBuilder.js \
  src/repairIntake/repairIntakeDraftCaseControllerAdapter.js \
  src/repairIntake/repairIntakeDraftCaseCreatorInputNormalizer.js \
  src/repairIntake/repairIntakeDraftCaseEligibility.js \
  src/repairIntake/repairIntakeDraftCaseIdempotencyCheckerAdapter.js \
  src/repairIntake/repairIntakeDraftCasePlanningService.js \
  src/repairIntake/repairIntakeDraftCasePreflightService.js \
  src/repairIntake/repairIntakeDraftCaseRouteFactory.js \
  src/repairIntake/repairIntakeDraftCaseRuntimeDependencyFactory.js \
  src/repairIntake/repairIntakeDraftCaseSubmissionAuditEventBuilder.js \
  src/repairIntake/repairIntakeDraftCaseSubmissionCommandGuard.js \
  src/repairIntake/repairIntakeDraftCaseSubmissionEnvelopeNormalizer.js \
  src/repairIntake/repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer.js \
  src/repairIntake/repairIntakeDraftCaseSubmissionResultNormalizer.js \
  src/repairIntake/repairIntakeDraftCaseSubmissionService.js \
  src/repairIntake/repairIntakeDraftRepositoryAdapter.js \
  src/repairIntake/repairIntakeDraftToCaseRouteRegistrar.js \
  src/repairIntake/repairIntakeTransactionRunnerAdapter.js \
  tests/repairIntake/repairIntake*.js \
  docs/task-934-*.md docs/task-935-*.md docs/task-936-*.md docs/task-937-*.md \
  docs/task-938-*.md docs/task-939-*.md docs/task-940-*.md docs/task-941-*.md \
  docs/task-942-*.md docs/task-943-*.md docs/task-944-*.md docs/task-945-*.md \
  docs/task-946-*.md docs/task-947-*.md docs/task-948-*.md docs/task-949-*.md \
  docs/task-950-*.md docs/task-951-*.md docs/task-952-*.md docs/task-953-*.md \
  docs/task-954-*.md docs/task-955-*.md docs/task-956-*.md docs/task-957-*.md \
  docs/task-958-*.md docs/task-959-*.md docs/task-960-*.md docs/task-961-*.md \
  docs/task-962-*.md docs/task-963-*.md
```

Before any future staging action, run `git status --short -- <paths>` against the selected manifest paths.

## Risk Notes

- The static boundary test `tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js` has been amended across tasks and must be included with this batch.
- Untracked files may not appear in `git diff`. Use `git status --short -- <paths>` before actual staging.
- This batch intentionally excludes global route mounting, app/server bootstrap, OpenAPI/DTO, DB execution, migrations, smoke runtime, provider sending, AI/admin/billing, and production rollout.
- Repair Intake Task950-Task963 is accepted / checkpointed / paused after Task963; do not resume runtime behavior inside a staging task.

## Next PM Decision Options

- Approve exact `git add` for this manifest.
- Adjust this manifest before any staging.
- Create a second manifest for Engineer Mobile.
- Resume runtime only after staging plan acceptance.

## Verification

Required commands:

```bash
git diff -- docs/task-965-first-batch-staging-manifest-repair-intake-runtime-stack-docs-only-no-git-mutation.md
git diff --check -- docs/task-965-first-batch-staging-manifest-repair-intake-runtime-stack-docs-only-no-git-mutation.md
git status --short
git status --short -- docs/task-965-first-batch-staging-manifest-repair-intake-runtime-stack-docs-only-no-git-mutation.md
```

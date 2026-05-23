# Task966 Second-Batch Staging Manifest for Engineer Mobile Task921-Task933

## Purpose

This document is a staging manifest only. It is not a staging task and not a commit task.

No git mutation was performed. No `git add`, commit, reset, clean, restore, checkout, delete, move, or restage action was performed.

This manifest proposes a future staging batch focused on Engineer Mobile Task921-Task933 only. The Engineer Mobile branch remains closed/paused; this is organization only.

## Recommended Second Batch

Recommended future batch name:

`engineer-mobile-task921-933-read-only-eligibility-stack`

### Documentation Paths

Recommended Engineer Mobile Task921-Task933 docs:

- `docs/task-921-engineer-mobile-read-only-assigned-appointments-projection-injected-db-client-no-route-no-migration.md`
- `docs/task-922-engineer-mobile-assigned-appointments-http-handler-injected-db-client-no-route-no-real-db.md`
- `docs/task-923-engineer-mobile-assigned-appointments-app-adapter-synthetic-app-only-no-public-route-no-listen.md`
- `docs/task-924-engineer-mobile-assigned-appointments-branch-closure-patch-inclusion-no-runtime-change.md`
- `docs/task-925-engineer-mobile-assigned-appointment-detail-projection-injected-db-client-no-route-no-workflow.md`
- `docs/task-926-engineer-mobile-assigned-appointment-detail-http-handler-injected-db-client-no-route-no-workflow.md`
- `docs/task-927-engineer-mobile-assigned-appointment-detail-app-adapter-synthetic-app-only-no-public-route-no-listen.md`
- `docs/task-928-engineer-mobile-assigned-appointment-detail-branch-closure-patch-inclusion-no-runtime-change.md`
- `docs/task-929-engineer-mobile-read-only-branch-master-patch-inclusion-checkpoint-no-runtime-change.md`
- `docs/task-930-engineer-mobile-pre-departure-action-eligibility-evaluator-pure-helper-no-state-change.md`
- `docs/task-931-engineer-mobile-pre-departure-eligibility-projection-delegation-no-state-change.md`
- `docs/task-932-engineer-mobile-pre-departure-eligibility-delegation-closure-patch-inclusion-no-runtime-change.md`
- `docs/task-933-engineer-mobile-read-only-eligibility-branch-final-handoff-summary-no-runtime-change.md`

### Source Paths

Recommended Task921-Task933 source paths:

- `src/engineerMobile/engineerAssignedAppointmentsProjectionService.js`
- `src/engineerMobile/engineerAssignedAppointmentsProjectionHandler.js`
- `src/engineerMobile/engineerAssignedAppointmentsAppAdapter.js`
- `src/engineerMobile/engineerAssignedAppointmentDetailProjectionService.js`
- `src/engineerMobile/engineerAssignedAppointmentDetailProjectionHandler.js`
- `src/engineerMobile/engineerAssignedAppointmentDetailAppAdapter.js`
- `src/engineerMobile/engineerPreDepartureActionEligibility.js`

Do not include broad `src/engineerMobile/**` in a future staging command unless PM first confirms that earlier/later Engineer Mobile permission, repository, migration, audit, route, or provider files should be included in this same batch.

### Test Paths

Recommended Task921-Task933 test paths:

- `tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentsProjectionServiceClosure.static.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentsProjectionHandler.http-behavior.unit.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentsProjectionHandlerClosure.static.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentsAppAdapter.unit.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentsAppAdapterClosure.static.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentsBranchClosure.static.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentDetailProjectionServiceClosure.static.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandler.http-behavior.unit.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandlerClosure.static.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentDetailAppAdapter.unit.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentDetailAppAdapterClosure.static.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentDetailBranchClosure.static.test.js`
- `tests/engineerMobile/engineerMobileReadOnlyBranchMasterPatchInclusion.static.test.js`
- `tests/engineerMobile/engineerPreDepartureActionEligibility.unit.test.js`
- `tests/engineerMobile/engineerPreDepartureActionEligibilityClosure.static.test.js`
- `tests/engineerMobile/engineerPreDepartureEligibilityProjectionDelegation.static.test.js`
- `tests/engineerMobile/engineerPreDepartureEligibilityDelegationBranchClosure.static.test.js`
- `tests/engineerMobile/engineerMobileReadOnlyEligibilityBranchFinalHandoff.static.test.js`

## Explicit Exclusions

Exclude Repair Intake Task934-Task963 paths already captured by Task965:

- `src/repairIntake/**`
- `tests/repairIntake/**`
- `docs/task-934-*.md` through `docs/task-963-*.md`

Exclude Data Correction / Customer Access unrelated branches:

- `src/dataCorrection/**`
- `tests/dataCorrection/**`
- `src/customerAccess/**`
- `tests/customerAccess/**`
- unrelated `docs/task-700-*.md` through `docs/task-920-*.md`

Exclude Engineer Mobile files outside the Task921-Task933 read-only/eligibility scope unless PM explicitly widens the batch:

- `src/controllers/engineerMobileController.js`
- `src/controllers/engineerMobileTaskDetailController.js`
- `src/routes/engineerMobileRoutes.js`
- `src/routes/engineerMobileTaskDetailRoutes.js`
- `src/routes/engineerMobileWorkbench.routes.js`
- `src/engineerMobile/engineerMobilePermissionAssignmentGuard.js`
- `src/engineerMobile/engineerMobilePermissionMiddleware.js`
- `src/engineerMobile/engineerMobileQueryExecutorAdapter.js`
- `src/engineerMobile/engineerMobileReadAccessAuditIntentBuilder.js`
- `src/engineerMobile/engineerMobileReadAccessAuditIntentSideChannel.js`
- `src/engineerMobile/engineerMobileReadModelRepository.js`
- `src/engineerMobile/engineerMobileReadProviderOptionsComposer.js`
- `src/engineerMobile/engineerMobileReadRepository.js`
- `src/engineerMobile/engineerMobileTaskDetailReadModelMapper.js`
- `src/engineerMobile/engineerMobileTaskDetailReadRepository.js`
- `src/engineerMobile/engineerMobileTaskDetailService.js`
- `src/engineerMobile/engineerMobileTaskListReadModelMapper.js`
- `src/engineerMobile/engineerMobileTaskListReadProviderAdapter.js`
- `src/engineerMobile/engineerMobileTaskListReadRepository.js`
- `src/engineerMobile/engineerMobileTaskListService.js`
- `tests/engineerMobile/fixtures/**`
- `tests/engineerMobile/engineerMobile*.js` unless listed in the recommended test paths above

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

Exclude migrations and fixtures unless explicitly reviewed later:

- `migrations/**`
- `fixtures/**`

Exclude Task902 and unrelated files.

## Suggested Future Git Add Command

Do not run this command in Task966. It is a proposed command for a future PM-authorized staging task only.

```bash
git add \
  docs/task-921-*.md docs/task-922-*.md docs/task-923-*.md docs/task-924-*.md \
  docs/task-925-*.md docs/task-926-*.md docs/task-927-*.md docs/task-928-*.md \
  docs/task-929-*.md docs/task-930-*.md docs/task-931-*.md docs/task-932-*.md \
  docs/task-933-*.md \
  src/engineerMobile/engineerAssignedAppointmentsProjectionService.js \
  src/engineerMobile/engineerAssignedAppointmentsProjectionHandler.js \
  src/engineerMobile/engineerAssignedAppointmentsAppAdapter.js \
  src/engineerMobile/engineerAssignedAppointmentDetailProjectionService.js \
  src/engineerMobile/engineerAssignedAppointmentDetailProjectionHandler.js \
  src/engineerMobile/engineerAssignedAppointmentDetailAppAdapter.js \
  src/engineerMobile/engineerPreDepartureActionEligibility.js \
  tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js \
  tests/engineerMobile/engineerAssignedAppointmentsProjectionServiceClosure.static.test.js \
  tests/engineerMobile/engineerAssignedAppointmentsProjectionHandler.http-behavior.unit.test.js \
  tests/engineerMobile/engineerAssignedAppointmentsProjectionHandlerClosure.static.test.js \
  tests/engineerMobile/engineerAssignedAppointmentsAppAdapter.unit.test.js \
  tests/engineerMobile/engineerAssignedAppointmentsAppAdapterClosure.static.test.js \
  tests/engineerMobile/engineerAssignedAppointmentsBranchClosure.static.test.js \
  tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js \
  tests/engineerMobile/engineerAssignedAppointmentDetailProjectionServiceClosure.static.test.js \
  tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandler.http-behavior.unit.test.js \
  tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandlerClosure.static.test.js \
  tests/engineerMobile/engineerAssignedAppointmentDetailAppAdapter.unit.test.js \
  tests/engineerMobile/engineerAssignedAppointmentDetailAppAdapterClosure.static.test.js \
  tests/engineerMobile/engineerAssignedAppointmentDetailBranchClosure.static.test.js \
  tests/engineerMobile/engineerMobileReadOnlyBranchMasterPatchInclusion.static.test.js \
  tests/engineerMobile/engineerPreDepartureActionEligibility.unit.test.js \
  tests/engineerMobile/engineerPreDepartureActionEligibilityClosure.static.test.js \
  tests/engineerMobile/engineerPreDepartureEligibilityProjectionDelegation.static.test.js \
  tests/engineerMobile/engineerPreDepartureEligibilityDelegationBranchClosure.static.test.js \
  tests/engineerMobile/engineerMobileReadOnlyEligibilityBranchFinalHandoff.static.test.js
```

Before any future staging action, run `git status --short -- <paths>` against the selected manifest paths.

## Risk Notes

- Accepted Engineer Mobile Task921-Task933 files remain local / uncommitted / untracked.
- Untracked files may not appear in `git diff`. Use `git status --short -- <paths>` before actual staging.
- The Engineer Mobile branch remains closed/paused; this task is organization only.
- Do not mix Engineer Mobile Task921-Task933 with Repair Intake Task934-Task963, Data Correction, Customer Access, migrations, fixtures, smoke, route bootstrap, or app/server runtime changes.
- Broad `src/engineerMobile/**` or `tests/engineerMobile/**` staging would include unrelated permission, repository, migration, audit, route, and fixture files. Use the exact manifest paths unless PM explicitly widens scope.

## Next PM Decision Options

- Approve exact `git add` for this manifest.
- Adjust this manifest before any staging.
- Create a third manifest for Data Correction / Customer Access.
- Resume runtime only after staging plans are accepted.

## Verification

Required commands:

```bash
git diff -- docs/task-966-second-batch-staging-manifest-engineer-mobile-task921-task933-docs-only-no-git-mutation.md
git diff --check -- docs/task-966-second-batch-staging-manifest-engineer-mobile-task921-task933-docs-only-no-git-mutation.md
git status --short
git status --short -- docs/task-966-second-batch-staging-manifest-engineer-mobile-task921-task933-docs-only-no-git-mutation.md
```

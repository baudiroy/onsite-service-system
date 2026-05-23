# Task972 Third-Batch Staging Manifest for Data Correction and Customer Access

## Purpose

This document is a staging manifest only. It is not a staging task and not a commit task.

No git mutation was performed. No `git add`, commit, reset, restore, checkout, clean, delete, move, copy, or restage action was performed.

This manifest identifies third-batch candidate paths for Data Correction and Customer Access. Because these branches are large and overlap with app/server wiring, route mounting, historical docs, and later continuation tasks, every proposed path group below requires PM review before any real staging.

## Read-Only Inventory Summary

Read-only inspection found:

- Data Correction source namespace: 20 files under `src/dataCorrection/`
- Data Correction adjacent runtime files: `src/controllers/dataCorrectionController.js`, `src/routes/dataCorrectionRoutes.js`
- Data Correction tests: 75 files under `tests/dataCorrection/`
- Data Correction docs by filename filter: 167 `docs/task-*.md` files containing `data-correction`
- Customer Access source namespace: 27 files under `src/customerAccess/`
- Customer Access adjacent controller/route/utils files: 8 files
- Customer Access tests: 70 files under `tests/customerAccess/`
- Customer-facing utility tests adjacent to Customer Access: 6 files under `tests/unit/utils/customer-facing/`
- Customer Access docs by filename filter: 90 `docs/task-*.md` files containing `customer-access`

`git status --short` shows the inspected Data Correction and Customer Access candidate source/test path groups as untracked. This task did not run `git add --dry-run`; dry-run verification should be a later PM-authorized task.

## Recommended Third Batch A: Data Correction

Recommended future batch name:

`data-correction-accepted-branch-candidate-stack`

### Candidate Source Paths

- `src/dataCorrection/**`
- `src/controllers/dataCorrectionController.js`
- `src/routes/dataCorrectionRoutes.js`

### Candidate Test Paths

- `tests/dataCorrection/**`

### Candidate Documentation Paths

Candidate docs are all `docs/task-*.md` filenames containing `data-correction`, except explicit exclusions below.

This group currently has 167 filename matches before exclusions. It must exclude `docs/task-902-data-correction-decision-audit-writer-invocation-boundary-helper-no-db-no-api-shape-change.md` unless PM explicitly reopens Task902.

Known Data Correction docs span multiple branch slices, including:

- Task652-688 Data Correction phase 1 / persistence foundation
- Task728 and Task743-748 permission/app-server shortcut follow-ups
- Task752 and Task757-760 shortcut/writer priority follow-ups
- Task776-805 async writer / query-backed / repository contract follow-ups
- Task806-853 governance/controller/route/request coverage follow-ups
- Task862-906 apply/decision-audit/writer continuation follow-ups

Because this range is large and contains app/server wiring docs as well as Task902, the documentation candidate set is marked: **needs PM review before actual git add**.

## Recommended Third Batch B: Customer Access

Recommended future batch name:

`customer-access-accepted-branch-candidate-stack`

### Candidate Source Paths

- `src/customerAccess/**`
- `src/controllers/customerAccessController.js`
- `src/routes/customerAccessRoutes.js`
- `src/utils/customerAccessContext.js`
- `src/utils/customerFacingForbiddenFields.js`
- `src/utils/customerFacingProjectionDto.js`
- `src/utils/customerFacingProjectionService.js`
- `src/utils/customerFacingResponseEnvelope.js`
- `src/utils/customerFacingSafeDenyResponse.js`

### Candidate Test Paths

- `tests/customerAccess/**`
- `tests/unit/utils/customer-facing/**`

### Candidate Documentation Paths

Candidate docs are all `docs/task-*.md` filenames containing `customer-access`.

This group currently has 90 filename matches before any PM refinements.

Known Customer Access docs span multiple branch slices, including:

- Task364 and Task375 early Customer Access context/resolver design notes
- Task421 and Task439 customer-facing Customer Access context design/implementation notes
- Task574-600 resolver/readiness planning and authorization notes
- Task602-650 runtime skeleton, route, repository, app/server wiring, and bootstrap composition notes
- Task729 mounted-route test refresh note
- Task908-920 accepted customer access projection/context/app-adapter/internal-test-route continuation notes

Because this range includes route/bootstrap/server composition docs and late accepted projection work, the documentation candidate set is marked: **needs PM review before actual git add**.

## Ambiguity Handling

The Data Correction and Customer Access candidate branches are less exact than the already dry-run-verified Repair Intake Task965 and Engineer Mobile Task966 manifests.

The following path groups should not be actual-staged until PM chooses an exact sub-batch and a later dry-run task verifies it:

- Data Correction docs by filename filter
- Customer Access docs by filename filter
- Data Correction adjacent controller/route files
- Customer Access adjacent controller/route/utils files
- Customer-facing utility tests under `tests/unit/utils/customer-facing/**`

If PM wants safer staging, split this manifest into separate dry-run tasks:

- Data Correction source/tests/docs-only candidate
- Customer Access source/tests/docs-only candidate
- Customer-facing shared utility candidate
- Route/bootstrap/app-server wiring candidate

## Explicit Exclusions

Exclude Repair Intake Task934-Task969 already covered by Task965/970.

Exclude Engineer Mobile Task921-Task933 already covered by Task966/971.

Exclude tracked bootstrap/runtime files unless PM creates a separate reviewed runtime/bootstrap batch:

- `src/app.js`
- `src/server.js`
- `src/routes/index.js`
- `src/routes/public.routes.js`
- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`
- `migrations/README.md`
- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`

Exclude migrations and fixtures unless explicitly reviewed later:

- `migrations/**`
- `fixtures/**`

Exclude:

- package files
- smoke/shared runtime scripts
- admin frontend
- provider / LINE / SMS / App / email / webhook code
- AI/RAG/vector/provider runtime
- billing/settlement/payment/invoice code
- Task902 unless PM explicitly reopens it

## Suggested Future Git Add Commands

Do not run these commands in Task972. They are proposed starting points for later PM-authorized dry-run verification only.

### Data Correction Candidate

```bash
git add --dry-run -- \
  src/dataCorrection \
  src/controllers/dataCorrectionController.js \
  src/routes/dataCorrectionRoutes.js \
  tests/dataCorrection \
  docs/task-*-data-correction-*.md
```

Before any actual staging, replace or narrow the docs pattern to exclude Task902 and any unrelated docs PM does not want in the batch.

### Customer Access Candidate

```bash
git add --dry-run -- \
  src/customerAccess \
  src/controllers/customerAccessController.js \
  src/routes/customerAccessRoutes.js \
  src/utils/customerAccessContext.js \
  src/utils/customerFacingForbiddenFields.js \
  src/utils/customerFacingProjectionDto.js \
  src/utils/customerFacingProjectionService.js \
  src/utils/customerFacingResponseEnvelope.js \
  src/utils/customerFacingSafeDenyResponse.js \
  tests/customerAccess \
  tests/unit/utils/customer-facing \
  docs/task-*-customer-access-*.md
```

Before any actual staging, run `git status --short -- <paths>` and `git add --dry-run -- <paths>` against the final PM-approved exact path set.

## Risk Notes

- Broad `src/**` or `tests/**` staging is unsafe.
- Broad `docs/task-*.md` staging is unsafe.
- Data Correction docs include Task902 by filename, and Task902 remains excluded unless PM explicitly reopens it.
- Customer Access source and docs include route/bootstrap/server composition work; PM should decide whether to stage those with pure read-model/projection files or split them.
- Untracked files may not appear in `git diff`; always use `git status --short -- <paths>` before actual staging.
- This manifest does not prove staging safety. It only defines candidate groupings for later dry-run verification.

## Next PM Decision Options

PM can choose one of the following next steps:

- approve dry-run verification for the Data Correction candidate group;
- approve dry-run verification for the Customer Access candidate group;
- split Data Correction and Customer Access into smaller manifests;
- authorize actual staging for already verified Task965 Repair Intake paths;
- authorize actual staging for already verified Task966 Engineer Mobile paths;
- resume runtime without staging.

## Verification

Required commands:

```bash
git diff -- docs/task-972-third-batch-staging-manifest-data-correction-customer-access-docs-only-no-git-mutation.md
git diff --check -- docs/task-972-third-batch-staging-manifest-data-correction-customer-access-docs-only-no-git-mutation.md
git status --short
git status --short -- docs/task-972-third-batch-staging-manifest-data-correction-customer-access-docs-only-no-git-mutation.md
```

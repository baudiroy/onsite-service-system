# Task2187 - Repair Intake Runtime Branch Re-entry Baseline Guard

## Status

- PM authorized Option D: Repair Intake / Open Repair Intake runtime branch.
- This task creates a bounded re-entry baseline guard before any next Repair Intake runtime implementation.
- Added one focused static boundary guard.
- Added this docs handoff.
- No source/runtime behavior changes were made.
- No DB execution, DB connection, migration creation, migration dry-run/apply, SQL execution, psql, `DATABASE_URL`, env/Zeabur inspection, smoke, endpoint probe, server/listener startup, provider sending, AI/RAG/model call, admin frontend, billing/payment, package, Customer Access, or Engineer Mobile behavior work was performed.
- The 7 held historical docs remain untracked and untouched.

## Baseline

- Repo: `/Users/global/Documents/Codex/onsite service system/codex-ready-ai-field-service-docs`
- Branch: `main`
- Starting HEAD/origin/main: `57755d4baab2c281cd23003b12bc20a2a53ec229`
- Local `main` equaled `origin/main`.
- Tracked tree was clean before Task2187 work.
- Only the same 7 held historical docs were untracked and untouched.
- Task2186 was accepted, pushed, and synced.
- Customer Access and Engineer Mobile production readiness branches were checkpointed.
- Customer Access smoke remains not executed.
- Engineer Mobile smoke remains not executed.
- DB/migration dry-run/apply remains not authorized.
- Provider sending remains not authorized.

## Exact Repair Intake / Open Repair Intake Files Inspected

Open Repair Intake directories:

- `src/openRepairIntake/`: not present.
- `tests/openRepairIntake/`: not present.

Route and controller surface:

- `src/routes/repairIntakeDraftToCase.routes.js`
- `src/routes/index.js`
- `src/routes/public.routes.js`
- `src/app.js`
- `src/server.js`
- `src/controllers/`: no Repair Intake controller file is currently present.

Repair Intake source surface under `src/repairIntake/`:

- `src/repairIntake/repairIntakeAuditWriterPortAdapter.js`
- `src/repairIntake/repairIntakeCaseCreatorPortAdapter.js`
- `src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.js`
- `src/repairIntake/repairIntakeCasePlannerPortAdapter.js`
- `src/repairIntake/repairIntakeCaseRepository.js`
- `src/repairIntake/repairIntakeCaseRepositoryAdapter.js`
- `src/repairIntake/repairIntakeCaseRepositoryConsumer.js`
- `src/repairIntake/repairIntakeCaseRepositoryContract.js`
- `src/repairIntake/repairIntakeContactRoleDtoGuard.js`
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
- `src/repairIntake/repairIntakeDraftReaderPortAdapter.js`
- `src/repairIntake/repairIntakeDraftRepository.js`
- `src/repairIntake/repairIntakeDraftRepositoryAdapter.js`
- `src/repairIntake/repairIntakeDraftRepositoryContract.js`
- `src/repairIntake/repairIntakeDraftToCaseApiModule.js`
- `src/repairIntake/repairIntakeDraftToCaseApplicationService.js`
- `src/repairIntake/repairIntakeDraftToCaseAuditIntentBuilder.js`
- `src/repairIntake/repairIntakeDraftToCaseAuthorizationGate.js`
- `src/repairIntake/repairIntakeDraftToCaseController.js`
- `src/repairIntake/repairIntakeDraftToCaseControllerAdapter.js`
- `src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js`
- `src/repairIntake/repairIntakeDraftToCaseHttpResultMapper.js`
- `src/repairIntake/repairIntakeDraftToCaseIdempotencyPolicyBuilder.js`
- `src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js`
- `src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js`
- `src/repairIntake/repairIntakeDraftToCaseOrchestrator.js`
- `src/repairIntake/repairIntakeDraftToCasePlanningAuditBoundary.js`
- `src/repairIntake/repairIntakeDraftToCasePreRouteHandlerFactory.js`
- `src/repairIntake/repairIntakeDraftToCasePublicResultPresenter.js`
- `src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js`
- `src/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.js`
- `src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js`
- `src/repairIntake/repairIntakeDraftToCaseRouteRegistrar.js`
- `src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js`
- `src/repairIntake/repairIntakeDraftToCaseSafeRouteBoundary.js`
- `src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js`
- `src/repairIntake/repairIntakeDuplicateCandidateGuard.js`
- `src/repairIntake/repairIntakeIdempotencyPortAdapter.js`
- `src/repairIntake/repairIntakeIdempotencyRepository.js`
- `src/repairIntake/repairIntakeIdempotencyRepositoryContract.js`
- `src/repairIntake/repairIntakeSyntheticAppCompositionHarness.js`
- `src/repairIntake/repairIntakeTransactionRunnerAdapter.js`

Existing boundary tests inspected for local patterns:

- `tests/repairIntake/repairIntakeRuntimeHardeningBoundary.static.test.js`
- `tests/repairIntake/repairIntakeRuntimeDependencyBoundary.static.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseRuntimeBranchCheckpoint.static.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposerBoundary.static.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseInjectedRouteCompositionBoundary.static.test.js`
- `tests/repairIntake/repairIntakeAppRouterAggregationPreflight.static.test.js`

## Current Branch Baseline

Currently present:

- Repair Intake draft-to-case modules are present under `src/repairIntake/`.
- Public/injected route composition helpers exist for draft-to-case runtime composition.
- Admin route file exists at `src/routes/repairIntakeDraftToCase.routes.js`, gated by injected runtime ports and route enablement options.
- Public route propagation and app factory route option propagation have existing guards.
- Draft intake, draft reader, repository contract, idempotency, case planner, case creator, authorization, controller, presenter, synthetic handler, route registrar, HTTP mount adapter, and runtime dependency factory modules exist.
- Repository adapters exist, but DB execution remains outside this task and requires explicit injected dependencies and separate authorization.
- Audit side-channel style ports/adapters exist for Repair Intake draft-to-case flow.

Currently not active or not authorized:

- No active `src/openRepairIntake/` module.
- No active `tests/openRepairIntake/` module.
- No new global app mount.
- No new production mount.
- No DB execution.
- No migration creation or execution.
- No provider sending.
- No LINE/SMS/email/webhook/app push.
- No AI/RAG/model provider calls.
- No admin frontend.
- No billing/payment.
- No Customer Access behavior changes.
- No Engineer Mobile behavior changes.

## Added Static Guard

Added:

- `tests/repairIntake/repairIntakeRuntimeBranchBoundary.static.test.js`

Guard coverage:

- Confirms current Repair Intake source and route surface exists.
- Confirms Open Repair Intake source/test directories are not active yet.
- Confirms Repair Intake runtime branch files do not directly import app, server, route globals, public route globals, controllers, providers, admin, DB package, or OpenAI.
- Confirms Repair Intake runtime branch files avoid env, listener, migration, provider sending, AI/RAG/model, and billing/payment execution markers outside existing guard/denylist constants.
- Confirms the public result presenter remains an explicit allowlist and does not expose raw phone, address, email, LINE identity, private notes, provider payload, SQL, or token fields.

## Recommended Next Bounded Runtime Task

Recommended next exact task:

- Repair Intake public/open intake request DTO allowlist guard.

Reason:

- The next safest progress is to lock request and response DTO shape before expanding Open Repair Intake or public intake runtime behavior.
- This can remain bounded to pure/static tests and small DTO guard surfaces.
- It should not require DB, migration, smoke, endpoint probes, provider sending, server/listener startup, global route mount, or production mount.

Alternative bounded next tasks:

- Repair Intake draft intake HTTP boundary safe-deny guard.
- Repair Intake route registration injected-only composition adapter.
- Repair Intake draft-to-case service input DTO guard.

## Project Invariants Preserved

- One Case equals one formal completion report / Field Service Report principle remains unchanged.
- Appointment remains separate from Case and Completion Report.
- Customer-visible data remains explicit allowlist only.
- LINE is not treated as global identity.
- Organization isolation and permission boundaries were not weakened.
- Audit side-channel rules remain advisory/side-channel only.
- No raw phone, address, private notes, provider payload, debug, SQL, or token data is authorized in customer-visible output.

## Explicit Non-Goals For Task2187

- No source/runtime behavior changes.
- No DB execution.
- No DB connection creation.
- No migration creation.
- No migration apply/dry-run.
- No SQL execution.
- No psql, `DATABASE_URL`, env, or Zeabur inspection.
- No global route mount.
- No production mount.
- No `src/app.js` changes.
- No `src/server.js` changes.
- No `src/routes/public.routes.js` changes.
- No smoke or endpoint probes.
- No server/listener startup.
- No provider sending: LINE/SMS/email/webhook/app push.
- No AI/RAG/provider/model calls.
- No admin frontend.
- No billing/payment work.
- No Customer Access behavior changes.
- No Engineer Mobile behavior changes.
- No package or package-lock changes.
- No cleanup, reset, stash, or revert of the 7 held historical docs.

## Verification

Commands:

```sh
node --test tests/repairIntake/repairIntakeRuntimeBranchBoundary.static.test.js
git diff --check
git status --short --branch
```

Results:

- `node --test tests/repairIntake/repairIntakeRuntimeBranchBoundary.static.test.js`: PASS, 4/4 tests.
- `git diff --check`: PASS.
- `git status --short --branch`: `main...origin/main` with this Task2187 doc, the new Task2187 static guard, and the same 7 held historical docs untracked before commit.

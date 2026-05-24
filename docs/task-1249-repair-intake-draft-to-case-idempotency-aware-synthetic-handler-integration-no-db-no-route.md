# Task1249 — Repair Intake Draft-to-Case Idempotency-Aware Synthetic Handler Integration / No DB No Route

Status: local implementation ready for PM review.

## Purpose

Task1249 adds an idempotency-aware synthetic integration test for the Repair Intake draft-to-Case chain. It validates that the Task1248 pure idempotency policy builder can wrap the existing non-HTTP synthetic handler flow before future route/controller work.

The idempotency policy is built before handler execution. It is not persisted.

## Scope

Allowlist files:

- `tests/repairIntake/repairIntakeDraftToCaseIdempotencyAwareSyntheticHandlerIntegration.unit.test.js`
- `docs/task-1249-repair-intake-draft-to-case-idempotency-aware-synthetic-handler-integration-no-db-no-route.md`

No production source is modified in this task.

## Integrated Local Modules

The test instantiates real local modules together:

- Task1248 idempotency policy builder.
- Synthetic handler.
- Request context resolver.
- Controller adapter.
- Public result presenter.
- Orchestrator.
- Authorization gate.
- Injected consumer application service.
- Case repository consumer.

Only synthetic dependencies are injected:

- `permissionResolver.canCreateCaseFromRepairIntakeDraft`
- `repository.createCaseFromDraft`

## Covered Behavior

- Allowed explicit idempotency key builds a safe organization-scoped policy and handler success result.
- Request ID fallback is deterministic for the same organization, draft, and request.
- Same draft/key under different organizations produces different dedupe keys.
- Body organization/actor override attempts do not affect policy or downstream values.
- Denied authorization does not call the repository.
- Invalid session context returns a safe invalid policy and invalid handler context.
- Unsafe raw body/session details do not leak into policy or handler result.
- Original synthetic input and policy input remain unchanged.

## Explicit Non-goals

- No idempotency persistence.
- No database or cache lookup.
- No idempotency store or cache integration.
- No route/controller/app/server mount.
- No provider sending.
- No AI/RAG.
- No billing/settlement.
- No customer-visible runtime.
- No auth/session/JWT runtime.

## Future Continuation

Production handler adoption of the idempotency policy requires separate PM approval.

Idempotency store or cache integration requires separate PM approval.

Route mount remains blocked until auth/session, permission, audit, idempotency, and runtime rollout decisions are complete.

## Verification

Required by PM:

- `node --test tests/repairIntake/repairIntakeDraftToCaseIdempotencyAwareSyntheticHandlerIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseIdempotencyPolicyBuilder.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseIdempotencyPolicyBuilderBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseAuditAwareSyntheticHandlerIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseFullSyntheticHttpEnvelopeIntegration.unit.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git diff --cached --name-only`
- `git diff --name-only`
- `git log -1 --oneline`

Expected:

- Targeted tests pass.
- Diff checks pass.
- Staged area remains empty.
- Latest commit remains `419e9cd Add repair intake draft-to-case audit intent builder`.
- Historical dirty tracked files remain unstaged and untouched.
- Task1248 and Task1249 files may remain untracked.

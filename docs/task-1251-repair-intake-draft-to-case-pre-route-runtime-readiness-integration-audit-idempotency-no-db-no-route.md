# Task1251 — Repair Intake Draft-to-Case Pre-Route Runtime Readiness Integration / Audit + Idempotency / No DB No Route

Status: local implementation ready for PM review.

## Purpose

Task1251 adds a pre-route runtime readiness integration test for the Repair Intake draft-to-Case flow.

It combines safe context resolution, idempotency policy building, audit intent building, the synthetic handler, and the HTTP result mapper before any future route work.

## Scope

Allowlist files:

- `tests/repairIntake/repairIntakeDraftToCasePreRouteRuntimeReadinessIntegration.unit.test.js`
- `docs/task-1251-repair-intake-draft-to-case-pre-route-runtime-readiness-integration-audit-idempotency-no-db-no-route.md`

No production source is modified in this task.

## Integrated Local Modules

The test instantiates real local modules together:

- Request context resolver.
- Task1248 idempotency policy builder.
- Synthetic handler.
- Controller adapter.
- Public result presenter.
- Orchestrator.
- Authorization gate.
- Injected consumer application service.
- Case repository consumer.
- Task1245 audit intent builder.
- HTTP result mapper.

Only synthetic dependencies are injected:

- `permissionResolver.canCreateCaseFromRepairIntakeDraft`
- `repository.createCaseFromDraft`

## Covered Flow

The integration test follows:

synthetic session/body/source -> resolve safe context -> build idempotency policy from safe context -> build attempt audit intent -> run synthetic handler -> map public result to HTTP envelope -> build submitted/denied/failed audit intent from safe result.

## Covered Behavior

- Allowed repository success resolves context from session values, builds organization/draft-scoped idempotency policy, builds safe attempt audit, returns 201 HTTP envelope, and builds submitted audit with safe scalar `caseId`.
- Denied authorization resolves context, builds policy and attempt audit, avoids repository call, returns 403 HTTP envelope, and builds safe denied audit.
- Invalid session context returns safe invalid context, does not build policy from missing organization, returns safe 400 HTTP envelope, and does not leak raw body/session data.
- Repository throw returns safe 503 HTTP envelope and safe failed audit without raw error leakage.
- Body organization/actor override attempts do not affect context, idempotency policy, permission resolver, repository, or audit intent values.
- Original synthetic input, context input, idempotency input, and audit inputs remain unchanged.

## Explicit Non-goals

- No route/controller/app/server mount.
- No database access.
- No cache lookup or write.
- No audit persistence.
- No idempotency persistence.
- No provider sending.
- No AI/RAG.
- No billing/settlement.
- No customer-visible runtime.
- No auth/session/JWT runtime.

## Future Continuation

A future route task remains blocked until PM separately approves exact path, method, auth/session behavior, permission behavior, audit persistence, idempotency store/cache integration, response contract, and runtime rollout verification.

## Verification

Required by PM:

- `node --test tests/repairIntake/repairIntakeDraftToCasePreRouteRuntimeReadinessIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseIdempotencyAwareSyntheticHandlerIntegration.unit.test.js`
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
- Latest commit remains `f8f6941 Add repair intake draft-to-case idempotency policy builder`.
- Historical dirty tracked files remain unstaged and untouched.
- Task1251 files may remain untracked.

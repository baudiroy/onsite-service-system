# Task1246 — Repair Intake Draft-to-Case Audit-Aware Synthetic Handler Integration / No DB No Route

Status: local implementation ready for PM review.

## Purpose

Task1246 adds an audit-aware synthetic integration test for the Repair Intake draft-to-Case chain. It validates that the Task1245 pure audit intent builder can be used around the already-committed synthetic handler flow.

The audit intents are built manually in the test. They are not persisted.

## Scope

Allowlist files:

- `tests/repairIntake/repairIntakeDraftToCaseAuditAwareSyntheticHandlerIntegration.unit.test.js`
- `docs/task-1246-repair-intake-draft-to-case-audit-aware-synthetic-handler-integration-no-db-no-route.md`

No production source is modified in this task.

## Integrated Local Modules

The test instantiates real local modules together:

- Task1245 audit intent builder.
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

- Allowed authorization and repository success builds safe `attempt` and `submitted` audit intents.
- Submitted intent includes safe scalar `caseId`, `repairIntakeDraftId`, `organizationId`, and `actorId`.
- Denied authorization builds safe `attempt` and `denied` audit intents and does not call the repository.
- Invalid session context returns safe invalid audit envelopes and does not leak raw body or session data.
- Repository throw returns generic handler failure and a safe `failed` audit intent.
- Original synthetic input and audit intent inputs remain unchanged.

## Explicit Non-goals

- No audit persistence.
- No audit writer or audit repository.
- No database access.
- No migration.
- No SQL dry-run or apply.
- No route/controller/app/server mount.
- No provider sending.
- No AI/RAG.
- No billing/settlement.
- No customer-visible runtime.
- No auth/session/JWT runtime.

## Future Continuation

Production handler adoption of the audit intent builder requires separate PM approval.

Audit writer or repository integration requires separate PM approval.

Route mount remains blocked until auth/session, permission, audit, idempotency, and runtime rollout decisions are complete.

## Verification

Required by PM:

- `node --test tests/repairIntake/repairIntakeDraftToCaseAuditAwareSyntheticHandlerIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseAuditIntentBuilder.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseAuditIntentBuilderBoundary.static.test.js`
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
- Latest commit remains `000cdb0 Document historical appointment dispatch source review`.
- Historical dirty tracked files remain unstaged and untouched.
- Task1245 and Task1246 files may remain untracked.

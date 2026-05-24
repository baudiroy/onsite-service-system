# Task1248 — Repair Intake Draft-to-Case Idempotency Policy Builder / Pure Runtime / No DB No Route

Status: local implementation ready for PM review.

## Scope

Task1248 adds a pure idempotency policy builder for Repair Intake draft-to-Case route readiness:

- `src/repairIntake/repairIntakeDraftToCaseIdempotencyPolicyBuilder.js`
- `tests/repairIntake/repairIntakeDraftToCaseIdempotencyPolicyBuilder.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseIdempotencyPolicyBuilderBoundary.static.test.js`

The builder returns a deterministic policy envelope only. It does not persist keys, query database, query cache, write cache, mount routes, register controllers, or start app/server runtime.

## Behavior

`buildRepairIntakeDraftToCaseIdempotencyPolicy(input)` requires safe scalar:

- `organizationId`
- `actorId`
- `repairIntakeDraftId`

Optional safe scalar fields:

- `requestId`
- `idempotencyKey`
- `source`

The returned policy includes:

- `ok`
- `status`
- `messageKey`
- `idempotencyScope`
- `idempotencyKey`
- `dedupeKey`
- `organizationId`
- `actorId`
- `repairIntakeDraftId`
- `requestId`
- `source`

`idempotencyScope` and `dedupeKey` include the organization boundary. Different organizations or different drafts produce different dedupe keys.

If an explicit `idempotencyKey` is absent, the builder uses `requestId`; if both are absent, it derives a deterministic fallback from safe actor and draft fields.

Invalid input returns a safe invalid envelope and does not throw raw errors.

## Sensitive Field Exclusion

The implementation does not copy raw request/body data, actor PII, SQL/query details, stack traces, external payloads, permission traces, database rows, phone, address, or email.

The builder does not mutate input and returns a detached result object.

## Explicit Non-goals

- No idempotency key persistence.
- No database lookup.
- No cache lookup or write.
- No idempotency store, repository, or cache integration.
- No route/controller/app/server mount.
- No provider sending.
- No AI/RAG.
- No billing/settlement.
- No customer-visible runtime.
- No auth/session/JWT runtime.

## Future Continuation

This prepares the future route readiness item for idempotency behavior.

Future idempotency store, repository, or cache integration requires separate PM approval.

## Verification

Required by PM:

- `node --test tests/repairIntake/repairIntakeDraftToCaseIdempotencyPolicyBuilder.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseIdempotencyPolicyBuilderBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseFullSyntheticHttpEnvelopeIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseAuditAwareSyntheticHandlerIntegration.unit.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git diff --cached --name-only`
- `git diff --name-only`
- `git log -1 --oneline`

Expected:

- Unit/static tests pass.
- Existing full synthetic HTTP-envelope integration passes.
- Audit-aware synthetic integration passes.
- Diff checks pass.
- Staged area remains empty.
- Latest commit remains `419e9cd Add repair intake draft-to-case audit intent builder`.
- Historical dirty tracked files remain unstaged and untouched.

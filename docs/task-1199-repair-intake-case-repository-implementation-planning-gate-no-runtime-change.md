# Task1199 - Repair Intake Case Repository Implementation Planning Gate / No Runtime Change

## Status

Completed locally. Not staged.

This is a planning gate only. It does not create a case repository implementation, writer, service wiring, route wiring, app bootstrap wiring, migration SQL change, package change, provider change, admin change, AI change, billing change, or DB behavior change.

It does not perform git staging, commit, cleanup, revert, reset, stash, DB connection, SQL execution, migration dry-run, migration apply, `psql`, or `db:migrate`.

## Accepted Baseline

- Task1198 was accepted as the Repair Intake persistence branch commit stack checkpoint.
- Migration 026 is committed as a persistence proposal only.
- Repair Intake draft repository read model and draft repository contract are committed.
- Repair Intake idempotency repository read model, idempotency repository contract, and idempotency writer forwarding are committed.
- Repair Intake case repository contract may already exist in the prior local patch stack, but it remains separate from the current committed persistence stack until PM accepts a bounded staging/commit task.
- Case repository implementation has not started in the current committed persistence stack.
- No DB execution has occurred.

## Case Repository Purpose

The future case repository implementation is expected to support a bounded method under consideration:

- `createCaseFromDraft(input)`

The intended source of truth must be decided before implementation:

- If the project already has a final formal Case table/model/repository/service, Repair Intake case creation should use that formal Case source of truth.
- The `repair_intake_draft_case_conversions` table from migration 026 should track draft-to-case conversion state only. It must not replace the formal Case table/model.

The future implementation must preserve:

- one Case / one formal completion report principles;
- organization and tenant isolation;
- customer-visible vs internal-only data separation;
- no exposure or propagation of `finalAppointmentId`.

## Key Design Decisions Before Implementation

Before source/runtime implementation starts, PM should explicitly decide:

- Which existing Case repository, service, or model is the source of truth for formal Case creation.
- Whether Repair Intake case creation calls an existing Case domain service instead of direct SQL.
- Whether the future repository should use an injected existing Case service, an injected dbClient, or a synthetic adapter first.
- The transaction boundary across draft repository read, Case creation, conversion record, idempotency record, and audit event.
- How duplicate and conflict handling should behave for repeated requests, already-converted drafts, conflicting idempotency keys, and mismatched organization scope.
- How organization and tenant isolation are enforced at every boundary.
- Which actor and request context fields are required, optional, sanitized, or rejected.
- Which fields are customer-visible and which must remain internal-only.
- How failure is handled after partial writes, including retry behavior, manual review, compensating records, and audit visibility.

## Recommended Safe Sequence

1. Stage and commit the existing case repository contract only if PM accepts it as a separate bounded task.
2. Create a case repository implementation preflight that decides whether to use an injected existing Case service or an injected dbClient.
3. Implement only a synthetic injected adapter first, with no real DB execution.
4. Wire the repository into app/service flow only after the transaction policy is accepted.

## Hard Boundaries

- No direct writer implementation in this task.
- No repository implementation in this task.
- No app-service wiring.
- No route, controller, or global mount wiring.
- No DB connection, SQL execution, migration dry-run, migration apply, `psql`, or `db:migrate`.
- No global DB import.
- No migration SQL change.
- No provider, admin, AI, billing, settlement, webhook, LINE, SMS, app, email, or smoke/shared runtime change.
- No `finalAppointmentId`.

## Future Bounded Task Candidates

- Case repository contract staging readiness.
- Case repository implementation preflight.
- Transaction boundary decision matrix.
- Case repository synthetic implementation with no DB execution.

## Acceptance Notes

- Only this Task1199 document is created.
- No source, test, runtime, package, migration SQL, admin, provider, route, controller, app-service, smoke, or design docs are modified by this task.
- No staging or commit is performed.
- Cached diff must remain empty.
- The case repository implementation remains uncreated.

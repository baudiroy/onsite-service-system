# Task 140 - Survey Runtime Transaction Boundary / Recovery Model Decision / No Runtime Change

## Background

Task140 defines the future transaction boundary and recovery-model decision for survey runtime writes. It does not implement runtime behavior, connect to DB, apply migration, or enable survey sending.

Task138 recommended strict atomic completion + survey intent + outbox writes as the default design. Task139 noted that payload validation failure behavior depends on whether the product chooses strict atomic or completion-first recovery.

## No-runtime-change Statement

Task140 does not modify migration files, apply migrations, execute DDL, connect to DB, run psql, run `npm run db:migrate`, change schema/indexes, modify backend runtime, add repositories/services, implement feature flags, modify config/env parsing, change API/Admin/smoke, send surveys, start workers/resolvers, implement response intake, or run AI.

## Source Review Summary

Reviewed:

- `docs/task-139-survey-runtime-payload-allow-list-redaction-contract-no-runtime-change.md`
- `docs/task-138-survey-runtime-write-path-contract-no-runtime-change.md`
- `docs/task-137-survey-runtime-feature-flag-kill-switch-contract-no-runtime-change.md`
- `docs/task-120-survey-roadmap-freeze-implementation-readiness-gate.md`
- `docs/task-110-post-completion-survey-trigger-first-transition-design.md`
- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `src/services/FieldServiceReportService.js` read-only context from prior task
- `package.json`

## Decision Recommendation

Default recommendation:

```text
Use strict atomic model for first runtime implementation.
```

Meaning:

- Field Service Report completion, Case completion, survey intent insert, and event outbox insert either all commit or all roll back.
- No durable survey intent / outbox row exists without completed report and completed Case.
- No completed report / completed Case exists without survey rows when survey write-path is enabled.
- External delivery remains outside the completion transaction and starts only in later worker/resolver tasks.

## Model Options

| Model | Description | Benefits | Risks | Recommendation |
| --- | --- | --- | --- | --- |
| Strict atomic | Completion and survey rows commit together. | Strong consistency, simple first-transition reasoning, no reconciliation needed. | Survey write failure can block completion if flags enabled. | Recommended first implementation. |
| Completion-first recovery | Complete Case/report first; create or repair survey rows later. | Completion less likely blocked by survey subsystem. | Requires detector, backfill-like repair, dedupe, race handling, and no-send safeguards. | Defer until operations require it. |
| Survey-only best effort | Try survey write and ignore failure. | Minimal operational friction. | Silent missing survey intents, harder audit, no clear first-transition guarantee. | Not recommended. |

## Strict Atomic Contract

Future strict atomic write-path must satisfy:

1. Already-completed guard runs before survey path.
2. finalAppointmentId is resolved and persisted in the same transaction.
3. Case completion update succeeds in the same transaction.
4. Payload allow-list validation succeeds before insert.
5. `survey_intents` insert succeeds.
6. `event_outbox` insert succeeds.
7. Timeline / audit behavior remains consistent with completion transaction policy.
8. Commit happens once after all durable side effects.
9. If any step fails, rollback removes completion and survey rows.
10. No external delivery happens inside the transaction.

## Recovery Model Requirements If Chosen Later

If completion-first recovery is ever chosen, a separate task must define:

- missing-intent detector,
- safe reconciliation window,
- organization-scoped idempotency,
- concurrency/race behavior,
- payload allow-list validation,
- no real outbound during repair by default,
- smoke/internal/test suppression,
- operator visibility of repair state,
- failure alerting with safe logs,
- explicit no backfill unless separately approved.

Completion-first recovery must not become a hidden historical backfill path.

## Failure Behavior Matrix

| Failure | Strict atomic behavior | Completion-first behavior if later chosen |
| --- | --- | --- |
| Payload validation fails | Rollback completion; safe error. | Complete only if recovery policy allows missing intent; otherwise reject. |
| Survey intent insert conflict | Rollback or explicit idempotent handling; no duplicate. | Detector must not duplicate. |
| Outbox insert fails | Rollback completion. | Intent may need repair; no sending. |
| DB constraint error | Rollback completion; safe error. | Recovery queue required. |
| Flags disabled | No survey rows; completion proceeds normally. | Same. |
| Migration not applied | Fail safe before survey path; no sending. | Same; no repair. |
| Repeat completion | Conflict before survey path. | Same. |

## Commit / Side-effect Boundary

Inside transaction:

- report completion mutation,
- Case completion mutation,
- timeline/audit if current architecture keeps them transactional,
- survey intent insert,
- event outbox insert.

Outside transaction:

- delivery resolver,
- outbox worker,
- provider send,
- survey response intake,
- AI advisory,
- Admin visibility refresh,
- metrics aggregation that does not affect completion.

## Idempotency And Concurrency

Future implementation should rely on:

- report status transition guard,
- completed report repeat conflict,
- organization + idempotency key uniqueness,
- organization + case + service report uniqueness,
- event outbox organization + event type + idempotency key uniqueness,
- transaction rollback on conflict unless explicit idempotent path is designed.

Concurrent first-completion attempts must produce at most one completed report transition and at most one survey intent/outbox pair.

## Product / Operations Tradeoff

Strict atomic means survey subsystem failures can block completion after flags are enabled. This is acceptable only if:

- feature flags default off,
- rollout starts in controlled environment,
- payload validation is deterministic,
- repository code is simple,
- rollback / disable path exists.

If business operations cannot tolerate completion blocking, completion-first recovery must be designed before implementation, not patched in ad hoc.

## Future Tests

Future tests should cover:

1. Strict atomic success commits report, Case, intent, and outbox.
2. Survey intent validation failure rolls back report and Case completion.
3. Outbox insert failure rolls back report and Case completion.
4. Duplicate idempotency key does not duplicate rows.
5. Repeat completion conflict occurs before survey path.
6. Flags disabled keeps existing completion behavior.
7. No provider send occurs inside completion transaction.

Task140 does not add tests.

## Remaining Blockers

Before implementation:

- Migration 020 apply status resolved.
- Strict atomic choice accepted by product/operations.
- Runtime feature flags implemented and default off.
- Payload allow-list implemented.
- Repository contracts approved.
- Targeted tests approved.
- No-send smoke approved.

## Final Recommendation

Adopt strict atomic as the initial implementation contract and explicitly defer completion-first recovery. Keep delivery outside the completion transaction and keep all survey runtime disabled until separate implementation approval.

Task141 should design the future `SurveyIntentRepository` contract as docs-only, using this strict atomic assumption.

## Non-goals

Task140 does not implement transactions, recovery, repositories, services, feature flags, migration apply, schema/index changes, API/Admin/smoke changes, survey sending, delivery resolver, outbox worker, response intake, AI runtime, inventory docs changes, or destructive cleanup.

## Verification Summary

Task140 verification should confirm:

- `npm run check` passes.
- `npm run admin:check` passes if executed.
- `git diff --check` passes.
- `npm run db:migrate` remains separate and was not executed.
- No psql command was executed.
- This document contains no executable DB command packet and no runtime implementation instruction.
- This document contains no actual `DATABASE_URL` value, password, token, secret, customer mobile, raw LINE user id, LINE channel secret, LINE access token, full payload, raw payload, or production data.

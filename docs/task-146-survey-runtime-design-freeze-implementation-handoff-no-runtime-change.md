# Task 146 - Survey Runtime Design Freeze / Implementation Handoff / No Runtime Change

## Background

Task146 freezes the survey runtime design package and prepares implementation handoff. It does not implement runtime behavior, connect to DB, apply migration, or approve survey sending.

Task145 recommended freezing Tasks137-145 as a complete survey runtime design package. Task146 turns that recommendation into a handoff note for future implementation planning.

## No-runtime-change Statement

Task146 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify smoke or browser smoke scripts,
- add tests,
- edit Migration 020,
- add or apply migrations,
- execute DDL,
- connect to DB,
- run psql,
- run `npm run db:migrate`,
- change schema or indexes,
- implement repositories,
- implement services,
- implement feature flags,
- change config or env parsing,
- change API behavior,
- create survey intents,
- create outbox events,
- start outbox workers,
- start delivery resolvers,
- send LINE / APP / SMS / email notifications,
- implement response intake,
- implement AI runtime,
- approve runtime implementation,
- approve migration apply,
- approve survey sending,
- modify Task087 inventory docs,
- mutate shared runtime data.

## Source Review Summary

Reviewed:

- `docs/task-145-survey-runtime-implementation-readiness-gate-no-runtime-change.md`
- `docs/task-144-survey-runtime-no-send-test-smoke-coverage-plan-no-runtime-change.md`
- `docs/task-143-survey-first-completion-service-contract-no-runtime-change.md`
- `docs/task-142-event-outbox-repository-contract-no-runtime-change.md`
- `docs/task-141-survey-intent-repository-contract-no-runtime-change.md`
- `docs/task-140-survey-runtime-transaction-boundary-recovery-model-no-runtime-change.md`
- `docs/task-139-survey-runtime-payload-allow-list-redaction-contract-no-runtime-change.md`
- `docs/task-138-survey-runtime-write-path-contract-no-runtime-change.md`
- `docs/task-137-survey-runtime-feature-flag-kill-switch-contract-no-runtime-change.md`
- `docs/task-136-migration-020-no-apply-path-continuation-survey-runtime-design-backlog.md`
- `docs/task-135-migration-020-local-only-dry-run-authorization-follow-up-no-apply.md`
- `docs/task-129-migration-020-static-sql-re-review-no-apply.md`
- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `docs/task-120-survey-roadmap-freeze-implementation-readiness-gate.md`
- `docs/task-110-post-completion-survey-trigger-first-transition-design.md`
- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
- `package.json`

## Runtime Design Source-of-truth Index

| Task / document | Purpose | Current status | Use as source of truth? | Use only as background? | Implementation approved? | Runtime change made? | Migration apply required? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Task137 - Feature flags / kill switches | Defines disabled-by-default runtime gates. | Frozen design | Yes | No | No | No | No for design; yes for write flags that touch tables. |
| Task138 - Write-path contract | Defines future first-completion survey write path. | Frozen design | Yes | No | No | No | Yes for actual writes. |
| Task139 - Payload allow-list / redaction | Defines safe payload boundaries. | Frozen design | Yes | No | No | No | No for design. |
| Task140 - Transaction boundary | Recommends strict atomic model. | Frozen design | Yes | No | No | No | Yes for runtime verification. |
| Task141 - SurveyIntentRepository contract | Defines future survey intent persistence boundary. | Frozen design | Yes | No | No | No | Yes for insert tests/writes. |
| Task142 - EventOutboxRepository contract | Defines future outbox persistence boundary. | Frozen design | Yes | No | No | No | Yes for insert tests/writes. |
| Task143 - SurveyFirstCompletionService contract | Defines future orchestration boundary. | Frozen design | Yes | No | No | No | Depends on phase. |
| Task144 - No-send tests / smoke coverage | Defines future verification plan. | Frozen design | Yes | No | No | No | Yes for DB-write smoke. |
| Task145 - Implementation readiness gate | Defines implementation blockers and gates. | Frozen design | Yes | No | No | No | Depends on phase. |
| Task136 / Task135 / Task129 | No-apply path, authorization, static SQL evidence. | Background and evidence | No | Yes | No | No | Dry-run/apply still not approved. |
| Task120 / Task110 / Task105 | Earlier survey and completion invariants. | Background source | Yes for upstream invariants | Yes | No for survey runtime | Some non-survey runtime already exists from earlier tasks | Not by itself. |

## Freeze Scope

Frozen for the current design package:

1. Survey runtime flags default false.
2. Missing / invalid flags fail closed.
3. Migration apply does not enable flags.
4. Survey write path source of truth = first successful durable backend Case service completion transition.
5. Repeat completion 409 creates no survey artifacts.
6. Rejected completion creates no survey artifacts.
7. finalAppointmentId is completed report persisted value.
8. Strict atomic first implementation is recommended.
9. Payloads are allow-list only.
10. No raw LINE id / mobile / provider payload / full payload.
11. `SurveyIntentRepository` is a thin transaction-aware persistence layer.
12. `EventOutboxRepository` is a thin transaction-aware persistence layer.
13. `SurveyFirstCompletionService` is the orchestration boundary.
14. Outbox worker / resolver / sending are not part of write-path.
15. No-send test coverage is required before runtime writes.
16. Shared runtime must not do destructive cleanup.
17. Inventory docs remain frozen and out of scope.

## Freeze Non-approval Statement

This freeze does not approve:

1. Migration 020 apply.
2. Local dry-run execution.
3. Shared runtime apply.
4. Runtime writes.
5. Feature flag implementation.
6. Repository implementation.
7. Service implementation.
8. `FieldServiceReportService` integration.
9. API changes.
10. Admin UI changes.
11. Smoke/test changes.
12. Outbox worker.
13. Delivery resolver.
14. Survey sending.
15. LINE / APP / SMS / email push.
16. Historical backfill.
17. Survey response intake.
18. AI runtime.
19. Manual send / resend / override.
20. Any destructive cleanup.

## Implementation Handoff Checklist

Before runtime implementation starts, confirm:

1. Migration 020 is applied in target environment, or implementation phase does not touch DB.
2. Local/test dry-run passed if DB writes are involved.
3. Shared apply is explicitly approved if target is shared runtime.
4. Runtime implementation is explicitly approved.
5. Feature flag source and parser are approved.
6. All flags default false.
7. Strict atomic model is accepted by product/ops.
8. Payload allow-list is implemented.
9. Safe error/logging policy is implemented.
10. `SurveyIntentRepository` contract is accepted.
11. `EventOutboxRepository` contract is accepted.
12. `SurveyFirstCompletionService` contract is accepted.
13. No-send tests are implemented.
14. No-send smoke plan is approved.
15. Rollback / disable plan is approved.
16. No delivery sending occurs in write-path.
17. No Admin manual controls are added.
18. No AI automatic decisions are added.
19. No raw LINE id / mobile / full payload is stored or output.
20. No shared destructive cleanup is performed.

## Implementation Phase Handoff

| Phase | Scope | Requires migration apply? | Requires runtime code? | Requires API/Admin/smoke change? | Requires sending approval? | Currently approved? |
| --- | --- | --- | --- | --- | --- | --- |
| Phase 0 - Authorization / migration readiness | Local dry-run approval, local dry-run execution, shared apply readiness. | Yes for dry-run/apply verification | No | No | No | No |
| Phase 1 - Feature flags only | Disabled-by-default flags, no writes, no sending. | No | Yes | Config/env only | No | No |
| Phase 2 - Repository skeletons | `SurveyIntentRepository`, `EventOutboxRepository`, no completion integration. | No for skeleton; yes for DB insert tests | Yes | Tests later | No | No |
| Phase 3 - SurveyFirstCompletionService no-op / disabled | Service exists but no DB writes unless flags and migration applied. | No for no-op | Yes | Tests later | No | No |
| Phase 4 - Completion write-path integration behind disabled flags | Integration present, disabled by default. | No while disabled | Yes | Tests likely | No | No |
| Phase 5 - Local/test no-send verification | Writes survey rows in local/test with no provider calls. | Yes local/test | Existing runtime code | New smoke/test | No | No |
| Phase 6 - Shared runtime inert write readiness | Explicitly approved no-send shared writes. | Yes shared | Existing runtime code | Safe smoke/readiness | No | No |
| Phase 7 - Resolver / outbox worker disabled-by-default | Worker/resolver disabled by default. | Yes | Yes | Tests | No for no-send worker | No |
| Phase 8 - Sending readiness | Channel policy, opt-out, contact target, provider credential safety. | Yes | Yes | Delivery tests | Yes | No |

## Remaining Blockers

1. No complete local-only dry-run authorization packet.
2. Migration 020 has not been locally dry-run in this task chain.
3. Migration 020 has not been applied.
4. Runtime implementation is not approved.
5. Feature flag implementation is not approved.
6. Config/env parser change is not approved.
7. Repository/service implementation is not approved.
8. `FieldServiceReportService` integration is not approved.
9. No-send tests are not implemented.
10. Shared runtime write policy is not approved.
11. Delivery resolver is not approved.
12. Outbox worker is not approved.
13. Sending is not approved.
14. Admin UI is not approved.
15. Response intake is not approved.
16. AI runtime is not approved.
17. Historical backfill is not approved.
18. Product policies for delivery/contact/opt-out remain future.
19. Provider credentials safety is not reviewed.
20. No shared runtime destructive cleanup remains mandatory.

## Reopen Conditions

Reopen survey runtime design docs only if:

1. Migration 020 schema changes.
2. Feature flag names or hierarchy change.
3. Payload allow-list changes.
4. Strict atomic recommendation changes.
5. Repository/service boundary changes.
6. `FieldServiceReportService` completion behavior changes.
7. Repeat completion guard changes.
8. finalAppointmentId stability changes.
9. Channel abstraction assumptions change.
10. Delivery / resolver scope changes.
11. Admin UI requirements change.
12. AI policy changes.
13. Privacy / redaction requirements change.
14. Shared runtime policy changes.
15. A security review finds a gap.
16. User explicitly approves runtime implementation and design gaps are found.

## Future Implementer Reading Order

Future implementer should read in order:

1. Task145 readiness gate.
2. Task137 flags.
3. Task138 write-path.
4. Task140 transaction model.
5. Task139 payload allow-list.
6. Task141 repository.
7. Task142 outbox repository.
8. Task143 service.
9. Task144 tests.
10. Migration 020 SQL.

Critical reminders:

- Do not start implementation from Migration 020 SQL alone.
- Do not enable runtime writes without flags.
- Do not write survey rows outside the completion transaction.
- Do not send survey from completion transaction.
- Do not use LINE-specific identity in completion core.
- Do not expose sensitive payload.

## Task147 Recommendation

Because there is still no DDL approval, no migration apply, and no runtime approval, Task147 should not implement runtime.

Recommended:

```text
Task147 - Migration 020 / Survey Runtime Handoff Index and Pause Point / No Runtime Change
```

Scope:

- docs-only,
- create final index for Tasks121-146,
- mark current pause point,
- clarify next branches:
  - authorization/dry-run path,
  - migration apply path,
  - runtime implementation path,
  - delivery path,
- no implementation.

Alternative only if the user provides explicit approval:

```text
Task147 - Authorization Response Review / No Apply
```

## Final Recommendation

Treat the survey runtime design package as frozen after Task146. The design is ready for future implementation planning, but not runtime implementation, migration apply, survey writes, or sending. Future work should branch explicitly into authorization/dry-run, migration apply, runtime implementation, or delivery planning, and each branch requires its own approval gate.

## Non-goals

Task146 does not implement runtime behavior, feature flags, repositories, services, tests, smoke, migration apply, schema/index changes, DB connections, delivery resolver, outbox worker, survey sending, Admin UI, response intake, AI runtime, inventory docs changes, shared runtime mutation, or destructive cleanup.

## Verification Summary

Task146 verification should confirm:

- `npm run check` passes.
- `npm run admin:check` passes if executed.
- `git diff --check` passes.
- No migration file was modified.
- No migration apply occurred.
- No psql command was executed.
- `npm run db:migrate` was not executed.
- This document contains no executable DB command packet and no runtime implementation instruction.
- Implementation handoff remains a non-approval.
- This document contains no actual `DATABASE_URL` value, password, token, secret, customer mobile, raw LINE user id, LINE channel secret, LINE access token, full payload, raw payload, or production data.

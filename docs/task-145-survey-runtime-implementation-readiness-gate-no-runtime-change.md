# Task 145 - Survey Runtime Implementation Readiness Gate / No Runtime Change

## Background

Task145 reviews implementation readiness for future survey runtime. It does not implement runtime behavior, connect to DB, apply migration, or approve survey sending.

This document aggregates Tasks137-144 into a readiness gate so the project has a clear boundary between design, implementation planning, runtime writes, and delivery/sending.

## No-runtime-change Statement

Task145 does not:

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

## Readiness Gate Inventory

| Gate | Current state |
| --- | --- |
| Migration 020 local-only dry-run authorization | Missing / not approved. |
| Migration 020 local-only dry-run result | Missing / not executed. |
| Migration 020 shared apply approval | Missing / not approved. |
| Migration 020 applied in target environment | Not proven / not performed by these tasks. |
| Feature flag / kill switch implementation approval | Designed only; not approved for implementation. |
| Config/env parser change approval | Not approved. |
| Runtime write approval | Not approved. |
| Strict atomic product/ops acceptance | Recommended; requires explicit acceptance before implementation. |
| Same-org / same-case runtime guard design | Designed conceptually; implementation not approved. |
| Payload allow-list implementation approval | Designed only; not approved for implementation. |
| SurveyIntentRepository implementation approval | Designed only; not approved. |
| EventOutboxRepository implementation approval | Designed only; not approved. |
| SurveyFirstCompletionService implementation approval | Designed only; not approved. |
| FieldServiceReportService integration approval | Not approved. |
| No-send tests implementation approval | Planned only; not approved. |
| Local/test no-send smoke implementation approval | Planned only; not approved. |
| Shared runtime no-send policy | Not approved beyond existing no destructive/no sending boundary. |
| Delivery resolver approval | Not approved. |
| Outbox worker approval | Not approved. |
| Survey sending approval | Explicitly not approved. |
| Admin visibility approval | Not approved. |
| Survey response intake approval | Not approved. |
| AI advisory approval | Not approved for runtime. |
| Historical backfill approval | Explicitly not approved. |
| Privacy / redaction / logging approval | Designed conceptually; needs implementation approval. |
| Rollout / rollback approval | Not approved. |

## Readiness Classification

Status options used below:

- Closed for design.
- Ready for implementation planning.
- Blocking implementation.
- Blocking runtime writes.
- Blocking delivery.
- Deferred.
- Explicitly forbidden until future approval.

Current classifications:

1. Migration 020 not applied -> blocking runtime writes.
2. Local-only dry-run authorization missing -> blocking dry-run execution.
3. Runtime feature flags only designed -> blocking implementation until approved.
4. Repositories only designed -> blocking implementation until approved.
5. `SurveyFirstCompletionService` only designed -> blocking implementation until approved.
6. Tests only planned -> blocking runtime implementation quality gate until approved/implemented.
7. Delivery/sending remains explicitly forbidden until future approval.
8. Admin survey UI remains deferred and not approved.
9. AI runtime remains deferred and not approved.
10. Inventory docs remain frozen and unrelated.

## Implementation Phase Proposal

These phases are proposals only. Task145 does not start any phase.

| Phase | Description | Requires migration apply? | Requires runtime code changes? | Requires tests? | Requires shared runtime approval? | Requires delivery approval? |
| --- | --- | --- | --- | --- | --- | --- |
| Phase 0 - Authorization / migration readiness | Local-only dry-run approval, dry-run execution, shared apply readiness review, shared apply only if explicitly approved. | Yes for dry-run/apply verification | No runtime code | Static/dry-run proof | Yes for shared apply | No |
| Phase 1 - Feature flags only | Implement flags / kill switches, default false, no survey writes. | No | Yes | Yes | Yes for shared deployment | No |
| Phase 2 - Repository skeletons behind no runtime usage | Add `SurveyIntentRepository` and `EventOutboxRepository`, no completion integration. | Tables needed for real insert tests; not for skeleton syntax | Yes | Unit/repository tests | Possibly | No |
| Phase 3 - SurveyFirstCompletionService no-op / flags disabled | Service exists but disabled; no DB writes unless flags on. | No for no-op | Yes | Unit tests | Possibly | No |
| Phase 4 - Completion write-path integration behind disabled flags | Integration present but disabled by default. | No if flags off | Yes | Integration tests | Yes for deployment | No |
| Phase 5 - Local/test no-send write-path verification | Flags enabled only in local/test, writes rows, no provider calls. | Yes in local/test | Existing runtime code | No-send tests/smoke | No shared runtime | No |
| Phase 6 - Shared runtime inert write readiness | Potential shared inert writes after explicit approval, still no sending. | Yes in shared target | Existing runtime code | Safe smoke/readiness | Yes | No |
| Phase 7 - Delivery resolver / worker design implementation | Disabled by default, no sending unless separately approved. | Yes | Yes | Worker/resolver tests | Yes | Not for no-send processing |
| Phase 8 - Sending readiness | Channel policy, opt-out, contact target, credential safety, explicit sending approval. | Yes | Yes | Delivery tests | Yes | Yes |

## No-go Decision Conditions

Do not enter runtime implementation if any are true:

1. Migration 020 is not applied and the implementation requires tables.
2. No local/test dry-run and no alternative schema verification exists.
3. Feature flag implementation approval is missing.
4. Strict atomic acceptance is missing.
5. Payload allow-list implementation plan is missing.
6. Tests for no-survey paths are missing.
7. No-send assertions are missing.
8. Runtime write approval is missing.
9. Shared runtime policy is missing.
10. The task requires enabling sending.
11. The task requires destructive shared runtime operations.
12. Target environment or `DATABASE_URL` handling is ambiguous.
13. The plan hard-codes LINE into completion core.
14. The plan exposes raw LINE user id / customer contact / raw payload.
15. The plan uses AI automatic decisions.

## Go Conditions For Implementation Planning Only

Implementation planning may proceed if:

1. Task145 readiness gate is documented.
2. Migration 020 file exists and static review passed.
3. Runtime design contracts exist.
4. No actual implementation is included.
5. No migration apply is needed for planning.
6. No DB connection is needed.
7. No sending is included.
8. Next task remains docs-only or explicitly scoped to planning.

## Go Conditions For Runtime Implementation

Runtime implementation may begin only after:

1. Migration 020 is applied in the target environment, or the implementation phase avoids DB writes entirely.
2. Explicit runtime implementation approval is granted.
3. Feature flag source and parser are approved.
4. Flags default false.
5. Strict atomic model is approved.
6. Payload allow-list implementation is approved.
7. No-send tests are planned and approved.
8. Rollback / disable plan is approved.
9. Sensitive output policy is approved.
10. Shared runtime policy is approved.
11. Delivery sending is not included.
12. AI automatic decision is not included.

## Delivery And Sending Gate

Survey sending is not part of runtime write-path implementation.

Delivery/sending requires separate future gates:

1. Delivery resolver implementation approval.
2. Outbox worker implementation approval.
3. Channel policy.
4. Opt-out policy.
5. Contact target policy.
6. Provider credential safety.
7. Smoke/internal/test suppression.
8. No raw LINE id / mobile / payload.
9. Admin visibility policy.
10. Explicit sending approval.

## Readiness Matrix

| Area | Design artifact | Current status | Blocks planning? | Blocks runtime implementation? | Blocks runtime writes? | Blocks delivery? | Required next approval | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Migration 020 file | Migration 020 + Tasks121-129 | Closed for design | No | No for planning | Yes until applied | Yes for live rows | Apply target approval | File authored, not applied here. |
| Local dry-run | Tasks130-135 | Blocking dry-run execution | No | Yes for DB-write confidence | Yes | Yes | Local-only authorization | No DB connection performed. |
| Shared apply | Tasks130-135 | Blocking runtime writes | No | Yes for shared writes | Yes | Yes | Explicit shared apply approval | No shared apply. |
| Feature flags | Task137 | Ready for implementation planning | No | Yes | Yes | Yes | Flag implementation approval | Defaults false required. |
| Payload allow-list | Task139 | Ready for implementation planning | No | Yes | Yes | Yes | Implementation approval | Unknown keys fail closed. |
| Transaction model | Task140 | Ready for implementation planning | No | Yes until accepted | Yes | No | Strict atomic acceptance | Recommended strict atomic. |
| SurveyIntentRepository | Task141 | Ready for implementation planning | No | Yes | Yes | No | Repository implementation approval | Persistence only. |
| EventOutboxRepository | Task142 | Ready for implementation planning | No | Yes | Yes | Yes | Repository implementation approval | Worker deferred. |
| SurveyFirstCompletionService | Task143 | Ready for implementation planning | No | Yes | Yes | Yes | Service implementation approval | Orchestration only. |
| FieldServiceReportService integration | Task138/143 | Blocking implementation | No | Yes | Yes | Yes | Integration approval | Must remain behind disabled flags. |
| No-send tests | Task144 | Ready for implementation planning | No | Yes | Yes | Yes | Test implementation approval | No tests added yet. |
| Backend smoke | Task144 | Ready for implementation planning | No | Yes for smoke coverage | Yes | Yes | Future smoke approval | Suggested `smoke:030`; not created. |
| Browser smoke | Task144 | Deferred | No | No initially | No | Yes for Admin visibility | Future Admin visibility approval | No survey UI now. |
| Delivery resolver | Tasks114/137/142/143 | Deferred | No | No for write path | No | Yes | Resolver approval | Not part of write path. |
| Outbox worker | Tasks137/142/144 | Deferred | No | No for write path | No | Yes | Worker approval | Disabled by default. |
| Admin UI | Tasks117/144 | Deferred | No | No for backend write path | No | Yes for visibility | Admin visibility approval | No manual send/resend. |
| Response intake | Task116/137 | Deferred | No | No for write path | No | Yes | Response intake approval | Not implemented. |
| AI advisory | Task119/137 | Deferred | No | No for write path | No | Yes | AI advisory approval | Advisory only, no auto decisions. |
| Backfill | Tasks120/137/140 | Explicitly forbidden until future approval | No | Yes if requested | Yes | Yes | Backfill approval | No historical backfill. |
| Privacy/logging | Tasks139/144 | Ready for implementation planning | No | Yes | Yes | Yes | Implementation + security review | No raw sensitive output. |

## Runtime Design Freeze Recommendation

Recommendation:

```text
Freeze survey runtime design docs Tasks137-145 after Task145.
```

Continue survey runtime docs only if one of these changes occurs:

- migration apply status changes,
- user authorizes local dry-run,
- runtime implementation approval is granted,
- delivery/sending policy changes,
- privacy/security review changes,
- real runtime design gap is discovered,
- product policy changes.

This freeze does not approve:

- implementation,
- migration apply,
- runtime writes,
- shared runtime mutation,
- survey sending,
- LINE / APP / SMS / email delivery,
- Admin survey UI,
- AI runtime.

## Task146 Recommendation

Because there is still no DDL approval, no migration apply, and no runtime approval, Task146 should not implement runtime.

Recommended default:

```text
Task146 - Survey Runtime Design Freeze / Implementation Handoff Note / No Runtime Change
```

Scope:

- docs-only,
- freeze runtime design docs Tasks137-145,
- produce concise implementation handoff summary,
- no implementation,
- no migration apply,
- no DB connection,
- no runtime/API/Admin/smoke changes.

Alternative only if the user provides explicit authorization:

```text
Task146 - Migration 020 Local-only Dry-run Authorization Checkpoint / No Apply
```

## Remaining Blockers

Current blockers:

1. No local-only dry-run authorization.
2. No Migration 020 apply.
3. No shared apply approval.
4. No feature flag implementation approval.
5. No runtime write approval.
6. No repository/service implementation approval.
7. No no-send test implementation approval.
8. No delivery resolver / worker approval.
9. No sending approval.
10. No Admin survey visibility approval.
11. No response intake approval.
12. No AI advisory runtime approval.
13. No historical backfill approval.
14. No rollout / rollback approval.

## Final Recommendation

Treat Tasks137-145 as a complete design package for survey runtime readiness, not an implementation approval. The next safe step is a design freeze / implementation handoff note. Runtime work should begin only after explicit approval for the specific implementation phase, with Migration 020 target status, feature flags, no-send tests, strict atomic behavior, and rollback policy settled first.

## Non-goals

Task145 does not implement runtime behavior, feature flags, repositories, services, tests, smoke, migration apply, schema/index changes, DB connections, delivery resolver, outbox worker, survey sending, Admin UI, response intake, AI runtime, inventory docs changes, shared runtime mutation, or destructive cleanup.

## Verification Summary

Task145 verification should confirm:

- `npm run check` passes.
- `npm run admin:check` passes if executed.
- `git diff --check` passes.
- No migration file was modified.
- No migration apply occurred.
- No psql command was executed.
- `npm run db:migrate` was not executed.
- This document contains no executable DB command packet and no runtime implementation instruction.
- Implementation phases are proposals only.
- This document contains no actual `DATABASE_URL` value, password, token, secret, customer mobile, raw LINE user id, LINE channel secret, LINE access token, full payload, raw payload, or production data.

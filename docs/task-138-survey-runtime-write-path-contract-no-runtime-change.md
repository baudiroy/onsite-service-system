# Task 138 - Survey Runtime Write-path Contract Design / No Runtime Change

## Background

Task138 designs the future survey runtime write-path contract. It does not implement runtime behavior, connect to DB, apply migration, or enable survey sending.

This document defines where `survey_intents` and `event_outbox` writes would conceptually happen after Migration 020 is applied, feature flags are enabled, and runtime write approval is explicit.

## No-runtime-change Statement

Task138 does not:

- modify `FieldServiceReportService`,
- add repository / service files,
- implement feature flags,
- change config or env parsing,
- edit Migration 020,
- add a migration file,
- apply migrations,
- execute DDL,
- connect to DB,
- run psql,
- run `npm run db:migrate`,
- change schema or indexes,
- change API,
- change Admin UI,
- change smoke or browser smoke,
- start survey sending, notification sending, LINE / APP / SMS / email push, outbox worker, delivery resolver, response intake, webhook, template seed, survey content seed, survey link generation, dashboard, manual override, or AI runtime.

## Source Review Summary

Reviewed:

- `docs/task-137-survey-runtime-feature-flag-kill-switch-contract-no-runtime-change.md`
- `docs/task-136-migration-020-no-apply-path-continuation-survey-runtime-design-backlog.md`
- `docs/task-120-survey-roadmap-freeze-implementation-readiness-gate.md`
- `docs/task-110-post-completion-survey-trigger-first-transition-design.md`
- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
- `docs/task-129-migration-020-static-sql-re-review-no-apply.md`
- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `src/services/FieldServiceReportService.js`
- `src/repositories/FieldServiceReportRepository.js`
- `src/repositories/AppointmentRepository.js`
- `src/repositories/CaseRepository.js`
- `package.json`

## Current Completion Flow Review

Current conceptual completion flow in `FieldServiceReportService.completeServiceReport`:

1. Enter `completeServiceReport`.
2. Load existing Field Service Report.
3. Check Case access.
4. Reject already-completed report before final appointment resolution or side effects.
5. Resolve / validate `finalAppointmentId`.
6. Compute completion timestamp.
7. Update Field Service Report to completed and persist final appointment.
8. Update Case service summary to completed.
9. Create workflow timeline message.
10. Create audit record.
11. Return mapped completed report DTO.

Current absence:

- no survey write-path,
- no `survey_intents` repository/service,
- no `event_outbox` repository/service,
- no resolver,
- no worker,
- no sending.

Required invariants:

- already-completed guard must remain before survey side effects,
- repeat completion conflict must never create survey rows,
- `finalAppointmentId` used by survey must be the completed report's persisted value,
- no AI decision,
- no Admin payload dependency,
- no LINE-specific dependency.

## Write-path Source Of Truth

Future survey runtime write-path source of truth:

```text
first successful durable backend Case service completion transition
```

Meaning:

1. Field Service Report transitions from non-completed to completed.
2. Case completion update succeeds.
3. finalAppointmentId has been resolved and persisted, or legacy null policy explicitly allows null.
4. The write transaction commits.
5. It is not a repeat completion.
6. It is not a rejected completion.
7. It is not a post-completion edit.
8. It is not a manual correction.
9. It is not an AI decision.
10. It is not historical backfill unless a separate backfill path is explicitly enabled.

## Conceptual Insertion Point

Recommended future conceptual sequence:

1. Validate completion request.
2. Reject already-completed report before side effects.
3. Resolve / validate finalAppointmentId.
4. Confirm first successful completion transition.
5. Start / use completion transaction.
6. Update Field Service Report completed state.
7. Update Case completed state.
8. Create timeline / audit records according to existing behavior.
9. If all survey runtime write flags are enabled:
   - build survey intent safe context,
   - insert `survey_intent`,
   - insert `event_outbox` event.
10. Commit transaction.
11. Return completed report / Case response.
12. Do not run delivery resolver.
13. Do not run outbox worker.
14. Do not send survey.

Ordering note:

- The exact ordering of timeline / audit versus survey inserts inside a future transaction may be implementation-specific.
- All durable completion side effects must commit or rollback consistently according to the chosen atomic model.
- External delivery must never happen inside the completion transaction.
- If flags are disabled, completion should not write survey rows and should preserve existing completion behavior.

## Write-path Preconditions

Future write-path can run only when all are true:

1. Migration 020 is applied in the target environment.
2. `SURVEY_RUNTIME_ENABLED=true`.
3. `SURVEY_COMPLETION_HOOK_ENABLED=true`.
4. `SURVEY_INTENT_WRITE_ENABLED=true`.
5. `SURVEY_OUTBOX_WRITE_ENABLED=true` if outbox write is part of the same transaction.
6. Runtime write approval exists.
7. Completion request is not repeat completion.
8. Report was non-completed before transition.
9. Completion validation passed.
10. finalAppointmentId is resolved and persisted, or legacy null policy explicitly allows null.
11. Case completion update succeeds.
12. No historical backfill path is involved.
13. Payload allow-list passes.
14. Same-organization / same-Case runtime guard passes.
15. Strict atomic or explicitly approved recovery model is active.
16. No delivery sending flag is required or used.
17. No outbox worker / resolver / sending happens in completion request.

## No-survey Paths

These paths must not create `survey_intents` or `event_outbox` rows:

1. Repeat completion conflict.
2. Already completed report.
3. Report update after completion.
4. Reopen attempt.
5. No eligible completed visit rejection.
6. Cross-case finalAppointmentId rejection.
7. Non-completed finalAppointmentId rejection.
8. Failed completion validation.
9. Failed transaction.
10. Explicit manual correction path.
11. AI suggestion path.
12. Completion request when survey runtime flags are disabled.
13. Migration not applied.
14. Historical backfill disabled.
15. Smoke / internal / test suppressed according to policy.
16. Legacy no-appointment case when policy disabled.
17. Delivery retry.
18. Resolver re-run.
19. Channel binding event.
20. Admin UI action.

## Strict Atomic Transaction Contract

Recommended contract:

1. Field Service Report completion, Case completion, `survey_intent` insert, and `event_outbox` insert should commit atomically when write-path is enabled.
2. If survey intent / outbox insert fails, completion should roll back under strict atomic model.
3. This product / operations tradeoff must be explicitly approved before implementation.
4. If strict atomic is not acceptable, completion-first recovery requires a separate reconciliation design before implementation.
5. No partial durable state where report is completed but survey intent/outbox is missing, unless a recovery model is explicitly chosen.
6. No durable survey intent/outbox without completed report and Case.
7. External delivery happens only after commit and only in a later resolver / worker flow.
8. Local dry-run / migration apply does not enable this write-path.

Open tradeoff:

- Strict atomic improves correctness but can make survey path failure block completion.
- Completion-first recovery avoids blocking completion but adds reconciliation and duplicate-risk complexity.

## `survey_intent` Write Contract

Future insert source:

| Field | Source |
| --- | --- |
| `organization_id` | Case / service context. |
| `case_id` | Completed Case. |
| `service_report_id` | Completed Field Service Report. |
| `final_appointment_id` | Completed report persisted finalAppointmentId, nullable only if policy allows. |
| `trigger_event_type` | `case.service_completion.first_transitioned`. |
| `trigger_event_version` | Current event version. |
| `idempotency_key` | `survey:first-completion:case:<caseId>:report:<serviceReportId>`. |
| `intent_status` | Initial policy state such as `pending_policy` unless later policy changes it. |
| `policy_status` | Deterministic policy summary, not AI. |
| `completed_at` | Persisted completion timestamp. |
| `source` | `backend`. |
| `safe_context_summary` | Allow-list only. |
| `triggered_by_user_id` | Optional internal reference only if available and allowed. |

Must not include:

- customer mobile / phone / tel,
- raw LINE user id,
- device token,
- provider payload,
- full customer / Case / report / appointment payload,
- credentials,
- operator personal identity,
- raw request / response body,
- AI output.

## `event_outbox` Write Contract

Future insert source:

| Field | Source |
| --- | --- |
| `organization_id` | Case / service context. |
| `event_type` | `case.service_completion.first_transitioned`. |
| `event_version` | Current event version. |
| `aggregate_type` | `case`. |
| `aggregate_id` | `case_id`. |
| `survey_intent_id` | Created survey intent id, if schema includes it. |
| `idempotency_key` | Same as survey intent. |
| `payload` | Allow-list JSON. |
| `status` | `pending`. |
| `available_at` | Future event availability timestamp. |
| `occurred_at` | Completion event time. |
| `attempts` | `0`. |
| `max_attempts` | Default policy. |
| `locked_at` / `locked_by` / `lock_expires_at` | Null at insert. |
| `last_error` | Null at insert. |
| `processed_at` | Null at insert. |

Safe payload should be minimal:

- `surveyIntentId`,
- `caseId`,
- `serviceReportId`,
- `finalAppointmentId` nullable,
- `completedAt`,
- `eventVersion`,
- channel binding state summary,
- contact eligibility state summary,
- `source: backend`.

Payload must not include:

- customer mobile,
- raw LINE user id,
- device token,
- provider payload,
- full customer / report / appointment payload,
- credentials,
- raw request / response,
- operator personal identity,
- AI output.

## Idempotency / Conflict Behavior

Future idempotency rules:

1. `survey_intents` unique organization + idempotency key.
2. `survey_intents` unique organization + Case + service report.
3. `event_outbox` unique organization + event type + idempotency key.
4. Conflict during first completion should fail safe.
5. Conflict must not create duplicate survey intent.
6. Conflict must not create duplicate outbox event.
7. Conflict must not trigger sending.
8. Conflict should be logged only as a safe code.
9. If conflict indicates repeat completion, repeat guard should already have caught it.
10. If conflict indicates concurrency race, transaction should fail/rollback or use explicitly designed idempotent behavior only.

## Feature Flag Enforcement

Task137 flags map to write-path as follows:

1. `SURVEY_RUNTIME_ENABLED` must be true.
2. `SURVEY_COMPLETION_HOOK_ENABLED` must be true.
3. `SURVEY_INTENT_WRITE_ENABLED` must be true.
4. `SURVEY_OUTBOX_WRITE_ENABLED` must be true if writing outbox.
5. `SURVEY_BACKFILL_ENABLED` must not be involved.
6. `SURVEY_DELIVERY_RESOLVER_ENABLED` is not required for write-path.
7. `SURVEY_DELIVERY_SENDING_ENABLED` is not required and must not cause sending.
8. Channel flags are not involved in completion write-path.
9. `SURVEY_AI_ADVISORY_ENABLED` is not involved.
10. Missing / invalid flags = false / no survey writes.

## Repository / Service Contract Proposal

Potential future components:

1. `SurveyIntentRepository`
   - `insertFirstCompletionIntent(transaction, input)`
   - `findByIdempotencyKey(...)`
   - no runtime in Task138.
2. `EventOutboxRepository`
   - `insertEvent(transaction, input)`
   - no worker in Task138.
3. `SurveyFirstCompletionService`
   - `buildSafeSurveyIntentContext(...)`
   - `buildOutboxEventPayload(...)`
   - enforce flags,
   - no sending,
   - no resolver,
   - no AI.
4. `FieldServiceReportService` integration point
   - future call to survey first-completion service inside completion transaction after completion criteria are satisfied.

Task138 does not create these files or modify runtime. Names are future contract proposals only.

## Error Handling Contract

Future behavior:

1. Flags disabled:
   - no survey write,
   - completion preserves existing behavior.
2. Migration not applied but flags enabled:
   - fail safe,
   - no sending,
   - future implementation must decide whether completion rejects or disables survey path.
3. `survey_intent` insert failure under strict atomic:
   - rollback completion,
   - safe error.
4. `event_outbox` insert failure under strict atomic:
   - rollback completion,
   - safe error.
5. Idempotency conflict:
   - fail safe or explicit idempotent path only if designed.
6. Payload validation failure:
   - fail safe under strict atomic.
7. No eligible completed visit:
   - completion rejected before survey path.
8. Repeat completion:
   - conflict before survey path.
9. Runtime policy disabled:
   - default no survey write.
   - suppressed no-send intent is only allowed if a later policy explicitly designs it.
10. Any error:
   - no sensitive data in logs / response.

## Future Tests / Smoke Plan

Future backend tests:

1. Flags disabled -> completion succeeds and no survey write is attempted.
2. Flags enabled + first completion -> one survey intent and one event outbox in same transaction.
3. Repeat completion conflict -> no survey write.
4. No eligible completed visit -> no survey write.
5. Cross-case finalAppointmentId rejection -> no survey write.
6. Non-completed finalAppointmentId rejection -> no survey write.
7. Payload allow-list rejects unsafe payload.
8. Idempotency conflict does not duplicate rows.
9. Transaction rollback removes report/Case completion and survey rows under strict atomic test.
10. Legacy no-appointment policy disabled -> no survey write.

Future no-send tests:

1. Writing intent/outbox does not send survey.
2. Resolver flag off -> no resolver.
3. Sending flag off -> no provider call.
4. Channel flags off -> no provider call.

Future smoke plan:

- add no-send smoke only after runtime implementation,
- no shared runtime real outbound,
- no inventory docs expansion.

## Remaining Blockers

Before implementation:

1. Migration 020 apply status resolved for target environment.
2. Feature flag implementation approved.
3. Runtime write approval.
4. Strict atomic vs recovery model decision.
5. Payload allow-list finalized.
6. Repository / service names and ownership confirmed.
7. Test plan approved.
8. No-send smoke plan approved.
9. Rollback / disable plan approved.

Before sending:

1. Resolver policy approved.
2. Channel policy approved.
3. Sending policy approved.
4. Provider credential safety approved.

## Final Recommendation

Use strict atomic write-path as the default design until product / operations explicitly choose a recovery model.

Keep completion as source of truth, keep `finalAppointmentId` persisted-value-only, and keep delivery outside the completion transaction. Task139 should define payload allow-list / redaction contract before any runtime implementation.

## Non-goals

Task138 does not:

- modify migration files,
- add migration files,
- apply migrations,
- execute DDL,
- connect to DB,
- run psql,
- run `npm run db:migrate`,
- modify schema or indexes,
- modify backend runtime,
- add repository or service files,
- implement feature flags,
- modify config or env parsing,
- modify API,
- modify Admin UI,
- modify smoke scripts,
- implement survey sending,
- implement notification sending,
- implement LINE / APP / SMS / email sending,
- implement delivery resolver runtime,
- implement outbox worker,
- implement response intake,
- implement webhook intake,
- seed notification templates or survey content,
- generate survey links or tokens,
- add Admin dashboard / manual send / resend / override,
- add manual finalAppointmentId picker,
- add AI runtime / model call / prompt pipeline,
- change repeat completion conflict guard,
- change finalAppointmentId inference ordering,
- turn survey into appointment-level formal result,
- allow appointment to create multiple formal Field Service Reports,
- hard-code LINE into completion core / survey trigger / intent / outbox,
- modify Task087 inventory guide,
- expand inventory docs,
- perform destructive cleanup,
- mutate shared runtime,
- print sensitive values.

## Verification Summary

Task138 verification should confirm:

- `npm run check` passes.
- `npm run admin:check` passes if executed.
- `git diff --check` passes.
- `npm run check` does not run migrations.
- `npm run db:migrate` remains separate and was not executed.
- No psql command was executed.
- This document contains no executable DB command packet.
- This document contains no runtime implementation instruction.
- Repository / service names are proposal only.
- This document contains no actual `DATABASE_URL` value, password, token, secret, customer mobile, raw LINE user id, LINE channel secret, LINE access token, full payload, raw payload, or production data.
- This task made no code, config, API, Admin, or smoke changes.

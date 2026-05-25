# Task 143 - SurveyFirstCompletionService Contract Design / No Runtime Change

## Background

Task143 designs the future `SurveyFirstCompletionService` orchestration contract. It does not implement services, connect to DB, apply migration, or enable survey delivery.

This task connects the prior no-runtime contracts:

- Task137 feature flag / kill switch contract,
- Task138 survey write-path contract,
- Task139 payload allow-list / redaction contract,
- Task140 strict atomic transaction model,
- Task141 `SurveyIntentRepository` contract,
- Task142 `EventOutboxRepository` contract.

## No-runtime-change Statement

Task143 does not:

- add `SurveyFirstCompletionService.js`,
- add `SurveyIntentRepository.js`,
- add `EventOutboxRepository.js`,
- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- edit Migration 020,
- add or apply migrations,
- execute DDL,
- connect to DB,
- run psql,
- run `npm run db:migrate`,
- change schema or indexes,
- implement feature flags,
- change config or env parsing,
- change API behavior,
- change smoke / browser smoke,
- create survey intents,
- create outbox events,
- start outbox workers,
- start delivery resolvers,
- send LINE / APP / SMS / email notifications,
- implement response intake,
- implement AI runtime,
- modify Task087 inventory docs,
- mutate shared runtime data.

## Source Review Summary

Reviewed:

- `docs/task-142-event-outbox-repository-contract-no-runtime-change.md`
- `docs/task-141-survey-intent-repository-contract-no-runtime-change.md`
- `docs/task-140-survey-runtime-transaction-boundary-recovery-model-no-runtime-change.md`
- `docs/task-139-survey-runtime-payload-allow-list-redaction-contract-no-runtime-change.md`
- `docs/task-138-survey-runtime-write-path-contract-no-runtime-change.md`
- `docs/task-137-survey-runtime-feature-flag-kill-switch-contract-no-runtime-change.md`
- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `src/services/FieldServiceReportService.js`
- `src/repositories/BaseRepository.js`
- `package.json`

## Current Completion Orchestration Review

Current `FieldServiceReportService.completeServiceReport` conceptual order:

1. Open transaction with `withTransaction`.
2. Load existing report.
3. Ensure Case access.
4. Reject already completed report before final appointment resolution or side effects.
5. Resolve / validate finalAppointmentId.
6. Set completion timestamp.
7. Update Field Service Report to completed.
8. Update Case service summary to completed.
9. Create workflow timeline message.
10. Create audit record.
11. Return mapped completed report DTO.

Current absence:

- no survey service,
- no survey intent repository,
- no event outbox repository,
- no feature flags,
- no outbox worker,
- no delivery resolver,
- no survey sending.

Important current invariant:

- Task109 already-completed guard runs before finalAppointmentId inference and side effects.

## SurveyFirstCompletionService Purpose

Future `SurveyFirstCompletionService` should orchestrate only the creation of survey runtime artifacts for a first successful service completion transition.

It should own:

- checking survey write feature flags,
- validating first-completion survey preconditions supplied by the completion flow,
- building the stable idempotency key,
- building allow-listed survey intent input,
- building allow-listed outbox event input,
- calling `SurveyIntentRepository`,
- calling `EventOutboxRepository`,
- returning a safe internal summary.

It should not own:

- Field Service Report completion,
- Case completion,
- finalAppointmentId inference,
- appointment eligibility validation,
- repeat completion guard,
- Admin UI behavior,
- channel resolution,
- provider sending,
- outbox worker processing,
- response intake,
- AI decision making.

## Proposed Method Contract

Proposed future method:

```js
async handleFirstCompletion(completionContext, tx)
```

Required `completionContext` fields:

| Field | Required | Source | Notes |
| --- | --- | --- | --- |
| `organizationId` | Yes | Case/report context | Must be internal org id. |
| `caseId` | Yes | Completed Case | Case-level survey context. |
| `serviceReportId` | Yes | Completed formal report | One Case remains one formal report. |
| `finalAppointmentId` | Conditional | Completed report persisted value | Nullable only for explicit legacy no-appointment policy. |
| `completedAt` | Yes | Persisted completion timestamp | Do not create a second timestamp. |
| `reportWasCompletedBefore` | Yes | Existing report state before update | Must be false. |
| `reportStatusAfter` | Yes | Updated report state | Must be completed. |
| `caseStatusAfter` | Yes | Updated Case state | Must be completed / closed according to current contract. |
| `actorType` | Optional | Internal actor summary | No personal contact value. |
| `triggeredByUserId` | Optional | Internal actor id | Internal reference only. |
| `legacyNoAppointment` | Yes | Completion path summary | Explicit boolean. |
| `appointmentCountBand` | Yes | Safe summary | `none`, `one`, `multiple`, or `unknown`. |
| `hasFinalAppointment` | Yes | Safe summary | Boolean. |
| `channelBindingState` | Optional | Safe summary | No raw channel ids. |
| `contactEligibilityState` | Optional | Safe summary | No contact values. |
| `surveyPolicyState` | Optional | Safe summary | Initial policy summary. |
| `suppressionReasonCode` | Optional | Safe code | No free text. |
| `featureFlagSnapshot` | Optional | Safe flag summary | Boolean summaries only. |
| `schemaVersion` | Optional | Payload version | Positive integer. |

Must not include:

- customer mobile / phone / tel,
- customer name / address,
- raw LINE user id,
- APP device token,
- provider payload,
- full customer / Case / report / appointment payload,
- raw request / response body,
- credentials,
- AI prompt / AI output,
- full feedback text,
- operator personal identity.

## Feature Flag Enforcement Contract

`SurveyFirstCompletionService` may proceed only if all required write flags are true:

1. `SURVEY_RUNTIME_ENABLED=true`
2. `SURVEY_COMPLETION_HOOK_ENABLED=true`
3. `SURVEY_INTENT_WRITE_ENABLED=true`
4. `SURVEY_OUTBOX_WRITE_ENABLED=true`

Rules:

1. Missing / invalid flag values are treated as false.
2. `SURVEY_BACKFILL_ENABLED` is not involved in normal completion path.
3. `SURVEY_DELIVERY_RESOLVER_ENABLED` is not required and must not be invoked.
4. `SURVEY_DELIVERY_SENDING_ENABLED` is not required and must not be invoked.
5. Channel-specific flags are not used in completion write-path.
6. `SURVEY_AI_ADVISORY_ENABLED` is not used in completion write-path.

If any required write flag is false:

- no `survey_intent` write,
- no `event_outbox` write,
- existing completion behavior is preserved,
- no error unless a later product policy chooses strict flag mismatch errors,
- no sending.

## Preconditions Contract

Future service preconditions:

1. Migration 020 is applied.
2. Runtime write approval exists.
3. Transaction client `tx` is provided.
4. First successful durable completion transition is in progress.
5. Report was non-completed before transition.
6. Already-completed guard passed.
7. finalAppointmentId is resolved and persisted, or legacy null policy explicitly allows null.
8. Case completion update succeeds / will commit in the same transaction.
9. Completion was not rejected.
10. No historical backfill path is involved.
11. Same-organization guard already passed or caller guarantees.
12. Same-Case finalAppointmentId guard already passed or caller guarantees.
13. Payload allow-list can be satisfied.
14. Strict atomic model is active.

## No-survey Paths Contract

`SurveyFirstCompletionService` must not be called, or must return a no-op if called defensively, for:

1. Repeat completion 409.
2. Already completed report.
3. No eligible completed visit rejection.
4. Cross-case finalAppointmentId rejection.
5. Non-completed finalAppointmentId rejection.
6. Failed validation.
7. Failed transaction.
8. Report update after completion.
9. Reopen attempt.
10. Manual correction flow.
11. AI suggestion flow.
12. Delivery retry.
13. Resolver re-run.
14. Channel binding event.
15. Admin UI action.
16. Flags disabled.
17. Migration not applied.
18. Historical backfill disabled.
19. Smoke / internal / test suppressed according to policy.
20. Legacy no-appointment policy disabled.

## Idempotency Key Contract

Canonical key:

```text
survey:first-completion:case:<caseId>:report:<serviceReportId>
```

Rules:

1. `caseId` and `serviceReportId` are internal ids.
2. `finalAppointmentId` is not included.
3. `completedAt` is not included.
4. Channel is not included.
5. Customer identity is not included.
6. Actor identity is not included.
7. Delivery attempt is not included.
8. Key construction must be deterministic.
9. The same key must be written to both `survey_intents` and `event_outbox`.

## Payload Builder Contract

Future builder 1:

```js
buildSurveyIntentInput(completionContext)
```

Output must match `SurveyIntentRepository` contract:

- canonical `trigger_event_type`,
- canonical `trigger_event_version`,
- stable idempotency key,
- completed report/case ids,
- finalAppointmentId from completed report only,
- `safe_context_summary` allow-list only,
- `source = backend`.

Future builder 2:

```js
buildEventOutboxInput(surveyIntentRow, completionContext)
```

Output must match `EventOutboxRepository` contract:

- canonical `event_type`,
- canonical `aggregate_type = case`,
- status `pending`,
- `last_error = null`,
- lock fields null,
- safe allow-listed payload only,
- `surveyIntentId` from inserted survey intent.

Builder restrictions:

- do not use raw request body,
- do not use full report/customer/appointment objects,
- do not query LINE identity,
- do not call AI,
- do not build provider delivery payloads,
- unknown context keys should fail closed or be ignored according to future validation policy.

## Repository Orchestration Contract

Recommended future insert order:

1. Validate flags and preconditions.
2. Build idempotency key.
3. Build survey intent input.
4. Insert survey intent using `SurveyIntentRepository.createFirstCompletionIntent(input, tx)`.
5. Build event outbox input using inserted `surveyIntentId`.
6. Insert event outbox using `EventOutboxRepository.createFirstCompletionEvent(input, tx)`.
7. Return safe summary.

Under strict atomic model:

- if survey intent insert fails, event outbox is not inserted;
- if event outbox insert fails, whole transaction rolls back;
- no partial durable state is allowed;
- no sending happens inside transaction.

## Error / Conflict Handling

Future behavior:

| Case | Contract |
| --- | --- |
| Feature flag disabled | Safe no-op result. |
| Missing transaction client | Fail closed. |
| Missing required context | Safe validation error. |
| Payload allow-list violation | Safe validation error. |
| SurveyIntent unique conflict | Fail safe; no outbox insert. |
| EventOutbox unique conflict | Fail safe under strict atomic; rollback survey intent insert. |
| DB error | Safe persistence error. |
| Any error | No raw payload, contact values, raw channel ids, credentials, or sending. |

## Safe Result Contract

Future service may return:

- `surveyIntentCreated` boolean,
- `eventOutboxCreated` boolean,
- `surveyIntentId`,
- `eventOutboxId`,
- `skippedReasonCode`,
- `errorReasonCode`.

The idempotency key may be returned only if internal policy accepts it as a safe internal reference; otherwise omit it from service result and logs.

Must not return:

- full payload,
- full `safe_context_summary` unless explicitly internal,
- raw request / response body,
- customer contact,
- raw LINE user id,
- provider data,
- AI output.

## Relationship To FieldServiceReportService

`FieldServiceReportService` owns:

1. Completion validation.
2. finalAppointmentId resolution.
3. Case/report completion transaction.
4. Repeat completion guard.
5. Completion response mapping.
6. Deciding whether to call `SurveyFirstCompletionService` at a future integration point.

`SurveyFirstCompletionService` owns:

1. Survey artifact orchestration only.
2. Feature flag checks.
3. Payload construction.
4. Idempotency key construction.
5. Repository calls.

`FieldServiceReportService` must not:

1. Build raw survey payload ad hoc.
2. Call outbox worker.
3. Call resolver.
4. Send survey.
5. Know LINE-specific channel logic.
6. Expose survey internal rows unless a future API contract allows safe summary.

## Relationship To Resolver / Worker / Delivery

`SurveyFirstCompletionService` must not:

1. Start outbox worker.
2. Claim ready events.
3. Process `event_outbox`.
4. Run delivery resolver.
5. Select channel.
6. Send LINE / APP / SMS / email.
7. Create notification logs.
8. Create survey response intake.
9. Create Admin dashboard state.
10. Call AI.

All of the above are future tasks.

## Future Tests

Future service unit tests:

1. Flags disabled -> no repository calls.
2. All flags enabled + valid context -> survey intent and event outbox inserts called in same transaction.
3. Missing transaction -> fail closed.
4. Missing finalAppointmentId with legacy policy disabled -> no write / error according to contract.
5. Payload forbidden field -> fail safe.
6. SurveyIntent conflict -> no outbox insert.
7. EventOutbox conflict -> rollback under strict atomic.
8. No raw LINE id / mobile / full payload in inputs.
9. Canonical event name is used.
10. Idempotency key is deterministic.

Future integration tests:

1. First completion creates exactly one intent + one outbox.
2. Repeat completion 409 creates none.
3. No eligible completed visit creates none.
4. Failed transaction creates none.
5. Flags disabled preserves completion behavior.
6. No survey sending occurs.
7. No resolver / worker is invoked.

Task143 does not add tests.

## Remaining Blockers

Before implementation:

- Migration 020 apply approval and target environment decision.
- Strict atomic runtime approval.
- Feature flag implementation.
- Payload allow-list implementation.
- `SurveyIntentRepository` implementation approval.
- `EventOutboxRepository` implementation approval.
- No-send smoke plan approval.
- Worker / resolver / delivery contracts.
- Legacy no-appointment survey policy.
- Test strategy approved.

## Final Recommendation

Future `SurveyFirstCompletionService` should be the only orchestration point for first-completion survey artifacts. It should be called only from the backend completion transaction after first-transition validation and before commit, and it should create at most one survey intent and one outbox event under the same strict atomic transaction. It must remain no-send, channel-agnostic, AI-free, and payload allow-list driven.

Task144 should design the future no-send test / smoke coverage plan for this write path without implementing runtime behavior.

## Non-goals

Task143 does not implement services, repositories, feature flags, payload builders, runtime behavior, API/Admin/smoke changes, migration apply, schema/index changes, survey sending, delivery resolver, outbox worker, response intake, notification logs, LINE / APP / SMS / email push, Admin dashboard, AI runtime, inventory docs changes, shared runtime mutation, or destructive cleanup.

## Verification Summary

Task143 verification should confirm:

- `npm run check` passes.
- `npm run admin:check` passes if executed.
- `git diff --check` passes.
- No migration file was modified.
- No migration apply occurred.
- No psql command was executed.
- `npm run db:migrate` was not executed.
- This document contains no executable DB command packet and no runtime implementation instruction.
- Service/repository/resolver/worker method names are proposals only.
- This document contains no actual `DATABASE_URL` value, password, token, secret, customer mobile, raw LINE user id, LINE channel secret, LINE access token, full payload, raw payload, or production data.

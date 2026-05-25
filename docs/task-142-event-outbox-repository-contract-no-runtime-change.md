# Task 142 - Event Outbox Repository Contract Design / No Runtime Change

## Background

Task142 designs the future `EventOutboxRepository` contract. It does not implement repositories, connect to DB, apply migration, start workers, or enable survey delivery.

This task follows:

- Task138 write-path contract,
- Task139 payload allow-list / redaction contract,
- Task140 strict atomic transaction recommendation,
- Task141 `SurveyIntentRepository` contract.

## No-runtime-change Statement

Task142 does not:

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

- `docs/task-141-survey-intent-repository-contract-no-runtime-change.md`
- `docs/task-140-survey-runtime-transaction-boundary-recovery-model-no-runtime-change.md`
- `docs/task-139-survey-runtime-payload-allow-list-redaction-contract-no-runtime-change.md`
- `docs/task-138-survey-runtime-write-path-contract-no-runtime-change.md`
- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `src/repositories/BaseRepository.js`
- `src/repositories/NotificationLogRepository.js`
- `src/repositories/LineEventRepository.js`
- `package.json`

Relevant current repository pattern:

- repositories extend `BaseRepository`;
- repository methods accept optional `client`;
- transaction-aware callers should pass the same transaction client through dependent repository calls;
- existing notification / LINE event repositories are persistence layers, not policy engines;
- `package.json` keeps `db:migrate` separate from `npm run check`.

## EventOutboxRepository Purpose

Future `EventOutboxRepository` should own durable access to `event_outbox`.

It should:

- insert a first-completion event row after a survey intent exists;
- preserve idempotency and safe payload boundaries;
- expose only future worker-specific methods after a separate worker design task;
- keep provider delivery out of the completion request.

It should not own:

- Field Service Report completion,
- Case completion,
- survey intent creation,
- finalAppointmentId inference,
- payload allow-list construction,
- feature flag policy,
- delivery channel choice,
- provider sending,
- response intake,
- AI suggestions,
- Admin UI behavior.

The repository is a persistence boundary, not a delivery engine.

## Proposed File And Class

Future implementation location:

```text
src/repositories/EventOutboxRepository.js
```

Proposed export:

```js
module.exports = {
  EventOutboxRepository
};
```

Proposed class:

```js
class EventOutboxRepository extends BaseRepository {
  // future methods only; Task142 does not implement this class
}
```

## First-write Method Contract

Proposed future method:

```js
async createFirstCompletionEvent(data, client)
```

Rules:

1. Must require a transaction client.
2. Must use the same transaction as report completion, Case completion, and survey intent insert.
3. Must not silently fall back to the pool in first-completion write path.
4. Must not open its own transaction.
5. Must not call provider delivery.
6. Must not call notification service.
7. Must not call worker.
8. Must not call resolver.
9. Must not send LINE / APP / SMS / email.
10. Must not log full payload.

Required input fields:

| Field | Required | Canonical value / source | Notes |
| --- | --- | --- | --- |
| `organizationId` | Yes | Case/report context | Must match survey intent organization. |
| `eventType` | Yes | `case.service_completion.first_transitioned` | Canonical event name. |
| `eventVersion` | Yes | Positive integer | Starts at 1. |
| `aggregateType` | Yes | `case` | Survey event is Case-level. |
| `aggregateId` | Yes | `caseId` | Internal Case id. |
| `surveyIntentId` | Yes for survey first-completion event | Inserted survey intent id | Migration allows nullable for future flexibility, but this path should pass it. |
| `idempotencyKey` | Yes | Same stable survey first-completion key | See idempotency section. |
| `payload` | Yes | Allow-list object | No raw payload. |
| `status` | Optional | `pending` | Initial canonical value. |
| `availableAt` | Optional | now / policy time | Initial scheduling boundary. |
| `occurredAt` | Yes | Persisted completion timestamp | Do not generate a second completion timestamp. |
| `attempts` | Optional | `0` | Initial canonical value. |
| `maxAttempts` | Optional | `5` or policy value | Keep bounded. |

Initial stored values:

- `status = pending`
- `attempts = 0`
- `processed_at = null`
- `locked_at = null`
- `lock_expires_at = null`
- `locked_by = null`
- `last_error = null`

## Payload Contract

Future `event_outbox.payload` must align with Task139.

Allowed payload fields:

| Field | Notes |
| --- | --- |
| `eventType` | `case.service_completion.first_transitioned`. |
| `eventVersion` | Positive integer. |
| `surveyIntentId` | Internal id. |
| `caseId` | Internal id. |
| `serviceReportId` | Internal id. |
| `finalAppointmentId` | Internal id or null for approved legacy no-appointment case. |
| `completedAt` | Persisted completion timestamp. |
| `idempotencyKey` | Stable case/report key. |
| `channelBindingState` | Summary only. |
| `contactEligibilityState` | Summary only. |
| `source` | `backend`. |
| `createdAt` | Event creation time. |
| `schemaVersion` | Optional future payload schema version. |

Forbidden payload fields:

- `DATABASE_URL`,
- password / password hash,
- token / secret,
- customer mobile / phone / tel,
- customer name,
- customer address,
- raw LINE user id,
- APP device token,
- provider payload,
- provider delivery result,
- full customer payload,
- full Case payload,
- full report payload,
- full appointment payload,
- raw request body,
- raw response body,
- AI prompt,
- AI raw output,
- full feedback text,
- operator personal identity.

Unknown payload keys must fail closed in the future validation layer. Task142 does not implement validation.

## Idempotency And Conflict Behavior

Future `EventOutboxRepository` must preserve:

- unique key: `organization_id + event_type + idempotency_key`;
- idempotency key: `survey:first-completion:case:<caseId>:report:<serviceReportId>`.

Rules:

1. `finalAppointmentId` is not part of the idempotency key.
2. `completedAt` is not part of the idempotency key.
3. Delivery channel is not part of the idempotency key.
4. A conflict must not create a duplicate event.
5. A conflict must not call worker / resolver / sending.
6. A conflict must not silently overwrite the existing payload.
7. First implementation should fail safe on conflict under strict atomic model.
8. Conflict error should expose a safe reason code only.

Under strict atomic model, an outbox insert conflict should roll back the completion transaction unless a later task explicitly designs idempotent first-transition recovery.

## Relationship To SurveyIntentRepository

Interaction with Task141:

1. `SurveyIntentRepository` inserts `survey_intent` first, or an equivalent row exists inside the same transaction.
2. `EventOutboxRepository` inserts `event_outbox` referencing `surveyIntentId`.
3. Both inserts happen in the same strict atomic transaction.
4. If either insert fails, the transaction rolls back under strict atomic model.
5. `EventOutboxRepository` must not create survey intent.
6. `SurveyIntentRepository` must not create outbox event.
7. `SurveyFirstCompletionService` should orchestrate both calls.
8. `FieldServiceReportService` should own the completion transaction and integration point.
9. Repository methods should not know feature flag logic.
10. Repository methods should not know delivery policy.

## Future Worker Methods Boundary

Potential future worker methods:

```js
async claimReadyEvents(...)
async markProcessing(...)
async markProcessed(...)
async markFailed(...)
async markDead(...)
async releaseExpiredLocks(...)
```

Task142 boundary:

1. These are future outbox worker contracts.
2. They are not part of the first-completion write-path contract.
3. They must not be implemented before a worker design task.
4. They must not be used to send provider messages without delivery approval.
5. Worker methods require a separate transaction / lock / retry contract.
6. Provider delivery result should be stored in a future delivery log or explicitly approved worker field policy, not in the first-write repository contract.

## `last_error` Contract

Insert path:

- `last_error = null`

Future worker path:

1. `last_error` is for future worker processing only.
2. It must be bounded.
3. It must be redacted.
4. It must not contain provider raw payload.
5. It must not contain request / response body.
6. It must not contain customer contact values.
7. It must not contain raw LINE user id.
8. It must not contain tokens / secrets.
9. It must not contain full payload.
10. Future worker must truncate / sanitize before writing `last_error`.

Task142 does not implement a `last_error` sanitizer.

## Safe Row Mapping

Default safe row mapping may return:

- id,
- organizationId,
- eventType,
- eventVersion,
- aggregateType,
- aggregateId,
- surveyIntentId,
- idempotencyKey,
- status,
- availableAt,
- occurredAt,
- attempts,
- maxAttempts,
- processedAt,
- createdAt,
- updatedAt.

Default safe row mapping should not expose:

- full payload,
- `lastError`,
- `lockedBy` if it may contain host/user/process info,
- raw provider data,
- contact values,
- raw channel identifiers.

If payload is needed by a future worker, a worker-specific internal method may return payload under strict internal-only rules and safe logging restrictions.

## Error Handling And Observability Contract

Future behavior:

| Case | Contract |
| --- | --- |
| Insert success | Return safe row. |
| Unique conflict | Safe duplicate / idempotency conflict error. |
| FK failure | Safe persistence error. |
| Payload validation failure | Should be caught before repository or fail safe. |
| Missing transaction client | Fail closed. |
| DB error | Safe persistence error. |

Logging:

- safe reason code only,
- safe component name,
- no payload dump,
- no customer/channel labels,
- no credential values.

Future metrics may count:

- insert attempt count,
- insert success count,
- idempotency conflict count,
- insert failure count.

Metrics must not include:

- payload labels,
- customer labels,
- channel identifiers,
- provider identifiers that expose delivery destinations.

Task142 does not implement logs or metrics.

## Future Tests

Repository tests:

1. `createFirstCompletionEvent` inserts expected row with canonical event type.
2. `createFirstCompletionEvent` requires transaction.
3. Inserted payload follows allow-list.
4. Unknown payload keys are rejected before insert.
5. Unique conflict is surfaced safely.
6. Provider delivery result fields are not stored on first insert.
7. Raw LINE id / mobile / device token fields are not accepted.
8. `last_error` is null on insert.
9. Locked fields are null on insert.
10. Status is `pending` on insert.
11. Aggregate type is `case`.
12. Idempotency key matches survey intent key.

Integration tests:

1. `SurveyIntentRepository` + `EventOutboxRepository` inserts happen in the same transaction.
2. `event_outbox` failure rolls back `survey_intent` under strict atomic model.
3. `survey_intent` failure prevents `event_outbox` insert.
4. Repeat completion path never calls `EventOutboxRepository`.
5. Failed completion path never calls `EventOutboxRepository`.

Task142 does not add tests.

## Remaining Blockers

Before implementation:

- Migration 020 apply approval and target environment decision.
- Strict atomic runtime approval.
- Feature flag implementation.
- Payload allow-list implementation.
- `SurveyIntentRepository` implementation approval.
- `SurveyFirstCompletionService` contract approval.
- Worker / lock / retry design before any worker methods.
- No-send smoke plan approval.
- Delivery resolver design approval before any provider send.

## Final Recommendation

Future `EventOutboxRepository` should be a thin transaction-aware persistence layer for safe internal events only. It should insert the first-completion event in the same transaction as the survey intent and completion writes, return a safe row, and avoid all delivery, worker, resolver, channel, AI, and policy decisions. Worker methods should remain deferred until a separate outbox worker contract is approved.

Task143 should design the future `SurveyFirstCompletionService` contract as docs-only, defining orchestration between `FieldServiceReportService`, feature flags, payload allow-list, `SurveyIntentRepository`, and `EventOutboxRepository`.

## Non-goals

Task142 does not implement a repository, worker, resolver, delivery, notification sending, LINE / APP / SMS / email sending, response intake, feature flags, config/env parsing, runtime behavior, API/Admin/smoke changes, migration apply, schema/index changes, AI runtime, inventory docs changes, shared runtime mutation, or destructive cleanup.

## Verification Summary

Task142 verification should confirm:

- `npm run check` passes.
- `npm run admin:check` passes if executed.
- `git diff --check` passes.
- No migration file was modified.
- No migration apply occurred.
- No psql command was executed.
- `npm run db:migrate` was not executed.
- This document contains no executable DB command packet and no runtime implementation instruction.
- Repository/service/worker method names are proposals only.
- This document contains no actual `DATABASE_URL` value, password, token, secret, customer mobile, raw LINE user id, LINE channel secret, LINE access token, full payload, raw payload, or production data.

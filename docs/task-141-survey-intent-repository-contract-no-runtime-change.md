# Task 141 - Survey Intent Repository Contract Design / No Runtime Change

## Background

Task141 defines the future `SurveyIntentRepository` contract for the post-completion survey runtime. It continues the Task138 write-path, Task139 payload allow-list, and Task140 strict atomic transaction model.

This task does not create repository files, change runtime behavior, connect to DB, apply Migration 020, or enable survey sending.

## No-runtime-change Statement

Task141 does not:

- add `SurveyIntentRepository.js`,
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
- send LINE / APP / SMS / email notifications,
- start a resolver / worker,
- implement response intake,
- implement AI runtime,
- modify Task087 inventory docs,
- mutate shared runtime data.

## Source Review Summary

Reviewed:

- `docs/task-140-survey-runtime-transaction-boundary-recovery-model-no-runtime-change.md`
- `docs/task-139-survey-runtime-payload-allow-list-redaction-contract-no-runtime-change.md`
- `docs/task-138-survey-runtime-write-path-contract-no-runtime-change.md`
- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `src/repositories/BaseRepository.js`
- `src/repositories/FieldServiceReportRepository.js`
- `src/repositories/AppointmentRepository.js`
- `src/repositories/CaseRepository.js`

Relevant current repository pattern:

- repositories extend `BaseRepository`;
- query helpers accept an optional `client`;
- transaction-aware call sites should pass the transaction client through each repository method;
- current appointment final inference uses `deleted_at IS NULL` and explicit deterministic ordering;
- no survey repository exists yet.

## Repository Purpose

Future `SurveyIntentRepository` should own only durable access to `survey_intents`.

It should not own:

- first-transition detection,
- Field Service Report completion,
- Case completion,
- finalAppointmentId inference,
- payload allow-list construction,
- delivery channel resolution,
- provider sending,
- response intake,
- AI suggestions,
- Admin visibility policy.

The repository is a persistence boundary, not a business decision engine.

## Proposed File And Class

Future implementation location:

```text
src/repositories/SurveyIntentRepository.js
```

Proposed export:

```js
module.exports = {
  SurveyIntentRepository
};
```

Proposed class:

```js
class SurveyIntentRepository extends BaseRepository {
  // future methods only; Task141 does not implement this class
}
```

## Required Transaction Contract

All first-completion survey-intent writes must receive and use the same transaction client as:

- Field Service Report completion update,
- Case completion update,
- timeline / audit writes if current architecture keeps them in the completion transaction,
- future event outbox insert.

Rules:

1. `createFirstCompletionIntent` must accept a transaction client.
2. It must not silently fall back to the pool during the first-completion write path.
3. It must not open its own independent transaction inside the completion transaction.
4. It must not perform delivery or resolver work.
5. It must return only the inserted / existing safe row shape needed by the caller.
6. If insert fails under strict atomic mode, the caller rolls back the full completion transaction.

## Proposed Create Method

Proposed future method:

```js
async createFirstCompletionIntent(data, client)
```

Required input fields:

| Field | Required | Source | Notes |
| --- | --- | --- | --- |
| `organizationId` | Yes | Case / report context | Must match Case organization. |
| `caseId` | Yes | Completed Case | One Case remains one formal report. |
| `serviceReportId` | Yes | Completed report | Must be the formal report for the Case. |
| `finalAppointmentId` | Conditional | Completed report persisted value | Nullable only for explicit legacy no-appointment policy. |
| `triggerEventType` | Yes | Constant | `case.service_completion.first_transitioned`. |
| `triggerEventVersion` | Yes | Constant / config | Positive integer. |
| `idempotencyKey` | Yes | Stable builder | `survey:first-completion:case:<caseId>:report:<serviceReportId>`. |
| `intentStatus` | Yes | Policy | Initial default `pending_policy` unless later policy changes it. |
| `policyStatus` | Yes | Policy | Initial default `pending`. |
| `suppressionReasonCode` | Optional | Policy | Safe enum only. |
| `suppressionDetailSafe` | Optional | Policy | Safe object only. |
| `completedAt` | Yes | Persisted completion timestamp | Do not generate a second completion timestamp. |
| `surveyPolicyVersion` | Optional | Policy | Safe version string. |
| `eligibilityPolicyVersion` | Optional | Policy | Safe version string. |
| `source` | Yes | Constant | `backend`. |
| `safeContextSummary` | Optional | Allow-list builder | Safe object only. |
| `triggeredByUserId` | Optional | Internal actor reference | Internal id only, no contact value. |

The repository should not derive these fields from raw request bodies or raw ORM objects.

## Insert Behavior

Recommended SQL behavior for future implementation:

1. Insert a new `survey_intents` row.
2. Use explicit columns only.
3. Preserve DB defaults only for safe defaults such as `id`, `created_at`, `updated_at`.
4. Return the inserted row.
5. Do not mutate any Case, report, appointment, customer, channel, or outbox table.

Under Task140 strict atomic model, a unique conflict should normally bubble as an error and cause the completion transaction to roll back unless a later task explicitly designs an idempotent first-transition recovery path.

## Idempotency Contract

The repository must enforce the future idempotency design through the DB indexes created by Migration 020:

- `organization_id + idempotency_key` unique.
- `organization_id + case_id + service_report_id` unique.

Rules:

1. The idempotency key is stable per Case/report.
2. `finalAppointmentId` is not part of the idempotency key.
3. `completedAt` is not part of the idempotency key.
4. A different final appointment supplied after completion must never create a second intent.
5. Repeat completion 409 must occur before repository create is called.
6. Historical backfill must not reuse this first-transition create path unless a later backfill task explicitly approves it.

## Guard Contract

`SurveyIntentRepository` should receive already-validated data, but it should still avoid broad writes.

Caller-side guards before repository insert:

- report was non-completed before transition,
- report completion validation passed,
- Case completion update is part of the same transaction,
- `finalAppointmentId` is the completed report persisted value,
- legacy no-appointment null policy is explicit if applicable,
- organization id is known and matches the Case/report context,
- payload allow-list validation passed,
- survey runtime write flags are enabled,
- Migration 020 is applied,
- no sending/resolver/worker runs in the completion request.

Repository-side checks:

- insert only the supplied `organization_id`, `case_id`, `service_report_id`;
- do not query by unscoped id alone in methods that may be used by runtime write paths;
- preserve `deleted_at` assumptions if future table adds soft delete; Migration 020 currently does not define soft delete for survey intents.

## Read Methods For Future Runtime

Potential future read methods:

```js
async getIntentById(intentId, organizationId, client)
async getIntentByCaseAndReport({ organizationId, caseId, serviceReportId }, client)
async getIntentByIdempotencyKey({ organizationId, idempotencyKey }, client)
```

Read rules:

- always scope by `organizationId`,
- return one row or null,
- do not expose customer contact values because the table should not contain them,
- do not join full Case/customer/report payloads,
- do not use these read methods to infer delivery eligibility.

## Status Update Methods Deferred

Potential future lifecycle methods are deferred:

```js
async updatePolicyStatus(...)
async markChannelResolutionPending(...)
async markReadyForDelivery(...)
async markSuppressed(...)
async markNotDeliverable(...)
async markExpired(...)
async markVoided(...)
```

These require a separate policy / lifecycle task because status transitions affect operations and delivery behavior.

Task141 does not approve status update runtime.

## Safe Row Mapping

Future repository mapping should keep the row internal and safe:

Allowed to return to internal services:

- id,
- organization_id,
- case_id,
- service_report_id,
- final_appointment_id,
- trigger_event_type,
- trigger_event_version,
- idempotency_key,
- intent_status,
- policy_status,
- suppression_reason_code,
- completed_at,
- source,
- safe_context_summary,
- created_at,
- updated_at.

Do not return or construct:

- customer mobile / phone / tel,
- customer address,
- raw LINE user id,
- LINE channel secret / access token,
- APP device token,
- provider payload,
- full Case payload,
- full report payload,
- full appointment payload,
- raw request / response body,
- AI prompt / raw output.

## Error Contract

Future repository errors should be safe:

- unique conflict: safe conflict category only;
- FK violation: safe invalid-reference category only;
- JSON validation issue: safe payload-validation category only;
- DB unavailable: safe dependency-failure category only.

Do not include:

- SQL connection strings,
- env values,
- raw payload,
- customer contact values,
- raw channel ids,
- stack traces in user-facing responses.

Service layer may translate repository errors into existing project error patterns.

## Relationship To Event Outbox

`SurveyIntentRepository` should not insert outbox rows directly.

Recommended future orchestration:

1. `SurveyFirstCompletionService` builds safe survey intent data.
2. `SurveyIntentRepository.createFirstCompletionIntent(data, client)` inserts the intent.
3. `SurveyFirstCompletionService` builds safe event payload from the inserted intent.
4. `EventOutboxRepository.createSurveyFirstCompletionEvent(data, client)` inserts outbox row.
5. Transaction commits only after both durable inserts succeed.

This preserves separation between intent lifecycle and event dispatch lifecycle.

## Relationship To Feature Flags

Feature flags should be enforced before repository create.

The repository should not read environment flags itself. This avoids:

- hidden side effects,
- difficult tests,
- runtime drift between service and repository,
- repository methods that behave differently across environments.

The service/orchestrator decides whether the repository method should be called.

## Legacy No-appointment Case Policy

Future repository contract allows `finalAppointmentId` to be null only when all are true:

1. Case has no appointments.
2. Existing legacy completion behavior allows completion without final appointment.
3. Product policy chooses to create a survey intent for legacy no-appointment cases.
4. Safe payload marks `legacyNoAppointment=true`.

If policy does not approve legacy survey intent creation, the service should not call this repository for those cases.

## Future Tests

Future implementation tests should cover:

1. Create first-completion intent inside transaction.
2. Insert includes stable idempotency key.
3. Duplicate idempotency key conflicts and does not create duplicate intent.
4. Duplicate Case/report conflicts and does not create duplicate intent.
5. Insert accepts null finalAppointmentId only for approved legacy no-appointment policy.
6. Insert rejects unsafe payload shape before DB insert.
7. Repository create is not called on repeat completion 409.
8. Repository create is not called when flags disabled.
9. Repository read methods require organization scope.
10. Errors are safe and do not expose secrets, contact values, raw channel ids, or raw payloads.

Task141 does not add tests.

## Remaining Blockers

Before implementation:

- Migration 020 apply approval and target environment decision.
- Strict atomic runtime approval.
- Feature flag implementation.
- Payload allow-list implementation.
- EventOutboxRepository contract approval.
- SurveyFirstCompletionService contract approval.
- No-send smoke plan approval.
- Explicit legacy no-appointment survey policy.

## Final Recommendation

Future `SurveyIntentRepository` should be a thin, transaction-aware persistence layer with no delivery, no policy inference, no AI decision, and no raw payload handling. First-completion survey intent creation should be orchestrated by a service that has already verified first-transition, feature flags, finalAppointmentId stability, strict atomic transaction scope, and payload allow-list safety.

Task142 should design the future `EventOutboxRepository` contract as docs-only, continuing the strict atomic and no-send assumptions.

## Non-goals

Task141 does not implement a repository, modify runtime behavior, apply Migration 020, change schema/indexes, create survey rows, create outbox rows, send notifications, add workers, add delivery resolvers, add response intake, add Admin UI, add AI runtime, modify inventory docs, mutate shared runtime data, or perform destructive cleanup.

## Verification Summary

Task141 verification should confirm:

- `npm run check` passes.
- `npm run admin:check` passes if executed.
- `git diff --check` passes.
- No migration apply occurred.
- No psql command was executed.
- `npm run db:migrate` was not executed.
- This document contains no executable DB command packet and no runtime implementation instruction.
- This document contains no actual `DATABASE_URL` value, password, token, secret, customer mobile, raw LINE user id, LINE channel secret, LINE access token, full payload, raw payload, or production data.

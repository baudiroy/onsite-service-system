# Task 127 - Migration 020 Static SQL Review / No Apply

## Executive Summary

Task127 statically reviews Migration 020. It does not edit, apply, execute, or approve the migration for runtime use.

Reviewed files:

- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `docs/task-126-survey-intent-event-outbox-migration-020-file-authoring-no-apply.md`
- `docs/task-125-survey-intent-event-outbox-migration-020-draft-ddl-convention-review.md`
- `docs/task-124-survey-intent-event-outbox-migration-020-file-authoring-plan-no-apply.md`
- `docs/task-123-survey-migration-020-policy-atomicity-retention-gate-closure-review.md`
- `docs/task-122-survey-intent-event-outbox-migration-020-draft-ddl-risk-review.md`
- `docs/task-121-survey-intent-event-outbox-migration-020-proposal-review.md`
- `docs/task-110-post-completion-survey-trigger-first-transition-design.md`
- migrations 001-019 convention samples.

Result:

- Migration 020 is a valid no-apply artifact for static review.
- Static review found one blocker before any migration apply: event name consistency.
- No DDL was executed.
- No DB connection, psql, or migration apply was used.
- No runtime/API/Admin/smoke file was changed by Task127.

## No-apply Safety Review

Task127 did not:

- run `npm run db:migrate`,
- run psql,
- connect to a database,
- execute DDL,
- apply Migration 020,
- touch shared runtime data,
- modify schema or indexes in any environment.

Package script review from Task126 remains valid:

- `npm run check` runs `node --check` on backend JavaScript files only.
- migration apply is a separate `npm run db:migrate` command.

## Warning Comments Review

Migration 020 includes these warning comments:

- migration file authoring only,
- not applied in Task126,
- apply requires a separate task,
- not approved for runtime writes,
- not approved for survey sending,
- do not run against shared runtime without explicit apply task,
- no LINE / APP / SMS / email sending is enabled,
- tables are inert until a future runtime task.

Warning conclusion:

- Acceptable for no-apply artifact.
- Recommended Task128 patch: add explicit comments that the migration also does not enable historical backfill, Admin UI, AI runtime, delivery resolver runtime, or notification dispatcher runtime.

## Event Name Consistency Review

Task110 recommended canonical event name:

```text
case.service_completion.first_transitioned
```

Task110 also listed this as an acceptable alternative if the project prefers status wording:

```text
case.service_completed.first_transition
```

Migration 020 currently uses:

```text
case.service_completed.first_transition
```

Finding:

- Severity: blocker before migration apply.
- Reason: Task121 expected `case.service_completion.first_transitioned`, and Task110's primary recommendation used that value. Task124 / Task125 drifted to the acceptable alternative, but no explicit decision recorded the switch as canonical.
- Risk: runtime event producers, outbox consumers, and future survey policy code may split across two event names.

Recommended action:

- Task128 should patch Migration 020 and related docs to use one canonical event name.
- Recommended canonical value: `case.service_completion.first_transitioned`, because it is Task110's primary recommendation and describes a completed domain event.
- Both `survey_intents.trigger_event_type` and `event_outbox.event_type` must match.
- The strict initial allow-list must use the same canonical value.

## `survey_intents` Static SQL Review

Passes:

- UUID primary key matches convention.
- `organization_id`, `case_id`, and `service_report_id` are required.
- `final_appointment_id` is nullable.
- `idempotency_key` is required and non-blank.
- `intent_status` uses text + CHECK.
- Delivery / response statuses such as `sent` and `answered` are not present.
- Safe JSON fields use JSONB object checks.
- `completed_at` is required.
- `source` defaults to `backend`.
- `triggered_by_user_id` is an internal nullable user FK only.
- `created_at` / `updated_at` match convention.
- updated_at trigger exists.
- No `deleted_at` column is present, preserving lifetime idempotency.
- No contact, raw channel, provider, credential, or full payload fields are present.

Warnings:

- `policy_status` may overlap with `intent_status`; this is acceptable for the artifact but should be clarified before runtime writes.
- `triggered_by_user_id` must remain an internal safe reference and must not be rendered as operator personal identity in survey payloads or handoffs.
- `suppression_detail_safe` is JSONB-object checked but not size-bounded at DDL level. Runtime must enforce allow-list and size limits.

Blockers:

- Event name consistency, as noted above.

## `survey_intents` Constraints / FK / Indexes Review

Passes:

- Unique `(organization_id, idempotency_key)` is lifetime-scoped.
- Unique `(organization_id, case_id, service_report_id)` supports one intent per formal report.
- No active-only partial uniqueness is used for idempotency.
- No `deleted_at` or archive bypass exists.
- Basic FKs exist for organization, Case, report, appointment, and user.
- No `ON DELETE CASCADE` is used.
- Index names follow existing style.
- Indexes are mostly minimal and not dashboard-heavy.

Future runtime guards still required:

- Case belongs to `organization_id`.
- Report belongs to the same Case and organization.
- `final_appointment_id`, if present, belongs to the same Case and organization.
- `final_appointment_id` is the completed report's stable resolved value.

## `event_outbox` Static SQL Review

Passes:

- UUID primary key matches convention.
- `organization_id` is required.
- `event_type` and `event_version` are required.
- `aggregate_type` is restricted to `case`.
- `aggregate_id` is required.
- `survey_intent_id` is nullable.
- `idempotency_key` is required and non-blank.
- `payload` is JSONB object checked.
- `status` uses text + CHECK.
- `available_at` and `occurred_at` are required.
- Lock fields are nullable and guarded by a consistency CHECK.
- `locked_by` is bounded by `varchar(120)`.
- attempts and max attempts are bounded.
- `last_error` is bounded by `varchar(2000)`.
- `processed_at` is nullable and required only for `processed`.
- created/updated timestamps and updated_at trigger match convention.
- No provider delivery result fields are present.
- No raw provider payload, raw LINE user id, customer mobile, credential, or full payload field is present.

Warnings:

- `survey_intent_id` ties the generic outbox to survey context. This is acceptable because it is nullable and the initial outbox scope is limited to survey first-transition, but future generic outbox use should not require survey intent.
- `skipped` does not require `processed_at`; this is conservative but should be documented before worker implementation.
- `last_error` is bounded, but runtime redaction remains mandatory.

Blockers:

- Event name consistency, as noted above.

## `event_outbox` Constraints / FK / Indexes Review

Passes:

- Unique `(organization_id, event_type, idempotency_key)` is lifetime-scoped.
- Ready worker index supports pending / failed lookup.
- Aggregate index supports Case-level event lookup.
- Lock expiry index supports future lock recovery.
- Survey intent index supports traceability.
- Processed-at index supports future retention review.
- No provider-specific indexes are present.
- No dashboard-specific indexes are present.
- No `ON DELETE CASCADE` is used.
- Constraint and index names follow local convention.

Future runtime guards still required:

- `aggregate_id` points to a Case in the same organization.
- `survey_intent_id`, if present, belongs to the same organization.
- Payload matches the event type allow-list and excludes sensitive values.
- Idempotency conflicts fail safe without duplicate side effects.

## Status Lifecycle Review

`survey_intents.intent_status` values:

- `pending_policy`
- `channel_resolution_pending`
- `pending_channel`
- `suppressed`
- `not_deliverable`
- `ready_for_delivery`
- `expired`
- `cancelled`
- `voided`

Review:

- These remain intent / eligibility lifecycle states.
- `sent` and `answered` are correctly excluded.
- Provider delivery attempt statuses are not included.

`event_outbox.status` values:

- `pending`
- `processing`
- `processed`
- `failed`
- `dead`
- `skipped`

Review:

- These are appropriate outbox worker states.
- They do not encode provider delivery results.
- `skipped` semantics remain future worker design.

## Invariant Protection Review

DDL-protected:

- one survey intent per organization + Case + service report,
- first-completion idempotency key uniqueness,
- event idempotency key uniqueness,
- initial event type allow-list,
- JSON object shape,
- no cascade deletion in new tables,
- no soft-delete bypass for intent recreation,
- minimal status allow-lists.

Future runtime-guarded:

- same organization across Case, report, final appointment, intent, and outbox,
- same Case for `finalAppointmentId`,
- completed report `finalAppointmentId` stability,
- strict atomic completion + survey intent + outbox writes,
- no survey event on repeat completion 409,
- no survey event on rejected no-eligible-visit completion,
- payload allow-list beyond JSON shape,
- redacted `last_error`,
- no real outbound delivery,
- opt-out / contact target / suppression policy.

## Sensitive Field Scan

Static scan reviewed the migration file and Task126 note for forbidden schema fields and actual sensitive values.

Result:

- No actual credential, URL, token, password, customer contact value, raw channel id, or production data was found.
- No forbidden Migration 020 schema fields such as customer contact fields, raw channel id fields, provider payload fields, token/secret fields, or credential fields were found.
- Safety-policy wording in docs is acceptable and does not contain actual sensitive values.

## Findings Matrix

| Area | Finding | Severity | Recommended action | Required before apply? | Required before runtime writes? | Suggested next task |
| --- | --- | --- | --- | --- | --- | --- |
| Event name | Migration uses acceptable alternative, but Task110 primary and Task121 expected `case.service_completion.first_transitioned`. | blocker | Patch SQL and docs to one canonical event name. | Yes | Yes | Task128 |
| Warning comments | Existing warnings are good, but historical backfill / Admin / AI / resolver no-op comments can be more explicit. | warning | Add explicit no-backfill/no-Admin/no-AI/no-resolver comments. | No | No | Task128 |
| `policy_status` | May overlap with `intent_status`. | warning | Clarify naming before runtime writes. | No | Yes | Future runtime design |
| `survey_intent_id` | Generic outbox has nullable survey FK. | info | Accept for initial limited generic outbox; revisit when generic outbox broadens. | No | No | Future outbox design |
| `suppression_detail_safe` | JSONB object only, no DDL size bound. | warning | Runtime allow-list and size guard required. | No | Yes | Future runtime task |
| `last_error` | Bounded but runtime redaction not implemented. | warning | Runtime redaction guard required. | No | Yes | Future outbox worker task |
| Same-org / same-case | Not fully enforced by DDL. | warning | Runtime validation required before writes. | No | Yes | Future runtime task |

## Final Recommendation

Task127 recommendation:

- Do not proceed to local-only dry-run planning yet.
- Do not apply Migration 020.
- Do not run DDL.
- Proceed to Task128 - Migration 020 Static SQL Patch / No Apply.

Task128 should:

- patch canonical event name consistently,
- strengthen warning comments,
- update Task126 note if needed,
- keep no-apply,
- keep no runtime/API/Admin/smoke changes,
- re-run static review checks.

## Non-goals

Task127 does not:

- modify the migration file,
- add another migration,
- apply migration,
- execute DDL,
- connect to DB,
- run psql or `npm run db:migrate`,
- modify schema/indexes,
- modify runtime/API/Admin/smoke,
- add survey sending,
- add LINE / APP push,
- add AI runtime,
- change repeat completion guard,
- change `finalAppointmentId` inference,
- expand inventory docs,
- perform destructive cleanup.

## Verification Summary

Recommended verification:

- `npm run check`
- `npm run admin:check` if safe and desired
- `git diff --check`
- static sensitive scan

No smoke, migration apply, psql, shared DB verification, inventory verification, or runtime tests are required for Task127.

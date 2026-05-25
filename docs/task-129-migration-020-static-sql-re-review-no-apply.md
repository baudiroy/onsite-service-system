# Task 129 - Migration 020 Static SQL Re-review / No Apply

## Executive Summary

Task129 re-reviews Migration 020 after Task128 patch. It does not edit, apply, execute, or approve the migration for runtime use.

Reviewed artifact:

- `migrations/020_create_survey_intents_and_event_outbox.sql`

Reviewed context:

- `docs/task-128-migration-020-static-sql-patch-no-apply.md`
- `docs/task-127-migration-020-static-sql-review-no-apply.md`
- `docs/task-126-survey-intent-event-outbox-migration-020-file-authoring-no-apply.md`
- `docs/task-125-survey-intent-event-outbox-migration-020-draft-ddl-convention-review.md`
- `docs/task-124-survey-intent-event-outbox-migration-020-file-authoring-plan-no-apply.md`
- `docs/task-123-survey-migration-020-policy-atomicity-retention-gate-closure-review.md`
- `docs/task-122-survey-intent-event-outbox-migration-020-draft-ddl-risk-review.md`
- `docs/task-121-survey-intent-event-outbox-migration-020-proposal-review.md`
- `docs/task-110-post-completion-survey-trigger-first-transition-design.md`
- migrations 001-019 convention samples

Result:

- Static SQL re-review passed with no apply blocker found.
- Event name mismatch blocker from Task127 is resolved.
- Warning comments are sufficient for no-apply static file posture, with one non-blocking wording improvement noted.
- No migration apply, DDL execution, DB connection, psql, shared DB verification, runtime change, API change, Admin UI change, smoke change, survey sending, LINE / APP push, AI runtime, destructive cleanup, or inventory docs expansion was performed.

## No-apply Safety Review

Task129 did not:

- run `npm run db:migrate`,
- run psql,
- connect to a DB,
- execute DDL,
- apply Migration 020,
- alter actual schema or indexes in any environment.

Package script review:

- `npm run check` runs `node --check` over backend JavaScript files.
- `npm run admin:check` delegates to the Admin frontend check script.
- migration apply is a separate `npm run db:migrate` command.

Therefore `npm run check` and `npm run admin:check` are safe for Task129 verification. Migration apply remains blocked until a separate explicit apply task.

## Event Name Re-review

Canonical event name:

```text
case.service_completion.first_transitioned
```

Migration 020 uses the canonical value in:

- `survey_intents.trigger_event_type` default,
- `survey_intents_trigger_event_type_check`,
- `event_outbox.event_type` default,
- `event_outbox_event_type_check`.

Old value:

```text
case.service_completed.first_transition
```

Static scan result:

- old value is absent from the migration file,
- old value is absent from the Task126 current note,
- old value remains only in Task127 / Task128 historical review notes.

Conclusion:

- event name re-review passes,
- no event-name blocker remains.

## Warning Comments Re-review

Migration 020 header includes:

- migration file authoring only,
- not applied in Task126,
- apply requires a separate task,
- not approved for runtime writes,
- not approved for survey sending,
- do not run against shared runtime without explicit apply task,
- no LINE / APP / SMS / email sending,
- no historical backfill,
- no Admin UI,
- no AI,
- no delivery resolver runtime,
- no survey response intake,
- no notification template seed,
- no survey content seed,
- tables are intended to be inert until a future runtime task.

Non-blocking wording note:

- The header does not literally include `PATCHED IN TASK 128 WITHOUT APPLY`.
- This is not an apply blocker because the same safety meaning is already covered by `NOT APPLIED IN TASK 126`, `APPLY REQUIRES A SEPARATE TASK`, and the Task128 docs note.
- A later static-comment polish task may add this exact phrase if the team wants stricter provenance in the migration header.

## `survey_intents` Static Re-review

Passes:

- UUID primary key uses `gen_random_uuid()`.
- `organization_id`, `case_id`, and `service_report_id` are required.
- `final_appointment_id` is nullable for legacy no-appointment compatibility.
- Nullable `final_appointment_id` does not enable survey delivery by default.
- `trigger_event_type` uses canonical event name.
- `trigger_event_version` is positive.
- `idempotency_key` is required and non-blank.
- `intent_status` remains intent / policy lifecycle, not response intake.
- `policy_status` remains policy-level summary.
- suppression fields are safe nullable summaries.
- `completed_at` is required.
- `source` defaults to `backend` and is CHECK-limited.
- `safe_context_summary` is JSONB-object checked.
- `triggered_by_user_id` is a nullable internal reference.
- timestamps and updated-at trigger follow local convention.
- no `deleted_at` is present, preserving lifetime idempotency.
- no customer contact, raw channel id, provider payload, credential, or full payload fields are present.

Warnings before runtime writes:

- same-organization and same-Case consistency still require runtime guards.
- JSONB safe details still require runtime allow-list and size limits.
- `policy_status` and `intent_status` semantics should be kept documented before runtime writes.

## `survey_intents` Constraints / FK / Indexes Re-review

Passes:

- unique `(organization_id, idempotency_key)` protects lifetime first-completion dedupe.
- unique `(organization_id, case_id, service_report_id)` protects one intent per formal report.
- no active-only partial unique index is used for idempotency.
- no soft-delete bypass exists.
- FKs exist for organization, Case, service report, appointment, and user.
- no `ON DELETE CASCADE` is used in Migration 020.
- indexes are minimal and not dashboard-heavy.
- constraint and index names follow local style.

Future runtime guards still required:

- Case/report/final appointment same-organization validation.
- `final_appointment_id`, if present, must belong to the same Case.
- `final_appointment_id` must be the completed report's stable resolved value.

## `event_outbox` Static Re-review

Passes:

- UUID primary key uses `gen_random_uuid()`.
- `organization_id` is required.
- `event_type` uses canonical event name.
- `event_version` is positive.
- `aggregate_type` is CHECK-limited to `case`.
- `aggregate_id` is required.
- `survey_intent_id` is nullable, so the outbox is limited but not impossible to broaden later.
- `idempotency_key` is required and non-blank.
- `payload` is JSONB-object checked.
- outbox worker status values are minimal.
- `available_at` and `occurred_at` are required.
- lock fields are nullable and consistency-checked.
- `locked_by` is bounded.
- attempts and max attempts are bounded.
- `last_error` is bounded.
- `processed_at` is required only for `processed`.
- timestamps and updated-at trigger follow local convention.
- no provider delivery result fields are present.
- no raw provider payload, raw LINE user id, customer contact, device token, credential, or full payload field is present.

Warnings before runtime writes:

- payload allow-list must be enforced by future runtime.
- `last_error` must be redacted before persistence by future runtime.
- `skipped` semantics should be defined before outbox worker implementation.

## `event_outbox` Constraints / FK / Indexes Re-review

Passes:

- unique `(organization_id, event_type, idempotency_key)` protects lifetime event dedupe.
- ready index supports future pending / failed worker lookup.
- aggregate index supports Case-level event lookup.
- lock expiry index supports future lock recovery.
- survey intent lookup index supports traceability.
- processed-at index supports future retention review.
- no provider-specific indexes are present.
- no dashboard-specific indexes are present.
- no `ON DELETE CASCADE` is used in Migration 020.
- constraint and index names follow local style.

Future runtime guards still required:

- `aggregate_id` must be validated as a Case id in the same organization.
- `survey_intent_id`, if present, must belong to the same organization.
- idempotency conflict handling must avoid duplicate side effects.

## Status Lifecycle Re-review

`survey_intents.intent_status` values remain intent / eligibility states:

- `pending_policy`
- `channel_resolution_pending`
- `pending_channel`
- `suppressed`
- `not_deliverable`
- `ready_for_delivery`
- `expired`
- `cancelled`
- `voided`

`sent` and `answered` remain excluded. Provider delivery attempt results are not encoded in `survey_intents`.

`event_outbox.status` values remain worker states:

- `pending`
- `processing`
- `processed`
- `failed`
- `dead`
- `skipped`

Provider delivery result details are not encoded in `event_outbox`.

## Invariant Protection Re-review

DDL-protected:

- one survey intent per organization + Case + service report,
- first-completion idempotency key uniqueness,
- event outbox idempotency key uniqueness,
- canonical event type allow-list,
- Case aggregate type allow-list,
- JSON object shape,
- no cascade delete in new tables,
- no soft-delete bypass for intent recreation,
- minimal status allow-lists.

Future runtime-guarded:

- same organization across Case, report, final appointment, intent, and outbox,
- same Case for `finalAppointmentId`,
- completed report `finalAppointmentId` stability,
- strict atomic completion + survey intent + outbox writes,
- no survey intent or outbox event on repeat completion 409,
- no survey intent or outbox event on rejected no-eligible-visit completion,
- payload allow-list beyond JSON shape,
- redacted `last_error`,
- no real outbound delivery,
- opt-out / contact target / suppression policy.

## Sensitive Field Scan

Static scan result:

- no actual credential, URL, token, password, customer contact value, raw channel id, or production data was found,
- no forbidden Migration 020 schema fields were found,
- docs-only safety wording mentions denied fields as policy text only and does not contain actual values.

Forbidden schema fields absent from Migration 020:

- customer contact fields,
- raw LINE user id fields,
- device token fields,
- provider raw payload fields,
- token / secret / credential fields,
- full payload fields.

## Findings Matrix

| Area | Finding | Severity | Recommended action | Required before local dry-run? | Required before apply? | Required before runtime writes? | Suggested next task |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Event name | Migration uses canonical `case.service_completion.first_transitioned` in intent and outbox contexts. | info | No action. | No | No | No | Task130 local-only dry-run planning |
| Old event value | Old value remains only in historical Task127 / Task128 notes. | info | Keep as historical evidence. | No | No | No | None |
| Warning comments | Header is sufficient but does not literally say `PATCHED IN TASK 128 WITHOUT APPLY`. | warning | Optional comment polish before apply if desired. | No | No | No | Optional future static patch |
| `survey_intents` structure | Shape matches Task124-128 decisions and contains no forbidden schema fields. | info | No action before local dry-run planning. | No | No | Runtime guards still needed | Task130 planning |
| `event_outbox` structure | Shape matches Task124-128 decisions and contains no provider delivery result fields. | info | No action before local dry-run planning. | No | No | Runtime payload/redaction guards still needed | Task130 planning |
| FKs / deletion | No `ON DELETE CASCADE` in Migration 020. | info | No action. | No | No | No | None |
| Runtime guards | Same-org, same-Case, atomic writes, and payload allow-list are not DDL-complete. | warning | Keep blocked until future runtime task. | No | No | Yes | Future runtime design |
| Sensitive output | Static scan found policy wording only, no actual sensitive values. | info | Continue safe handoff. | No | No | No | None |

## Final Recommendation

Option A:

- Migration 020 static SQL re-review passed.
- No new static apply blocker was found.
- Ready for Task130 local-only dry-run planning / no shared apply.

Task130 should remain documentation/planning-only unless a later task explicitly authorizes local/test DDL execution. It should not apply the migration to shared runtime.

## Non-goals

Task129 does not:

- modify the migration file,
- add another migration,
- apply migration,
- execute DDL,
- connect to DB,
- run psql or `npm run db:migrate`,
- modify schema/indexes,
- modify runtime/API/Admin/smoke,
- add survey sending,
- add notification sending,
- add LINE / APP push,
- add AI runtime,
- change repeat completion guard,
- change `finalAppointmentId` inference,
- make survey appointment-level,
- expand inventory docs,
- perform destructive cleanup.

## Verification Summary

Verification performed:

- reviewed package script safety for `npm run check` and `npm run admin:check`,
- static event name scan,
- static warning comment scan,
- static SQL safety scan for `ON DELETE CASCADE` and forbidden schema fields,
- static sensitive scan over Task121-128 docs and Migration 020.

No smoke, migration apply, psql, shared DB verification, inventory verification, or runtime tests are required for Task129.

## Next Task Recommendation

Task 130 - Migration 020 Local-only Dry-run Planning / No Shared Apply.

Task130 should define:

- local/test-only dry-run goals,
- no shared runtime apply boundary,
- environment prerequisites,
- safety gates before any future DDL execution,
- exact commands that must not be run in Task130,
- post-dry-run safe summary expectations,
- rollback / forward-fix stance for a future apply task,
- confirmation that runtime writes and survey sending remain disabled.

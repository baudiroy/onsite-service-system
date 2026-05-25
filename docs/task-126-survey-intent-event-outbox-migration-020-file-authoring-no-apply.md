# Task 126 - Survey Intent / Event Outbox Migration 020 File Authoring / No Apply

## Executive Summary

Task126 authors Migration 020 as a file artifact only. It does not apply, execute, or approve the migration for runtime use.

Created artifact:

- `migrations/020_create_survey_intents_and_event_outbox.sql`

This task did not change runtime behavior, API behavior, Admin UI, smoke scripts, survey sending, notification delivery, LINE / APP push, or inventory documentation.

## Pre-authoring Safety Check

Checked package scripts before authoring:

- `npm run check` only runs `node --check` against backend JavaScript files.
- `npm run admin:check` delegates to the Admin frontend check script.
- Migration apply is a separate `npm run db:migrate` command.

Task126 must not run `npm run db:migrate`, psql, or any command that applies migrations.

## Authored Migration File

Migration filename:

```text
migrations/020_create_survey_intents_and_event_outbox.sql
```

The file begins with explicit warning comments:

- migration file authoring only,
- not applied in Task126,
- apply requires a separate task,
- not approved for runtime writes,
- not approved for survey sending,
- do not run against shared runtime without explicit apply task,
- no LINE / APP / SMS / email sending is enabled,
- tables are inert until a future runtime task.

## `survey_intents` Summary

The migration file creates `survey_intents` with:

- UUID primary key using `gen_random_uuid()`,
- required `organization_id`,
- required `case_id`,
- required `service_report_id`,
- nullable `final_appointment_id`,
- `trigger_event_type` defaulting to `case.service_completion.first_transitioned`,
- positive `trigger_event_version`,
- required `idempotency_key`,
- `intent_status` text with minimal lifecycle CHECK,
- `policy_status` text with CHECK,
- nullable safe suppression fields,
- required `completed_at`,
- nullable policy version fields,
- `source` defaulting to `backend`,
- nullable allow-list `safe_context_summary`,
- nullable `triggered_by_user_id` as internal safe reference,
- standard `created_at` / `updated_at`,
- updated_at trigger.

Intent statuses included:

- `pending_policy`
- `channel_resolution_pending`
- `pending_channel`
- `suppressed`
- `not_deliverable`
- `ready_for_delivery`
- `expired`
- `cancelled`
- `voided`

Delivery / response statuses intentionally excluded:

- `sent`
- `answered`

## `survey_intents` Constraints / Indexes

Authored constraints and indexes:

- trigger event type CHECK,
- positive event version CHECK,
- non-blank idempotency key CHECK,
- intent status CHECK,
- policy status CHECK,
- JSONB object checks for safe suppression detail and context summary,
- source CHECK,
- unique `(organization_id, idempotency_key)`,
- unique `(organization_id, case_id, service_report_id)`,
- status lookup index,
- Case lookup index,
- service report lookup index,
- nullable final appointment lookup index,
- completed time lookup index.

Design notes:

- No normal `deleted_at` column was added, preserving lifetime idempotency.
- No active-only partial unique index was used for idempotency.
- Nullable `final_appointment_id` does not enable legacy no-appointment survey delivery by default.
- FK deletion behavior relies on PostgreSQL default restrict / no action; no `ON DELETE CASCADE` is used.

## `event_outbox` Summary

The migration file creates `event_outbox` with:

- UUID primary key using `gen_random_uuid()`,
- required `organization_id`,
- `event_type` defaulting to `case.service_completion.first_transitioned`,
- positive `event_version`,
- `aggregate_type` defaulting to `case`,
- required `aggregate_id`,
- nullable `survey_intent_id`,
- required `idempotency_key`,
- required JSONB object `payload`,
- `status` text with worker lifecycle CHECK,
- required `available_at`,
- required `occurred_at`,
- nullable lock fields,
- bounded `locked_by`,
- retry accounting fields,
- bounded `last_error`,
- nullable `processed_at`,
- standard `created_at` / `updated_at`,
- updated_at trigger.

Outbox statuses included:

- `pending`
- `processing`
- `processed`
- `failed`
- `dead`
- `skipped`

Provider delivery result fields are intentionally not included.

## `event_outbox` Constraints / Indexes

Authored constraints and indexes:

- event type CHECK,
- positive event version CHECK,
- aggregate type CHECK,
- non-blank idempotency key CHECK,
- JSONB object payload CHECK,
- status CHECK,
- attempts / max attempts CHECK,
- lock consistency CHECK,
- processed timestamp CHECK,
- unique `(organization_id, event_type, idempotency_key)`,
- ready worker lookup index for pending / failed rows,
- aggregate lookup index,
- lock expiry lookup index,
- survey intent lookup index,
- processed retention lookup index.

Design notes:

- `event_outbox` remains generic by table name but strict by initial event allow-list.
- `aggregate_id` represents Case id for the initial event but remains runtime-validated.
- `last_error` is bounded by type, but future runtime must redact it before persistence.
- `payload` is structurally checked as JSONB object, but future runtime must enforce allow-list content.

## DDL-protected Invariants

The migration file can protect:

- one survey intent per `(organization_id, case_id, service_report_id)`,
- event/intent idempotency keys,
- initial event type allow-list,
- minimal status allow-lists,
- JSONB object shape,
- no active-only uniqueness bypass,
- no cascade delete in these new tables,
- basic FK existence.

## Future Runtime Guard Invariants

The following are intentionally future runtime responsibilities:

- Case/report/appointment same-organization consistency,
- `final_appointment_id` belongs to the same Case,
- `final_appointment_id` is the completed report's stable resolved value,
- strict atomic completion + intent + outbox writes,
- idempotency conflict handling,
- survey policy / suppression / opt-out decisions,
- payload allow-list and redaction,
- last_error sanitization,
- no real outbound for smoke/internal/test cases,
- delivery resolver and channel selection,
- no repeat completion side effects.

## Remaining Apply Blockers

Migration apply remains blocked until a later explicit task:

1. Static SQL review is completed.
2. Apply command / environment is explicitly selected.
3. Shared runtime apply safety is approved.
4. Runtime writes remain disabled.
5. Survey sending remains disabled.
6. No historical backfill is confirmed.
7. Post-apply verification is schema-only safe summary.

## Non-goals

Task126 did not:

- apply Migration 020,
- execute DDL,
- connect to a database,
- run psql,
- modify runtime behavior,
- modify API behavior,
- modify Admin UI,
- modify smoke scripts,
- add survey sending,
- add notification sending,
- add LINE / APP / SMS / email push,
- add delivery resolver runtime,
- add outbox worker,
- add survey response intake,
- add survey dashboard,
- add manual send / resend / override,
- add AI runtime or AI automatic decision,
- change repeat completion 409 guard,
- change `finalAppointmentId` inference,
- make survey appointment-level,
- allow multiple formal Field Service Reports per Case,
- modify Task 087 inventory guide,
- expand inventory docs,
- perform destructive cleanup.

## Verification Summary

Recommended verification:

- `npm run check`
- `npm run admin:check` if desired and safe
- `git diff --check`
- sensitive scan over the new migration and Task126 note
- static file review confirming no runtime/API/Admin/smoke changes

No smoke, inventory verification, shared DB live verification, psql, migration apply, Admin UI tests, or runtime tests are required for Task126.

## Next Task Recommendation

Task 127 - Migration 020 Static SQL Review / No Apply.

Task127 should statically review:

- migration filename,
- warning comments,
- table definitions,
- constraint names,
- index names,
- trigger functions,
- status CHECK values,
- no `ON DELETE CASCADE`,
- no contact/channel/provider payload fields,
- no runtime changes,
- no migration apply.

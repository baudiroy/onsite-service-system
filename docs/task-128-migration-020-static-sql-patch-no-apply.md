# Task 128 - Migration 020 Static SQL Patch / No Apply

## Executive Summary

Task128 patches static SQL blockers only. It does not apply, execute, or approve Migration 020 for runtime use.

Patched files:

- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `docs/task-126-survey-intent-event-outbox-migration-020-file-authoring-no-apply.md`

Added documentation:

- `docs/task-128-migration-020-static-sql-patch-no-apply.md`

No migration apply, DDL execution, DB connection, runtime change, API change, Admin UI change, smoke change, survey sending, LINE / APP push, AI runtime, or inventory docs expansion was performed.

## No-apply Statement

Task128 did not:

- run `npm run db:migrate`,
- run psql,
- connect to a DB,
- execute DDL,
- apply Migration 020,
- alter actual schema or indexes in any environment.

The migration file remains a file artifact only. Apply requires a separate explicit task.

## Event Name Canonical Decision

Old migration value:

```text
case.service_completed.first_transition
```

Canonical value:

```text
case.service_completion.first_transitioned
```

Reason:

- Task110's primary recommendation and Task121 expected value use `case.service_completion.first_transitioned`.
- The value describes a Case-level domain event that has happened.
- It avoids appointment-level, report-per-visit, or delivery-specific semantics.
- It remains channel-agnostic and does not hard-code LINE, APP, SMS, or email.

## Locations Patched

Migration file patches:

- `survey_intents.trigger_event_type` default.
- `survey_intents_trigger_event_type_check`.
- `event_outbox.event_type` default.
- `event_outbox_event_type_check`.

Documentation patch:

- Task126 summary now references `case.service_completion.first_transitioned`.

Task127 was not changed because it is the historical static review that found the blocker.

## Warning Comments Strengthened

Migration 020 now explicitly states:

- migration file authoring only,
- not applied in Task126,
- apply requires a separate task,
- not approved for runtime writes,
- not approved for survey sending,
- do not run against shared runtime without explicit apply task,
- no LINE / APP / SMS / email sending is enabled,
- no historical backfill is enabled,
- no Admin UI is enabled,
- no AI is enabled,
- no delivery resolver runtime is enabled,
- no survey response intake is enabled,
- no notification template seed is created,
- no survey content seed is created,
- tables are inert until a future runtime task.

## What Was Not Changed

Task128 intentionally did not change:

- table structure,
- column set,
- indexes,
- FK behavior,
- status lifecycle,
- `policy_status` vs `intent_status`,
- `triggered_by_user_id`,
- `survey_intent_id`,
- same-organization / same-Case runtime guard model,
- rollout / rollback policy,
- runtime behavior,
- API behavior,
- Admin UI,
- smoke scripts.

## Remaining Static Concerns

Remaining concerns are not blockers for the event-name patch but must be handled before runtime writes:

- `policy_status` and `intent_status` semantics should be finalized before runtime.
- `suppression_detail_safe` size and allow-list enforcement remains runtime responsibility.
- `last_error` redaction remains runtime responsibility.
- same-organization and same-Case consistency remain runtime responsibilities.
- strict atomic completion + intent + outbox writes remain future runtime work.

## Verification Summary

Recommended verification:

- `npm run check`
- `npm run admin:check` if safe and desired
- `git diff --check`
- event name scan
- warning comment scan
- sensitive field scan

No smoke, migration apply, psql, shared DB verification, inventory verification, or runtime tests are required for Task128.

## Next Task Recommendation

Task 129 - Migration 020 Static SQL Re-review / No Apply.

Task129 should confirm:

- old event name is gone except historical notes,
- canonical event name appears in both survey intent and outbox event type contexts,
- warning comments are present,
- no `ON DELETE CASCADE`,
- no forbidden contact/channel/provider/credential fields,
- no runtime/API/Admin/smoke changes,
- no migration apply.

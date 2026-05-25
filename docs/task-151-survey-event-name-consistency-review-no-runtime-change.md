# Task 151 - Survey Event Name Consistency Review / No Runtime Change

## Background

Task151 records the ChatGPT full-context review follow-up for the survey runtime and Migration 020 handoff. It is documentation-only and does not implement runtime behavior, connect to DB, apply Migration 020, or approve survey sending.

## No-runtime-change Statement

Task151 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify smoke or browser smoke scripts,
- edit Migration 020 SQL,
- add or apply migrations,
- execute DDL,
- connect to DB,
- run psql,
- run `npm run db:migrate`,
- change schema or indexes,
- implement repositories, services, feature flags, workers, resolvers, delivery, response intake, or AI runtime,
- approve runtime implementation, migration apply, local dry-run, shared apply, or survey sending,
- modify Task087 inventory docs,
- mutate shared runtime data.

## Review Trigger

ChatGPT reviewed the consolidated system architecture, progress, and future planning summary. The overall architecture was accepted as consistent, but one high-priority documentation consistency issue was identified:

- historical / non-canonical event name: `case.service_completed.first_transition`,
- current canonical event name: `case.service_completion.first_transitioned`.

## Canonical Event Name Decision

Current source-of-truth for future survey intent / outbox work:

```text
case.service_completion.first_transitioned
```

This is the canonical event name for:

- Migration 020 SQL defaults and constraints,
- future `survey_intents.trigger_event_type`,
- future `event_outbox.event_type`,
- future runtime allow-lists,
- future tests and smoke expectations,
- future handoff summaries.

The historical value `case.service_completed.first_transition` may remain only in historical draft, review, or patch-context documents where it is explicitly described as pre-Task128 or deprecated context. It should not be used as a current recommendation.

## Static Grep Result

Current Migration 020 SQL uses only:

```text
case.service_completion.first_transitioned
```

The old string appears only in historical docs and correction context after this Task151 cleanup. Task110, Task123, Task124, and Task125 now clarify that the old value is historical and not the current recommendation.

## Migration 020 Status Wording

Use this wording in future summaries:

- migration files 001-020 exist,
- DB applied status remains 001-019 unless explicitly applied later,
- Migration 020 exists as a file artifact only,
- Migration 020 has not been applied,
- Migration 020 has not been locally dry-run,
- no shared apply occurred,
- no runtime writes or survey sending are approved.

Avoid shorthand such as "migrations are at 001-020" unless it clearly means files exist, not DB applied state.

## Other Review Notes

The ChatGPT review also reaffirmed:

- one-open-appointment is currently a service-level guard, not a DB-level concurrency constraint,
- DB-level partial unique constraint / transaction isolation / row lock review remains a future hardening topic,
- survey runtime implementation remains blocked until explicit migration / runtime approval gates are satisfied,
- survey sending remains blocked by future product policy decisions,
- inventory docs remain frozen.

## Current Pause Decision

Task151 keeps the project on the no-apply / no-runtime path:

- no Migration 020 local-only dry-run,
- no shared runtime apply,
- no DB connection,
- no runtime implementation,
- no survey writes,
- no survey sending.

General instructions such as "continue" or "go ahead" still do not authorize DDL, DB connection, Migration 020 dry-run/apply, runtime writes, or survey sending.

## Recommended Next Branches

Without explicit DDL / runtime approval, the safest next branches remain:

1. Product mainline return, such as channel abstraction, reverse LINE binding, Admin workflow polish, billing / settlement design, SLA / risk / escalation design, or AI advisory risk radar design.
2. Docs-only QA, if another handoff consistency issue is found.
3. Local-only Migration 020 dry-run only after a complete explicit approval packet is provided for a disposable local/test DB target.

## Verification Scope

Task151 verification should be limited to:

- static grep for event-name consistency,
- `npm run check`,
- optional `npm run admin:check` if project convention requires it,
- `git diff --check` if git is available.

No smoke, browser smoke, inventory verification, DB verification, migration apply, or shared runtime action is required.

# Task 709 - Engineer Mobile Task Detail Read Model Mapper and Query Spec / No DB / No Migration

## Summary

Task 709 added the pre-DB Engineer Mobile task detail read model mapper and non-executable query spec builder.

Added:

- `mapEngineerMobileTaskDetailRow(row)`
- `mapEngineerMobileTaskDetailRowsToReadModel(input)`
- `buildEngineerMobileTaskDetailQuerySpec(input)`
- `ENGINEER_MOBILE_TASK_DETAIL_FIELDS`

## Mapper Boundary

The mapper converts synthetic future DB rows into the safe task detail read model consumed by the Task 704 detail service.

It requires:

- `organizationId`
- `engineerId`
- `appointmentId`
- one or more candidate rows

It filters by:

- same organization
- assigned engineer
- requested appointment

It fail-closes to `{ task: null }` when required input or required row identity is missing.

## Safe Output

The mapper allows only safe task detail fields:

- organization / case / appointment / assigned engineer identifiers
- schedule/status fields
- masked customer name / phone
- address summary
- product / issue / service type summary
- safe site note
- checklist summary
- safe evidence reference metadata

It does not output:

- internal note
- audit log
- AI raw payload
- billing / settlement internal data
- raw phone
- raw address
- raw LINE id
- token / secret / `DATABASE_URL`
- `finalAppointmentId` / `final_appointment_id`
- raw storage path / signed URL / evidence token

Evidence refs are metadata-only safe refs.

## Query Spec Boundary

`buildEngineerMobileTaskDetailQuerySpec(input)` returns a static, placeholder-based, non-executable query spec.

The query spec:

- requires `organizationId`, `engineerId`, and `appointmentId`
- uses `$1`, `$2`, `$3` placeholders
- does not interpolate raw values into SQL text
- is `executable: false` by default
- does not request raw customer payload, raw phone/address/LINE id, token/secret, or `finalAppointmentId`

Task 709 does not execute SQL and does not connect to any database.

## Runtime Boundary

- No route/app/server/controller/service changes.
- No repository implementation.
- No DB, SQL execution, migration, schema, provider sending, AI/RAG/vector, smoke/browser, admin, package, guardrails, or design-doc changes.

## Future Tasks

- Add an injected query executor adapter for this query spec in a separate no-real-DB task.
- Add a real DB-backed task detail repository only after explicit DB/migration/runtime approval.
- Add Engineer Mobile UI detail page and browser smoke only after backend read provider and UI route approval.

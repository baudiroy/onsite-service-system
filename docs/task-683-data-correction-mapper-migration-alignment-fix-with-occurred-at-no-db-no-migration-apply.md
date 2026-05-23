# Task 683 — Data Correction Mapper/Migration Alignment Fix with occurred_at / No DB / No Migration Apply

## Scope

Task683 fixes Data Correction mapper/migration/design alignment issues and adds a static guard.

This task does not connect to a database, does not execute SQL, does not apply or dry-run a migration, and does not change API, routes, app/server, permission runtime, or real audit runtime.

## Fixes

Blocker 1:

- Mapper `correction_application` table hint used `data_correction_applications`.
- Migration/design use `data_correction_application_records`.
- The mapper now aligns with `data_correction_application_records`.

Blocker 2:

- Mapper query specs output `occurred_at`.
- Mapper query specs output `record_type`.
- Migration/design originally listed `created_at` only.
- The migration draft and design proposal now include `record_type`, `occurred_at`, and `created_at`.

Decision:

- `record_type` is the safe normalized writer / persistence record type.
- `occurred_at` is the safe business-event timestamp supplied by the workflow.
- `created_at` is when the persistence record is created.

## Static Alignment Guard

The static alignment test validates:

- mapper exports record/query spec functions
- mapper record types map to migration/design table names
- every mapper table hint exists in the migration draft
- every mapper table hint exists in the design proposal
- migration draft and design proposal contain all mapper table names
- required fields include `record_type`, `occurred_at`, and `created_at`
- query specs remain `executable:false` by default
- query spec SQL does not interpolate raw values
- forbidden sensitive fields are absent from mapper output, query spec, and migration column definitions
- `sourceAppointmentId` normalizes to `appointmentId` for follow-up path
- mapper import boundary remains no DB / repository / provider / AI

## Boundaries

- No DB connection.
- No SQL execution.
- No migration apply.
- No migration dry-run.
- No API change.
- No app/server/route/controller change.
- No permission runtime change.
- No real audit runtime.
- No smoke test.
- No provider sending.
- No sensitive data.

## Follow-up

Future disposable DB dry-run or migration apply still requires separate explicit authorization.

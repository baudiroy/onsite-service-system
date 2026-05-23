# Task 681 — Data Correction Persistence Schema Proposal and Static Guard / No Migration Apply / No DB

## Scope

Task681 adds a module-level Data Correction persistence schema proposal and a static guard test.

This task is docs/static only. It does not create a migration, does not connect to a database, does not execute SQL, and does not change runtime source.

## Proposal Summary

The proposal maps Data Correction record types to conceptual future tables:

- audit -> `data_correction_audit_events`
- contact_log -> `data_correction_contact_logs`
- dispatch_note -> `data_correction_dispatch_notes`
- engineer_notification_intent -> `data_correction_engineer_notification_intents`
- appointment_result -> `data_correction_appointment_results`
- evidence -> `data_correction_evidence_refs`
- follow_up_draft -> `data_correction_follow_up_drafts`
- correction_application -> `data_correction_application_records`

The proposal defines common fields, data minimization rules, organization-scoped conceptual indexes, and migration authorization boundaries.

## Static Guard Coverage

The static test checks that the proposal:

- exists
- states no migration and no DB execution authorization
- includes all proposed table names
- includes common required fields
- includes all record type to table mappings
- includes no raw phone/address/LINE id storage invariants
- includes no token/secret/DB URL storage invariants
- includes no raw `fromValue`/`toValue` storage invariant
- includes no AI raw payload invariant
- includes no second formal Field Service Report invariant
- includes no `finalAppointmentId` storage/change invariant
- includes follow-up draft not formal appointment invariant
- includes appointment result not Field Service Report invariant
- includes organization-scoped conceptual indexes
- includes future migration separate authorization boundary
- avoids real-looking credential or DB URL examples

## Boundaries

- No runtime source.
- No API change.
- No DB connection.
- No SQL execution.
- No migration file.
- No DDL.
- No permission runtime change.
- No real audit runtime.
- No smoke test.
- No provider sending.
- No sensitive data.

## Follow-up

Future migration design, rollback, local dry-run, shared DB apply, or real persistence wiring require separate explicit authorization.

# Task 344 - Field Service Report No-Appointment Completion Legacy Boundary Review / No Runtime Change

## Scope And Non-goals

This document reviews the current legacy boundary for completing a Field Service Report when the Case has no appointments.

Task344 is documentation-only. It does not change backend runtime, Admin frontend, API contract, smoke tests, migrations, schema, indexes, package configuration, provider integrations, notification sending, AI / RAG, billing, customer-facing report, survey, complaint, callback, inventory, parts, WMS, supervisor override, void, or correction workflows.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, shared runtime verification, or destructive cleanup is part of this task.

## Current Behavior Summary

The current completion contract has two separate branches:

1. Cases with appointments:
   - completion requires a final appointment to resolve from a supplied, existing, or inferred appointment,
   - the appointment must belong to the same Case,
   - the appointment must not be deleted,
   - `visit_result` must be `completed`,
   - if no eligible completed appointment exists, completion is rejected before report update, Case update, timeline message, and audit side effects.

2. Cases with no appointments:
   - legacy completion is still allowed,
   - `final_appointment_id` may remain `null`,
   - if a supplied or existing `finalAppointmentId` is present, it is still validated as same-Case and `visit_result = completed`,
   - no fake appointment is created.

This preserves older compatibility while the platform continues to enforce the stronger completed-appointment rule for normal multi-visit / dispatch-backed Cases.

## Code Inspection Findings

`FieldServiceReportService.ensureCompletionFinalAppointment()` first calls `AppointmentRepository.hasAppointmentsByCaseId(existingReport.case_id, client)`.

If the Case has no appointments, the service enters the legacy branch:

- it combines supplied and existing final appointment values into `legacyFinalAppointmentId`,
- if a value exists, it validates the appointment with `ensureFinalAppointmentCompletedForCase()`,
- if no value exists, it returns `null`.

If the Case has appointments, the service:

- validates supplied `finalAppointmentId`, if present,
- validates existing report `final_appointment_id`, if present,
- otherwise calls `AppointmentRepository.findEligibleFinalAppointmentForCase()`,
- rejects completion with a safe validation error if no eligible completed appointment exists.

`AppointmentRepository.hasAppointmentsByCaseId()` checks for at least one non-deleted appointment for the Case.

`AppointmentRepository.findEligibleFinalAppointmentForCase()` requires:

- same `case_id`,
- `deleted_at IS NULL`,
- `visit_result = 'completed'`,
- deterministic ordering by `visit_sequence`, service timestamps, `created_at`, and `id`.

`FieldServiceReportService.completeServiceReport()` calls `ensureCompletionFinalAppointment()` after report row locking and organization access checks, but before:

- `completeServiceReportFirstTransition()`,
- Case summary / status update,
- timeline message creation,
- audit record creation.

For no-appointment legacy completion, the completed report is written with `final_appointment_id = null` unless a valid legacy appointment id already exists or is supplied.

The same completion path still updates the Case summary / status, creates the completion timeline message, and records audit, because the runtime currently treats no-appointment completion as a valid legacy completion transition.

## Existing Smoke Coverage

`smoke:028` already covers the normal appointment-backed rule:

- completion without `finalAppointmentId` is rejected when the Case has appointments but only a non-completed visit,
- the Case remains open after that rejection,
- after a same-Case appointment is marked `visit_result = completed`, completion without supplied `finalAppointmentId` succeeds and backend inference resolves the final appointment.

`smoke:028` does not currently add a separate no-appointment legacy fixture. That is acceptable for Task344 because this task does not change runtime and does not require DB / API fixture execution.

## Why The Legacy No-appointment Behavior May Exist

No-appointment completion may still be useful for transitional or exception cases:

- manual backfill of historical Field Service Reports,
- legacy Cases created before appointment / dispatch visit modeling was fully enforced,
- non-visit or remote completion cases,
- admin-only correction of old operational records,
- test or seed data created before multi-dispatch behavior existed,
- controlled imports from older systems where visit-level data does not exist.

These scenarios are not the default field-service workflow, but removing the behavior without a dedicated migration and policy could break old data or operational recovery paths.

## Risk Analysis

Keeping no-appointment completion has risks:

- a direct API client could complete a Case without a dispatch / appointment trail,
- Case completion could bypass the normal appointment / visit evidence layer,
- `finalAppointmentId` is `null`, so downstream survey, customer report, billing, settlement, and quality workflows must handle that context carefully,
- reporting may need to distinguish legacy / exception completion from appointment-backed completion,
- future customer-visible completion summaries may lack visit context,
- future survey eligibility policy must explicitly decide whether no-appointment completion is eligible.

Those risks are bounded today because the behavior is legacy-compatible and the normal appointment-backed path is already stricter. They should not be silently expanded into a standard workflow.

## Future Policy Options

### Option A - Preserve Legacy No-appointment Completion

Keep the current behavior, but document it as legacy / admin-only / exception-compatible.

Runtime impact:

- minimal,
- current behavior continues,
- downstream features must handle nullable `finalAppointmentId`.

Migration impact:

- none immediately,
- future reporting may need a way to classify legacy completion.

Test impact:

- optional no-appointment smoke or unit coverage can be added later,
- existing appointment-backed completion tests remain unchanged.

Risk:

- direct API misuse remains possible unless a future permission / policy layer narrows it.

### Option B - Require Completed Appointment For All Completion

Remove no-appointment completion and require a completed appointment for every Field Service Report completion.

Runtime impact:

- breaking behavior change,
- legacy no-appointment Cases can no longer complete without migration or backfill,
- remote or non-visit completion needs a separate model.

Migration impact:

- likely requires legacy data analysis,
- may require historical appointment backfill or an explicit exception model.

Test impact:

- smoke fixtures and docs that rely on legacy compatibility must be updated,
- no-appointment tests should assert rejection.

Risk:

- safer for normal operations,
- potentially disruptive without careful rollout.

### Option C - Allow Explicit Exception Types

Keep completion possible without appointments only when an explicit exception type, reason, permission, and audit record are present.

Candidate exception types:

- historical import,
- remote completion,
- supervisor correction,
- legacy backfill,
- non-visit service closure.

Runtime impact:

- requires service-layer policy,
- likely requires new fields or related records,
- should require explicit role / permission checks and audit.

Migration impact:

- may require schema / migration if exception reason is structured.

Test impact:

- needs positive / negative tests for allowed exception types,
- must verify normal completion still requires completed appointment.

Risk:

- best balance long-term,
- more design work than a small guard change.

## Recommended Current Decision

No runtime change now.

Keep legacy no-appointment completion until a dedicated policy, migration, permission, audit, and customer-visible behavior design is approved.

Do not silently convert the legacy branch into a standard workflow. Any future tightening should be a separate task with explicit approval because it may affect historical data, remote completion, admin correction, smoke fixtures, and downstream survey / customer report / billing policies.

## Recommended Next Step

If the product wants to reduce no-appointment completion risk, open a future task for a no-appointment completion policy decision packet.

That future task should decide:

- whether no-appointment completion remains allowed,
- whether it is admin-only,
- whether it requires an exception reason,
- whether it requires supervisor approval,
- whether it should be blocked for new Cases after a rollout date,
- whether remote completion needs its own appointment / visit representation,
- whether historical imports require a dedicated flag,
- how customer-visible reports describe no-appointment completion,
- whether surveys are allowed when `finalAppointmentId` is `null`,
- what smoke / unit coverage is required.

## Explicit Non-goals

Task344 does not:

- change Field Service Report completion runtime,
- change `finalAppointmentId` inference,
- change legacy no-appointment behavior,
- add an exception reason field,
- add a supervisor override workflow,
- add a void / correction workflow,
- change Case status transitions,
- change appointment lifecycle,
- change one-open-appointment guard,
- add migration / schema / index,
- add or modify API,
- add or modify Admin UI,
- add or modify smoke tests,
- add notification / survey / customer-facing report / billing behavior,
- add AI decisions,
- connect to any DB or shared runtime.

## Guardrails Checklist

- One Case = one formal Field Service Report: preserved.
- One Case may have multiple appointments / visits: preserved.
- Normal appointment-backed completion requires a same-Case completed visit: preserved.
- No-appointment completion is documented as legacy-compatible, not a new default.
- `finalAppointmentId` remains backend/system-determined: preserved.
- Completed report `finalAppointmentId` stability: unchanged.
- No manual final appointment picker: unchanged.
- No AI auto decision: unchanged.
- No destructive cleanup: unchanged.
- No migration / schema / index change: unchanged.
- No sensitive output: unchanged.
- Inventory docs remain frozen: unchanged.

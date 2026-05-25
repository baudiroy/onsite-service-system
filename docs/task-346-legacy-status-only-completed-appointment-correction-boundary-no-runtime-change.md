# Task 346 - Legacy Status-only Completed Appointment Correction Boundary / No Runtime Change

## Scope And Non-goals

This document reviews the future correction boundary for historical appointments that may have `appointment_status = completed` while `visit_result` is missing or not `completed`.

Task346 is documentation-only. It does not change backend runtime, Admin frontend, API contract, smoke tests, migrations, schema, indexes, package configuration, provider integrations, notification sending, AI / RAG, billing, customer-facing report, survey, complaint, callback, inventory, parts, WMS, supervisor override, or correction runtime.

No database connection, data profiling query, correction script, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, shared runtime verification, or destructive cleanup is part of this task.

## Current Behavior Summary

Task345 introduced a service-layer guard for new writes:

- a resulting `appointmentStatus = completed` requires `visitResult = completed`,
- a resulting `visitResult = completed` requires `appointmentStatus = completed`,
- create requests cannot create a scheduled appointment with `visitResult = completed`,
- update requests cannot create or reopen inconsistent completed status / visit result combinations.

This prevents new inconsistent appointment transitions, but it does not inspect or correct historical database rows.

## Code / Schema Inspection Findings

`dispatchAppointmentValidators.js` defines:

- `appointmentStatus`: `scheduled`, `rescheduled`, `cancelled`, `completed`, `no_show`,
- `visitResult`: `completed`, `pending_parts`, `pending_quote`, `need_second_visit`, `customer_not_home`, `customer_cancelled`, `unable_to_repair`, `rescheduled`, `no_show`.

`migrations/006_create_dispatch_appointment_tables.sql` created `appointment_status` with a check constraint for the appointment status values.

`migrations/018_add_visit_result_fields_to_appointments.sql` added nullable visit-layer fields:

- `visit_sequence`,
- `visit_result`,
- `incomplete_reason`,
- `next_action`,
- `actual_arrival_at`,
- `actual_finished_at`.

Migration018 also added indexes for `visit_sequence`, `visit_result`, and `next_action`, but it did not add a DB-level consistency constraint between `appointment_status` and `visit_result`.

`AppointmentRepository.updateAppointment()` performs partial updates with `coalesce()`, so the service layer must validate the resulting state before repository mutation.

`AppointmentService.isAppointmentOpen()` treats an appointment as not open when either:

- `appointment_status` is terminal (`cancelled`, `completed`, `no_show`), or
- `visit_result` is terminal.

`AppointmentRepository.findEligibleFinalAppointmentForCase()` only treats `visit_result = 'completed'` as eligible for final appointment inference.

`smoke:029` previously had a status-only completed fixture. Task345 updated it so new smoke coverage no longer depends on creating a completed appointment without `visitResult = completed`.

## Legacy Inconsistent Row Definition

A legacy status-only completed appointment means a row such as:

- `appointment_status = completed`
- and `visit_result IS NULL`

or:

- `appointment_status = completed`
- and `visit_result != completed`

These rows may have been created before Task345's service-layer consistency guard, through older runtime behavior, seed/test data, historical import, direct database operations, or a future correction path that has not yet been designed.

Task346 does not assert such rows exist in any environment. It only defines the boundary if they exist.

## Runtime Impact After Task345

For new writes, Task345 rejects inconsistent completed appointment transitions before repository mutation and before side effects.

If a legacy inconsistent row already exists:

- normal update paths may reject attempts to edit it if the resulting state remains inconsistent,
- status-only completed rows remain terminal for one-open-appointment checks because `appointment_status = completed` is terminal,
- Field Service Report final appointment inference ignores them because `visit_result` is not `completed`,
- they may appear in appointment history as completed by status while not qualifying as formal final service completion.

No automatic correction is performed.

## Downstream Impact

### Field Service Report Final Appointment Inference

Final appointment inference uses `visit_result = completed`, so status-only completed rows are not eligible.

This is correct for formal completion semantics but may surprise operators if old appointment history displays status completed without a completed visit result.

### One-open Appointment Guard

The one-open guard treats status-only completed rows as terminal because `appointment_status = completed` is terminal.

That means a new appointment may be allowed after a status-only completed appointment, even though the row is not eligible for `finalAppointmentId`.

### Appointment Reschedule / Update

Task345 prevents reopening or editing a completed appointment into a status / result mismatch through normal update paths.

Historical inconsistent rows may need a dedicated correction flow rather than normal update.

### Customer-facing Report

Customer-facing service summaries should not rely on status-only completed rows as proof of final visit completion.

If historical rows are shown to customers, the customer-visible report layer should use a safe summary and avoid exposing internal correction details.

### Survey Eligibility

Post-completion survey logic should not treat status-only completed appointments as eligible final appointment context.

Survey eligibility should use the completed Field Service Report's resolved `finalAppointmentId`, and that appointment should have `visit_result = completed`, except for separately approved legacy no-appointment policy.

### Billing / Settlement Future Risk

Billing, settlement, quote, customer fee approval, and reconciliation rules should not treat status-only completed rows as completed visit evidence without explicit policy.

If historical billing depends on those rows, a correction or exception review may be required before automated settlement logic uses them.

## Policy Options

### Option A - Keep Read-only Legacy Rows, No Auto-correction

Do not change historical rows automatically.

Runtime impact:

- minimal,
- current safeguards prevent new inconsistent writes,
- old rows remain visible as historical data.

Migration impact:

- none.

Risk:

- operators may see old status-only completed rows,
- downstream logic must avoid treating them as final completed visit evidence.

### Option B - Admin Correction With Reason / Audit

Create a future correction workflow that allows authorized users to correct legacy rows after review.

Potential requirements:

- explicit permission,
- correction reason,
- before / after audit,
- no silent customer-visible change,
- optional supervisor review,
- safe error and enumeration behavior,
- report of affected downstream records.

Runtime impact:

- requires new service / API / UI design.

Migration impact:

- not necessarily required, unless structured correction metadata is added.

Risk:

- safer than auto-correction,
- requires workflow design before implementation.

### Option C - Dry-run Backfill Proposal, No Apply

Create a future read-only profiling and dry-run report.

The dry-run could count and classify legacy rows by:

- organization,
- Case,
- appointment status,
- visit result,
- finalAppointmentId usage,
- Field Service Report completion state,
- downstream billing / survey / customer report references.

Runtime impact:

- none if dry-run is read-only.

Migration impact:

- none until explicitly approved.

Risk:

- useful for understanding blast radius before any correction.

### Option D - Full Migration / Backfill

Automatically update historical rows, for example setting `visit_result = completed` where `appointment_status = completed`.

Runtime impact:

- can change downstream semantics,
- may make old appointments eligible for final appointment inference if report completion is rerun or future logic reads them.

Migration impact:

- requires explicit DB / migration approval,
- requires local dry-run and shared runtime approval before any production-like apply.

Risk:

- highest risk,
- must not happen without data profiling, policy approval, rollback plan, audit plan, and customer-visible impact review.

## Recommended Current Decision

No runtime change now.

Do not auto-correct historical appointment rows.

Future correction requires:

- data profiling,
- dry-run report,
- explicit DB / migration approval if data will be changed,
- permission / audit design,
- customer-visible impact review,
- finalAppointmentId impact review,
- survey, billing, settlement, and reporting impact review.

Task345 is sufficient to prevent new inconsistent normal writes. Task346 keeps historical correction as a separate policy and operational safety question.

## Future Task Candidates

Potential follow-up tasks:

- legacy status-only completed appointment profiling plan,
- read-only dry-run SQL design with redacted output policy,
- admin correction workflow design,
- correction permission and audit event catalog,
- customer-visible report impact review,
- survey eligibility impact review,
- billing / settlement legacy appointment evidence policy,
- migration / backfill authorization packet, if product chooses Option D.

## Explicit Non-goals

Task346 does not:

- query any database,
- profile or list real rows,
- run a correction script,
- update historical appointments,
- add migration / schema / index,
- change validators or services,
- change smoke tests,
- change Field Service Report completion logic,
- change `finalAppointmentId` inference,
- change one-open-appointment guard,
- add correction UI,
- add supervisor override runtime,
- add billing / survey / customer-facing behavior,
- add AI decisions.

## Guardrails Checklist

- One Case = one formal Field Service Report: preserved.
- Multiple appointments / visits per Case: preserved.
- Normal final appointment eligibility still requires `visit_result = completed`.
- Task345 prevents new inconsistent completed appointment writes.
- Legacy row correction remains future-only and explicitly governed.
- No destructive cleanup: preserved.
- No migration / schema / index change: preserved.
- No shared DB / production / Zeabur access: preserved.
- No sensitive output: preserved.
- No AI auto decision: preserved.
- Inventory docs remain frozen: preserved.

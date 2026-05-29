# Task2085 - Customer Access Case Overview Identifier Fields Approved Source Contract

## Scope

- Customer Access case overview response boundary only.
- No DB, no migration, no new route, no route mount, no smoke, no listener, no provider, no admin, no AI/RAG, no billing, no package changes.
- The 7 held historical docs remain untracked and untouched.

## Runtime Boundary

- Final case overview response keys remain:
  - top-level: `status`, `messageKey`, `customerVisible`, `data`
  - `data`: `serviceReport`
  - `serviceReport`: `caseNo`, `finalAppointmentId`, `publicReportId`, `status`, `summary`
- Customer-visible `serviceReport.caseNo` is sourced only from explicit source field `caseNo`.
- Customer-visible `serviceReport.finalAppointmentId` is sourced only from explicit source field `finalAppointmentId`.
- Customer-visible `serviceReport.publicReportId` is sourced only from explicit source field `publicReportId`.

## No-Fallback Behavior

If an approved identifier source field is absent or invalid, that output field is omitted. The controller does not fall back to route params, customer access context, raw row/container data, customer/organization/LINE identifiers, phone/address raw fields, or aliases such as `caseId`, `case_id`, `id`, `rawCaseNo`, `internalCaseNo`, `caseReference`, `customerCaseId`, `appointmentId`, `appointment_id`, `internalAppointmentId`, `final_appointment_id`, `visitId`, `engineerVisitId`, `reportId`, `report_id`, `public_report_id`, `customerReportReference`, `internalReportId`, or `privateReportId`.

Unsafe approved values are omitted without leaking raw values. This includes object, array, `Error`, `Date`, Buffer-like, thenable, function, class instance, SQL-looking string, token/header-looking string, and stack-like string values.

## Verification

- Targeted Customer Access controller/static/mounted route tests cover the approved-source/no-fallback behavior.
- `git diff --check` remains required before commit.

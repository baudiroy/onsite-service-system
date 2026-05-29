# Task2084 - Customer Access Case Overview Status/Summary Approved Source Contract

## Scope

- Customer Access case overview response boundary only.
- No DB, no migration, no new route, no route mount, no smoke, no listener, no provider, no admin, no AI/RAG, no billing, no package changes.
- The 7 held historical docs remain untracked and untouched.

## Runtime Boundary

- Final case overview response keys remain:
  - top-level: `status`, `messageKey`, `customerVisible`, `data`
  - `data`: `serviceReport`
  - `serviceReport`: `caseNo`, `finalAppointmentId`, `publicReportId`, `status`, `summary`
- Customer-visible `serviceReport.status` is sourced only from the explicit `status` source field.
- Customer-visible `serviceReport.summary` is sourced only from the explicit `summary` source field.
- Raw/internal/fallback fields are never used to fill customer-visible status or summary.

## No-Fallback Behavior

If the approved `status` or `summary` source field is absent or invalid, that output field is omitted. The controller does not fall back to raw/internal fields such as `rawStatus`, `internalStatus`, `workflowStatus`, `appointmentStatus`, `caseStatus`, `completionStatus`, `repairStatus`, `rawSummary`, `serviceSummary`, `service_summary`, `approved_service_summary`, AI draft/generated summary fields, notes, provider payloads, raw payloads, or debug fields.

Unsafe approved values are omitted without leaking raw values. This includes object, array, `Error`, `Date`, Buffer-like, thenable, function, class instance, SQL-looking string, token/header-looking string, and stack-like string values.

## Verification

- Targeted Customer Access controller/static/mounted route tests cover the approved-source/no-fallback behavior.
- `git diff --check` remains required before commit.

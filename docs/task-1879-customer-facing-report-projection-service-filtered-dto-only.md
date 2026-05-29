# Task1879 Customer-facing Report Projection Service / Filtered DTO Only

## Scope

Task1879 hardens the existing customer-facing service report projection service as a filtered DTO boundary.

The projection remains a customer-visible publication view only. It does not create, approve, publish, or mutate a Completion Report / Field Service Report, and it does not mutate `finalAppointmentId`.

## Files changed

- `tests/customerAccess/customerServiceReportProjectionService.unit.test.js`
- `docs/task-1879-customer-facing-report-projection-service-filtered-dto-only.md`

## Existing implementation confirmed

- `src/customerAccess/customerServiceReportProjectionService.js` uses an injected `dbClient` only.
- The service builds a parameterized read-only query spec.
- Missing DB client, missing access context, denied context, mismatched scope, not found rows, and query errors all return a generic safe-deny envelope.
- The allow path returns only the normalized `data.serviceReport` DTO.
- Raw DB rows are not returned.

## Filtered DTO contract

Allowed customer-facing report fields remain:

- `customerReportReference`
- `caseReference`
- `serviceStatus`
- `appointmentWindow`
- `engineerDisplayName`
- `serviceSummary`
- `completionTime`
- `publicAttachments`

The Task1879 test hardening verifies that the DTO does not expose:

- raw Case rows or payloads
- raw Appointment rows
- raw Completion Report / FSR internals
- `finalAppointmentId`
- internal notes or technician-private notes
- assignment internals
- audit internals
- provider payloads
- raw phone or raw address
- billing internals
- organization-internal fields

## Safety boundaries

- No real DB connection.
- No `DATABASE_URL` usage.
- No global pool construction.
- No migration.
- No seed.
- No runtime server start.
- No public/customer-visible smoke.
- No provider, AI/RAG, or billing execution.
- No Completion Report / FSR creation, approval, publication, or mutation.
- No `finalAppointmentId` mutation.
- No admin frontend changes.
- No Zeabur changes.

## Verification expectation

Run the customer access projection tests and available project check. If `npm` is unavailable in the shell, use the bundled Node runtime for the equivalent targeted test and syntax/static checks, and report that clearly.

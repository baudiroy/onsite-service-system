# Task 314 - finalAppointmentId Backend-owned Inference Readiness Detail / No Runtime Change

## Scope And Non-goals

This document follows Task311 through Task313 and creates a docs-only implementation readiness detail packet for the third core MVP candidate: `finalAppointmentId` backend-owned inference hardening.

Task314 does not approve implementation. It documents the ownership, override, appointment eligibility, concurrency, API, schema, test, permission, and audit questions that must be reviewed before any `finalAppointmentId` runtime work is considered.

This task is not:

- backend runtime,
- Admin runtime,
- API contract change,
- migration,
- schema change,
- index change,
- DB / DDL execution,
- `finalAppointmentId` runtime change,
- appointment runtime change,
- Case runtime change,
- Field Service Report runtime change,
- admin override runtime,
- permission runtime,
- audit runtime,
- AI / RAG runtime,
- provider sending,
- notification runtime,
- survey runtime,
- complaint runtime,
- billing / settlement runtime,
- test / smoke implementation,
- fixture change,
- package change.

Task314 does not modify backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, migrations, schema, indexes, smoke scripts, fixtures, package configuration, provider integrations, AI runtime, inventory documentation, or shared runtime data.

## Why This Follows Task313

Task313 documented Field Service Report completion hardening. `finalAppointmentId` is a key part of completion stability because it identifies which completed appointment / visit is the final service context for the Case-level formal Field Service Report.

This topic follows Task313 because completion hardening cannot stay safe unless `finalAppointmentId` remains:

- backend/system-owned,
- based on an eligible completed appointment,
- stable after formal completion,
- protected from silent client or UI override,
- scoped to the same Case and organization,
- separated from AI or operator guesswork.

Task314 keeps this as a future-only readiness packet and does not change the current runtime.

## Core finalAppointmentId Invariants To Protect

Future implementation must preserve these invariants:

1. `finalAppointmentId` must be backend/system-owned.
2. Engineer users must not manually select `finalAppointmentId`.
3. Admin UI must not send `finalAppointmentId` by default.
4. Manual selection may only be a future admin override with explicit permission, audit, reason, and guardrails.
5. `finalAppointmentId` should be inferred from the final completed appointment.
6. Pending, waiting, quote-needed, customer-not-available, cancelled, no-show, or incomplete appointment outcomes must not become the final completed appointment.
7. Appointment status alone must not qualify an appointment as final if the visit result is not completed.
8. `finalAppointmentId` should remain stable after formal completion unless an explicit future override workflow is approved.
9. One Case = one formal Field Service Report.
10. One Case may have multiple appointments / dispatch visits.
11. `finalAppointmentId` must point to an appointment from the same Case.
12. `finalAppointmentId` must point to an appointment from the same organization scope.
13. AI must not decide or override `finalAppointmentId`.

## Current Readiness Questions / Docs-only

Before any future `finalAppointmentId` hardening runtime task is approved, PM and engineering should answer the following questions.

### Service / Repository / API Paths That Could Influence finalAppointmentId

Future review would likely include, but is not approved to modify in Task314:

- Field Service Report completion service logic.
- finalAppointmentId resolution helper logic.
- Appointment repository lookup by Case and visit result.
- Field Service Report repository update logic.
- Appointment update / visit outcome update paths.
- Admin completion API client and completion handler.
- Direct API completion request contract.
- Browser smoke and backend smoke coverage for completion and final marker display.

Any future implementation task must include an explicit allowed file / layer list before editing.

### API Contracts That Must Forbid Client Authority By Default

Future API contract review should confirm:

- Admin completion should omit `finalAppointmentId` by default.
- Engineer completion flows should not send or select `finalAppointmentId`.
- Direct API clients should not be treated as authority for final appointment selection.
- If compatibility continues accepting a supplied value before completion, the backend must strictly validate it.
- Supplied values must never override a completed report.
- Explicit null must not clear an existing completed report's `finalAppointmentId`.
- Response data may include the resolved `finalAppointmentId`, but the request payload should not become the source of truth.

Task314 does not change any API contract.

### Future Admin Override Questions

If a future manual override is ever allowed, it must be a separate explicit workflow, not the default completion path.

Questions:

- Which role can request an override?
- Which permission is required?
- Is supervisor approval required?
- What reason must be recorded?
- What audit event is required?
- Can an override happen after report completion, or only before a correction workflow?
- Does an override require preserving the previous value?
- How is the customer-visible completion summary protected from internal correction details?
- How does the system prevent override from becoming a silent picker?

Task314 does not approve any admin override runtime.

### Appointment Outcome Eligibility

Future implementation must define an eligible final completed appointment using deterministic business rules.

Candidate eligibility rules:

- appointment belongs to the same Case,
- appointment belongs to the same organization scope,
- visit result is completed,
- appointment is not deleted or inactive, if such flags exist,
- appointment has not been cancelled, no-show, pending parts, pending quote, customer-not-available, needs follow-up, or otherwise incomplete,
- appointment status alone is not enough if visit result is missing or not completed.

Future implementation should also define deterministic ordering for multiple eligible completed appointments and must not rely on DB natural order.

Task314 does not modify inference ordering.

### Concurrency Questions

Future implementation should evaluate:

- What happens if appointment visit result is updated while Field Service Report completion is running?
- What happens if two completion requests attempt to infer `finalAppointmentId` at the same time?
- Should completion lock the report row, the Case row, the appointment rows, or use a conditional update?
- Should the final eligible appointment be selected inside the same transaction as report completion?
- How should the system handle a completed appointment inserted after a report is already completed?
- How should repeat completion preserve the original `finalAppointmentId`?

Task314 does not approve locking, transaction, DB, or repository changes.

### Future Smoke / Regression Tests

Future runtime work should include targeted tests or smoke coverage for:

- completion without supplied `finalAppointmentId` infers the eligible completed appointment,
- multiple completed appointments choose the deterministic final appointment,
- pending / quote-needed / customer-not-available / no-show / cancelled appointments are not eligible,
- appointment status completed without completed visit result is not eligible,
- supplied same-Case completed appointment is accepted only if compatibility is preserved,
- supplied cross-Case appointment is rejected,
- supplied cross-organization appointment is rejected,
- completed report cannot have `finalAppointmentId` overwritten,
- explicit null cannot clear completed report `finalAppointmentId`,
- Admin completion request omits `finalAppointmentId`,
- Engineer flow has no final appointment picker,
- future override workflow, if ever approved, requires permission, reason, and audit.

Task314 does not add or modify tests.

## Future-only Implementation Gate Checklist

Any future `finalAppointmentId` hardening runtime task must include explicit approval for:

1. PM approval.
2. Allowed file / layer list.
3. API contract approval.
4. Migration / schema / index approval, if needed.
5. DB / DDL approval, if needed.
6. Transaction / concurrency design approval.
7. Admin override permission and audit approval, if override is considered.
8. Test / smoke approval.
9. Rollback / safety plan.
10. Organization isolation review.
11. Data Access Control review.
12. Customer-visible / internal-only data review.
13. No AI auto-decision confirmation.
14. No provider sending confirmation.
15. No inventory docs expansion confirmation.

General statements such as "continue", "go ahead", "do next task", or "make progress" are not enough to approve runtime, DB, migration, provider sending, AI, permission, audit, or test changes.

## Risk Matrix / Future-only

`Runtime approved now` is `No` for every row.

| Risk | Affected invariant | Possible future mitigation | Requires schema/index? | Requires API change? | Requires test/smoke? | Requires permission/audit? | Runtime approved now? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Client supplies `finalAppointmentId` and is treated as authority. | finalAppointmentId must be backend/system-owned. | Keep backend validation and prefer omitted request payload; do not trust client selection. | Future-only no / maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| Admin UI silently sends `finalAppointmentId`. | Admin must not send finalAppointmentId by default. | Keep completion payload omitted; use response/resolved report data for display. | Future-only no | Future-only maybe | Future-only yes | Future-only maybe | No |
| Engineer selects `finalAppointmentId`. | Engineer must not manually select finalAppointmentId. | Do not expose picker in Engineer Mobile or engineer web flows. | Future-only no | Future-only maybe | Future-only yes | Future-only yes | No |
| Pending appointment becomes `finalAppointmentId`. | Final appointment must be an eligible completed visit. | Eligibility must require completed visit result, not merely appointment status. | Future-only no / maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| Quote-needed appointment becomes `finalAppointmentId`. | Pending quote is not a final completed appointment. | Exclude quote-needed / pending quote outcomes from eligibility. | Future-only no / maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| Customer-not-available appointment becomes `finalAppointmentId`. | Customer-not-available outcome belongs to visit layer, not final completion. | Exclude no-show / customer-not-available outcomes from final eligibility. | Future-only no / maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| Race between appointment update and Field Service Report completion. | finalAppointmentId must be stable and based on correct eligible appointment. | Review transaction boundary, locking, or conditional update in a future task. | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| Override changes completed report without audit. | Completed finalAppointmentId must remain stable unless explicit override workflow is approved. | If override is ever allowed, require permission, reason, audit, and preserved previous value. | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| finalAppointmentId points to appointment from another organization. | Organization isolation. | Validate organization scope in service/repository/API and add cross-scope tests. | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| finalAppointmentId points to appointment from another Case. | finalAppointmentId must belong to the same Case. | Validate same Case before completion and before any future override. | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| AI suggestion chooses finalAppointmentId. | No AI auto-decision. | Keep AI advisory only; do not let AI select official final appointment. | Future-only no | Future-only maybe | Future-only yes | Future-only yes | No |

## Runtime Forbidden Confirmation

Task314 explicitly does not approve:

- backend runtime,
- Admin runtime,
- API changes,
- migration changes,
- schema changes,
- index changes,
- DB connection,
- DDL,
- `psql`,
- `db:migrate`,
- Migration 020 dry-run,
- Migration 020 apply,
- tests,
- smoke scripts,
- fixtures,
- package changes,
- `finalAppointmentId` runtime changes,
- appointment runtime changes,
- Case runtime changes,
- Field Service Report runtime changes,
- admin override runtime,
- permission runtime,
- audit runtime,
- AI / RAG runtime,
- provider sending,
- notification runtime,
- survey runtime,
- complaint runtime,
- billing runtime,
- settlement runtime,
- inventory documentation changes.

## Conclusion

Task314 is a docs-only `finalAppointmentId` backend-owned inference readiness detail packet.

It does not approve `finalAppointmentId` runtime implementation.

Future implementation may use this packet to prepare a tightly scoped task, but the future task must still obtain explicit approval for allowed files, API contracts, schema or index changes, DB / DDL, transaction and concurrency design, override policy, permission and audit boundaries, tests, Data Access, rollback, safety, and sensitive data boundaries before any runtime work begins.

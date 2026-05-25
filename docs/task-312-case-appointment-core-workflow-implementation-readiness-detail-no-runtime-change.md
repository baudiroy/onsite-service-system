# Task 312 - Case / Appointment Core Workflow Implementation Readiness Detail / No Runtime Change

## Scope And Non-goals

This document follows Task311 and creates a docs-only implementation readiness detail packet for the first MVP candidate: Case / Appointment core workflow hardening.

Task312 does not approve implementation. It is a planning packet for future PM, product, and engineering review before any runtime change is considered.

This task is not:

- backend runtime,
- Admin runtime,
- API contract change,
- migration,
- schema change,
- index change,
- DB / DDL execution,
- appointment runtime change,
- Case runtime change,
- Field Service Report runtime change,
- finalAppointmentId runtime change,
- AI / RAG runtime,
- provider sending,
- notification runtime,
- survey runtime,
- complaint runtime,
- billing / settlement runtime,
- test / smoke implementation,
- fixture change,
- package change.

Task312 does not modify backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, migrations, schema, indexes, smoke scripts, fixtures, package configuration, provider integrations, AI runtime, inventory documentation, or shared runtime data.

## Why This Candidate Comes First After Task311

Task311 listed multiple MVP implementation candidates. Case / Appointment core workflow hardening is the safest first implementation readiness candidate because it protects the platform's central service workflow before customer-facing, AI-assisted, report/export, notification, survey, billing, or mobile runtime is added.

The Case / Appointment layer is the foundation for:

- customer service intake,
- dispatch scheduling,
- field engineer visits,
- multi-visit history,
- Field Service Report completion,
- finalAppointmentId stability,
- future customer-visible service summaries,
- future survey trigger context,
- future billing / settlement evidence,
- future audit and evidence traceability,
- future Engineer Mobile workflows.

If the core Case / Appointment workflow is ambiguous, later features could accidentally create duplicate open visits, close a Case from the wrong event, produce duplicate formal reports, or expose appointment data outside the authorized organization scope.

Task312 therefore documents what must be protected before runtime is approved.

## Core Invariants To Protect

Future implementation must preserve these invariants:

1. One Case = one formal Field Service Report.
2. One Case may have multiple appointments / dispatch visits.
3. One Case must not have multiple open appointments at the same time.
4. A new appointment should only be created after the previous appointment has a clear terminal outcome.
5. Abnormal and multi-visit results belong to the appointment / visit layer.
6. Customer not available, pending parts, pending quote, cancelled, no show, unable to repair, and revisit outcomes must not create duplicate formal Field Service Reports.
7. Case status must not be mutated by survey, complaint, AI, billing, notification, provider sending, or analytics side effects.
8. Field Service Report remains the Case-level formal completion summary, not one report per appointment.
9. `finalAppointmentId` remains backend/system-owned.
10. `finalAppointmentId` must not become a default operator picker.
11. Completion, cancellation, reschedule, revisit, and multi-dispatch flows must preserve organization isolation.
12. Engineer-visible and customer-visible appointment data must follow Data Access Control and field-level masking policies.

## Current Readiness Questions / Docs-only

Before any future implementation task is approved, PM and engineering should answer the following questions.

### Runtime Files Likely Needing Review

Future runtime work would likely require review of, but is not approved to modify in Task312:

- Case service and repository files.
- Appointment service and repository files.
- Field Service Report service and repository files.
- Dispatch / multi-dispatch service files.
- Appointment validators and route contracts.
- Case status transition logic.
- Field Service Report completion logic.
- finalAppointmentId resolution logic.
- Admin Case detail and appointment timeline UI.
- Engineer Mobile future workflow surfaces.
- Browser smoke and backend smoke scripts that cover appointment lifecycle.

Any future task must provide an explicit allowed file / layer list before editing.

### API Contracts Requiring Explicit Approval

Future implementation may need explicit API contract review for:

- create appointment,
- update appointment,
- cancel appointment,
- reschedule appointment,
- complete appointment / visit outcome update,
- multi-dispatch create or update,
- Case status transition,
- Field Service Report completion,
- appointment timeline retrieval,
- customer-visible appointment summary,
- Engineer Mobile appointment result submission.

No endpoint path, request payload, response payload, status code, or error behavior is approved by Task312.

### Schema Or Constraint Questions

Future implementation must decide whether any schema or DB-level constraint is needed. Task312 does not approve schema changes.

Questions:

- Should the one-open-appointment invariant remain service-level, or eventually become DB-level with a partial unique constraint or equivalent concurrency guard?
- What statuses count as open appointments?
- Which statuses count as terminal appointment outcomes?
- Should appointment outcome and appointment status stay separate concepts?
- Should additional visit outcome values be needed, or are existing values enough?
- Is any index needed for safe appointment lookup by `case_id`, status, and organization scope?
- Should cross-organization appointment access be protected only in service logic or with additional DB constraints?
- How should legacy Case records with no appointments remain compatible?

Any DB / DDL / migration / index work requires separate explicit approval.

### Smoke / Regression Tests Needed If Future Implementation Is Approved

Future runtime work should include targeted tests or smoke coverage for:

- creating the first open appointment for a Case,
- rejecting a second open appointment for the same Case,
- allowing a new appointment after the previous one has a terminal outcome,
- reschedule preserving the one-open-appointment invariant,
- cancel then create a new appointment,
- pending parts then create a follow-up appointment,
- pending quote does not close the Case,
- no show does not close the Case unless an explicit business rule later approves it,
- abnormal visit outcome remains appointment-layer data,
- Field Service Report remains one formal report per Case,
- finalAppointmentId remains backend/system-owned,
- cross-organization appointment access rejected,
- customer-visible appointment summary excludes internal data,
- engineer-visible appointment data is scoped to assigned or authorized work.

Task312 does not add or modify tests.

### Data Access / Audit / Usage Checks Needed

Future implementation should confirm:

- all appointment reads and writes apply organization scope,
- engineer access is limited to assigned or authorized appointments,
- customer-visible appointment data uses customer visible data policy,
- internal appointment notes are not exposed to customer channels,
- report/export/download/scheduled reports do not bypass appointment data permissions,
- AI/RAG retrieval cannot fetch unauthorized appointment or Case data,
- key appointment state changes can be audited,
- future SaaS usage tracking is considered where customer self-service, notifications, reports, AI, or provider usage are involved.

Task312 does not implement permission, audit, or usage runtime.

## Future-only Implementation Gate Checklist

Any future runtime task must include explicit approval for:

1. PM approval.
2. Allowed file / layer list.
3. API contract approval.
4. Migration / schema approval, if needed.
5. DB / DDL approval, if needed.
6. Test / smoke approval.
7. Rollback / safety plan.
8. Organization isolation review.
9. Data Access Control review.
10. Audit readiness review.
11. Field-level masking review, if data is customer-visible or exportable.
12. No provider sending confirmation.
13. No AI auto-decision confirmation.
14. No inventory docs expansion confirmation.

General statements such as "continue", "go ahead", "do next task", or "make progress" are not enough to approve runtime, DB, migration, provider sending, AI, or test changes.

## Risk Matrix / Future-only

`Runtime approved now` is `No` for every row.

| Risk | Affected invariant | Possible future mitigation | Requires schema? | Requires API change? | Requires test/smoke? | Requires audit? | Runtime approved now? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Duplicate open appointments for the same Case. | No multiple open appointments per Case. | Define open status set, add service guard, consider DB concurrency guard in a separate approved task. | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| Appointment outcome incorrectly closes the Case. | Case status must not be mutated by visit outcomes alone. | Keep Case completion tied to Field Service Report completion or explicit approved transition. | Future-only no / maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| Abnormal visit creates a duplicate formal Field Service Report. | One Case = one formal Field Service Report. | Keep abnormal results on appointment / visit layer; preserve report uniqueness invariant. | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| `finalAppointmentId` manually overridden by a non-admin path. | finalAppointmentId remains backend/system-owned. | Keep system resolution as source of truth; any future correction flow must be explicit, audited, and not default UI. | Future-only no / maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Survey, complaint, billing, notification, or provider side effect mutates Case status. | Side effects must not drive Case completion. | Keep side effects downstream of approved Case / Report transition; do not let provider or AI callbacks mutate core status. | Future-only no | Future-only maybe | Future-only yes | Future-only yes | No |
| Cross-organization appointment access. | Organization isolation and Data Access Control. | Enforce organization scope in service/repository/API; add tests for cross-scope denial. | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| Engineer-visible overexposure. | Engineer sees only assigned or authorized work. | Apply engineer assignment scope, field-level masking, and internal-only data exclusion. | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Customer-visible appointment summary leaks internal data. | Customer visible data policy. | Use allow-listed customer-visible fields and safe-deny behavior for unavailable data. | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Reschedule creates two active visits. | New appointment only after prior clear terminal outcome or approved reschedule transition. | Model reschedule as a state transition with clear cancellation / replacement semantics. | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| AI suggestion changes appointment or Case status. | No AI auto-decision. | Keep AI as suggestion only; require deterministic rule or human confirmation for official status writes. | Future-only no | Future-only maybe | Future-only yes | Future-only yes | No |

## Runtime Forbidden Confirmation

Task312 explicitly does not approve:

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
- appointment runtime changes,
- Case runtime changes,
- Field Service Report runtime changes,
- finalAppointmentId runtime changes,
- AI / RAG runtime,
- provider sending,
- notification runtime,
- survey runtime,
- complaint runtime,
- billing runtime,
- settlement runtime,
- inventory documentation changes.

## Conclusion

Task312 is a docs-only implementation readiness detail packet.

It does not approve Case / Appointment runtime implementation.

Future implementation may use this packet to prepare a tightly scoped task, but the future task must still obtain explicit approval for allowed files, API contracts, schema or migration changes, DB / DDL, tests, Data Access, audit, rollback, safety, and sensitive data boundaries before any runtime work begins.

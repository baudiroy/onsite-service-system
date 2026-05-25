# Task 315 - One-open-appointment Invariant Hardening Readiness Detail / No Runtime Change

## Scope And Non-goals

This document follows Task311 through Task314 and creates a docs-only implementation readiness detail packet for the fourth core MVP candidate: one-open-appointment invariant hardening.

Task315 does not approve implementation. It documents the appointment state taxonomy, creation/update risks, concurrency questions, API/schema/test/security gates, and future approval requirements that must be reviewed before any appointment runtime work is considered.

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
- automatic appointment creation,
- appointment reopening runtime,
- AI / RAG runtime,
- provider sending,
- notification runtime,
- survey runtime,
- complaint runtime,
- billing / settlement runtime,
- test / smoke implementation,
- fixture change,
- package change.

Task315 does not modify backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, migrations, schema, indexes, smoke scripts, fixtures, package configuration, provider integrations, AI runtime, inventory documentation, or shared runtime data.

## Why This Follows Task314

Task314 documented `finalAppointmentId` backend-owned inference readiness. That inference is only reliable if the appointment lifecycle is clear.

One-open-appointment hardening follows Task314 because the platform must distinguish:

- a Case with multiple historical appointments,
- a Case with exactly one current open / active appointment,
- abnormal visit outcomes that require follow-up,
- terminal visit outcomes that allow a new appointment,
- final completed appointments that may later become the resolved `finalAppointmentId`.

If the one-open-appointment invariant is weak, later features may create duplicate active visits, infer the wrong final appointment, confuse dispatchers, increase engineer workload, or produce inconsistent customer-visible service status.

Task315 keeps this as a future-only readiness packet and does not change current runtime.

## Core Invariants To Protect

Future implementation must preserve these invariants:

1. One Case may have multiple appointments / dispatch visits.
2. The same Case must not have multiple open / active / unfinished appointments at the same time.
3. A new appointment should only be created after the previous appointment has a clear terminal outcome or an explicitly approved reschedule replacement transition.
4. Abnormal outcomes belong to the appointment / visit layer.
5. Second visit required does not equal new Case.
6. Waiting for parts, quote required, and customer not available must not silently create duplicate open appointments.
7. `finalAppointmentId` must be inferred only from the final completed appointment.
8. One Case = one formal Field Service Report.
9. Appointment lifecycle changes must preserve organization isolation.
10. AI must not create, reopen, or close appointments automatically.
11. Provider sending, notifications, surveys, complaints, and billing side effects must not create appointments unless a future explicit workflow approves it.

## Future-only Appointment State Classification

This classification is a readiness aid. It is not a runtime enum change and does not approve schema changes.

### Open / Active Candidate States

Candidate open / active states may include:

- pending,
- scheduled,
- assigned,
- confirmed,
- en_route,
- arrived,
- on_site,
- in_progress,
- awaiting_customer_confirmation, if used as an active scheduled visit state.

Future implementation must verify the actual current status values before relying on this list.

### Terminal / Closed Candidate States

Candidate terminal / closed states may include:

- completed,
- cancelled,
- no_show,
- customer_not_available, if the business defines it as terminal for that visit,
- unable_to_repair, if no follow-up is automatically active,
- closed.

Future implementation must define whether each terminal state allows a new appointment and whether additional review is required.

### Ambiguous / Needs-review States

Ambiguous states require explicit product and engineering review before runtime:

- pending_parts,
- waiting_for_parts,
- pending_quote,
- quote_required,
- needs_follow_up,
- reschedule_requested,
- customer_reschedule_requested,
- parts_eta_pending,
- supervisor_review_required.

These states may be terminal for the current visit but still require a later appointment. They must not silently create a second open appointment.

### Abnormal But Terminal States

Abnormal but terminal states may include:

- no_show,
- customer_not_available,
- cancelled,
- unable_to_repair,
- refused_service,
- incomplete_with_reason.

These outcomes belong to the appointment / visit layer. They do not create another formal Field Service Report.

### Abnormal And Follow-up-needed States

Abnormal and follow-up-needed states may include:

- pending_parts,
- pending_quote,
- needs_follow_up,
- revisit_required,
- additional_worker_required,
- customer_approval_needed.

Future implementation must define whether the current appointment is closed before a follow-up appointment can be created.

## Current Readiness Questions / Docs-only

Before any future one-open-appointment runtime task is approved, PM and engineering should answer the following questions.

### Appointment Creation / Update Paths Needing Review

Future review would likely include, but is not approved to modify in Task315:

- appointment create service / repository paths,
- appointment update service / repository paths,
- dispatch / multi-dispatch create paths,
- reschedule paths,
- cancel paths,
- visit outcome update paths,
- Field Service Report completion paths that reference appointments,
- Admin appointment timeline and dispatch UI,
- Engineer Mobile appointment outcome submission paths,
- direct API clients that can create or update appointments.

Any future implementation task must include an explicit allowed file / layer list before editing.

### API Contracts That Could Create Or Reopen Appointments

Future API review should identify:

- create appointment endpoint,
- reschedule endpoint,
- appointment update endpoint,
- cancel appointment endpoint,
- complete visit / outcome endpoint,
- multi-dispatch endpoint,
- reopen / follow-up endpoint if any exists or is proposed,
- Engineer Mobile result submission endpoint,
- customer channel appointment confirmation or reschedule endpoint.

Task315 does not approve endpoint path, payload, response, status code, or error behavior changes.

### Open Appointment Definition

Future implementation must define what counts as an open appointment.

Questions:

- Does scheduled count as open?
- Does assigned count as open?
- Does en_route count as open?
- Does arrived / on_site count as open?
- Does pending customer confirmation count as open?
- Does pending parts count as open or terminal-with-follow-up-needed?
- Does pending quote count as open or terminal-with-follow-up-needed?
- How are soft-deleted or disabled appointments excluded?
- How does organization scope affect open appointment lookup?

### Terminal Outcome Definition

Future implementation must define what counts as a terminal outcome.

Questions:

- Which status or visit result allows the next appointment to be created?
- Is cancelled terminal?
- Is no_show terminal?
- Is customer_not_available terminal?
- Is unable_to_repair terminal?
- Is pending_parts terminal for the visit but follow-up-needed for the Case?
- Is pending_quote terminal for the visit but follow-up-needed for the Case?
- Can terminal appointment outcomes still require supervisor review?

### Reschedule / Second Visit / Parts / Quote Classification

Future implementation should clarify:

- whether reschedule replaces the existing appointment or creates a new appointment after cancelling the old one,
- whether second visit required closes the first appointment before creating the follow-up appointment,
- whether waiting for parts keeps the existing appointment open or closes it with a follow-up-needed outcome,
- whether quote required keeps the existing appointment open or closes it with a pending quote outcome,
- whether customer-not-available is terminal or reschedule-requested,
- how the UI explains these states without increasing dispatcher or engineer burden.

### Concurrency Risks

Future implementation must evaluate:

- two dispatchers creating appointments for the same Case at the same time,
- API retry creating the same appointment twice,
- reschedule and cancel racing with create,
- appointment cancellation racing with new appointment creation,
- Engineer Mobile outcome update racing with dispatcher follow-up appointment creation,
- soft-delete or disable racing with open appointment lookup,
- cross-organization data accidentally counted in open appointment checks.

Task315 does not approve locking, transactions, repository changes, or DB work.

### Schema / Index / Constraint Questions

Future implementation should answer:

- Can service-level guard remain sufficient?
- Is a DB-level partial unique constraint feasible for open appointments?
- Which columns would define the open set?
- How would soft-delete / disabled appointments be excluded?
- Would a partial index need a stable set of status values?
- Does multi-tenant organization scope need to be part of the constraint?
- How would legacy data be handled before adding any constraint?

Any schema, index, migration, DB, or DDL work requires separate explicit approval.

### Future Smoke / Regression Tests

Future runtime work should include targeted tests or smoke coverage for:

- first open appointment creation succeeds,
- second open appointment for the same Case is rejected,
- API retry does not create duplicate open appointment,
- reschedule does not leave two open appointments,
- cancel then create new appointment succeeds,
- pending parts follow-up cannot create duplicate open appointment unless the prior visit is terminal by policy,
- quote required follow-up cannot create duplicate open appointment unless the prior visit is terminal by policy,
- customer-not-available classification follows the approved policy,
- cross-organization appointment is not counted or accessed incorrectly,
- soft-deleted / inactive appointment handling follows the approved policy,
- AI suggestion cannot create or reopen appointment,
- one Case still has one formal Field Service Report.

Task315 does not add or modify tests.

## Future-only Implementation Gate Checklist

Any future one-open-appointment hardening runtime task must include explicit approval for:

1. PM approval.
2. Allowed file / layer list.
3. API contract approval.
4. Appointment state taxonomy approval.
5. Migration / schema / index approval, if needed.
6. DB / DDL approval, if needed.
7. Transaction / concurrency design approval.
8. Test / smoke approval.
9. Rollback / safety plan.
10. Organization isolation review.
11. Data Access Control review.
12. Audit readiness review.
13. No provider sending confirmation.
14. No AI auto-decision confirmation.
15. No inventory docs expansion confirmation.

General statements such as "continue", "go ahead", "do next task", or "make progress" are not enough to approve runtime, DB, migration, provider sending, AI, or test changes.

## Risk Matrix / Future-only

`Runtime approved now` is `No` for every row.

| Risk | Affected invariant | Possible future mitigation | Requires transaction / locking? | Requires schema/index? | Requires API change? | Requires test/smoke? | Requires audit? | Runtime approved now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Duplicate open appointments created by dispatcher. | Same Case must not have multiple open appointments. | Define open set and add guarded create flow; consider DB-level guard in separate approved task. | Future-only maybe | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| Duplicate open appointments created by API retry. | Same Case must not have multiple open appointments. | Use idempotency or guarded create semantics in a future approved task. | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Reschedule creates new open appointment before old one is terminal. | New appointment only after clear terminal outcome or approved replacement transition. | Model reschedule as cancellation / replacement with one active appointment at a time. | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Second visit required creates duplicate active visit. | Multiple visits allowed, but only one open appointment. | Require prior visit outcome before follow-up appointment creation. | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Waiting for parts is incorrectly treated as terminal or open without policy. | Ambiguous states require approved classification. | Define pending_parts as terminal-with-follow-up-needed or open by explicit policy. | Future-only maybe | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| Quote required creates follow-up appointment automatically. | Quote-required state must not silently create duplicate open appointment. | Require quote approval or explicit user action before follow-up creation. | Future-only no / maybe | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Appointment cancellation races with new appointment creation. | No duplicate open appointments under concurrency. | Review transaction boundary, row lock, or conditional create in a future task. | Future-only yes | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| Cross-organization appointment is counted incorrectly. | Organization isolation. | Scope open appointment lookup by organization and Case; test cross-scope denial. | Future-only maybe | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| Deleted or soft-deleted appointment counted incorrectly. | Open appointment set must exclude inactive records if supported. | Define active/deleted filters and ensure lookup uses them. | Future-only maybe | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| AI suggestion creates or reopens appointment automatically. | No AI auto-decision. | Keep AI advisory only; require authorized user action and deterministic guards. | Future-only no | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | No |

## Runtime Forbidden Confirmation

Task315 explicitly does not approve:

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
- automatic appointment creation,
- appointment reopening,
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

Task315 is a docs-only one-open-appointment invariant hardening readiness detail packet.

It does not approve appointment runtime implementation.

Future implementation may use this packet to prepare a tightly scoped task, but the future task must still obtain explicit approval for allowed files, appointment state taxonomy, API contracts, schema or index changes, DB / DDL, transaction and concurrency design, tests, Data Access, audit, rollback, safety, and sensitive data boundaries before any runtime work begins.

# Task 291 - Engineer Mobile Appointment / Visit Outcome Boundary Matrix / No Runtime Change

## Scope And Non-goals

This document continues the Engineer Mobile / Field UX branch after Task289 and Task290.

The purpose is to define a docs-only appointment / dispatch visit outcome boundary matrix. It separates engineer field-reported visit-level outcomes from Case status, Field Service Report completion summary, finalAppointmentId inference, follow-up scheduling, quote workflow, pending parts workflow, fee consent, settlement, and supervisor review.

Task291 is documentation-only.

This task is not:

- Engineer Mobile App runtime,
- mobile web runtime,
- appointment runtime change,
- Case status runtime change,
- completion runtime change,
- Field Service Report runtime change,
- finalAppointmentId runtime change,
- quote runtime,
- customer fee consent runtime,
- billing runtime,
- settlement runtime,
- photo upload runtime,
- signature capture runtime,
- file storage runtime,
- AI classification runtime,
- AI summary runtime,
- permission runtime,
- entitlement runtime,
- usage metering runtime,
- notification/provider sending runtime,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- smoke / test implementation.

Task291 does not add tables, migrations, schema, indexes, APIs, Admin UI, mobile UI, runtime logic, audit runtime, permission runtime, entitlement runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why Appointment / Visit Outcome Boundaries Are Needed After Task290

Task290 defined minimal engineer completion input. It clarified that engineers should record field facts and simple outcomes, while the system and AI may help structure them.

The next risk is confusing a visit-level outcome with a Case-level status, formal Field Service Report, quote approval, fee consent, settlement approval, or finalAppointmentId selection.

Task291 defines outcome boundaries so future Engineer Mobile / Field UX work does not turn every field result into a formal report, a closed Case, a new Case, or a manual final appointment choice.

## Definitions

### Appointment / Dispatch Visit Outcome

Appointment / dispatch visit outcome is the result of one scheduled or attempted field visit.

It belongs to the appointment / visit layer.

### Completed Visit

Completed visit means the engineer completed the field service work for that visit.

Only an eligible completed visit can become a final completed appointment candidate.

### Incomplete Visit

Incomplete visit means the visit happened or was attempted but service was not fully completed.

It may require follow-up, quote, parts, reschedule, supervisor review, or customer communication.

### Abnormal Outcome

Abnormal outcome is a visit outcome outside normal completion.

Examples include customer not available, waiting for parts, quote required, cancellation, unable to repair, safety issue, wrong address, access issue, or second visit required.

### Customer Not Available

Customer not available means the engineer could not perform service because the customer was not present, unreachable, or unable to provide access.

It is a visit outcome, not automatically repair failure.

### Waiting For Parts

Waiting for parts means service could not be completed because required parts or materials are unavailable.

It is not automatically engineer fault and should not be treated as formal completion.

### Quote Required

Quote required means the visit produced a need for quotation before work can continue.

It is not customer fee consent and not quote approval.

### Second Visit Required

Second visit required means another appointment may be needed after a clear outcome on the current visit.

It is not a new Case.

### Cancelled Visit

Cancelled visit means the appointment was cancelled before or during the visit according to future workflow rules.

It must not be treated as completed service.

### Unable To Repair

Unable to repair means the engineer determined service cannot be completed under current conditions.

It may require supervisor review or customer communication, but it is not automatically a formal Case completion.

### Final Completed Appointment

Final completed appointment is the completed visit selected by backend/system completion logic as the final service completion context for the Case-level Field Service Report.

### System-inferred finalAppointmentId

System-inferred `finalAppointmentId` is the backend/system-resolved final completed appointment id.

Engineers should not manually choose it.

## Boundary Principles

- One Case can have multiple appointments / dispatch visits.
- One Case can have only one formal Field Service Report.
- Multiple visits and abnormal outcomes belong to the appointment / visit layer.
- Appointment outcome is not Field Service Report.
- Abnormal outcome is not Case closure.
- Customer not available is not repair failure.
- Waiting for parts is not engineer incomplete responsibility by default.
- Quote required is not customer fee consent.
- Quote required is not quote approval.
- Second visit required is not a new Case.
- Cancelled visit is not completed service.
- Engineer must not manually choose `finalAppointmentId`.
- `finalAppointmentId` should be inferred by backend/system from the final completed appointment.
- Manual `finalAppointmentId` override, if ever needed, must be a future controlled admin correction flow.
- Customer fee consent, quote approval, settlement approval, and finance approval must not be mixed into visit outcome.
- AI may suggest classification but may not decide official status.

## Future-only Outcome Matrix

This matrix is intentionally conservative. It describes future outcome guidance only.

| Outcome | Belongs to Appointment / Visit layer? | May affect Case status? | May affect Field Service Report? | May become final completed appointment candidate? | Requires follow-up appointment? | Requires quote workflow? | Requires customer fee consent? | Requires supervisor review? | Customer-visible? | Internal-only? | AI may suggest classification? | AI may decide? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Arrived / on-site | Yes | Maybe, as operational progress. | No by itself. | No | No | No | No | No | Maybe | Maybe | No | No | No |
| Work completed | Yes | Yes, after completion validation. | Yes, as final summary source. | Yes | No | No by default | Maybe, if fee involved. | No by default | Yes, after review | Maybe | Yes | No | No |
| Partial work completed | Yes | Maybe | Maybe, as history/context. | No by default | Maybe | Maybe | Maybe | Maybe | Maybe | Maybe | Yes | No | No |
| Customer not available | Yes | Maybe, as follow-up needed. | Maybe, as visit history only. | No | Maybe | No | No | Maybe, if repeated. | Maybe | Maybe | Yes | No | No |
| Waiting for parts | Yes | Maybe, as pending parts. | Maybe, as visit history only. | No | Yes, when parts ready. | No by default | No by default | Maybe | Maybe | Maybe | Yes | No | No |
| Quote required | Yes | Maybe, as pending quote. | Maybe, as visit history only. | No | Maybe, after quote approval. | Yes | Not by itself; consent happens in quote/approval workflow. | Maybe | Maybe | Maybe | Yes | No | No |
| Customer declined service | Yes | Maybe | Maybe, as visit history only. | No | No by default | No | Maybe, if fee/decline record needed. | Maybe | Maybe | Maybe | Yes | No | No |
| Cancelled before arrival | Yes | Maybe | No by itself. | No | Maybe, if reschedule. | No | No | No by default | Maybe | Maybe | No | No | No |
| Cancelled on-site | Yes | Maybe | Maybe, as visit history only. | No | Maybe | No by default | Maybe, if fee involved. | Maybe | Maybe | Maybe | Yes | No | No |
| Unable to repair | Yes | Maybe | Maybe, as visit history and final report context if Case is closed through proper review. | No by default | Maybe | Maybe | Maybe | Yes, often. | Maybe | Maybe | Yes | No | No |
| Second visit required | Yes | Maybe | Maybe, as visit history only. | No | Yes | Maybe | Maybe | Maybe | Maybe | Maybe | Yes | No | No |
| Safety issue prevents service | Yes | Maybe | Maybe, as visit history only. | No | Maybe | No by default | No by default | Yes | Maybe | Maybe | Yes | No | No |
| Wrong address / access issue | Yes | Maybe | Maybe, as visit history only. | No | Maybe | No | No | Maybe | Maybe | Maybe | Yes | No | No |
| Customer requests reschedule | Yes | Maybe | No by itself. | No | Yes | No | No | No by default | Maybe | Maybe | Yes | No | No |

## Anti-confusion Rules

- Appointment abnormal outcome must not create a second formal Field Service Report.
- Pending / waiting / quote-needed outcome must not be treated as formal completion.
- Second visit should be represented as a new appointment only after the previous appointment has a clear terminal outcome.
- One Case must not have multiple open appointments at the same time.
- Customer fee consent must not be mixed into visit outcome.
- Quote approval must not be mixed into visit outcome.
- Settlement approval must not be mixed into visit outcome.
- Finance approval must not be mixed into visit outcome.
- Appointment outcome must not be used as a shortcut around Field Service Report completion validation.
- Appointment status completed alone must not be treated as final service completion unless visit result is completed.

## Engineer UX Rules

Engineer mobile workflow should keep outcome input short.

Future UI should prefer:

- simple outcome selection,
- short required reason only when needed,
- optional internal technician note,
- evidence attachment prompt only when useful,
- default next-action hints,
- missing-photo/signature/serial reminders where applicable.

Future UI should not ask engineers to decide:

- finance approval,
- settlement approval,
- vendor settlement rule,
- SaaS usage,
- provider cost,
- audit classification,
- permission scope,
- entitlement state,
- finalAppointmentId,
- report/export/download category,
- customer communication strategy beyond simple field facts.

## AI-assisted Classification Boundary

AI may:

- suggest outcome classification from engineer's short input,
- detect missing reason for abnormal outcome,
- suggest follow-up flag,
- detect possible quote-needed case,
- remind about missing photo/signature/serial/evidence,
- summarize visit outcome for review.

AI must not:

- automatically change Case status,
- automatically change Appointment status,
- automatically complete Field Service Report,
- automatically choose `finalAppointmentId`,
- automatically create follow-up appointment,
- automatically create quote,
- automatically create customer fee consent,
- automatically approve settlement,
- automatically create complaint,
- override engineer-provided facts,
- use internal-only data in customer-visible output.

AI suggestions must remain reviewable, editable, rejectable, permission-aware, and audit-ready.

## Data Visibility / Security Considerations

Future visit outcome workflows must preserve:

- assigned appointment scope,
- organization isolation,
- Field Engineer Seat boundary,
- Data Access Control,
- field-level masking where possible,
- customer-visible/internal-data separation,
- sensitive customer data minimization,
- audit readiness for important outcome changes,
- no token exposure,
- no secret exposure,
- no raw LINE id exposure,
- no provider payload exposure,
- no cross-organization data exposure.

Customer-visible outcome summaries must not expose:

- internal-only notes,
- supervisor review,
- settlement internals,
- finance approval,
- audit log,
- AI raw payload,
- provider data,
- other customer data.

## Runtime Forbidden Confirmation

Task291 explicitly does not implement:

- Engineer Mobile App runtime,
- mobile web runtime,
- appointment runtime changes,
- Case status runtime changes,
- completion runtime changes,
- Field Service Report runtime changes,
- finalAppointmentId runtime changes,
- quote runtime,
- customer fee consent runtime,
- billing runtime,
- settlement runtime,
- photo upload runtime,
- signature capture runtime,
- file storage runtime,
- AI classification runtime,
- AI summary runtime,
- permission runtime,
- entitlement runtime,
- usage metering runtime,
- notification/provider sending runtime,
- LINE / SMS / Email / APP sending,
- report / export / download runtime,
- DB schema,
- migration,
- index,
- tests,
- smoke fixtures.

## Future Implementation Questions

Before any appointment / visit outcome runtime work begins, future tasks must answer:

- Which visit outcomes are terminal?
- Which visit outcomes leave appointment open?
- Which visit outcomes allow creating a follow-up appointment?
- Which outcomes require customer notification?
- Which outcomes require supervisor review?
- Which outcomes require quote workflow?
- Which outcomes require customer fee consent?
- Which outcomes can be customer-visible?
- Which outcomes should be internal-only?
- Which outcomes are eligible for finalAppointmentId inference?
- Which outcomes should affect Case status summaries?
- Which outcomes should be excluded from Field Service Report completion?
- Which outcomes need audit events?
- Which outcomes need evidence attachments?

## Conclusion

Task291 adds docs-only appointment / visit outcome boundary guidance.

It does not approve Engineer Mobile, appointment, Case, Field Service Report, finalAppointmentId, quote, fee consent, settlement, AI classification, or runtime implementation.

Future implementation must preserve:

- appointment / visit outcome is visit-level data,
- abnormal outcome is not Case closure,
- pending / quote-needed / waiting outcomes are not formal completion,
- second visit is not a new Case,
- one Case = one formal Field Service Report,
- multiple appointments / visits per Case,
- one open appointment invariant,
- backend/system finalAppointmentId ownership,
- AI suggestion only,
- runtime allowed now is No.

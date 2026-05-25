# Task 289 - Engineer Mobile / Field UX Branch Kickoff Scope Map / No Runtime Change

## Scope And Non-goals

This document opens a docs-only Engineer Mobile / Field UX design branch after the SaaS Plan / Entitlement / Usage branch readiness closure in Task288.

The purpose is to define the initial scope map for future engineer mobile web / mobile app workflows, with emphasis on minimum input, field completion UX, photos/signatures/attachments boundaries, data visibility, security, and alignment with the existing Case / Appointment / Field Service Report model.

Task289 is documentation-only.

This task is not:

- Engineer Mobile App runtime,
- mobile web runtime,
- Admin UI runtime,
- API change,
- appointment runtime change,
- completion runtime change,
- Field Service Report runtime change,
- photo upload runtime,
- signature capture runtime,
- file storage runtime,
- AI summary runtime,
- AI suggestion runtime,
- notification/provider sending runtime,
- LINE / SMS / Email / APP sending,
- permission runtime,
- entitlement runtime,
- usage metering runtime,
- seat management runtime,
- DB schema / migration proposal,
- smoke / test implementation.

Task289 does not add tables, migrations, schema, indexes, APIs, Admin UI, mobile UI, runtime logic, audit runtime, permission runtime, entitlement runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why This Branch Follows SaaS Plan / Entitlement / Usage Readiness Closure

Task282 through Task288 clarified SaaS plan, entitlement, seat, usage, billing, AI Add-on, SSO, and Data Access boundaries.

That branch established that Field Engineer Seat is a future account type and that engineer mobile capability may be plan/entitlement/usage controlled later, but seat type does not grant data visibility or permissions.

The next safe product branch is Engineer Mobile / Field UX because:

- the project is a field service platform, not just an admin back office,
- engineer completion experience is central to appointment and Field Service Report quality,
- future mobile workflows must preserve one Case = one formal Field Service Report,
- field input must remain simple,
- photos, signatures, and attachments need clear future boundaries,
- engineer-visible data must be restricted to assigned work and operational necessity.

This branch remains docs-only and does not approve runtime implementation.

## Engineer Mobile / Field UX Branch Purpose

The branch should define future engineer-facing field workflow principles without adding screens, APIs, schemas, or runtime.

It should preserve:

- simple engineer UX,
- minimum necessary input,
- assigned-work data scope,
- appointment / visit-level outcome recording,
- Case-level Field Service Report final summary,
- backend/system finalAppointmentId ownership,
- object/file storage direction for photos/signatures/documents,
- AI as assistant only,
- organization isolation,
- permission-aware access,
- audit readiness,
- usage tracking readiness.

## Concept Map

The following concepts are future design targets only.

They are not UI components, API endpoints, database tables, or runtime approvals.

| Concept | Future purpose | Key boundary | Runtime allowed now? |
| --- | --- | --- | --- |
| Assigned appointment view | Let engineers see assigned work for today / next stop. | Assigned work only; no broad case/customer access. | No |
| Arrival / on-site status | Record arrival or on-site progress. | Must be auditable; no fake arrival; no AI auto-arrival. | No |
| Field diagnosis | Capture concise problem diagnosis from the visit. | Minimum fields; AI may structure later but not decide facts. | No |
| Minimal completion input | Let engineer submit short result, key actions, parts/serial notes, and outcome. | Avoid complex admin-style form. | No |
| Photos / attachments | Capture evidence such as before/after photos or part photos. | Future object/file storage; metadata linked to case/appointment/report. | No |
| Customer signature | Capture customer confirmation where required. | Sensitive data; no fake signature; object/file storage direction. | No |
| Customer fee confirmation display | Show customer-visible fee/approval summary if applicable. | No internal settlement or SaaS billing exposure. | No |
| Abnormal outcome | Record customer not home, pending parts, cancelled, unable to repair, quote needed, or second visit needed. | Appointment / visit layer, not multiple formal reports. | No |
| AI-assisted completion summary | Help convert short engineer input into structured draft summary. | Human review; no official write without confirmation. | No |
| Offline / poor network future consideration | Consider safe local draft and sync strategy for field work. | Encryption, expiry, conflict handling, device loss risk. | No |
| Engineer-visible data boundary | Define what field engineers can see. | Operational necessity, assigned scope, masking, audit. | No |

## Core Workflow Alignment

Engineer Mobile / Field UX must align with current Case / Appointment / Field Service Report invariants:

- One Case can have only one formal Field Service Report.
- One Case can have multiple appointments / dispatch visits.
- Multiple visits, customer not home, pending parts, quote needed, cancellation, unable to repair, and second visit scenarios belong at the appointment / dispatch visit layer.
- Field Service Report is the Case-level final completion summary, not one report per visit.
- Field engineer workflow must not create multiple formal Field Service Reports for one Case.
- Field engineer workflow must not break `field_service_reports.case_id` uniqueness.
- Field engineer workflow must not allow the engineer to manually choose `finalAppointmentId`.
- `finalAppointmentId` should be resolved by backend/system from the final completed appointment.
- Completion should continue to rely on `visit_result = completed` for final appointment eligibility.
- Field engineer completion flow must remain simple.
- AI and system assistance should help structure field input, not increase field form burden.

## Role / Data Visibility Boundary

Field engineers should see only the data needed to execute assigned field service.

Future engineer-visible data may include:

- assigned appointment,
- schedule / next stop,
- customer contact and address only when operationally necessary,
- case summary,
- service history summary where useful,
- product / equipment summary,
- visit instructions,
- safety or access notes,
- customer-visible fee/approval summary where applicable,
- required photos/signature/checklist prompts.

Field engineers should not see:

- unrelated cases,
- broad customer lists,
- internal billing data,
- internal settlement data,
- supervisor-only notes,
- audit log,
- AI raw payload,
- provider credentials,
- cross-organization data,
- unrelated customer personal data,
- SaaS billing / subscription / plan cost data.

Sensitive data such as customer name, phone, address, signature, photos, product serial numbers, and customer notes should be shown only in operationally necessary contexts, with masking where possible.

## Future-only UX Flow

This flow is conceptual only.

It is not an approved UI, API, or runtime contract.

1. Engineer views assigned job.
2. Engineer sees route / navigation / contact customer action with masking and permission rules.
3. Engineer marks arrival or on-site state.
4. Engineer records concise diagnosis with minimal required fields.
5. Engineer captures photos or evidence if needed.
6. Engineer records abnormal outcome or completion result:
   - customer not home,
   - pending parts,
   - cancelled,
   - unable to repair,
   - quote needed,
   - second visit needed,
   - completed.
7. Customer confirms visible service summary or fee if applicable.
8. Engineer captures signature if required.
9. AI drafts structured completion summary from minimal engineer input.
10. Engineer reviews and submits.
11. Backend/system later determines final appointment context according to completion rules.

## Abnormal Outcome Boundary

Abnormal outcomes should remain appointment / visit-level results.

Examples:

- customer not home,
- pending parts,
- quote needed,
- cancelled / rescheduled,
- unable to repair,
- second visit needed,
- additional evidence needed.

These outcomes should not automatically complete the Case or Field Service Report.

They should help the system plan the next action while preserving visit history.

## Photos / Signature / Attachment Boundary

Future photo, signature, and document workflows should use object/file storage and metadata.

They should not be hard-coded into core Case, Appointment, or Field Service Report tables as large raw blobs.

Future metadata should be able to link files to:

- organization,
- case,
- appointment / visit,
- Field Service Report,
- uploader,
- timestamp,
- file category,
- visibility policy,
- retention policy,
- audit context.

Photos and signatures are sensitive. They must not appear in unsafe logs, raw AI payload, unrestricted reports, or broad exports by default.

## AI-assisted Completion Boundary

AI may help engineer mobile workflows by:

- summarizing short engineer notes,
- suggesting fault category,
- detecting missing photos/signatures/serial numbers,
- turning field notes into draft completion summary,
- flagging possible quote / fee consent needs,
- summarizing pending parts reason,
- creating customer-facing completion summary draft.

AI must not:

- fake arrival,
- fake customer signature,
- decide official completion facts,
- approve quote,
- approve settlement,
- decide final payable amount,
- change official Case status,
- submit completion without engineer/human confirmation,
- bypass engineer permission or organization scope,
- expose AI raw payload to engineer/customer.

AI output must remain separate from official record until accepted or confirmed through proper workflow.

## Offline / Poor Network Future Consideration

Offline or poor-network support is future design only.

If implemented later, it must consider:

- local draft encryption,
- local data expiry,
- device loss risk,
- sync conflict handling,
- duplicate submission protection,
- audit after sync,
- minimal offline data scope,
- no unmasked bulk customer data cache,
- no provider credentials on device,
- safe retry and idempotency.

Task289 does not approve offline runtime.

## SaaS-ready / Security Considerations

Future Engineer Mobile / Field UX must preserve:

- organization isolation,
- Field Engineer Seat boundary,
- permission vs entitlement separation,
- Data Access Control as authoritative,
- assigned-work scope,
- field-level masking readiness,
- customer-visible/internal-data separation,
- audit readiness for important field actions,
- usage tracking readiness for uploads, AI, notifications, and field workflow usage,
- sensitive data and token safety,
- LINE / SMS / Email / APP channel abstraction,
- no LINE hard-code in core field workflow.

Engineer Mobile may later be affected by plan, entitlement, seat, usage, and AI Add-on rules, but those concepts must not replace permissions or data visibility.

## Runtime Forbidden Confirmation

Task289 explicitly does not implement:

- Engineer Mobile App runtime,
- mobile web runtime,
- Admin UI runtime,
- API changes,
- appointment runtime changes,
- completion runtime changes,
- Field Service Report runtime changes,
- photo upload runtime,
- signature capture runtime,
- file storage runtime,
- AI summary runtime,
- AI suggestion runtime,
- notification/provider sending runtime,
- LINE / SMS / Email / APP sending,
- permission runtime,
- entitlement runtime,
- usage metering runtime,
- seat management runtime,
- report / export / download runtime,
- DB schema,
- migration,
- index,
- tests,
- smoke fixtures.

## Future Implementation Questions

Before any Engineer Mobile / Field UX runtime work begins, future tasks must answer:

- Which engineer workflows should be mobile web first?
- Which fields are truly required for a fast field completion?
- Which abnormal outcomes are selectable vs free-text?
- Which photos are mandatory by case type?
- When is customer signature required?
- Which customer fee confirmation must be shown to the customer?
- Which data should be masked for field engineers?
- How are assigned appointments scoped?
- Which actions require audit?
- Which uploads require usage tracking?
- Which AI suggestions are allowed in field flow?
- How should offline drafts be protected if ever implemented?
- How should duplicate submissions be prevented?
- How should finalAppointmentId remain backend/system-owned?

## Conclusion

Task289 opens the Engineer Mobile / Field UX branch as a docs-only scope map.

It does not approve Engineer Mobile / Field UX runtime implementation.

Future branch work should preserve:

- simple field workflow,
- minimum input,
- assigned-work data scope,
- one Case = one formal Field Service Report,
- multiple appointments / visits per Case,
- appointment / visit-level abnormal outcomes,
- backend/system finalAppointmentId ownership,
- object/file storage direction for photos/signatures/documents,
- AI as assistant only,
- organization isolation and Data Access Control,
- runtime allowed now is No.

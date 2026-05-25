# Task 295 - Engineer Mobile Offline / Poor Network Boundary Design / No Runtime Change

## Scope And Non-goals

This document continues the Engineer Mobile / Field UX docs-only branch after Task289 through Task294.

Task295 defines future-only boundaries for Engineer Mobile offline and poor-network scenarios, including local drafts, pending sync, evidence pending upload, AI-assisted drafts, server validation, data protection, and sync conflicts.

Task295 is documentation-only.

This task is not:

- offline sync runtime,
- local storage implementation,
- Engineer Mobile App runtime,
- mobile web runtime,
- completion runtime change,
- Field Service Report runtime change,
- finalAppointmentId runtime change,
- file upload runtime,
- object/file storage runtime,
- AI offline runtime,
- AI summary runtime,
- permission runtime,
- entitlement runtime,
- usage metering runtime,
- API contract,
- Admin UI,
- backend service change,
- DB schema / migration proposal,
- smoke / test implementation.

Task295 does not add tables, migrations, schema, indexes, backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, smoke scripts, fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, AI provider calls, offline cache, local storage, upload/download endpoints, completion logic, finalAppointmentId logic, or inventory documentation changes.

## Why Offline / Poor Network Boundaries Are Needed After Task294

Task294 clarified that AI-assisted completion summaries are drafts and cannot become official Field Service Report content, engineer facts, completion submission, Case/Appointment status changes, customer consent, or finalAppointmentId inference without future review and server-side validation.

The next risk is assuming that offline or poor-network field input can safely behave like online server submission.

Engineers may need to work in homes, basements, rural areas, elevators, or sites with unstable connectivity. Future Engineer Mobile may need local drafts and pending uploads. However, local draft data must not become official server state until reconnect, permission/scope validation, assignment validation, conflict checks, and server acceptance.

Task295 defines those offline boundaries before any offline sync or local storage runtime is approved.

## Definitions

### Offline Mode

Offline mode is a future state where the engineer device cannot reach the backend service.

Offline mode may allow local drafting, but it must not update server state.

### Poor Network Mode

Poor network mode is a future state where connectivity is slow, intermittent, or unreliable.

The system may need retry-safe submission and pending states, but server validation remains required.

### Local Draft

Local draft is data temporarily recorded on the device before server acceptance.

Local draft is not official submission and not official record.

### Pending Sync

Pending sync means a local draft or evidence item is waiting for reconnect and server validation.

Pending sync is not completion success.

### Sync Conflict

Sync conflict occurs when local draft data no longer matches server-authoritative state after reconnect.

Examples include appointment cancelled, reassigned, already completed, changed status, permission revoked, or Case closed.

### Stale Assignment

Stale assignment means the local device believes the engineer is assigned to an appointment, but the server has changed assignment, permission, organization scope, appointment state, or Case state.

### Retry-safe Submission

Retry-safe submission is a future design property that allows repeated sync attempts without duplicate official records or duplicate side effects.

It requires idempotency and server-side validation, but Task295 does not implement it.

### Evidence Pending Upload

Evidence pending upload is a photo, signature, document, or attachment captured locally but not yet accepted by the server.

It is not official evidence until uploaded, validated, permission-checked, associated, audited, and accepted.

### Offline-sensitive Data

Offline-sensitive data is any cached or locally stored data that may expose customer private data, address, phone, photos, signatures, appointment details, internal notes, fee information, or operational context.

### Server-authoritative State

Server-authoritative state is the backend's validated Case, appointment, visit, Field Service Report, assignment, permission, organization scope, and finalAppointmentId state.

Server state remains authoritative over local drafts.

## Boundary Principles

- Server state remains authoritative.
- Offline draft is not official submission.
- Pending sync is not completion success.
- Local draft must not automatically change Case status.
- Local draft must not automatically change Appointment status.
- Local draft must not automatically change Field Service Report status or content.
- Offline state must not create or determine `finalAppointmentId`.
- `finalAppointmentId` remains backend/system determined from the final completed appointment.
- Offline completion draft must be revalidated by server after reconnect.
- Evidence pending upload is not official evidence until server acceptance.
- Customer signature pending upload is not formal consent until future server validation and consent workflow accepts it.
- AI summary in offline state must not create official records or bypass human review.
- Sync conflict resolution must fail closed or require review.
- AI must not decide conflict resolution.
- Retry behavior must be future idempotent and side-effect safe.
- Local cache must be minimized, protected, expiring, and scoped to assigned work only.

## Future-only Offline Flow Map

This is a concept map only. It does not approve implementation.

1. Engineer opens assigned appointment while online.
2. App caches limited assigned-job data only.
3. Network degrades or becomes offline.
4. Engineer records minimal local draft facts.
5. Photos / signature are marked evidence pending upload.
6. Completion draft is marked pending sync.
7. Device reconnects.
8. Server revalidates organization scope, user identity, role, permission, assignment, appointment state, Case state, and feature entitlement where applicable.
9. Server detects conflict or accepts the draft.
10. Conflict requires fail-closed handling, engineer review, or admin/supervisor review.
11. Official submission is accepted only after server validation.
12. Audit and usage tracking happen only through future approved server-side flows.

## Offline / Sync Boundary Matrix

This matrix is future-only guidance. It does not approve runtime, schema, API, mobile UI, offline cache, local storage, upload, AI, completion, or sync implementation.

| Offline / sync scenario | Allowed as local draft? | May update server state offline? | Requires reconnect validation? | Requires human review? | Sensitive data risk? | Requires local protection? | May AI assist? | May AI decide? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| View cached assigned appointment | Yes, limited assigned scope only. | No | Yes, for refresh/action. | No by default. | Yes | Yes | No by default. | No | No |
| Record diagnosis draft | Yes | No | Yes | Yes, before official use. | Maybe | Yes | Maybe, draft only. | No | No |
| Record work performed draft | Yes | No | Yes | Yes, before official use. | Maybe | Yes | Maybe, draft only. | No | No |
| Record abnormal outcome draft | Yes | No | Yes | Yes, before official use. | Maybe | Yes | Maybe, suggestion only. | No | No |
| Capture photo pending upload | Yes, as pending evidence. | No | Yes | Maybe | Yes | Yes | No by default; future masked analysis only. | No | No |
| Capture customer signature pending upload | Yes, if future policy allows. | No | Yes | Yes | Yes | Yes | No by default. | No | No |
| Customer fee display viewed offline | Maybe, if cached policy allows. | No | Yes | Maybe | Yes | Yes | No by default. | No | No |
| Fee consent capture candidate offline | Maybe, future candidate only. | No | Yes | Yes | Yes | Yes | No | No | No |
| AI summary draft offline | Maybe, local draft only if future safe model exists. | No | Yes | Yes | Yes | Yes | Maybe, draft only. | No | No |
| Submit completion while offline | No as official submission; only queue a draft. | No | Yes | Yes | Yes | Yes | No by default. | No | No |
| Retry sync after reconnect | Future-only maybe. | No until server accepts. | Yes | Maybe | Yes | Yes | No by default. | No | No |
| Conflict with changed appointment status | No official update. | No | Yes | Yes | Maybe | Yes | Maybe, explain conflict only. | No | No |
| Conflict with reassigned engineer | No official update. | No | Yes | Yes | Yes | Yes | No by default. | No | No |
| Conflict with cancelled appointment | No official update. | No | Yes | Yes | Maybe | Yes | No by default. | No | No |

## Data Protection Rules

Future offline cache must be minimized.

Offline cache should only contain assigned appointment data required for field work.

Offline cache must not include:

- unnecessary customer lists,
- unrelated Cases,
- unrelated appointments,
- internal billing data,
- settlement data,
- audit log data,
- AI raw payload,
- provider raw payload,
- cross-organization data,
- unauthorized attachments,
- hidden internal notes,
- unrelated customer data.

Cached phone, address, signature, photo, serial, fee information, and appointment context require future:

- device/session protection,
- expiration,
- local cleanup,
- masking/redaction where possible,
- organization scope,
- assignment scope,
- permission scope,
- audit readiness after server sync,
- lost-device and session-revocation policy,
- conflict handling policy.

Local logs must not contain:

- tokens,
- secrets,
- complete phone numbers,
- complete addresses,
- raw LINE identifiers,
- raw provider payloads,
- signature raw data,
- unauthorized photo content,
- unmasked customer private data,
- cross-organization data,
- AI raw sensitive payload.

## Conflict Handling Principles

- Stale assignment must fail closed or require review.
- Appointment cancelled by server must not accept offline completion draft directly.
- Appointment reassigned to another engineer must not accept stale local draft directly.
- Appointment already completed must not accept offline completion draft as another completion.
- Case already closed must not accept offline completion draft directly.
- Permission revoked must prevent sync acceptance.
- Organization mismatch must prevent sync acceptance.
- Evidence pending upload must not become official evidence if appointment/Case conflict prevents submission.
- Retry submission requires future idempotency design.
- Conflict resolution must not be decided by AI.
- Conflict resolution should present safe, role-appropriate information and avoid exposing hidden resource state to unauthorized users.

## Interaction With Existing Platform Objects

### Case

Case state remains server-authoritative.

Offline draft must not close, complete, reopen, or modify a Case without server validation.

### Appointment / Dispatch Visit

Appointment / dispatch visit assignment and status must be revalidated after reconnect.

Offline drafts must not create multiple open appointments or bypass visit outcome rules.

### Field Service Report

Field Service Report remains the Case-level formal completion summary.

Offline completion draft must not become formal report content until accepted by server-side validation and future approved workflow.

### finalAppointmentId

`finalAppointmentId` remains backend/system determined.

Offline mode must not create, choose, infer, override, or clear `finalAppointmentId`.

### Photos / Attachments

Photos and attachments captured offline remain evidence pending upload until server-side upload, metadata association, permission, audit, and storage policy accept them.

### Customer Signature

Customer signature captured offline is sensitive pending evidence.

It is not formal consent or confirmation until server-side validation and future approved workflow accept it.

### Customer Fee Consent

Offline fee consent candidate is not formal customer fee consent.

Formal consent requires future server-side workflow, evidence, audit, and validation.

### AI Suggestion Records

Offline AI draft or local suggestion is not an AI suggestion record until future server-side AI suggestion workflow accepts it.

AI must not decide official state or conflict resolution.

### Audit Log Future Layer

Offline actions may need future audit events once synced, but local-only logs must be safe and minimized.

Server-side audit should record accepted sync, rejected sync, conflicts, retries, and evidence upload outcomes through approved future workflow.

## SaaS-ready / Security Considerations

Future offline / poor network design must preserve:

- organization isolation,
- Field Engineer Seat boundary,
- Data Access Control authority after reconnect,
- device/session security future design,
- role permission,
- feature entitlement,
- field-level masking readiness,
- audit readiness,
- upload usage tracking readiness,
- sync attempt usage tracking readiness,
- AI Add-on usage tracking readiness,
- storage usage tracking readiness,
- sensitive data safety,
- LINE / SMS / Email / APP channel abstraction,
- Enterprise SSO and session revocation readiness,
- lost-device response readiness.

Entitlement may determine whether an organization can use offline mode, offline evidence capture, offline signature capture, offline AI draft, or background sync in the future.

Entitlement does not replace server validation, permission, organization scope, Data Access Control, masking, audit, or conflict handling.

## Explicit Runtime Forbidden Confirmation

Task295 explicitly does not approve:

- offline sync runtime,
- local storage implementation,
- Engineer Mobile runtime,
- mobile web runtime,
- completion runtime change,
- Field Service Report runtime change,
- finalAppointmentId runtime change,
- file upload runtime,
- object/file storage runtime,
- file download runtime,
- AI offline runtime,
- AI summary runtime,
- AI provider integration,
- customer fee consent runtime,
- quote runtime,
- billing runtime,
- settlement runtime,
- API changes,
- Admin UI changes,
- DB schema changes,
- migration changes,
- permission runtime,
- entitlement runtime,
- usage runtime,
- seat billing runtime,
- notification/provider sending,
- LINE / SMS / Email / APP sending,
- report/export/download runtime,
- smoke / fixture changes.

## Future Task Candidates

These are future candidates only and are not approved by Task295:

- offline data minimization policy,
- local cache encryption and expiration design,
- retry-safe sync idempotency design,
- server-side sync validation contract,
- offline evidence pending upload UX,
- stale assignment conflict UX,
- offline signature risk policy,
- lost-device and session revocation design,
- offline usage tracking design,
- offline no-official-record smoke plan.

## Conclusion

Task295 establishes docs-only offline / poor network boundary guidance.

Offline and poor-network support must treat local data as drafts only. Server state remains authoritative. Pending sync is not completion success. Offline mode must not update Case, Appointment, Field Service Report, finalAppointmentId, evidence, consent, quote, settlement, billing, payment, invoice, or official records without reconnect and server validation.

No offline sync, local storage, Engineer Mobile, completion, Field Service Report, finalAppointmentId, file upload/storage/download, AI offline/summary, customer fee consent, quote, billing, settlement, payment, invoice, API, Admin UI, DB, migration, permission, entitlement, usage, provider sending, report/export/download, smoke, or inventory documentation change is approved by this task.

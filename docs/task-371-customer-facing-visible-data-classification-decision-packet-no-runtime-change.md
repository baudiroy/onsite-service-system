# Task 371 - Customer-facing Visible Data Classification Decision Packet / No Runtime Change

## Scope Summary

Task371 is a documentation-only decision packet for future customer-facing visible data classification.

This task does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, helper files, interface/code files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, projection service runtime, verification runtime, token runtime, rate-limit runtime, audit runtime, notification delivery, provider integrations, customer portal runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task371 extends the Task360-370 customer-facing access design branch. It classifies what future customer-facing timeline, service report, access verification response, and safe-deny response surfaces may display.

## Current Baseline

| Area | Current status |
| --- | --- |
| Customer-facing runtime | Not started |
| Customer-visible appointment timeline API | Docs-ready proposal only |
| Customer-facing service report API | Docs-ready proposal only |
| Projection service | Docs-ready design only |
| `customerAccessContext` | Docs-ready proposal only |
| Customer channel verification runtime | Docs-ready design only |
| Safe-deny helper | Docs-ready design only |
| Link/token lifecycle | Docs-ready policy only |
| Abuse / rate-limit policy | Docs-ready review only |
| Implementation sequencing | Docs-ready plan only |
| DB / DDL / migration approval | Not granted |
| Migration020 / survey runtime | Paused |
| Provider sending | Paused |
| Disposable local/test runtime for API/DB smoke | Not confirmed |

The current branch is design-ready, not runtime-ready.

## Customer-facing Data Classification Matrix

The future projection service should classify every field before it appears in a customer-facing surface.

| Classification | Meaning | Timeline examples | Service report examples | Access / safe-deny examples | Required control |
| --- | --- | --- | --- | --- | --- |
| Allowed customer-visible | Safe to show after authorization and projection. | Customer-safe Case reference, broad display status, confirmed service window, customer action availability. | Service date, customer-safe issue summary, repair summary, service result, customer-safe service item summary. | Generic next step, support contact entrypoint. | organization scope, verified access, allow-list projection. |
| Conditionally visible | May be shown only when policy, status, consent, and context allow it. | Proposed appointment window, reschedule state, engineer arrival state, pending parts wording, quote pending wording. | Customer charges, invoice/receipt status, signature status, selected photos, part/serial summary, warranty or care note. | Verification-required message, expired-link message, report unavailable message. | workflow eligibility, customer visible data policy, redaction, audit/security boundary. |
| Human/admin confirmation required | Needs manual or deterministic confirmation before customer visibility. | Dispatcher-approved proposed appointment, customer-confirmed appointment, revised service window, exception explanation. | Customer-facing report version, fee/approval/invoice summary, signature exception wording, unresolved issue response wording. | Manual support handoff wording, corrected link resend, customer issue follow-up copy. | authorized confirmation, version/audit record, safe wording. |
| Forbidden internal-only | Must never appear in customer-facing responses. | Dispatch scoring, route clustering, engineer ranking, internal visit notes. | Internal Field Service Report payload, engineer internal comments, supervisor notes, billing/settlement internals, inventory internals. | Root denial reason, resource existence, channel binding internals, token details. | hard block, security review, no prompt/context/log exposure. |

## Surface-specific Classification

### Customer-visible Appointment Timeline

Allowed after authorization:

- customer-safe Case display reference,
- customer-safe display status,
- confirmed appointment date/time window,
- pending customer confirmation state,
- reschedule-requested state,
- pending parts state using neutral wording,
- pending quote state using customer-safe wording,
- missed visit / customer-not-home state using neutral wording,
- service completed high-level state,
- customer-facing report availability flag,
- issue / support / survey entrypoint availability.

Conditionally visible:

- proposed appointment window before customer confirmation,
- engineer arrival or on-the-way state,
- high-level technician display name if organization policy allows,
- customer-safe location context when needed for appointment confirmation,
- customer action availability such as confirm, request change, contact support.

Forbidden:

- internal dispatch queue position,
- route optimization or route clustering,
- engineer score, ranking, workload, performance note, or internal evaluation,
- internal appointment notes,
- raw appointment row,
- internal `visit_result` enum when wording is not customer-safe,
- internal `appointment_status` transitions that reveal staff operations,
- raw `finalAppointmentId`,
- full contact history,
- provider delivery payload.

### Customer-facing Service Report

Allowed after authorization:

- customer-safe Case display reference,
- service date,
- customer-safe issue summary,
- customer-safe repair action summary,
- high-level service result,
- customer-visible service item or part category summary,
- signature status summary,
- support / issue / survey entrypoint availability.

Conditionally visible:

- selected completion photos or file links after storage/access policy approval,
- selected part name/category when customer-safe,
- serial number summary when policy allows and redaction is applied,
- signature exception summary,
- confirmed customer charge / approval / invoice / receipt information,
- warranty / care note,
- report version metadata such as version number and published date.

Human/admin confirmation required:

- customer-facing report publication,
- corrected report version,
- signature exception wording for refused, representative, remote, or no-signature cases,
- customer charge, approval, invoice, or receipt summary,
- unresolved issue or follow-up wording,
- photos/files selected for customer visibility.

Forbidden:

- internal Field Service Report raw payload,
- internal notes,
- audit log,
- engineer internal comments,
- supervisor notes,
- supervisor review notes,
- AI raw payload, prompt, model output, or confidence internals,
- billing internal rules,
- settlement internal rules,
- vendor reconciliation data,
- brand reconciliation data,
- internal cost, margin, payout, or settlement amount,
- inventory internals, warehouse data, stock movement, reservation, or vehicle stock details,
- internal complaint classification,
- raw database ids,
- raw channel ids or provider ids.

### Access Verification Response

Allowed:

- generic verification-required message,
- generic confirmation that more verification is needed,
- customer-safe next step such as contact support or request a new link,
- safe channel-neutral wording.

Forbidden:

- whether the Case exists,
- whether the customer exists,
- whether the organization exists,
- whether the report exists,
- whether a LINE identity exists,
- whether a phone/email/channel identity matched,
- whether a link was valid but expired,
- exact internal verification failure reason,
- raw verification code, binding token, link token, provider id, or channel id.

### Safe-deny Response

Allowed:

- generic unavailable message,
- verification-required message,
- link-unavailable message,
- action-unavailable message,
- support/contact next step,
- customer-safe retry guidance when policy allows.

Forbidden:

- root denial reason,
- resource existence or non-existence,
- ownership mismatch,
- organization mismatch,
- channel binding details,
- token validity details,
- rate-limit scoring or abuse classification,
- internal policy rule that denied access.

## Source-of-truth vs Projection Boundary

Internal domain records remain the source of truth:

- Case,
- Customer,
- Appointment / dispatch visit,
- Field Service Report,
- Contact History,
- Customer Channel Identity,
- Customer Approval Record,
- Invoice / receipt record if future policy implements it,
- Survey / issue / complaint / follow-up records if future policy implements them,
- Audit / security event records.

Customer-facing responses must be filtered projections only. A projection may reference internal records, but it must not expose raw source records or become the official source of truth.

Future runtime should follow this boundary:

```text
Internal source records
-> access / verification / consent checks
-> customerAccessContext
-> customer visible data classification
-> projection allow-list
-> safe-deny or customer-safe response
```

Controllers should not assemble customer-facing responses directly from raw database rows.

## Forbidden Exposure List

Future customer-facing surfaces must not expose:

- internal notes,
- audit log,
- AI raw payload,
- AI prompts,
- raw model output,
- raw provider payload,
- raw LINE id,
- raw channel binding internals,
- provider id,
- raw database ids unless explicitly approved as customer-safe identifiers,
- billing internal data,
- settlement internal data,
- quote internal approval notes,
- inventory internals,
- warehouse data,
- stock movement,
- vehicle stock,
- engineer internal comments,
- supervisor notes,
- supervisor review details,
- dispatch scoring,
- route clustering,
- engineer ranking,
- internal cost,
- payout,
- margin,
- reconciliation rules,
- full phone number,
- full address,
- full email unless future policy explicitly permits it for a narrow operation,
- token,
- secret,
- `DATABASE_URL`,
- credentials,
- verification code,
- link token,
- signature storage internals,
- organization existence inference details,
- customer existence inference details,
- Case existence inference details,
- appointment existence inference details,
- report existence inference details,
- internal denial reason.

## Conditional Customer-visible Rules

### Customer Charges / Approval / Invoice

Customer-facing surfaces may show customer fees only when the information is confirmed and customer-relevant.

Allowed only after the required business state exists:

- confirmed customer charge,
- customer approval status,
- customer approval time/channel if customer-safe,
- invoice / receipt status,
- customer-facing payment status if future policy implements it.

Forbidden:

- internal settlement amount,
- vendor payout,
- internal cost,
- margin,
- reconciliation rule,
- finance review note,
- missing-evidence internals.

AI may help draft customer-safe fee wording, but AI must not decide fee visibility, approve charges, create invoices, or modify official amounts.

### Appointment Time / Dispatch Context

Customer-facing surfaces may show:

- customer-confirmed appointment time,
- dispatcher-approved proposed appointment time,
- reschedule-requested state,
- customer action availability.

They must not show:

- internal route clustering,
- dispatch queue ranking,
- engineer workload details,
- engineer score,
- internal travel optimization,
- staff-only scheduling conflicts.

### Engineer Information

Engineer information is conditionally visible and must depend on organization policy, role, channel, and customer-safe projection.

Potentially visible:

- public display name,
- high-level arrival/on-the-way state,
- customer-safe contact method if future policy approves it.

Forbidden:

- personal phone number unless explicitly approved for an operational scenario,
- internal workload,
- performance score,
- internal comments,
- private profile details.

### Photos / Signature / Documents

Photos, signatures, and documents are future storage/access-policy dependent. Task371 does not implement file storage or access links.

Future visibility requires:

- object/file storage policy,
- customer-visible allow-list,
- expiration / revocation policy,
- field-level masking/redaction,
- download/access log,
- audit/security event boundary.

Forbidden by default:

- raw signature original,
- unreviewed photos,
- internal evidence photos,
- documents containing internal notes or full personal data,
- permanent public links.

## Safe-deny Copy Boundary

Safe-deny wording must avoid enumeration and ownership leaks.

For these cases:

- not found,
- unauthorized,
- expired link,
- revoked link,
- malformed link,
- wrong customer,
- wrong organization,
- wrong channel identity,
- verification failed,
- verification required,
- rate-limited,
- report not available,
- timeline not available,
- issue entrypoint unavailable,
- survey unavailable,
- internal resolution error,

customer-facing copy must not reveal whether any resource exists.

Customer-safe response direction:

- say the content or action is currently unavailable,
- ask the customer to verify, request a new link, or contact support,
- avoid root cause,
- avoid internal policy names,
- avoid channel binding details.

Detailed denial reasons may be recorded in future minimized audit/security events, but they must not be returned to customers or included in AI context.

## AI Boundary

AI may assist only after the authorized projection boundary is known.

AI may help:

- draft customer-safe wording,
- summarize already-allowed fields,
- suggest simpler labels for timeline states,
- summarize a customer-facing report draft,
- flag if customer-facing wording seems to include forbidden data.

AI must not:

- decide field visibility,
- bypass projection rules,
- publish customer-facing content,
- infer access from raw channel identities,
- reveal root denial reasons,
- use internal-only data in customer-facing output,
- include raw provider payload,
- include raw LINE id,
- include full phone/address/email,
- include token, secret, credential, or verification code,
- modify official Case, Appointment, Field Service Report, billing, settlement, complaint, or survey records.

AI suggestions remain drafts. Human confirmation or deterministic business logic must control official customer-facing publication.

## Future Runtime Readiness Checklist

Before any future customer-facing runtime is implemented, confirm:

- this data classification is adopted by the projection service,
- `customerAccessContext` contains organization, channel, verification, consent, and surface scopes,
- customer channel identity is scoped by organization/channel/provider and does not use global `line_user_id`,
- safe-deny helper collapses root denial reasons into generic customer-safe messages,
- customer-facing response does not reveal resource existence before authorization,
- timeline projection has an explicit field allow-list,
- service report projection has an explicit field allow-list,
- customer charge / invoice / fee projection has an explicit confirmed-state gate,
- photos/signature/document links have a storage, expiration, revocation, and access-log policy,
- audit/security events record only minimal internal details,
- abuse/rate-limit policy is connected before public link exposure,
- AI is limited to customer-safe drafts and cannot publish,
- API/DB smoke runs only after explicit disposable local/test runtime confirmation,
- no shared / production / Zeabur runtime is used for exploratory access tests.

## Non-goals

Task371 does not:

- implement runtime,
- add API routes,
- add controllers,
- add services,
- add repositories,
- add helpers,
- add interface code,
- add localization files,
- add migrations,
- add schema,
- add indexes,
- add smoke tests,
- modify validators,
- modify Admin frontend,
- modify provider integrations,
- send LINE / SMS / Email / App notifications,
- implement customer portal,
- implement AI / RAG runtime,
- implement billing / settlement / invoice runtime,
- implement inventory / WMS runtime,
- implement survey, complaint, callback, or issue runtime,
- change Field Service Report completion,
- change `finalAppointmentId` inference,
- change Case status workflow.

## Risk and Limitations

This document is a decision packet, not runtime approval.

The highest future risk is exposing raw internal records through customer-facing APIs before the classification, access context, projection allow-list, safe-deny helper, link/token policy, audit/security event boundary, and rate-limit policy are implemented.

The safest future path is to treat every customer-facing field as forbidden by default and promote it to allowed or conditional only after product, security, and access-control review.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No data model change.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke test change.

## Security / Redaction Note

This document contains policy terms such as token, `line_user_id`, provider payload, phone, address, secret, and `DATABASE_URL` only as examples of data that must not be exposed.

It does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, raw link values, verification codes, or production data details.

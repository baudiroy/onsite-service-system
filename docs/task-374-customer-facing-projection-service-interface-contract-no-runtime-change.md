# Task 374 - Customer-facing Projection Service Interface Contract / No Runtime Change

## Scope Summary

Task374 is a documentation-only interface contract for a future customer-facing projection service.

This task does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, helper files, interface/code files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, projection service runtime, verification runtime, token runtime, rate-limit runtime, audit runtime, notification delivery, provider integrations, customer portal runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task374 defines how a future projection service should convert internal source-of-truth records into Task373 customer-safe DTOs and Task372 response envelopes. It does not add code.

## Current Baseline

| Area | Current status |
| --- | --- |
| Customer-facing runtime | Not started |
| Projection service runtime | Not implemented |
| Projection service interface code | Not implemented |
| Response envelope | Docs proposal only |
| DTO field map | Docs proposal only |
| `customerAccessContext` | Docs proposal only |
| Safe-deny helper | Docs design only |
| Localization files | Not implemented |
| API routes / controllers / services | Not implemented |
| DB / DDL / migration approval | Not granted |
| Migration020 / survey runtime | Paused |
| Provider sending | Paused |
| Disposable local/test runtime for API/DB smoke | Not confirmed |

The current branch is design-ready, not runtime-ready.

## Projection Service Role

The future projection service is the single conversion boundary between internal source-of-truth records and customer-facing DTOs.

It should:

- receive already-authorized internal domain context,
- apply customer-visible data classification,
- build customer-safe timeline DTOs,
- build customer-safe service report DTOs,
- build generic unavailable / verification-required projections,
- connect to the Task372 response envelope,
- fail closed when data, policy, or access context is incomplete.

It must not:

- become the source of truth,
- rewrite Case, Appointment, Field Service Report, Contact History, or Channel Identity records,
- decide formal workflow status,
- approve fees,
- approve invoices,
- approve settlement,
- decide customer identity,
- decide access authorization,
- send notifications,
- call providers,
- call AI,
- expose raw internal records.

Future customer-facing controllers should not directly read or return raw Case, Customer, Appointment, Field Service Report, Contact History, Customer Channel Identity, audit, billing, settlement, inventory, or AI records.

## Proposed Interface Concepts

The following method names and shapes are conceptual only. They do not add code or runtime contracts.

### `buildTimelineProjection`

Purpose:

- Convert authorized Case / Appointment / dispatch visit context into a customer-safe timeline DTO.

Required input concept:

- authorized Case summary,
- authorized appointment / visit summary,
- optional customer action eligibility,
- customer-safe product/copy policy,
- `customerAccessContext` with organization, channel, verification, consent, and surface scope.

Allowed output:

- Task373 timeline DTO fields,
- Task372 success response envelope,
- customer-safe display status,
- customer-safe next actions.

Forbidden output:

- raw appointment rows,
- internal dispatch order,
- route clustering,
- engineer scoring,
- dispatch suggestion confidence,
- internal notes,
- audit reason,
- raw contact history,
- raw provider payload,
- raw `finalAppointmentId`,
- raw database ids.

Unavailable handling:

- Return a generic unavailable projection via safe-deny envelope if access, context, or projection policy is incomplete.
- Do not disclose which source record is missing or denied.

Audit/security boundary:

- May emit only a future minimized symbolic category through an approved audit/security writer.
- Must not include raw token, full contact values, raw provider payload, internal source payload, or stack trace in customer response.

### `buildServiceReportProjection`

Purpose:

- Convert an authorized internal Field Service Report completion context into a customer-facing service report DTO.

Required input concept:

- authorized Case summary,
- authorized completed Field Service Report summary,
- authorized final appointment display context,
- optional customer-visible charge/approval/invoice summary,
- optional customer-visible signature/photo/document policy result,
- `customerAccessContext` with organization, channel, verification, consent, and surface scope.

Allowed output:

- Task373 service report DTO fields,
- Task372 success response envelope,
- customer-safe issue summary,
- customer-safe work performed summary,
- customer-safe service result,
- customer-visible fees only when confirmed and customer-relevant.

Forbidden output:

- internal Field Service Report raw payload,
- engineer internal comments,
- supervisor notes,
- supervisor review details,
- billing internal rules,
- settlement internal rules,
- vendor / brand reconciliation internals,
- inventory internals,
- warehouse or stock movement data,
- AI raw payload,
- raw prompt or model output,
- raw ids.

Unavailable handling:

- Return a generic unavailable projection if the report is not customer-visible, verification is incomplete, or projection policy is incomplete.
- Do not reveal whether the report exists, whether the Case is completed, or whether a link is tied to a real report.

Audit/security boundary:

- Customer response must not include audit/security detail.
- Internal audit/security categories must remain minimized and redacted.

### `buildAccessUnavailableProjection`

Purpose:

- Convert denied, unavailable, unsupported, expired, revoked, malformed, wrong-customer, wrong-organization, or internal error cases into one generic customer-safe response family.

Required input concept:

- safe symbolic deny category,
- requested surface/action,
- `customerAccessContext` if available,
- safe support policy.

Allowed output:

- Task372 safe-deny envelope,
- generic message key,
- generic next action,
- optional generic retry hint where safe.

Forbidden output:

- resource existence or non-existence,
- root denial reason,
- raw token,
- raw link value,
- raw provider id,
- channel identity id,
- Case id,
- appointment id,
- report id,
- organization id,
- customer id,
- internal policy name.

Unavailable handling:

- Missing or uncertain mapping must collapse to generic unavailable.
- The method must not choose a more specific response if that specificity creates enumeration risk.

Audit/security boundary:

- Detailed denial reason belongs only in a minimized internal audit/security category, not in customer response.

### `buildVerificationRequiredProjection`

Purpose:

- Build a verification-required customer response only when a verification prompt is safe and non-enumerating.

Required input concept:

- safe verification-required category,
- requested surface/action,
- channel-neutral verification policy,
- `customerAccessContext` if available.

Allowed output:

- generic verification-required envelope,
- safe verification next action,
- support fallback.

Forbidden output:

- whether a customer channel identity matched,
- whether LINE binding exists,
- which verification factor failed,
- full phone/email/address,
- verification code,
- raw token,
- resource existence,
- exact link state.

Unavailable handling:

- If a verification prompt could reveal resource existence, collapse to generic unavailable instead.

Audit/security boundary:

- Internal verification category may be recorded only through a minimized audit/security path.

## Input Boundary

Projection service input may come from internal domain records, but only after:

- organization scope is resolved,
- permission/access context is established,
- customer channel identity scope is verified,
- requested surface is authorized or safely denied,
- customer visible data policy is known,
- sensitive data minimization/redaction policy is applied.

Projection service should not receive:

- raw provider payload,
- raw token,
- raw link value,
- credentials,
- full phone,
- full address,
- full email,
- AI raw payload,
- raw prompt or model output,
- full audit log text,
- internal notes,
- raw database rows that are not needed for projection.

If input is incomplete or not covered by `customerAccessContext`, the projection service must produce generic unavailable, not partial customer-facing data and not a detailed error.

## Output Boundary

Projection service output must:

- follow Task373 DTO field map,
- fit Task372 response envelope,
- include only Task371 allowed or conditionally allowed fields,
- omit forbidden fields by default,
- avoid raw ids and resource existence leaks,
- avoid internal source-of-truth payloads,
- avoid debug metadata,
- avoid implementation details.

Forbidden fields must not leak through renamed fields, summary fields, AI rewritten text, debug blocks, metadata, `displayHints`, `nextActions`, `requestReference`, or error messages.

## Timeline Projection Rules

Timeline projection should:

- show a customer-safe service timeline,
- translate appointment states into customer-safe display statuses,
- show confirmed/proposed windows only when allowed,
- show support or next actions only when authorized,
- avoid exposing internal workflow complexity.

Timeline projection must not output:

- internal dispatch sorting,
- route clustering,
- engineer scoring,
- dispatch suggestion confidence,
- engineer workload,
- internal appointment notes,
- audit reasons,
- raw contact history,
- provider payloads.

## Service Report Projection Rules

Service report projection must preserve:

- one Case equals one formal Field Service Report,
- one Case may have multiple appointments / visits,
- customer-facing service report is a projection, not the internal Field Service Report source of truth,
- final appointment context is stable after report completion.

Service report projection must not output:

- engineer internal comments,
- supervisor notes,
- billing/settlement internal rules,
- vendor / brand reconciliation internals,
- internal cost, payout, or margin,
- inventory internals,
- AI raw payload,
- raw internal Field Service Report payload.

Customer charges may be output only when:

- confirmed,
- customer-relevant,
- customer-visible policy permits it,
- the charge/approval/invoice summary is not an internal billing/settlement detail.

## Unavailable / Safe-deny Projection Rules

Denied, unavailable, expired, unauthorized, verification failed, rate-limited, malformed link, unsupported link, wrong-customer, wrong-organization, and internal resolution failures must support same-shape generic responses.

Unavailable projection must not reveal whether:

- the organization exists,
- the customer exists,
- the Case exists,
- the appointment exists,
- the report exists,
- the channel identity exists,
- the link token is valid,
- the link token is expired,
- the link token was revoked,
- the request matches another customer.

`requestReference` must be a non-enumerable customer-safe reference concept. It must not be an internal id or raw token.

## AI Boundary

AI may help draft customer-safe wording after projection rules are known.

AI must not:

- decide field visibility,
- decide access,
- decide `customerAccessContext`,
- decide safe-deny category,
- publish projection output,
- rewrite internal reason, audit reason, denial reason, billing rule, inventory state, engineer comment, supervisor note, or provider payload into customer-visible projection,
- bypass projection service,
- bypass permission,
- bypass verification,
- bypass organization isolation.

AI output remains draft-only and must not become DTO content without approved deterministic or human-controlled publication flow.

## Future Implementation Checklist

Before implementing projection service code, confirm:

- Task371 data classification is adopted,
- Task372 response envelope is adopted,
- Task373 DTO field map is adopted,
- `customerAccessContext` includes organization, channel, verification, consent, and requested surface scopes,
- safe-deny helper does not leak existence through projection branch differences,
- audit/security event writer receives only minimized internal categories,
- rate-limit / abuse policy is connected before public link exposure,
- localization fallback fails closed to generic safe wording,
- no controller returns raw internal records,
- API/DB smoke runs only after explicit disposable local/test runtime confirmation,
- no shared / production / Zeabur runtime is used for exploratory customer-facing access tests.

## Non-goals

Task374 does not:

- add runtime,
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
- implement file upload/download,
- implement photo/signature/document storage,
- implement survey, complaint, callback, or issue runtime,
- change Field Service Report completion,
- change `finalAppointmentId` inference,
- change Case status workflow.

## Risk and Limitations

This document is an interface contract proposal, not runtime approval.

The highest future risk is allowing customer-facing API controllers to bypass the projection service and return raw internal records. Future runtime should centralize all customer-facing projection through a narrow, testable boundary.

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

This document contains policy terms such as token, provider payload, raw LINE id, phone, address, secret, and `DATABASE_URL` only as examples of data that must not be exposed.

It does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, raw link values, verification codes, or production data details.

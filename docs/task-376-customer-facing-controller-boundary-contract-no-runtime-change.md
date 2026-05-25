# Task 376 - Customer-facing Controller Boundary Contract / No Runtime Change

## Scope Summary

Task376 is a documentation-only boundary contract for future customer-facing controllers.

This task does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, helper files, interface/code files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, projection service runtime, verification runtime, token runtime, rate-limit runtime, audit runtime, notification delivery, provider integrations, customer portal runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task376 defines how future customer-facing timeline, service report, and access/verification controllers should orchestrate resolver, projection service, safe-deny helper, and response envelope without directly exposing raw records. It does not add controller, route, or API runtime.

## Current Baseline

| Area | Current status |
| --- | --- |
| Customer-facing controller/runtime | Not started |
| Customer-facing route/API runtime | Not started |
| Customer access context resolver | Docs contract only |
| Projection service | Docs contract only |
| Safe-deny helper | Docs design only |
| Response envelope | Docs contract only |
| DTO field map | Docs proposal only |
| Audit/security event runtime | Not implemented |
| DB / DDL / migration approval | Not granted |
| Migration020 / survey runtime | Paused |
| Provider sending | Paused |
| Disposable local/test runtime for API/DB smoke | Not confirmed |

The current branch is design-ready, not runtime-ready.

## Controller Role

Future customer-facing controllers should perform request orchestration only.

Controllers may coordinate:

- request parsing,
- resolver invocation,
- projection service invocation after verified context,
- safe-deny helper invocation on denied/unavailable/ambiguous context,
- response envelope assembly from approved projection/helper output,
- minimal audit/security event trigger concept when future runtime exists.

Controllers must not:

- directly return raw Case records,
- directly return raw Customer records,
- directly return raw Appointment records,
- directly return raw Field Service Report records,
- directly return Contact History,
- directly return Customer Channel Identity records,
- directly return audit/security event details,
- directly return billing/settlement/inventory/AI internals,
- decide verification state,
- decide channel binding,
- decide organization scope,
- decide token state,
- decide field visibility,
- approve fees,
- change official status,
- create formal appointments,
- close complaints,
- publish AI-generated customer-visible content.

## Required Future Flow

Future customer-facing request flow should be:

```text
Customer-facing request
-> controller parses surface/action only
-> customer access context resolver
-> if verified and allowed: projection service
-> projection service builds Task373 DTO
-> Task372 response envelope
-> customer response
```

If resolver returns unavailable, ambiguous, denied, verification-required, or rate-limited:

```text
Customer-facing request
-> controller parses surface/action only
-> customer access context resolver
-> safe-deny helper
-> Task372 safe-deny envelope
-> generic customer response
```

Unavailable responses must be same-shape, generic, and non-enumerating.

## Forbidden Controller Behavior

Future controllers must not:

- query raw domain records and build customer-facing response directly,
- branch response details based on not-found vs unauthorized vs expired vs wrong-customer,
- include internal ids in customer responses,
- include raw token or token hash,
- include raw LINE id,
- include raw provider payload,
- include full phone,
- include full address,
- include full email,
- include audit reason,
- include internal denial reason,
- include AI raw payload,
- include stack trace,
- expose internal workflow status,
- expose customer channel binding state,
- expose report/Case existence before authorization,
- call AI to generate final customer-facing response,
- approve fees or invoices,
- update Case/Appointment/Field Service Report status,
- create formal appointment,
- close complaint or unresolved issue.

## Endpoint Boundary Mapping

The following endpoint categories are conceptual only. Task376 does not create routes.

| Endpoint category | Required resolver state | Allowed projection | Response envelope | Forbidden direct output | Audit/security event class |
| --- | --- | --- | --- | --- | --- |
| Customer timeline | Verified access with timeline surface allowed. | Task373 timeline DTO. | Task372 success envelope. | Raw appointment rows, dispatch scoring, route clustering, contact history. | `customer_access.allowed` concept. |
| Customer-facing service report | Verified access with report surface allowed. | Task373 service report DTO. | Task372 success envelope. | Internal Field Service Report payload, billing/settlement internals, engineer comments. | `customer_access.allowed` concept. |
| Access verification required | Verification prompt is safe and non-enumerating. | No resource-specific projection. | Task372 verification-required envelope. | Identity match details, factor details, resource existence. | `customer_access.verification_required` concept. |
| Link unavailable | Link or access context unavailable. | No resource-specific projection. | Task372 link-unavailable or generic unavailable envelope. | Expired/revoked/malformed/already-used detail. | `customer_access.link_unavailable` concept. |
| Unauthorized / denied | Access unavailable or denied. | No resource-specific projection. | Task372 generic unavailable envelope. | Wrong customer/org/resource detail. | `customer_access.denied_generic` concept. |
| Rate limited / abuse suspected | Rate-limit or abuse signal active. | No resource-specific projection. | Task372 rate-limited or generic unavailable envelope. | Threshold, rule id, abuse score, matched identity. | `customer_access.suspicious_probe` concept. |
| Internal projection failure | Safe projection cannot be built. | No partial raw projection. | Task372 try-again or generic unavailable envelope. | Stack trace, SQL/provider error, raw source data. | `customer_access.projection_unavailable` or internal safe-denied concept. |

## Enumeration Protection

Controllers must not reveal whether:

- an organization exists,
- a customer exists,
- a Case exists,
- an appointment exists,
- a report exists,
- a customer channel identity exists,
- a link token exists,
- a token is expired,
- a token is revoked,
- a token is already used,
- a request matched another customer,
- a report is completed but hidden.

Internal states such as not found, expired, revoked, wrong user, already used, organization disabled, unsupported channel, ambiguous input, and internal projection error must collapse to safe, generic customer-facing responses when they create enumeration risk.

`requestReference` must be a non-enumerable customer-safe concept. It must not be an internal id, raw token, raw channel id, provider id, Case id, appointment id, report id, organization id, or customer id.

## Audit / Security Boundary

Future controllers may trigger minimized internal audit/security event concepts only through an approved writer.

Customer responses must not include:

- audit event category,
- audit event id unless transformed into a customer-safe support reference,
- internal audit reason,
- root denial reason,
- raw token,
- raw provider payload,
- raw LINE id,
- full phone,
- full address,
- full email,
- AI raw payload,
- stack trace,
- SQL/provider error.

Task376 defines the boundary only. It does not add audit runtime.

## AI Boundary

AI may help draft customer-safe wording for product review.

Controllers must not call AI to produce final customer-facing responses.

AI must not:

- decide resolver state,
- decide field visibility,
- decide safe-deny category,
- decide customer-visible status,
- publish customer-facing response,
- transform internal denial reason into customer-visible hints,
- bypass controller -> resolver -> projection -> envelope flow,
- bypass permission,
- bypass organization isolation,
- bypass channel identity verification.

## Future Implementation Checklist

Before implementing customer-facing controller code, confirm:

- Task371 data classification is adopted,
- Task372 response envelope is adopted,
- Task373 DTO field map is adopted,
- Task374 projection service contract is adopted,
- Task375 resolver contract is adopted,
- safe-deny helper does not receive raw internal reason,
- controllers do not directly expose raw records,
- audit/security event payload is minimized,
- localization fallback fails closed to generic safe wording,
- API/DB smoke runs only after explicit disposable local/test runtime confirmation,
- no shared / production / Zeabur runtime is used for exploratory customer-facing access tests.

## Non-goals

Task376 does not:

- add runtime,
- add controller code,
- add route/API code,
- add helper code,
- add service code,
- add repository code,
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

This document is a controller boundary contract, not runtime approval.

The highest future risk is letting controllers bypass resolver/projection/safe-deny boundaries and assemble customer responses from raw internal records. Future implementation should keep controllers thin and orchestration-only.

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

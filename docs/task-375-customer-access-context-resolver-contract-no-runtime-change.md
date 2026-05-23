# Task 375 - Customer Access Context Resolver Contract / No Runtime Change

## Scope Summary

Task375 is a documentation-only contract for a future customer access context resolver.

This task does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, helper files, interface/code files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, projection service runtime, verification runtime, token runtime, rate-limit runtime, audit runtime, notification delivery, provider integrations, customer portal runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task375 defines how a future resolver should transform customer-facing request, link, channel identity, and verification inputs into `customerAccessContext`. It does not add resolver/helper/service/interface code.

## Current Baseline

| Area | Current status |
| --- | --- |
| Customer-facing runtime | Not started |
| Customer access context resolver | Docs contract only in this task |
| `customerAccessContext` interface | Docs proposal only |
| Projection service | Docs contract only |
| Safe-deny helper | Docs design only |
| Response envelope | Docs contract only |
| DTO field map | Docs proposal only |
| Audit/security event runtime | Not implemented |
| Rate-limit / abuse runtime | Not implemented |
| DB / DDL / migration approval | Not granted |
| Migration020 / survey runtime | Paused |
| Provider sending | Paused |
| Disposable local/test runtime for API/DB smoke | Not confirmed |

The current branch is design-ready, not runtime-ready.

## Resolver Role

The future customer access context resolver is the single decision boundary that converts request/link/channel/verification input into a safe `customerAccessContext`.

It should:

- resolve organization/channel scope,
- interpret customer-facing link reference without exposing raw token state,
- evaluate channel/provider-scoped identity reference,
- evaluate verification result,
- incorporate rate-limit / abuse signals,
- produce a verified context or a generic unavailable/denied context,
- provide only safe symbolic categories to projection and safe-deny layers.

It must not:

- build customer-facing DTOs,
- return raw source records,
- decide customer-facing field visibility,
- send notifications,
- call providers,
- call AI,
- expose raw root failure reasons to customer-facing code.

Projection service should not independently decide channel binding, token state, organization scope, or verification status.

Safe-deny helper should receive a generic safe-deny category or safe context, not raw failure detail.

## Input Boundary

Future resolver input may conceptually include:

- request metadata,
- requested surface/action,
- customer-facing link reference,
- channel/provider-scoped identity reference,
- verification attempt result,
- organization/channel scope hints,
- consent state summary,
- rate-limit / abuse signal,
- locale or customer-facing copy preference,
- support policy hint.

The resolver should not receive, log, or pass to customer response:

- raw token,
- raw link value,
- raw LINE id,
- raw provider payload,
- credentials,
- secrets,
- full phone,
- full address,
- full email,
- AI raw payload,
- raw prompt or model output,
- full audit log text,
- internal notes,
- internal Field Service Report raw payload,
- billing/settlement internals,
- inventory internals.

If future runtime needs raw values for validation, those values should remain inside tightly scoped validation helpers and must not enter logs, AI context, docs examples, projection DTOs, or customer responses.

## Output Boundary

Future `customerAccessContext` concept should include:

- organization scope,
- channel scope,
- requested access surface,
- requested action,
- verification state,
- customer-safe request reference,
- customer-safe Case/report reference when safely resolved,
- allowed projection scope,
- consent state summary,
- safe-deny category if unavailable,
- rate-limit / abuse category if applicable,
- audit/security event hint as a minimized symbolic category.

It must not expose to customer response:

- internal organization id,
- internal customer id,
- internal Case id,
- internal appointment id,
- internal report id,
- raw channel identity id,
- raw token,
- token hash,
- detailed denial reason,
- raw verification factor,
- raw provider id.

Detailed denial reasons are internal-only. They must not be used directly by customer-facing copy, projection DTO, AI wording, or localization key selection.

## Resolver State Matrix

| Resolver state | Projection allowed | Response envelope mapping | Safe-deny message family | Audit/security event class | Customer-visible details allowed | Customer-visible details forbidden |
| --- | --- | --- | --- | --- | --- | --- |
| Valid verified access | Yes, within allowed projection scope. | Success envelope. | `customerAccess.available`. | `customer_access.allowed`. | Customer-safe projection only. | Raw ids, internal rows, provider data. |
| Verification required | No projection until verified. | Verification-required envelope when safe. | `customerAccess.verificationRequired`. | `customer_access.verification_required`. | Generic verification prompt. | Resource existence, matched factor, binding state. |
| Verification failed | No. | Generic verification failed or unavailable. | `customerAccess.verificationFailed` or generic unavailable. | `customer_access.denied_generic`. | Generic retry/contact support. | Which factor failed, whether identity exists. |
| Link unavailable | No. | Link-unavailable or generic unavailable. | `customerAccess.linkUnavailable`. | `customer_access.link_unavailable`. | Generic link unavailable. | Expired/revoked/malformed/already-used detail. |
| Access unavailable | No. | Generic unavailable. | `customerAccess.genericUnavailable`. | `customer_access.denied_generic`. | Contact support / request new link if safe. | Case/report/customer/org existence. |
| Rate limited | No. | Rate-limited envelope. | `customerAccess.rateLimited`. | `customer_access.suspicious_probe` or denied category. | Generic wait/retry hint. | Threshold, rule id, score, matched identity. |
| Abuse suspected | No. | Generic unavailable or rate-limited. | `customerAccess.genericUnavailable` or `customerAccess.rateLimited`. | `customer_access.suspicious_probe`. | Minimal safe message. | Abuse reason, probe detection, resource state. |
| Unsupported channel | No. | Generic unavailable or contact support. | `customerAccess.genericUnavailable`. | `customer_access.channel_scope_mismatch` or action unavailable. | Generic contact support. | Which channel/provider failed or exists. |
| Missing/ambiguous input | No. | Generic unavailable. | `customerAccess.genericUnavailable`. | `customer_access.denied_generic`. | Generic unavailable. | Which required input was missing if it creates enumeration risk. |

## Enumeration Protection Rules

Resolver behavior must not let customers infer:

- whether an organization exists,
- whether a customer exists,
- whether a Case exists,
- whether an appointment exists,
- whether a report exists,
- whether a channel identity exists,
- whether a link token exists,
- whether a link token was valid,
- whether a link token expired,
- whether a link token was revoked,
- whether a request matched another customer.

Internal states such as not found, expired, revoked, wrong user, already used, organization disabled, unsupported channel, and ambiguous input should collapse to same-shape, same-copy, same-level-detail customer-facing responses when they create enumeration risk.

## Interaction With Projection Service

Projection service may build Task373 DTOs only after the resolver produces verified `customerAccessContext` with allowed projection scope.

Resolver does not:

- assemble DTOs,
- return raw records,
- select visible fields,
- publish customer-facing content.

Projection service must not:

- expand the resolver's allowed projection scope,
- re-check raw channel identity outside the resolver boundary,
- infer access from raw link or provider state,
- return partial raw data when context is incomplete.

If the resolver returns unavailable, partial, ambiguous, or denied context, projection service should use generic safe-deny projection rather than resource-specific output.

## Interaction With Safe-deny Helper

Resolver failure, partial context, ambiguous context, unsupported channel, link unavailable, verification failure, or rate-limit states must route to generic safe-deny.

Safe-deny helper should receive:

- requested surface,
- requested action,
- safe symbolic category,
- safe support policy,
- optional generic retry hint if allowed.

Safe-deny helper should not receive:

- raw internal reason,
- raw token,
- raw provider payload,
- raw channel identity,
- raw verification factor,
- internal ids,
- stack trace,
- SQL/provider error.

Rate-limit flows may provide a generic `retryAfterSeconds`, but must not reveal internal threshold, rule id, bucket, score, or abuse classifier.

## Audit / Security Event Boundary

Internal audit/security events may record minimized symbolic categories only.

Customer response may include only a customer-safe `requestReference`, if policy permits.

Audit/security event design must not put these into customer response or docs examples:

- raw token,
- full phone,
- full address,
- full email,
- raw LINE id,
- raw provider payload,
- AI raw payload,
- raw link value,
- raw verification code,
- detailed denial reason.

Future audit/security writer is a separate runtime task and is not implemented here.

## AI Boundary

AI may help draft customer-safe wording after resolver and safe-deny categories are already determined.

AI must not:

- decide resolver state,
- decide verification success or failure,
- decide identity match,
- decide access,
- transform internal denial reason into customer-visible hints,
- bypass resolver,
- bypass permission,
- bypass organization isolation,
- bypass channel identity verification,
- read raw token, raw provider payload, or full personal data.

AI output must remain draft-only and cannot replace resolver decisions.

## Future Implementation Checklist

Before implementing resolver code, confirm:

- Task371 data classification is adopted,
- Task372 response envelope is adopted,
- Task373 DTO field map is adopted,
- Task374 projection service contract is adopted,
- resolver output matches the approved `customerAccessContext` concept,
- safe-deny helper does not receive raw internal reason,
- audit/security event payload is minimized,
- rate-limit / abuse policy is connected before public link exposure,
- localization fallback fails closed to generic safe wording,
- projection service never expands resolver scope,
- API/DB smoke runs only after explicit disposable local/test runtime confirmation,
- no shared / production / Zeabur runtime is used for exploratory customer-facing access tests.

## Non-goals

Task375 does not:

- add runtime,
- add resolver code,
- add helper code,
- add service code,
- add repository code,
- add controller code,
- add route/API code,
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

This document is a resolver contract proposal, not runtime approval.

The highest future risk is allowing projection, controller, safe-deny, or AI layers to re-interpret raw request/link/channel state independently. Future runtime should centralize access context resolution in one narrow boundary and make all downstream layers depend on that context.

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

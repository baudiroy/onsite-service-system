# Task 372 - Customer-facing Response Envelope and Safe-deny Message Contract / No Runtime Change

## Scope Summary

Task372 is a documentation-only contract for future customer-facing response envelopes and safe-deny message boundaries.

This task does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, helper files, interface/code files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, projection service runtime, verification runtime, token runtime, rate-limit runtime, audit runtime, notification delivery, provider integrations, customer portal runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task372 extends the Task360-371 customer-facing access design branch. It defines a future response envelope shape and safe-deny message contract proposal only. It does not add runtime API behavior.

## Current Baseline

| Area | Current status |
| --- | --- |
| Customer-facing runtime | Not started |
| Customer-visible appointment timeline API | Docs-ready proposal only |
| Customer-facing service report API | Docs-ready proposal only |
| Projection service | Docs-ready design only |
| `customerAccessContext` | Docs-ready proposal only |
| Safe-deny helper | Docs-ready design only |
| Response envelope | Docs proposal only in this task |
| Message keys / localization files | Not implemented |
| Audit/security event runtime | Not implemented |
| Rate-limit / abuse runtime | Not implemented |
| DB / DDL / migration approval | Not granted |
| Migration020 / survey runtime | Paused |
| Provider sending | Paused |
| Disposable local/test runtime for API/DB smoke | Not confirmed |

The current branch is design-ready, not runtime-ready.

## Response Envelope Principles

Future customer-facing responses should use a consistent envelope so success, unavailable, verification-required, and safe-deny states do not leak internal details.

Principles:

- The response must contain a filtered projection only.
- The envelope must not expose internal source-of-truth records.
- The same envelope family should support timeline, service report, verification/access, link, issue, support, and survey surfaces.
- Deny and unavailable states must not reveal whether an organization, customer, Case, appointment, Field Service Report, customer channel identity, link token, issue, invoice, or survey exists.
- Controllers must not append internal root causes, stack traces, raw ids, provider errors, or raw link state.
- Future localization may resolve `messageKey`, but this task does not create localization files.
- Missing message mapping in future runtime should fail closed to a generic customer-safe unavailable response.

## Proposed Success Response Envelope

This is a proposal only. It does not create an API schema or runtime endpoint.

```json
{
  "status": "ok",
  "messageKey": "customerAccess.available",
  "data": {
    "surface": "timeline_or_service_report_projection"
  },
  "nextActions": [
    {
      "type": "contactSupport",
      "labelKey": "customerCommon.contactSupport",
      "available": true
    }
  ],
  "displayHints": {
    "refreshRecommended": false
  },
  "requestReference": "customer-safe-request-reference"
}
```

Success response rules:

- `data` may contain only the Task371 allowed or conditionally allowed customer-visible projection.
- `data` must not include raw source records.
- `requestReference` must be customer-safe and non-enumerable; it must not be a raw database id, raw token, raw channel id, or provider id.
- `nextActions` must be based on authorized surface/action availability.
- `displayHints` must not reveal internal eligibility, workflow state, or access-control reasons.
- Customer-facing response must not include internal source-of-truth payloads, permissions, entitlements, audit data, or internal denial details.

## Proposed Safe-deny / Error Response Envelope

This is a proposal only. It does not create an API schema or runtime endpoint.

```json
{
  "status": "unavailable",
  "messageKey": "customerAccess.genericUnavailable",
  "customerMessage": "The requested content is currently unavailable. Please verify your link or contact support.",
  "nextActions": [
    {
      "type": "contactSupport",
      "labelKey": "customerCommon.contactSupport",
      "available": true
    }
  ],
  "retryAfterSeconds": null,
  "requestReference": "customer-safe-request-reference"
}
```

Safe-deny response rules:

- `status` should be generic, such as `unavailable`, `verification_required`, `action_unavailable`, or `rate_limited`.
- `messageKey` must use a safe family that does not reveal root cause.
- `customerMessage` must be optional or localization-resolved in future runtime; Task372 does not add message files.
- `retryAfterSeconds` may be present only for a generic rate-limit / later-retry class and must not expose exact abuse scoring.
- `requestReference` must be customer-safe and useful for support without exposing ids or tokens.
- The response must not include raw resource id, Case id, appointment id, report id, organization id, customer id, channel identity id, raw token, raw provider id, raw link value, or raw verification factor.

The response must not disclose whether a link is unknown, expired, revoked, already used, malformed, rate-limited, or tied to a real Case. It may only say the link or content is currently unavailable.

## MessageKey Contract

The following message key families are proposal-only. They do not add localization files.

| Key family | Customer-visible meaning | Forbidden internal implication | Allowed next action |
| --- | --- | --- | --- |
| `customerAccess.available` | The requested customer-safe content is available. | Do not imply access to raw internal records. | Show authorized projection. |
| `customerAccess.genericUnavailable` | The requested content cannot currently be shown. | Do not imply whether the resource exists, belongs to another customer, or is hidden. | Contact support, request a new link if policy allows. |
| `customerAccess.verificationRequired` | More verification is needed before viewing content. | Do not imply the Case/report exists or belongs to the viewer. | Complete verification, contact support. |
| `customerAccess.verificationFailed` | Verification could not be completed. | Do not imply which factor failed or whether a matching identity exists. | Retry limited verification, contact support. |
| `customerAccess.linkUnavailable` | The link cannot currently be used. | Do not imply whether it was expired, revoked, malformed, valid, invalid, already used, or tied to a Case. | Request a new link, contact support. |
| `customerAccess.rateLimited` | The request cannot be processed right now. | Do not imply abuse score, rate-limit bucket, identity match, or resource existence. | Try later, contact support if urgent. |
| `customerAccess.tryAgainLater` | Temporary issue or later retry is appropriate. | Do not imply provider failure, database error, or internal projection error. | Try again later, contact support. |
| `customerCommon.contactSupport` | Customer may contact support. | Do not expose internal deny reason to support-facing customer copy. | Contact support. |
| `customerAction.unavailable` | The requested action cannot currently proceed. | Do not reveal workflow status or internal eligibility reason. | Contact support, return to status page. |

Message key naming must not encode root cause or existence details.

Avoid keys that reveal details such as:

- case not found,
- report not found,
- customer not bound,
- organization disabled,
- exact token expiration cause,
- line user mismatch,
- wrong customer,
- wrong organization,
- report exists but unavailable,
- appointment exists but unauthorized.

Those conditions may be represented internally by symbolic audit/security categories, but they must collapse to customer-safe key families.

## Timeline / Service Report Response Mapping

### Timeline Success

Future timeline success responses should use the success envelope with `data` containing the customer-safe timeline projection:

- customer-safe Case reference,
- display status,
- confirmed/proposed appointment window when allowed,
- customer action availability,
- report availability flag,
- support / issue / survey availability.

The response must not include raw appointment rows, dispatch scoring, route clustering, engineer ranking, internal notes, raw contact history, raw provider payload, or raw `finalAppointmentId`.

### Timeline Deny / Error

Future timeline deny responses must use the safe-deny envelope.

Wrong customer, wrong organization, unknown Case, unavailable projection, expired link, missing consent, and verification failure must not have distinguishable customer-facing responses unless product/security explicitly approves a safe verification prompt.

### Service Report Success

Future service report success responses should use the success envelope with `data` containing the customer-safe report projection:

- service date,
- customer-safe issue summary,
- customer-safe repair summary,
- high-level service result,
- customer-visible part/service summary,
- signature status summary,
- confirmed customer charge/invoice information if allowed,
- issue/support/survey entrypoint availability.

The response must not include internal Field Service Report raw payload, internal notes, audit log, AI raw payload, billing internals, settlement internals, inventory internals, engineer internal comments, supervisor notes, or raw ids.

### Service Report Deny / Error

Future service report deny responses must use the same safe-deny envelope as timeline.

The API must not reveal whether the report exists, whether a report link exists, whether the Case is completed, whether the customer is bound, or whether the report is not customer-visible yet.

## Access Verification Response Mapping

Verification responses must be non-enumerating.

Allowed:

- generic verification required,
- generic verification failed,
- generic contact support,
- generic link unavailable.

Forbidden:

- whether a phone/email/channel identity matched,
- whether a customer channel identity is bound,
- whether the organization exists,
- whether the Case/report exists,
- which verification factor failed,
- exact token/link state,
- raw verification code or factor value.

## Audit / Security Event Boundary

Customer-facing responses must not display audit/security internal reasons.

Future internal audit/security events may record minimized categories such as:

- allowed,
- denied generic,
- verification required,
- link unavailable,
- action unavailable,
- suspicious probe,
- cross-scope denied,
- channel scope mismatch,
- projection unavailable,
- internal error safe-denied.

The customer response must not contain:

- audit event category,
- audit event id unless it is transformed into a customer-safe support reference,
- root denial reason,
- raw token,
- raw provider payload,
- raw LINE id,
- full phone,
- full address,
- AI raw payload,
- internal error detail.

Task372 defines the boundary only. It does not add audit runtime.

## AI Boundary

AI may help draft customer-safe wording for product review.

AI must not:

- decide `messageKey`,
- decide field visibility,
- decide access,
- publish customer-visible content,
- bypass verification,
- bypass permission,
- bypass organization isolation,
- bypass projection allow-list,
- transform internal denial reason into customer-visible hints,
- see raw denial context unless minimum necessary, masked, permission-aware, tenant-isolated, and auditable.

AI output remains draft-only until product/localization review and deterministic runtime policy approve it.

## Future Runtime Readiness Checklist

Before implementing a safe-deny helper or customer-facing API runtime, confirm:

- Task371 visible data classification is adopted,
- response envelope does not include forbidden fields,
- `messageKey` names do not reveal existence, ownership, token state, or channel binding state,
- `customerAccessContext` includes organization, channel, verification, consent, and requested surface scopes,
- projection service outputs only allowed / conditionally allowed fields,
- safe-deny helper collapses internal root causes into generic safe key families,
- audit/security event writer receives only minimized internal categories,
- rate-limit / abuse policy is connected before public link exposure,
- localization fallback fails closed to generic safe wording,
- AI is limited to draft wording and cannot publish,
- API/DB smoke runs only after explicit disposable local/test runtime confirmation,
- no shared / production / Zeabur runtime is used for exploratory customer-facing access tests.

## Non-goals

Task372 does not:

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
- implement survey, complaint, callback, or issue runtime,
- change Field Service Report completion,
- change `finalAppointmentId` inference,
- change Case status workflow.

## Risk and Limitations

This document is a response contract proposal, not runtime approval.

The highest future risk is using different response shapes for different denial reasons and accidentally allowing customers to infer resource existence, ownership, channel binding, or workflow state.

The safest future path is one shared envelope family, safe message key families, classification-driven projection, and internal-only minimized audit/security events.

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

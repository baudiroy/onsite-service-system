# Task 360 - Customer-visible Appointment Timeline API Contract Proposal / No Runtime Change

## Scope Summary

Task360 is a documentation-only API contract proposal for a future customer-visible appointment timeline.

This task does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, projection services, notification delivery, provider integrations, customer portal runtime, timeline runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task360 extends the Task352-359 customer-visible surfaces branch. It proposes future API boundaries only. It does not create or approve a runtime endpoint.

## Proposed API Purpose

The future customer-visible appointment timeline API should let an authorized customer safely understand the service progress for a Case.

The API should return a customer-safe filtered projection, not internal source records.

It must not return raw appointment rows, raw dispatch visit data, internal Field Service Report payloads, contact history, audit log, billing internals, settlement internals, provider payloads, or AI output.

The API should support customer access through:

- LINE,
- Web,
- future App,
- SMS-directed link,
- Email-directed link,
- customer service assisted handoff if approved.

LINE may be an important current channel, but the API contract must remain channel-agnostic and must not hard-code LINE as the only customer identity or delivery path.

The customer-visible timeline does not replace:

- internal appointment records,
- dispatch visit records,
- Field Service Report,
- contact history,
- audit log,
- notification log,
- billing / settlement records,
- survey or issue workflow records.

## Proposed Endpoint Shape

This endpoint is proposal-only and must not be treated as an implemented route.

Conceptual endpoint:

```http
GET /customer-facing/cases/:customerSafeCaseRef/timeline
```

Possible request context:

- customer-safe Case reference,
- verified customer session,
- scoped customer channel identity,
- verified link context,
- consent / authorization context,
- organization scope resolved internally.

Design notes:

- `customerSafeCaseRef` must not be a raw database id.
- Customer-facing identifiers must not be raw `case_id`, raw `customer_id`, raw appointment id, raw `line_user_id`, provider id, or internal organization id.
- Link or verification context must not be guessable.
- A customer-facing path must not allow enumeration of Cases, Customers, Organizations, Appointments, Field Service Reports, reports, or survey links.
- Endpoint naming is only a proposal. Task360 does not add a route, controller, service, repository, validator, or permission helper.

## Required Access-control Boundary

The future API must check access before projecting any customer-visible data.

Required boundaries:

- organization scope,
- customer channel identity scope,
- customer-to-Case authorization,
- verification state,
- consent state where required,
- link validity / expiration / revocation policy as future dependency,
- customer visible data policy,
- field-level masking / redaction policy,
- channel-specific access policy without hard-coding one channel,
- audit / security event boundary as future dependency.

Safe-deny must apply to:

- wrong customer,
- wrong Case,
- wrong organization,
- cross-organization same external channel id,
- expired link,
- revoked link,
- malformed link,
- missing consent,
- unverified identity,
- unsupported channel,
- unavailable projection,
- internal resolution error.

Customer-facing errors must not reveal whether any Case, Customer, Organization, Appointment, Field Service Report, report link, survey link, or LINE binding exists.

The API may internally record detailed deny reasons in future audit or security events, but those details must not be returned to the customer.

## Proposed Response Projection

The response must be a filtered projection designed for customer understanding.

Example proposal:

```json
{
  "caseRef": "customer-safe-case-reference",
  "displayStatus": "waiting_for_customer_confirmation",
  "timeline": [
    {
      "type": "appointment_confirmation_pending",
      "labelKey": "customerTimeline.appointment.confirmationPending",
      "displayText": "Waiting for your confirmation",
      "scheduledWindow": {
        "start": "2026-01-15T09:00:00+08:00",
        "end": "2026-01-15T12:00:00+08:00",
        "timezone": "Asia/Taipei"
      },
      "action": {
        "type": "confirm_or_request_change",
        "available": true
      }
    }
  ],
  "report": {
    "available": false,
    "labelKey": "customerReport.notAvailable"
  },
  "issue": {
    "available": true,
    "labelKey": "customerIssue.entrypoint"
  },
  "support": {
    "available": true,
    "labelKey": "customerCommon.contactSupport"
  },
  "survey": {
    "available": false,
    "labelKey": "customerSurvey.unavailable"
  }
}
```

The example above is intentionally illustrative. It does not define a runtime schema.

Potential projection fields:

- customer-safe Case display reference,
- customer-safe display status,
- confirmed scheduled service window,
- waiting customer confirmation state,
- reschedule requested state,
- pending parts state,
- waiting quote state,
- customer-not-home / missed visit state using neutral wording,
- engineer arrived high-level state if approved for customer display,
- service finished high-level state,
- customer-facing report availability,
- report issue entrypoint availability,
- support contact entrypoint availability,
- optional satisfaction survey entrypoint availability.

The response must not expose internal source-of-truth payloads or raw internal rows. It must also avoid raw database IDs and organization-internal IDs unless a future approved customer-safe identifier policy permits them.

## Must-not-return Fields

The future API must not return:

- internal notes,
- audit log,
- raw AI payload,
- AI prompt,
- raw model output,
- engineer internal comments,
- supervisor notes,
- supervisor override reason,
- dispatch scoring,
- engineer ranking,
- route optimization,
- billing internal rules,
- settlement internal rules,
- vendor reconciliation data,
- brand reconciliation data,
- internal cost,
- margin,
- payout,
- inventory internal data,
- warehouse data,
- stock movement data,
- raw LINE ID,
- raw channel ID,
- provider ID,
- full phone number unless clearly necessary and authorized,
- full address unless clearly necessary and authorized,
- sensitive provider payload,
- internal complaint classification,
- database IDs that are not customer-safe,
- organization-internal IDs that are not customer-safe,
- raw `finalAppointmentId` as an internal field,
- internal Field Service Report raw payload,
- raw contact history,
- permission details,
- entitlement details,
- internal denial reason.

## Safe-deny Response Contract

Customer-facing deny responses should use generic message semantics based on the Task355 proposal. Task360 does not add localization files or runtime message keys.

| Deny surface | Proposed key family | Customer-facing direction | Internal-only detail |
| --- | --- | --- | --- |
| Generic unavailable | `customerAccess.genericUnavailable` | The content is currently unavailable; confirm the link or contact support. | Specific access failure reason. |
| Verification required | `customerAccess.verificationRequired` | Ask the customer to complete verification before viewing. | Verification state and identity resolution details. |
| Link unavailable | `customerAccess.linkUnavailable` | The link cannot currently be used; ask the customer to obtain a new link or contact support. | Whether the link was expired, revoked, malformed, or unsupported. |
| Action unavailable | `customerAccess.actionUnavailable` | The requested action cannot currently be processed. | Internal workflow status or eligibility reason. |
| Issue entrypoint unavailable | `customerAccess.reportIssueUnavailable` | The issue entrypoint is currently unavailable. | Complaint workflow eligibility or access reason. |
| Survey unavailable | `customerAccess.surveyUnavailable` | The survey is currently unavailable. | Survey eligibility, suppression, or report state. |

Rules:

- Denied reason may be recorded internally in future audit/security events.
- Customer-facing responses must not display denial root cause.
- Before verification, the API must avoid confirming resource existence.
- Wrong customer, wrong organization, expired link, revoked link, missing consent, unavailable projection, and cross-scope access should all use safe-deny wording.
- Audit / security event implementation is a future dependency and is not part of Task360.

## AI Boundary

AI may assist with future customer-visible timeline wording only as a draft aid.

AI may help:

- transform internal appointment history into customer-safe wording drafts,
- summarize pending parts or follow-up needs in neutral language,
- draft multilingual copy for product review,
- suggest shorter channel-specific wording.

AI must not:

- publish customer-visible timeline responses automatically,
- decide official timeline content,
- hide complaints,
- hide negative feedback,
- hide unresolved issues,
- expose internal notes,
- expose raw AI payloads,
- expose billing or settlement internals,
- expose audit details,
- infer or reveal internal denial reasons,
- bypass permissions,
- cross organization or tenant boundaries.

Any AI context must be:

- minimum necessary,
- masked / redacted,
- permission-aware,
- tenant-isolated,
- auditable,
- human-controlled before publication when the output affects customer-visible content.

AI output must not be treated as the API source of truth.

## Non-goals

Task360 does not:

- add an API route,
- add a controller,
- add a service,
- add a repository,
- add a validator,
- add a projection service,
- add permission runtime,
- add customer channel verification runtime,
- add localization files,
- add notification sending,
- add smoke tests,
- modify schema, migration, or indexes,
- touch provider integrations,
- touch LINE / SMS / Email / App runtime,
- touch AI / RAG runtime,
- touch billing / settlement runtime,
- touch quote / payment / invoice runtime,
- touch inventory / WMS runtime,
- touch customer-facing report runtime,
- touch survey runtime,
- touch complaint / callback runtime,
- change Field Service Report completion,
- change `finalAppointmentId` inference,
- change Case workflow.

## Future Task Candidates

These are future tasks only and must not be implemented as part of Task360.

### Customer-facing Service Report API Contract Proposal

Define customer-safe report response fields, report access behavior, fee/signature display boundaries, and must-not-return fields.

### Timeline Projection Service Permission Filter Design

Design how internal appointment and dispatch visit records become customer-safe timeline events through allow-lists, field masking, and organization-scoped authorization.

### Customer Channel Identity Verification Runtime Design

Design scoped verification for LINE, Web link, Web portal, App, SMS-directed link, and Email-directed link.

### Safe-deny Response Helper Design

Design a shared helper for customer-facing API surfaces to return consistent non-enumerating responses.

### Customer-visible Localization File Implementation

Implement localization files only after product copy review and API contract approval.

### Timeline API Access-control Smoke Tests

Add smoke/integration tests only after API runtime exists and disposable local/test runtime is confirmed.

### Multi-channel Delivery Policy For Timeline Links

Define when timeline links can be delivered through LINE, App, SMS, Email, Web portal, or customer service handoff.

## Risk and Limitations

This proposal is not a runtime contract approval. It defines a direction for future design and review.

Future implementation must still resolve:

- customer-safe identifier format,
- link lifecycle policy,
- identity verification flow,
- consent handling,
- projection service field allow-list,
- safe-deny helper behavior,
- localization files,
- audit / security event mapping,
- channel delivery policy,
- smoke/integration tests in a disposable local/test environment.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No localization file is added by Task360.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke test change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, or production data details.

Future timeline implementation must continue to avoid exposing resource existence, ownership, organization scope, channel identity state, internal denial reason, provider data, AI payload, billing internals, settlement internals, inventory internals, or staff-management data.

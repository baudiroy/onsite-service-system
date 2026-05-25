# Task 361 - Customer-facing Service Report API Contract Proposal / No Runtime Change

## Scope Summary

Task361 is a documentation-only API contract proposal for a future customer-facing service report.

This task does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, projection services, notification delivery, provider integrations, customer portal runtime, report runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task361 extends the Task352-360 customer-visible surfaces branch. It proposes future API boundaries only. It does not create or approve a runtime endpoint.

## Proposed API Purpose

The future customer-facing service report API should let an authorized customer safely view a post-completion service report.

The API should return a customer-safe filtered projection, not the internal Field Service Report raw payload.

It must not replace:

- internal Field Service Report,
- internal appointment records,
- dispatch visit records,
- contact history,
- audit log,
- billing / settlement records,
- complaint / follow-up workflow,
- survey workflow.

The API should support access through:

- LINE,
- Web,
- future App,
- SMS-directed link,
- Email-directed link,
- customer service assisted resend if approved.

LINE may be an important current channel, but the API contract must remain channel-agnostic and must not hard-code LINE as the only customer identity or delivery path.

## Proposed Endpoint Shape

These endpoints are proposal-only and must not be treated as implemented routes.

Conceptual endpoint options:

```http
GET /customer-facing/cases/:customerSafeCaseRef/service-report
```

or:

```http
GET /customer-facing/reports/:customerSafeReportRef
```

Possible request context:

- customer-safe Case reference or customer-safe report reference,
- verified customer session,
- scoped customer channel identity,
- verified link context,
- consent / authorization context,
- organization scope resolved internally.

Design notes:

- `customerSafeCaseRef` and `customerSafeReportRef` must not be raw database ids.
- Customer-facing identifiers must not be raw `case_id`, raw `customer_id`, raw `field_service_report_id`, raw appointment id, raw `line_user_id`, provider id, or internal organization id.
- A customer-facing path must not allow enumeration of Cases, Customers, Organizations, Appointments, Field Service Reports, reports, invoices, surveys, or issue records.
- Endpoint naming is only a proposal. Task361 does not add a route, controller, service, repository, validator, or permission helper.

## Required Access-control Boundary

The future API must check access before projecting any customer-visible service report data.

Required boundaries:

- organization scope,
- customer channel identity scope,
- customer-to-Case authorization,
- customer-to-report authorization,
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
- wrong report,
- wrong organization,
- cross-organization same external channel id,
- expired link,
- revoked link,
- malformed link,
- missing consent,
- unverified identity,
- unavailable report projection,
- report not customer-visible yet,
- internal resolution error.

Customer-facing errors must not reveal whether any Case, Customer, Organization, Appointment, Field Service Report, report link, survey link, issue entrypoint, invoice, or LINE binding exists.

The API may internally record detailed deny reasons in future audit or security events, but those details must not be returned to the customer.

## Proposed Response Projection

The response must be a filtered projection designed for customer understanding.

Example proposal:

```json
{
  "caseRef": "customer-safe-case-reference",
  "reportTitle": "Service report",
  "serviceDate": "2026-01-15",
  "completedWindow": {
    "start": "2026-01-15T09:00:00+08:00",
    "end": "2026-01-15T12:00:00+08:00",
    "timezone": "Asia/Taipei"
  },
  "issueSummary": {
    "labelKey": "customerReport.issueSummary",
    "text": "Customer-safe issue summary"
  },
  "repairSummary": {
    "labelKey": "customerReport.repairSummary",
    "text": "Customer-safe repair action summary"
  },
  "serviceResult": {
    "labelKey": "customerReport.serviceCompleted",
    "status": "completed"
  },
  "serviceItems": [
    {
      "labelKey": "customerReport.serviceItem",
      "name": "Customer-visible service item",
      "quantity": 1
    }
  ],
  "signature": {
    "status": "signed",
    "labelKey": "customerReport.signature.signed"
  },
  "customerCharges": {
    "available": false,
    "labelKey": "customerReport.charge.none"
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
- service report display title,
- service date,
- completed appointment display window,
- customer-safe issue summary,
- customer-safe repair action summary,
- customer-visible parts or service item summary,
- high-level service result,
- customer-safe signature status,
- customer-safe signature exception wording if applicable,
- confirmed customer charge / approval / invoice information if applicable,
- report issue / unresolved issue entrypoint availability,
- support contact entrypoint availability,
- optional satisfaction survey entrypoint availability.

The response must not expose internal Field Service Report raw payloads, raw database IDs, internal statuses, audit details, dispatch scoring, AI output, billing internal data, settlement internal data, or inventory internal data.

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
- signature raw file,
- signature image,
- signature storage key,
- signature provider payload,
- internal signature exception reason,
- supervisor approval detail,
- raw contact history,
- permission details,
- entitlement details,
- internal denial reason.

## Signature and Exception Contract

Customer signature is important service completion evidence, but it is not an absolute condition for every completion.

The future customer-facing report may display customer-safe signature status, such as:

- signed,
- representative signed,
- signature not collected,
- remote completion,
- customer-safe exception recorded.

It must not expose:

- internal supervisor review details,
- internal dispute handling,
- staff-performance notes,
- internal audit events,
- sensitive evidence files,
- raw signature file identifiers,
- storage object keys.

No-signature, refused-signature, representative-signature, remote-completion, site-unattended, and other exception scenarios should be projected only through approved customer-safe wording.

Future signature files should follow object/file storage access policy. Task361 does not implement file storage, file access, signature capture, signature display, or exception runtime.

## Fee / Charge Contract

If completion involves customer charges, the API should only display customer-relevant and confirmed charge, approval, payment, receipt, or invoice information.

Potential customer-visible fee fields:

- confirmed charge item,
- customer-facing amount,
- customer approval status,
- approval channel summary,
- approval time,
- payment status,
- invoice / receipt status,
- customer-safe invoice / receipt access link if approved.

The API must not display:

- internal settlement amount,
- supplier payout,
- engineer cost,
- internal cost,
- margin,
- vendor reconciliation rules,
- brand reconciliation rules,
- rule version internals,
- AI parsing draft,
- internal finance review notes.

AI may help draft customer-safe fee summaries or flag missing customer approval internally.

AI must not:

- approve customer fees,
- approve settlement,
- issue an invoice,
- decide payment status,
- modify formal charge records,
- modify formal billing / settlement outcomes,
- act as customer consent.

## Issue / Complaint Entrypoint Contract

The customer-facing report may include a report issue / unresolved issue entrypoint as a customer-facing action.

Future customer actions may include:

- issue still exists,
- service question,
- request support,
- request callback,
- report problem with service,
- report missing or incorrect report information.

If the customer reports an unresolved issue, low rating, negative feedback, complaint, or callback request, future runtime should create follow-up / escalation records according to an approved workflow.

The API must not reveal:

- internal complaint classification,
- liability analysis,
- responsibility assignment,
- supervisor review content,
- staff notes,
- internal escalation routing,
- AI risk labels.

AI may assist with internal summary, classification, and risk flagging.

AI must not:

- hide negative feedback,
- hide complaints,
- automatically close complaints,
- modify satisfaction ratings,
- decide that no human follow-up is needed for high-risk complaints,
- publish internal complaint classification to the customer.

## Safe-deny Response Contract

Customer-facing deny responses should use generic message semantics based on the Task355 proposal. Task361 does not add localization files or runtime message keys.

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
- Audit / security event implementation is a future dependency and is not part of Task361.

## Appointment / Field Service Report Boundary

The Field Service Report is the Case-level formal completion summary.

The customer-facing service report is a filtered projection. It is not the internal Field Service Report raw dump.

Core invariant:

- one Case = one formal Field Service Report,
- one Case can have multiple appointments / dispatch visits,
- multiple visits do not create multiple formal Field Service Reports,
- pending parts, cancellation, no-show, unable-to-repair, and follow-up visits are recorded at the appointment / dispatch visit layer,
- customer-facing service report should summarize the final customer-visible outcome,
- `finalAppointmentId` remains backend/system determined and should not be exposed as a raw customer-facing field.

## AI Boundary

AI may assist with future customer-facing report wording only as a draft aid.

AI may help:

- convert internal Field Service Report drafts into customer-safe wording drafts,
- draft issue summaries,
- draft repair action summaries,
- draft service result wording,
- draft customer-safe parts / service item descriptions,
- draft customer-safe fee summary wording after formal approval exists.

AI must not:

- publish customer-facing reports automatically,
- decide official report content,
- treat uncertain content as formal fact,
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

Task361 does not:

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

These are future tasks only and must not be implemented as part of Task361.

### Customer-facing Service Report Projection Service Permission Filter Design

Design how internal Field Service Report, appointment, signature, fee, issue, and survey availability data become a customer-safe report projection.

### Customer-facing Service Report API Access-control Smoke Tests

Add smoke/integration tests only after API runtime exists and disposable local/test runtime is confirmed.

### Safe-deny Response Helper Design

Design a shared helper for customer-facing API surfaces to return consistent non-enumerating responses.

### Customer-visible Localization File Implementation

Implement localization files only after product copy review and API contract approval.

### Signature Exception Customer-safe Display Policy Implementation

Design approved customer-safe signature status and exception wording before runtime display.

### Fee / Invoice Display Policy Implementation

Design customer-facing charge, approval, payment, invoice, and receipt display policy.

### Complaint / Unresolved Issue Follow-up Workflow Review

Design how report issue entrypoints create follow-up or escalation records.

### Multi-channel Delivery Policy For Service Report Links

Define when report links can be delivered through LINE, App, SMS, Email, Web portal, or customer service handoff.

## Risk and Limitations

This proposal is not a runtime contract approval. It defines a direction for future design and review.

Future implementation must still resolve:

- customer-safe report identifier format,
- report link lifecycle policy,
- identity verification flow,
- consent handling,
- projection service field allow-list,
- signature exception display policy,
- customer fee / invoice display policy,
- issue / complaint workflow,
- safe-deny helper behavior,
- localization files,
- audit / security event mapping,
- channel delivery policy,
- smoke/integration tests in a disposable local/test environment.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No localization file is added by Task361.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke test change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, or production data details.

Future customer-facing service report implementation must continue to avoid exposing resource existence, ownership, organization scope, channel identity state, internal denial reason, provider data, AI payload, billing internals, settlement internals, inventory internals, signature storage internals, or staff-management data.

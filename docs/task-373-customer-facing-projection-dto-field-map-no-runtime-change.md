# Task 373 - Customer-facing Projection DTO Field Map / No Runtime Change

## Scope Summary

Task373 is a documentation-only field map for future customer-facing projection DTOs.

This task does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, helper files, interface/code files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, projection service runtime, verification runtime, token runtime, rate-limit runtime, audit runtime, notification delivery, provider integrations, customer portal runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task373 maps Task371 visible data classification and Task372 response envelope principles into future conceptual DTO fields for timeline, service report, and access/unavailable responses.

## Current Baseline

| Area | Current status |
| --- | --- |
| Customer-facing runtime | Not started |
| Customer-facing DTOs | Docs proposal only in this task |
| Response envelope | Docs proposal only |
| Projection service | Docs-ready design only |
| `customerAccessContext` | Docs-ready proposal only |
| Safe-deny helper | Docs-ready design only |
| Localization files | Not implemented |
| API routes / controllers / services | Not implemented |
| DB / DDL / migration approval | Not granted |
| Migration020 / survey runtime | Paused |
| Provider sending | Paused |
| Disposable local/test runtime for API/DB smoke | Not confirmed |

The current branch is design-ready, not runtime-ready.

## DTO Design Principles

Future DTOs are customer-safe projections. They are not internal source-of-truth records.

DTO principles:

- DTOs must not mirror internal table shapes.
- DTOs must not expose raw Case, Customer, Appointment, Field Service Report, Contact History, Channel Identity, Audit, Billing, Settlement, Inventory, or AI payload rows.
- DTO field names must not reveal organization, customer, Case, appointment, report, channel identity, link token, or verification factor existence.
- DTOs should be compatible with the Task372 response envelope.
- Success DTOs should contain only Task371 allowed or conditionally allowed fields.
- Deny/unavailable DTOs should usually contain no resource-specific data.
- Missing or uncertain mapping should fail closed to safe-deny, not partial raw output.

## Timeline Projection DTO Field Map

Future success response shape:

```json
{
  "surface": "timeline",
  "caseRef": "customer-safe-case-reference",
  "serviceDisplayTitle": "Service progress",
  "displayStatus": "waiting_for_customer_confirmation",
  "appointmentWindow": {
    "status": "proposed",
    "start": "2026-01-15T09:00:00+08:00",
    "end": "2026-01-15T12:00:00+08:00",
    "timezone": "Asia/Taipei"
  },
  "timelineItems": [],
  "nextActions": [],
  "support": {
    "available": true,
    "labelKey": "customerCommon.contactSupport"
  }
}
```

The example is illustrative only and does not define runtime API schema.

| DTO field | Source domain concept | Visibility class | Redaction / masking requirement | Forbidden internal leakage |
| --- | --- | --- | --- | --- |
| `surface` | Requested customer-facing surface | Allowed | Fixed safe enum such as `timeline`. | Internal route/controller name. |
| `caseRef` | Customer-safe Case reference | Allowed | Must be non-enumerable and not raw `case_id`. | Raw Case id, organization id, customer id. |
| `serviceDisplayTitle` | Product copy / service category | Allowed | Customer-safe wording only. | Internal case type rules or staff note. |
| `displayStatus` | Projected Case / appointment / report status | Allowed / conditional | Use customer-safe status vocabulary. | Raw workflow enum if it reveals staff-only state. |
| `appointmentWindow.status` | Proposed or confirmed appointment context | Conditional / human-confirmed | Show only dispatcher-approved proposed or customer-confirmed context. | Internal dispatch draft, route clustering, queue position. |
| `appointmentWindow.start/end/timezone` | Appointment scheduled window | Conditional / human-confirmed | Show only customer-safe approved window; timezone explicit. | Internal schedule conflicts or engineer route plan. |
| `timelineItems[].type` | Customer-safe event type | Allowed / conditional | Use safe event families only. | Internal event names, audit categories, raw lifecycle details. |
| `timelineItems[].labelKey` | Customer-facing localization key | Allowed | Must use safe generic names. | Keys that reveal not-found, wrong-customer, or internal denial reason. |
| `timelineItems[].displayText` | Customer-facing wording | Allowed / conditional | Future localization/product approved. | Internal notes, AI raw draft, provider error. |
| `timelineItems[].action` | Customer action availability | Conditional | Action only when verified and eligible. | Internal eligibility reason, entitlement detail. |
| `nextActions[]` | Customer action list | Conditional | Use safe labels and availability only. | Hidden workflow state, staff-only decision reason. |
| `support` | Support entrypoint | Allowed / conditional | Generic support/contact hint. | Internal escalation reason or staff assignment. |

Timeline DTO must not include:

- internal dispatch order,
- route clustering,
- engineer internal score,
- engineer internal performance note,
- internal appointment note,
- audit reason,
- raw contact history,
- raw `finalAppointmentId`,
- raw provider payload,
- raw channel identity,
- raw database ids.

## Service Report Projection DTO Field Map

Future success response shape:

```json
{
  "surface": "serviceReport",
  "caseRef": "customer-safe-case-reference",
  "reportRef": "customer-safe-report-reference",
  "reportTitle": "Service report",
  "serviceDate": "2026-01-15",
  "serviceWindow": {
    "start": "2026-01-15T09:00:00+08:00",
    "end": "2026-01-15T12:00:00+08:00",
    "timezone": "Asia/Taipei"
  },
  "servicedItemSummary": {},
  "issueSummary": {},
  "workPerformedSummary": {},
  "partsSummary": [],
  "chargesSummary": {
    "available": false
  },
  "signatureSummary": {},
  "warrantyOrCareNote": null,
  "nextActions": []
}
```

The example is illustrative only and does not define runtime API schema.

| DTO field | Source domain concept | Visibility class | Redaction / masking requirement | Forbidden internal leakage |
| --- | --- | --- | --- | --- |
| `surface` | Requested customer-facing surface | Allowed | Fixed safe enum such as `serviceReport`. | Internal report route/controller name. |
| `caseRef` | Customer-safe Case reference | Allowed | Must not be raw `case_id`. | Raw Case id, organization id, customer id. |
| `reportRef` | Customer-safe report reference | Conditional | Non-enumerable, not raw Field Service Report id. | Raw report id, report storage key. |
| `reportTitle` | Customer-facing copy | Allowed | Future localization/product approved. | Internal report type or staff workflow state. |
| `serviceDate` | Completed service date | Allowed / conditional | Date only if customer-visible report is authorized. | Internal completion audit timestamp if not customer-facing. |
| `serviceWindow` | Final completed appointment window | Conditional | Customer-safe start/end window only. | Raw `finalAppointmentId`, internal appointment row. |
| `servicedItemSummary` | Product / asset / service item | Conditional | Minimize detail; mask serial if required. | Full internal asset fields, inventory records. |
| `issueSummary` | Customer-safe problem summary | Allowed / human-confirmed | Use approved summary; avoid internal notes. | Internal diagnosis note, AI raw summary, complaint risk flag. |
| `workPerformedSummary` | Customer-safe repair/action summary | Allowed / human-confirmed | Use approved customer wording. | Engineer internal comments, supervisor notes. |
| `partsSummary[]` | Customer-visible parts/service items | Conditional | Show category/name only when policy allows. | Inventory internals, warehouse stock, cost, settlement eligibility. |
| `chargesSummary` | Customer charges / approval / invoice | Conditional / human-confirmed | Show only confirmed customer-relevant charge/approval/invoice info. | Billing internals, settlement rules, vendor payout, margin. |
| `signatureSummary` | Signature / exception status | Conditional / human-confirmed | Show safe signed/representative/no-signature summary. | Raw signature file/storage internals. |
| `warrantyOrCareNote` | Customer-facing note | Conditional / human-confirmed | Approved customer copy only. | Internal liability analysis. |
| `nextActions[]` | Report issue, support, survey | Conditional | Use action availability only. | Complaint classification, survey suppression reason. |

Service report DTO must not include:

- internal Field Service Report raw payload,
- internal notes,
- audit log,
- engineer internal comments,
- supervisor notes,
- billing / settlement internal rules,
- vendor/brand reconciliation internals,
- inventory internals,
- AI raw payload,
- raw prompt or model output,
- raw database ids,
- raw channel/provider ids.

## Access Verification / Unavailable DTO Field Map

Future unavailable or verification-required responses should use the Task372 safe-deny envelope with little or no resource-specific `data`.

Conceptual unavailable response:

```json
{
  "status": "unavailable",
  "messageKey": "customerAccess.genericUnavailable",
  "data": null,
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

| DTO field | Source domain concept | Visibility class | Redaction / masking requirement | Forbidden internal leakage |
| --- | --- | --- | --- | --- |
| `status` | Safe response state | Allowed | Generic state only. | Exact root cause or internal workflow state. |
| `messageKey` | Safe-deny key family | Allowed | No existence/ownership/state leak in key name. | Not-found, wrong-customer, exact token state. |
| `data` | Resource projection | Forbidden by default on deny | Usually `null` or absent. | Any Case/report/appointment/customer-specific data. |
| `nextActions[]` | Customer-safe action | Conditional | Generic contact, verify, retry later if safe. | Internal support routing reason or risk category. |
| `retryAfterSeconds` | Rate-limit hint | Conditional | Only generic delay; optional. | Abuse score, rate-limit bucket, identity match. |
| `requestReference` | Support reference | Conditional | Non-enumerable customer-safe support reference. | Raw resource id, token, provider id, channel identity id. |

Access/unavailable DTO must not return:

- resource id,
- raw token,
- channel identity id,
- Case id,
- appointment id,
- report id,
- organization id,
- customer id,
- raw provider id,
- raw verification factor,
- exact link state,
- exact verification failure reason.

## Redaction and Masking Rules

| Data type | Default customer-facing rule | Possible conditional rule | Always forbidden |
| --- | --- | --- | --- |
| Customer name | Omit or use minimal display name. | Masked name if operationally needed. | Full identity in generic report/deny response. |
| Phone | Omit from timeline/report by default. | Masked confirmation hint only if needed. | Full phone in response, log, AI context, or deny response. |
| Address | Omit from generic response. | Service location summary or masked address when required for appointment confirmation. | Full door/address in reports unless explicitly approved. |
| Engineer information | Omit by default. | Public display name/status if organization policy allows. | Personal phone, score, workload, internal comments. |
| Fees / charges | Omit by default. | Confirmed customer charge/approval/invoice summary only. | Internal settlement, cost, margin, payout, reconciliation rules. |
| Photos | Omit by default. | Selected customer-visible file link after storage/access policy. | Raw internal evidence photos or permanent public links. |
| Signature | Status summary only. | Customer-safe exception summary after review. | Raw signature file/storage key in DTO. |
| Documents | Omit by default. | Selected customer-visible file link after review and expiration policy. | Internal documents, audit exports, provider payloads. |
| Raw LINE / provider identity | Never visible. | None. | Raw LINE id, provider id, channel binding internals. |
| Tokens / secrets / credentials | Never visible. | None. | Token, secret, `DATABASE_URL`, credentials, verification code. |

Large files remain future storage / access policy requirements. Task373 does not add upload, download, file storage, file link, signature, photo, or document runtime.

## AI Boundary

AI may help convert allowed DTO fields into customer-safe wording drafts.

AI must not:

- decide DTO field visibility,
- decide access,
- decide message keys,
- transform internal reason, audit reason, denial reason, billing rule, inventory state, engineer comment, supervisor note, or provider payload into customer-visible DTO output,
- publish customer-facing content,
- receive raw internal source records unless the content passes minimum necessary, masked, permission-aware, tenant-isolated, auditable gates.

AI output remains draft-only and must be separated from official DTO publication.

## Future Implementation Checklist

Before implementing DTOs in code, confirm:

- DTO field map matches Task371 classification,
- response envelope follows Task372 contract,
- projection service outputs only allowed or conditionally allowed fields,
- safe-deny helper returns no resource-specific `data` on deny by default,
- `customerAccessContext` includes organization, channel, verification, consent, and requested surface scopes,
- customer channel identity is not treated as global identity,
- DTO field names do not reveal internal table shape,
- audit/security event writer receives minimized internal categories only,
- localization fallback fails closed to generic safe wording,
- API/DB smoke runs only after explicit disposable local/test runtime confirmation,
- no shared / production / Zeabur runtime is used for exploratory customer-facing access tests.

## Non-goals

Task373 does not:

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

This document is a field map proposal, not runtime approval.

The highest future risk is letting DTOs mirror internal database rows or letting individual API handlers pick fields ad hoc. Future implementation should centralize projection and treat every field as forbidden until explicitly allowed.

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

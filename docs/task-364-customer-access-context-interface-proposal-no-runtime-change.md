# Task 364 - Customer Access Context Interface Proposal / No Runtime Change

## Scope Summary

Task364 is a documentation-only interface proposal for a future `customerAccessContext` contract.

This task does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, interface/code files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, projection service runtime, verification runtime, notification delivery, provider integrations, customer portal runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task364 extends Task360-363: customer-facing API contract proposals, projection service permission filter design, and customer channel identity verification design. It proposes a shared access contract only.

## Interface Purpose

Future `customerAccessContext` should be the shared fail-closed access contract between:

- customer channel identity verification,
- customer-facing API controllers,
- customer-visible projection service,
- safe-deny helper,
- audit / security event boundary.

Its purpose is to:

- pass verification results to projection service without exposing raw provider identifiers,
- avoid controllers or projection services making authorization decisions from raw identifiers,
- centralize organization scope,
- centralize channel identity scope,
- centralize verification and consent status,
- centralize surface/action availability,
- isolate internal denial reason from customer-facing safe-deny wording,
- support consistent non-enumerating behavior across customer-facing surfaces.

The context is not an authorization bypass. It is a reduced, safe, fail-closed summary of access decisions.

## Proposed Conceptual Shape

This shape is proposal-only and must not be treated as an implemented TypeScript or JavaScript interface.

```ts
type CustomerAccessContext = {
  organizationScope: {
    status: "resolved" | "unknown";
    organizationRef: "internal-only-symbolic-ref";
  };
  channelScope: {
    status: "resolved" | "unknown";
    channelType: "line" | "web" | "app" | "sms_link" | "email_link" | "assisted";
    channelRef: "internal-only-symbolic-ref";
  };
  subject: {
    status: "verified" | "verificationRequired" | "notAuthorized" | "unknown";
    customerRef: "customer-safe-internal-ref";
  };
  caseAccess: {
    caseRef: "customer-safe-case-ref";
    status: "authorized" | "notAuthorized" | "unknown" | "unavailable";
  };
  reportAccess: {
    reportRef: "customer-safe-report-ref";
    status: "authorized" | "notAuthorized" | "unknown" | "unavailable";
  };
  verification: {
    status: "verified" | "required" | "failed" | "unknown";
  };
  consent: {
    status: "granted" | "required" | "missing" | "unknown";
  };
  surfaces: {
    timeline: SurfaceAccess;
    serviceReport: SurfaceAccess;
    reportIssue: SurfaceAccess;
    survey: SurfaceAccess;
  };
  safeDeny: {
    family:
      | "customerAccess.genericUnavailable"
      | "customerAccess.verificationRequired"
      | "customerAccess.linkUnavailable"
      | "customerAccess.actionUnavailable"
      | "customerAccess.reportIssueUnavailable"
      | "customerAccess.surveyUnavailable";
  };
  riskFlags: string[];
  auditHint: {
    category: "access_allowed" | "access_denied" | "verification_required" | "link_unavailable" | "surface_unavailable";
  };
};

type SurfaceAccess = {
  status: "authorized" | "notAuthorized" | "unknown" | "unavailable" | "verificationRequired" | "consentRequired";
};
```

The context must not contain:

- raw LINE ID,
- raw provider payload,
- full phone,
- full address,
- full email,
- full audit log,
- internal notes,
- raw database identifiers,
- raw AI prompt,
- raw AI output,
- link raw value,
- verification code,
- secret,
- token,
- root denial reason intended for customer display.

Symbolic refs in this proposal represent reduced internal references, not customer-facing output fields and not raw database ids.

## Status Semantics

The status names below are proposal-only.

| Status | Meaning | Customer-facing behavior |
| --- | --- | --- |
| `authorized` | Access to the requested surface is allowed after all checks. | Projection service may return customer-safe projection. |
| `notAuthorized` | The resolved subject is not authorized for the resource or action. | Usually collapse into generic safe-deny. |
| `unknown` | The system cannot safely resolve or confirm access. | Usually collapse into generic safe-deny. |
| `verificationRequired` | More verification is needed and showing a verification prompt is safe. | Show generic verification prompt only when it does not create enumeration risk. |
| `consentRequired` | Consent is required before the surface/action can proceed. | Show generic verification/consent prompt only when safe. |
| `unavailable` | The surface/action is not available or not ready. | Show action unavailable, link unavailable, report issue unavailable, survey unavailable, or generic safe-deny. |

Customer-facing responses should not expose raw statuses directly.

In many cases, `notAuthorized`, `unknown`, and `unavailable` should collapse into `customerAccess.genericUnavailable` to avoid enumeration.

Internal logs may retain more granular categories, but customer-facing responses must not reveal root cause.

## Safe-deny Mapping

The `safeDeny.family` value should be a proposal-only family, not a localized message implementation.

| Family | Intended use | Must not reveal |
| --- | --- | --- |
| `customerAccess.genericUnavailable` | Wrong customer, wrong organization, unknown resource, unavailable resource, ambiguous access failure. | Case/customer/org/report existence, correct owner, tenant boundary. |
| `customerAccess.verificationRequired` | Legitimate flow needs verification and the prompt does not create enumeration risk. | Whether the Case/customer/report exists before verification is safe. |
| `customerAccess.linkUnavailable` | Link cannot be used due to invalid/expired/revoked/unsupported state. | Whether the link was once valid or tied to a real Case. |
| `customerAccess.actionUnavailable` | A customer action cannot proceed. | Internal workflow state or denial reason. |
| `customerAccess.reportIssueUnavailable` | Issue entrypoint cannot proceed. | Complaint eligibility or internal issue workflow status. |
| `customerAccess.surveyUnavailable` | Survey entrypoint cannot proceed. | Survey eligibility, report status, suppression, or customer match. |

Mapping is proposal-only.

No localization files are added by Task364.

The `safeDeny` field should not contain sensitive denial details, raw identifiers, token values, link values, verification codes, or provider payloads.

## Interaction Boundaries

### Verification Layer

The verification layer should create or update `customerAccessContext`.

It should:

- resolve organization and channel scope,
- validate link context,
- validate scoped channel identity,
- validate verification factors,
- validate consent,
- validate customer-to-Case/report authorization,
- collapse customer-facing denial state into safe-deny families.

It should not pass raw provider payloads or displayable root denial reasons downstream.

### Projection Service

The projection service should accept `customerAccessContext` and minimum necessary internal data.

It should:

- check surface authorization,
- return customer-safe projections only when allowed,
- omit unsafe fields,
- return safe-deny when access is not permitted,
- avoid using raw provider identifiers for identity resolution.

### API Controller

The API controller should not stitch raw internal rows into customer responses.

It should:

- call the verification/access layer,
- call the projection service with `customerAccessContext`,
- return the customer-safe projection or safe-deny response.

### Safe-deny Helper

Future safe-deny helper may use `safeDeny.family` to produce generic customer-facing responses.

It must not display root denial reason.

### AI Boundary

AI must not:

- modify `customerAccessContext`,
- decide access,
- override verification,
- override organization scope,
- override consent,
- override safe-deny behavior.

AI may only receive minimum necessary, masked, permission-aware, tenant-isolated context after access filtering.

### Audit / Security Boundary

Audit or security events should receive only minimum necessary internal categories.

They should avoid raw provider payloads, raw link values, verification codes, full phone, full address, full email, secrets, tokens, or raw AI payloads.

## Examples

These examples are safe pseudo examples. They do not contain real personal data, raw database ids, raw LINE ids, token values, full phone numbers, or full addresses.

### Example 1 - Verified Customer Can View Timeline

```json
{
  "organizationScope": { "status": "resolved", "organizationRef": "org_ref_internal" },
  "channelScope": { "status": "resolved", "channelType": "line", "channelRef": "channel_ref_internal" },
  "subject": { "status": "verified", "customerRef": "customer_ref_safe_internal" },
  "caseAccess": { "caseRef": "CASE-SAFE-REF", "status": "authorized" },
  "reportAccess": { "reportRef": "REPORT-SAFE-REF", "status": "unknown" },
  "verification": { "status": "verified" },
  "consent": { "status": "granted" },
  "surfaces": {
    "timeline": { "status": "authorized" },
    "serviceReport": { "status": "unavailable" },
    "reportIssue": { "status": "authorized" },
    "survey": { "status": "unavailable" }
  },
  "safeDeny": { "family": "customerAccess.actionUnavailable" },
  "riskFlags": [],
  "auditHint": { "category": "access_allowed" }
}
```

### Example 2 - Unverified Customer Needs Verification

```json
{
  "organizationScope": { "status": "resolved", "organizationRef": "org_ref_internal" },
  "channelScope": { "status": "resolved", "channelType": "web", "channelRef": "channel_ref_internal" },
  "subject": { "status": "verificationRequired", "customerRef": "unknown" },
  "caseAccess": { "caseRef": "CASE-SAFE-REF", "status": "unknown" },
  "reportAccess": { "reportRef": "unknown", "status": "unknown" },
  "verification": { "status": "required" },
  "consent": { "status": "unknown" },
  "surfaces": {
    "timeline": { "status": "verificationRequired" },
    "serviceReport": { "status": "verificationRequired" },
    "reportIssue": { "status": "verificationRequired" },
    "survey": { "status": "verificationRequired" }
  },
  "safeDeny": { "family": "customerAccess.verificationRequired" },
  "riskFlags": [],
  "auditHint": { "category": "verification_required" }
}
```

### Example 3 - Wrong Organization Or Wrong Customer Collapsed To Generic Safe-deny

```json
{
  "organizationScope": { "status": "unknown", "organizationRef": "unknown" },
  "channelScope": { "status": "unknown", "channelType": "sms_link", "channelRef": "unknown" },
  "subject": { "status": "unknown", "customerRef": "unknown" },
  "caseAccess": { "caseRef": "unknown", "status": "unknown" },
  "reportAccess": { "reportRef": "unknown", "status": "unknown" },
  "verification": { "status": "unknown" },
  "consent": { "status": "unknown" },
  "surfaces": {
    "timeline": { "status": "unknown" },
    "serviceReport": { "status": "unknown" },
    "reportIssue": { "status": "unknown" },
    "survey": { "status": "unknown" }
  },
  "safeDeny": { "family": "customerAccess.genericUnavailable" },
  "riskFlags": ["possible_cross_scope_access"],
  "auditHint": { "category": "access_denied" }
}
```

### Example 4 - Service Report Not Ready Or Unavailable

```json
{
  "organizationScope": { "status": "resolved", "organizationRef": "org_ref_internal" },
  "channelScope": { "status": "resolved", "channelType": "app", "channelRef": "channel_ref_internal" },
  "subject": { "status": "verified", "customerRef": "customer_ref_safe_internal" },
  "caseAccess": { "caseRef": "CASE-SAFE-REF", "status": "authorized" },
  "reportAccess": { "reportRef": "REPORT-SAFE-REF", "status": "unavailable" },
  "verification": { "status": "verified" },
  "consent": { "status": "granted" },
  "surfaces": {
    "timeline": { "status": "authorized" },
    "serviceReport": { "status": "unavailable" },
    "reportIssue": { "status": "authorized" },
    "survey": { "status": "unavailable" }
  },
  "safeDeny": { "family": "customerAccess.actionUnavailable" },
  "riskFlags": [],
  "auditHint": { "category": "surface_unavailable" }
}
```

## Non-goals

Task364 does not:

- add interface code,
- add runtime helper,
- add verification runtime,
- add projection service runtime,
- add an API route,
- add a controller,
- add a service,
- add a repository,
- add a validator,
- add localization files,
- add migration, schema, or index,
- add smoke tests,
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

These are future tasks only and must not be implemented as part of Task364.

### Customer Access Context TypeScript / JSDoc Interface Implementation

Implement a code interface only after API, verification, projection, and safe-deny designs are approved.

### Safe-deny Response Helper Design

Design shared non-enumerating response behavior for customer-facing surfaces.

### Verification API Contract Proposal

Define future verification handoff endpoints, response semantics, and safe-deny behavior.

### Projection Service Interface Proposal

Define typed projection input/output boundaries for timeline and service report surfaces.

### Access-control Smoke / Integration Tests

Add tests only after disposable local/test runtime is confirmed and runtime exists.

### Audit / Security Event Boundary Design

Define what access context decisions are logged internally and how values are redacted.

### Link Lifecycle / Storage Policy

Design link creation, expiration, revocation, hashing, rotation, and audit behavior.

## Risk and Limitations

This document is not runtime approval. It defines a conceptual shared access context only.

Future implementation must still resolve:

- exact interface naming,
- code location,
- runtime validation,
- safe-deny helper integration,
- verification runtime,
- projection service runtime,
- audit/security event mapping,
- link lifecycle,
- tests in a disposable local/test environment.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No localization file or interface code is added by Task364.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke test change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, raw link values, verification codes, or production data details.

Future customer access context implementation must continue to avoid exposing resource existence, ownership, organization scope, channel identity state, internal denial reason, provider data, AI payload, billing internals, settlement internals, inventory internals, signature storage internals, or staff-management data.

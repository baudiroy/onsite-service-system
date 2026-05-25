# Task 568 - Customer-Facing Service Report API Contract Proposal

## Contract Conclusion

CUSTOMER-FACING SERVICE REPORT API CONTRACT PROPOSAL COMPLETE — NO API RUNTIME AUTHORIZED

Task568 defines a future API contract proposal for reading a customer-facing service report.

This document is proposal-only.

It does not authorize API runtime.

It does not create a route, controller, resolver, DTO, repository query, service, database access, migration, provider sending, customer identity runtime, publication runtime, survey runtime, billing runtime, AI runtime, RAG runtime, or vector database behavior.

## Proposed Endpoint Boundary

Future endpoint concept, proposal only:

```text
GET /customer/cases/:caseId/service-report
```

Alternative future endpoint concept, proposal only:

```text
GET /customer/service-reports/:caseId
```

Recommendation:

- Prefer `GET /customer/cases/:caseId/service-report` because the customer-facing report is Case-level context.
- A customer-facing service report is a filtered publication view of the Case-level formal Field Service Report.
- It is not a second formal Field Service Report.

Endpoint boundary:

- Endpoint path is proposal only.
- No route is created.
- No controller is created.
- No DTO runtime is created.
- No resolver is created.
- No repository query is created.
- No database is read.
- No API behavior changes.

## Mandatory Request Flow

Future API runtime, if explicitly authorized later, must follow this order:

```text
request
-> auth/session or customer channel identity context
-> organization scope resolution
-> customer identity verification
-> customer-to-Case linkage check
-> publication state check
-> customer-visible projection policy
-> DTO / response envelope
-> generic unavailable / safe-deny when not allowed
```

Mandatory contract rules:

- Controller must not bypass the resolver.
- Resolver must not bypass organization scope.
- Publication state must not bypass identity check.
- Publication state must not bypass Case/customer linkage check.
- Projection must not output internal-only fields.
- Denied / unavailable responses must not leak whether a Case, report, customer, or organization exists.
- Publication state alone must not grant access.
- Raw channel identity alone must not grant access.

## Proposed Success Response Envelope

Pseudo JSON only, not runtime code:

```json
{
  "ok": true,
  "data": {
    "caseId": "customer-visible-case-id-or-reference",
    "serviceReport": {
      "publicationState": "customer_report_published",
      "serviceSummary": "customer-visible-service-summary",
      "serviceResult": "customer-visible-service-result",
      "completedAt": "customer-visible-completed-at",
      "appointmentWindow": "customer-visible-appointment-window",
      "productSummary": "customer-visible-product-summary",
      "technicianDisplayName": "customer-visible-technician-display-name",
      "customerSafeSignatureStatus": "customer-visible-signature-status",
      "followUp": {
        "required": false,
        "customerVisibleReason": null
      }
    }
  }
}
```

Success envelope requirements:

- Fields must be customer-visible, masked, and filtered.
- Response must not use raw DB rows.
- Response must not expose formal FSR internal fields.
- Response must not expose completion submission source-data directly.
- Response must not treat the customer-facing report as a second formal FSR.
- Response must not include raw binary photos, raw signatures, or unrestricted file references.
- Evidence or file access must go through future mediated file access policy if ever authorized.

## Proposed Unavailable / Safe-deny Envelope

Pseudo JSON only, not runtime code:

```json
{
  "ok": false,
  "code": "SERVICE_REPORT_UNAVAILABLE",
  "message": "The service report is not available."
}
```

The same generic unavailable / safe-deny envelope should be used for:

- cross-organization access.
- wrong customer access.
- unverified identity.
- unlinked Case.
- unpublished report.
- internal-only completion source data.
- disputed state when not customer-visible.
- withheld state when not customer-visible.
- deleted / hidden / unavailable report.
- ambiguous identity.
- missing or invalid publication permission.

Safe-deny requirements:

- Do not reveal internal reason.
- Do not reveal whether a Case exists.
- Do not reveal whether a report exists.
- Do not reveal whether an organization exists.
- Do not reveal whether another customer is linked.
- Do not reveal unpublished draft existence.
- Do not reveal approval status.

## Forbidden Customer-visible Fields

Future API response must not output:

- internal note.
- audit log.
- AI raw payload.
- internal billing / settlement data.
- engineer internal comment.
- supervisor review / approval data.
- provider raw payload.
- token / secret / `DATABASE_URL`.
- raw LINE identifiers.
- raw phone / address unless explicitly customer-visible and masked.
- customer channel identity internals.
- cross-organization data.
- unconfirmed AI assumptions.
- raw completion submission.
- raw engineer input.
- raw photos / raw signatures / raw binary file identifiers unless mediated by future file access policy.
- vendor rules / cost / margin / settlement formula.
- internal dispute notes.
- internal follow-up notes.
- unconfirmed dispatch suggestions.
- internal risk flags.

Future API response should use an explicit allow-list of customer-visible fields.

## Formal FSR Invariant Protection

Future customer-facing service report API must preserve these invariants:

- One Case ultimately has one formal Field Service Report.
- Customer-facing service report is a filtered publication view.
- API can only read customer-visible projection.
- API must not create a formal Field Service Report.
- API must not approve a formal Field Service Report.
- API must not publish a formal Field Service Report.
- API must not modify completion source-data.
- API must not modify `finalAppointmentId`.
- API must not treat completion submission as Case completed.
- API must not create additional formal reports for the same Case.

## Identity and Channel Contract

Future API access must observe:

- LINE is not global identity.
- `organization_id + line_channel_id + line_user_id` is still insufficient alone.
- Phone alone cannot authorize access.
- Address alone cannot authorize access.
- LINE id alone cannot authorize access.
- Future API must require verified identity.
- Future API must require organization scope.
- Future API must require linked Case/customer relation.
- Future API must require publication allowed.
- All access decisions must be audit-ready.

Task568 does not add audit runtime.

Task568 does not add identity runtime.

## Audit-readiness

Future implementation should be audit-ready for:

- customer-facing report viewed.
- customer-facing report unavailable / denied.
- permission denied.
- cross-scope access denied.
- customer identity verification failed.
- Case linkage failed.
- publication state not customer-visible.

Audit records must not expose full phone, raw LINE id, tokens, secrets, raw payloads, or customer-sensitive binary data.

This is a future requirement only.

No audit runtime is implemented by Task568.

## Non-goals

Task568 does not do any of the following:

- no API runtime.
- no route / controller.
- no resolver implementation.
- no DTO implementation.
- no repository / DB query.
- no migration / SQL / DDL.
- no customer identity runtime.
- no customer-facing publication runtime.
- no provider sending.
- no LINE / SMS / Email / App push.
- no survey runtime.
- no billing / settlement runtime.
- no AI / RAG / vector DB.
- no `package.json` change.
- no tests executed.
- no fixture changes.
- no existing document changes.

## Future Task Candidates

Future candidates only, not authorized by Task568:

- Customer-facing API contract static test planning / no runtime.
- Customer-facing service report response envelope fixture markers / fixture-only.
- Customer-facing safe-deny envelope static test / test-only.
- Customer access resolver implementation sequencing / no runtime.
- Customer-facing projection DTO runtime authorization packet / no code.
- Customer-facing minimum vertical slice authorization gate / no runtime.

## Final Contract Statement

Task568 defines a future customer-facing service report read API contract proposal.

CUSTOMER-FACING SERVICE REPORT API CONTRACT PROPOSAL COMPLETE — NO API RUNTIME AUTHORIZED

# Task 575 - Customer Access Resolver Contract Proposal

## Contract Conclusion

CUSTOMER ACCESS RESOLVER CONTRACT PROPOSAL COMPLETE — NO RESOLVER RUNTIME AUTHORIZED

Task575 defines the future customer access resolver contract proposal.

This document only defines future resolver contract shape.

It does not authorize resolver runtime.

It does not authorize API, route, controller, DTO, projection, repository, database, migration, provider sending, customer identity runtime, publication runtime, survey runtime, billing runtime, AI runtime, RAG runtime, vector database work, or package changes.

General phrases such as "continue", "next step", "go ahead", "可以", or "繼續" do not authorize resolver runtime.

## Current Baseline

Current status remains:

API CONTRACT STATIC BASELINE COMPLETE / API RUNTIME NO-GO / RESOLVER RUNTIME NO-GO

Current baseline summary:

- Task568: customer-facing service report API contract proposal complete.
- Task571: customer-facing API contract static test passed, 8 passed / 0 failed.
- Task572: API contract static baseline closed.
- Task573: API runtime authorization gate defined, but runtime is still not authorized.
- Task574: customer access resolver implementation sequencing completed.

Task575 does not execute tests.

Task575 does not begin resolver runtime.

## Proposed Resolver Purpose

Future customer access resolver purpose:

- make an access decision for a customer-facing service report read request.
- decide whether the request may proceed to customer-visible projection.
- fail closed when uncertain.

Future resolver must not:

- produce a DTO.
- read or output internal-only fields.
- modify Case data.
- modify Appointment data.
- modify Field Service Report data.
- modify Completion data.
- modify Customer data.
- call provider sending.
- call LINE / SMS / Email / App push.
- call AI / RAG.
- decide billing / settlement.
- create, approve, or publish a formal Field Service Report.

## Proposed Input Contract

Pseudo shape only, not runtime code:

```text
CustomerAccessResolverInput
- requestContext
- organizationContext
- customerIdentityContext
- caseReference
- channelContext
- publicationContext
```

### `requestContext`

Future request/session metadata.

It must not contain token, secret, raw provider payload, full raw phone, full raw address, or raw LINE id in customer-facing output.

### `organizationContext`

Organization-scoped context.

The resolver cannot proceed without organization scope.

Cross-organization ambiguity must fail closed.

### `customerIdentityContext`

Verified customer identity context.

It must not rely only on raw phone, raw address, or raw LINE id.

It may include scoped channel identity context only after organization/channel scope is resolved.

### `caseReference`

Customer-facing request reference to the Case.

It is not sufficient authorization by itself.

Case linkage must be verified separately.

### `channelContext`

LINE / SMS / Web / App are entry channels.

They are not global identity.

`organization_id + line_channel_id + line_user_id` may be part of scoped identity context, but remains insufficient alone.

### `publicationContext`

Publication state context.

It only decides whether a customer-facing projection may be shown after identity, organization, and Case linkage checks.

Publication allowed is not formal Field Service Report approval.

## Proposed Output Contract

Pseudo shape only, not runtime code:

```text
CustomerAccessResolverDecision
- decision: allow | unavailable
- customerVisible: boolean
- safeDenyCode: SERVICE_REPORT_UNAVAILABLE
- projectionAllowed: boolean
- auditReadyMetadata
```

Output rules:

- Customer-facing response can receive only generic allow / unavailable result.
- Customer-facing unavailable response must not receive internal denial reason.
- `auditReadyMetadata` is future internal audit concept only.
- Task575 does not add audit runtime.
- `allow` only means the request may enter customer-visible projection.
- `allow` does not mean raw FSR access.
- `allow` does not mean formal FSR approval.
- `unavailable` must not reveal whether the Case, report, customer, or organization exists.

## Internal-only Decision Metadata Boundary

### Customer-facing allowed output

Future customer-facing output may receive only:

- generic allow / unavailable result.
- whether customer-visible projection may proceed.
- generic unavailable code / message.

### Internal audit-ready metadata proposal

Future internal metadata may include:

- decision category.
- evaluated checks.
- fail-closed reason category.
- organization scope check result.
- identity verification check result.
- Case linkage check result.
- publication state check result.

This metadata must not be directly output to customer-facing API.

It must not contain:

- token.
- secret.
- raw provider payload.
- full raw phone.
- full raw address.
- raw LINE id.
- cross-organization data.
- AI raw payload.
- internal note full text.
- raw completion submission.
- raw engineer input.

## Mandatory Resolver Decision Order

Future resolver order:

```text
request context
-> organization scope check
-> customer identity verification check
-> customer-to-Case linkage check
-> publication state check
-> customer-visible policy gate
-> allow customer-facing projection OR generic unavailable / safe-deny
```

Rules:

- Organization scope must be checked before linkage.
- Identity verification must not rely on phone alone.
- Identity verification must not rely on address alone.
- Identity verification must not rely on raw LINE id alone.
- Publication state must not bypass identity / linkage.
- Denied / unavailable must not leak whether a Case, report, customer, or organization exists.
- Resolver output must not pass internal denial reason to customer-facing response.

## Proposed Decision Matrix

| Scenario | Decision | Customer-facing response |
| --- | --- | --- |
| same org + verified identity + linked Case + published report | allow | success projection allowed |
| same org + verified identity + linked Case + unpublished report | unavailable | generic unavailable |
| same org + unverified identity + linked Case + published report | unavailable | generic unavailable |
| same org + verified identity + unlinked Case + published report | unavailable | generic unavailable |
| cross-org + verified identity + linked-looking Case | unavailable | generic unavailable |
| phone-only match | unavailable | generic unavailable |
| address-only match | unavailable | generic unavailable |
| raw LINE id only | unavailable | generic unavailable |
| disputed / withheld not customer-visible | unavailable | generic unavailable |
| follow-up required + customer-visible publication allowed | allow | success projection with customer-visible follow-up summary |

This matrix is proposal-only.

Task575 does not add fixture markers or tests for this matrix.

## Safe-deny Contract

Future customer-facing safe-deny response:

```json
{
  "ok": false,
  "code": "SERVICE_REPORT_UNAVAILABLE",
  "message": "The service report is not available."
}
```

The response must not leak:

- Case existence.
- report existence.
- organization existence.
- customer matching failure detail.
- internal approval status.
- internal publication reason.
- internal dispute reason.
- internal audit reason.
- AI confidence.
- AI raw output.

## Formal FSR Invariant Protection

Future resolver must preserve:

- One Case ultimately has one formal Field Service Report.
- A customer-facing service report is a filtered publication view, not a second formal Field Service Report.
- Resolver must not create a formal Field Service Report.
- Resolver must not approve a formal Field Service Report.
- Resolver must not publish a formal Field Service Report.
- Resolver must not modify completion source-data.
- Resolver must not modify `finalAppointmentId`.
- Resolver must not treat completion submission as Case completed.
- Publication allowed is not formal Field Service Report approval.

## Customer-visible Data Policy Alignment

Future resolver must not authorize output of:

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
- channel internals.
- cross-organization data.
- raw completion submission.
- raw engineer input.
- raw photos / signatures / binary refs unless mediated by future file access policy.
- vendor rules / cost / margin / settlement formula.
- internal dispute / follow-up notes.
- unconfirmed dispatch suggestions.
- internal risk flags.

## Non-goals

Task575 does not do any of the following:

- no resolver implementation.
- no runtime implementation.
- no API route / controller.
- no DTO / projection implementation.
- no repository / service implementation.
- no DB / SQL / DDL / migration.
- no customer identity runtime.
- no publication runtime.
- no provider sending.
- no LINE / SMS / Email / App push.
- no survey runtime.
- no billing / settlement runtime.
- no AI / RAG / vector DB.
- no `package.json` change.
- no tests executed.
- no fixture changes.
- no existing Task568-Task574 document edits.

## Future Task Candidates

Future candidates only, not authorized by Task575:

- Customer access resolver fixture marker extension / fixture-only.
- Customer access resolver decision matrix static test / test-only.
- Customer-facing safe-deny envelope implementation sequencing / no runtime.
- Customer-facing projection DTO implementation sequencing / no runtime.
- Customer-facing read-only API skeleton exact-file authorization packet / no runtime.

## Final Contract Statement

Task575 defines the future customer access resolver contract proposal.

CUSTOMER ACCESS RESOLVER CONTRACT PROPOSAL COMPLETE — NO RESOLVER RUNTIME AUTHORIZED

Current status remains:

API CONTRACT STATIC BASELINE COMPLETE / API RUNTIME NO-GO / RESOLVER RUNTIME NO-GO

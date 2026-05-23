# Task 574 - Customer Access Resolver Implementation Sequencing

## Sequencing Conclusion

CUSTOMER ACCESS RESOLVER IMPLEMENTATION SEQUENCING COMPLETE — NO RESOLVER RUNTIME AUTHORIZED

Task574 defines future sequencing for a customer access resolver if customer-facing service report API runtime is ever explicitly authorized.

This document only defines future resolver implementation sequencing.

It does not authorize resolver runtime.

It does not authorize API, route, controller, DTO, projection, repository, database, migration, provider sending, customer identity runtime, publication runtime, survey runtime, billing runtime, AI runtime, RAG runtime, vector database work, or package changes.

General phrases such as "continue", "next step", "go ahead", "可以", or "繼續" do not authorize resolver runtime.

## Current Baseline

Current status remains:

API CONTRACT STATIC BASELINE COMPLETE / API RUNTIME NO-GO

Current baseline summary:

- Task568: customer-facing service report API contract proposal complete.
- Task571: API contract static test passed, 8 passed / 0 failed.
- Task572: API contract static baseline closed.
- Task573: runtime authorization gate defined, but runtime is still not authorized.

Task574 does not execute tests.

Task574 does not begin resolver runtime.

## Future Resolver Responsibility Boundary

Future customer access resolver should be responsible only for access decision.

Future resolver responsibilities:

- receive request context / customer channel identity context.
- verify organization scope.
- verify whether customer identity is verified.
- verify customer-to-Case linkage.
- verify whether publication state is customer-visible.
- produce allow / deny / unavailable decision.
- fail closed when uncertain.
- provide audit-ready decision metadata, without implementing audit runtime in this task.

Future resolver must not:

- produce customer-facing DTO.
- read or output internal-only fields.
- create a formal Field Service Report.
- approve a formal Field Service Report.
- publish a formal Field Service Report.
- modify completion source-data.
- modify `finalAppointmentId`.
- call LINE / SMS / Email / App push.
- call AI / RAG.
- decide billing / settlement.
- perform database writes.
- leak denial reason to customer-facing response.

## Future Sequencing Proposal

Each future phase requires separate PM / user authorization.

### Phase A - Resolver Contract Doc / No Runtime

Define:

- resolver input contract.
- resolver output contract.
- allow / unavailable / safe-deny decision shape.
- internal-only decision metadata shape.
- customer-facing safe response mapping.

No code.

No tests.

No fixture modification.

### Phase B - Resolver Fixture Markers / Fixture-only

Add synthetic resolver access scenario markers covering:

- same organization.
- cross organization.
- verified identity.
- unverified identity.
- linked Case.
- unlinked Case.
- published report.
- unpublished report.
- withheld / disputed report.
- follow-up required customer-visible state.

No test.

No runtime.

### Phase C - Resolver Static Test / Test-only

Verify fixture decision matrix.

Constraints:

- import only `node:test`, `node:assert/strict`, and fixture file.
- do not import `src/`.
- do not add resolver code.
- do not call DB.
- do not call providers.
- do not call AI / RAG.

### Phase D - Runtime Authorization Packet / No Runtime

Define:

- exact allowed runtime files.
- exact allowed tests.
- exact commands.
- exact stop conditions.
- exact DB policy.
- exact no-provider/no-send policy.
- fail-closed behavior.

Still no code.

### Phase E - Minimal Pure Resolver Skeleton / Future Candidate Only

Only if a future task explicitly authorizes code.

Recommended limits for first code slice:

- pure function first.
- no DB.
- no provider.
- no API route.
- no controller.
- no DTO.
- no writes.
- no `package.json` change.
- fail closed when context is incomplete.

Phase E is not authorized by Task574.

## Mandatory Future Resolver Order

Future resolver decision order:

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

- Organization scope must be confirmed before customer linkage.
- Identity verification must not rely on phone alone.
- Identity verification must not rely on address alone.
- Identity verification must not rely on raw LINE id alone.
- Publication state must not bypass identity / linkage.
- Denied / unavailable must not leak whether a Case, report, customer, or organization exists.
- Resolver output must not include internal denial reason in the customer-facing response.

## Proposed Future Decision Matrix

| Scenario | Expected resolver decision |
| --- | --- |
| same org + verified identity + linked Case + published report | allow |
| same org + verified identity + linked Case + unpublished report | generic unavailable |
| same org + unverified identity + linked Case + published report | generic unavailable |
| same org + verified identity + unlinked Case + published report | generic unavailable |
| cross-org + verified identity + linked-looking Case | generic unavailable |
| phone-only match | generic unavailable |
| address-only match | generic unavailable |
| raw LINE id only | generic unavailable |
| disputed / withheld not customer-visible | generic unavailable |
| follow-up required but customer-visible publication allowed | allow with customer-visible follow-up summary only |

The matrix is a future design target only.

Task574 does not add fixtures or tests for this matrix.

## Safe-deny and Non-leakage Requirement

Future resolver must map customer-facing denial to generic unavailable.

It must not return:

- internal reason.
- Case existence.
- report existence.
- organization existence.
- approval / publication internal state.
- dispute internal reason.
- customer matching failure details.
- cross-organization mismatch detail.
- unlinked Case detail.

Internal audit metadata may record more detail only if a future task explicitly authorizes audit runtime and safe storage.

Task574 does not add audit runtime.

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

Projection and DTO layers must still apply their own allow-list if future runtime is authorized.

## Formal FSR Invariant Protection

Future resolver must preserve:

- One Case ultimately has one formal Field Service Report.
- A customer-facing service report is a filtered publication view, not a second formal Field Service Report.
- Resolver must not create a formal Field Service Report.
- Resolver must not approve a formal Field Service Report.
- Resolver must not publish a formal Field Service Report.
- Resolver must not modify completion source-data.
- Resolver must not modify `finalAppointmentId`.
- Completion submission is not Case completed.
- Publication allowed is not formal Field Service Report approval.

## Non-goals

Task574 does not do any of the following:

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
- no existing Task568-Task573 document edits.

## Future Task Candidates

Future candidates only, not authorized by Task574:

- Customer access resolver contract proposal / no runtime.
- Customer access resolver fixture marker extension / fixture-only.
- Customer access resolver decision matrix static test / test-only.
- Customer-facing safe-deny envelope implementation sequencing / no runtime.
- Customer-facing projection DTO implementation sequencing / no runtime.
- Customer-facing read-only API skeleton exact-file authorization packet / no runtime.

## Final Sequencing Statement

Task574 defines future sequencing for customer access resolver implementation.

CUSTOMER ACCESS RESOLVER IMPLEMENTATION SEQUENCING COMPLETE — NO RESOLVER RUNTIME AUTHORIZED

Current status remains:

API CONTRACT STATIC BASELINE COMPLETE / API RUNTIME NO-GO

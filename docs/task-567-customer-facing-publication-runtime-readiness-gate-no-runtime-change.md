# Task 567 - Customer-Facing Publication Runtime Readiness Gate

## Gate Conclusion

CUSTOMER-FACING PUBLICATION RUNTIME READINESS GATE COMPLETE — RUNTIME STILL NOT AUTHORIZED

Task567 defines the conditions that must be satisfied before any future customer-facing publication runtime work can begin.

This document is a readiness gate only.

It does not authorize runtime implementation.

It does not authorize API, route, controller, DTO, projection service, resolver, repository, database, migration, provider sending, AI, RAG, vector database, billing, settlement, survey, or package changes.

## Current Baseline

The current customer-facing publication branch status is:

STATIC BASELINE COMPLETE / RUNTIME NO-GO

Completed baseline artifacts:

- Task563 publication state matrix completed.
- Task564 static test planning completed.
- Task565 static test implemented and passed.
- Task566 static baseline closure completed.

Task565 result recorded by Task566:

```text
node --test tests/engineerMobileWorkbench/engineerMobileWorkbench.customerFacingPublicationState.static.test.js
8 passed / 0 failed
```

Task567 does not rerun this test or any other test.

## Required Future Runtime Components

If customer-facing publication runtime is ever explicitly authorized, the future task must separately authorize exact components such as:

- customer-facing route / controller.
- customer-facing access resolver.
- `customerAccessContext` builder.
- organization scope check.
- customer identity verification check.
- Case/customer linkage check.
- publication state resolver.
- customer-visible projection service.
- customer-facing DTO / response envelope.
- generic unavailable / safe-deny response handling.
- audit log strategy.
- permission / entitlement check.
- tests and fixtures scope.
- no provider sending by default.

None of these components are implemented or authorized by Task567.

## Mandatory Future Request Flow

Any future customer-facing publication runtime must follow a guarded request flow:

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

Mandatory implementation constraints for that future flow:

- Controller must not bypass the resolver.
- Resolver must not bypass organization scope.
- Identity context must not be treated as sufficient without Case linkage and publication permission.
- Projection must not read or output internal-only fields.
- Unavailable / denied responses must not leak whether a Case, report, customer, or organization exists.
- Publication state alone must never grant access.
- Customer-facing response generation must happen only after identity, organization, Case linkage, publication state, and customer-visible policy checks.

## Formal FSR Invariant Protection

Future publication runtime must protect the formal Field Service Report invariants:

- One Case ultimately has one formal Field Service Report.
- A customer-facing service report is a filtered publication view, not a second formal Field Service Report.
- Publication runtime must not create a formal Field Service Report.
- Publication runtime must not approve a formal Field Service Report.
- Publication runtime must not modify completion source-data.
- Publication runtime must not modify `finalAppointmentId`.
- Publication runtime must not treat a completion submission as Case completed.
- Completion submission source-data remains distinct from formal FSR and customer-facing publication.

## Identity and Channel Safety

Future customer-facing read access must preserve identity and channel safety:

- LINE is not global identity.
- `organization_id + line_channel_id + line_user_id` may be part of scoped identity context, but is still not sufficient by itself.
- Raw phone alone cannot authorize customer-facing report access.
- Raw address alone cannot authorize customer-facing report access.
- Raw LINE id alone cannot authorize customer-facing report access.
- Customer-facing read access requires verified identity.
- Customer-facing read access requires organization scope match.
- Customer-facing read access requires linked Case/customer relation.
- Customer-facing read access requires publication allowed.
- Cross-organization access must generic safe-deny.
- Cross-customer access must generic safe-deny.
- Unlinked Case access must generic safe-deny.
- Unverified identity access must generic safe-deny.
- Ambiguous identity access must generic safe-deny.

Safe-deny responses must avoid resource enumeration.

They must not reveal whether the target Case, report, organization, or customer exists.

## Customer-visible Data Policy

Future customer-facing projection must not output:

- internal note.
- audit log.
- AI raw payload.
- internal billing / settlement data.
- engineer internal comment.
- supervisor review / approval internal data.
- provider raw payload.
- token / secret / `DATABASE_URL`.
- full raw phone / address unless explicitly customer-visible and masked.
- LINE internal identifiers.
- customer channel identity internals.
- cross-organization data.
- unconfirmed AI/source-data assumptions.
- raw completion submission payload.
- raw engineer input snapshot.
- raw photo binary.
- raw signature binary.
- internal dispute notes.
- internal follow-up notes.
- vendor settlement rules.
- internal cost or margin data.

Future customer-facing projection should use an allow-list approach.

Customer-visible fields should be filtered, minimal, and purpose-bound.

## Future Authorization Checklist

Before any future customer-facing publication runtime task starts, PM must explicitly decide each item below.

The default answer is No unless a future task explicitly opens it.

| Authorization item | Default |
| --- | --- |
| exact files allowed | No open scope |
| exact commands allowed | No commands beyond explicit future task |
| tests may be added or modified | No |
| fixtures may be added or modified | No |
| `src/` may be modified | No |
| API route/controller may be touched | No |
| DTO/projection service may be implemented | No |
| resolver/access context may be implemented | No |
| repository or DB access is allowed | No |
| migration / SQL / DDL is allowed | No |
| provider sending is allowed | No |
| LINE / SMS / Email / App push is allowed | No |
| AI / RAG / vector DB is allowed | No |
| audit log runtime may be added | No |
| package script may be changed | No |
| full test suite / smoke may be run | No |
| rollback / fail-closed expectation defined | Required before runtime |
| stop conditions defined | Required before runtime |

Future runtime authorization must specify:

- exact write scope.
- exact test scope.
- exact DB policy.
- exact no-send policy.
- exact safe-deny behavior.
- exact customer-visible field policy.
- exact audit log behavior.
- exact failure behavior.

## Stop Conditions For Future Runtime Tasks

Future Codex execution must stop if:

- required organization scope behavior is unclear.
- customer identity verification boundary is unclear.
- Case/customer linkage behavior is unclear.
- safe-deny response semantics are unclear.
- customer-visible allow-list is unclear.
- formal FSR invariant would be weakened.
- `finalAppointmentId` could be modified by customer-facing runtime.
- implementation would require DB or migration without explicit approval.
- implementation would require provider sending without explicit approval.
- implementation would require AI/RAG/vector DB without explicit approval.
- sensitive data could be exposed in logs, errors, tests, or customer responses.

## Non-goals

Task567 does not do any of the following:

- no runtime implementation.
- no API / route / controller.
- no DTO implementation.
- no repository / service implementation.
- no DB / SQL / DDL / migration.
- no customer identity runtime.
- no customer-facing publication runtime.
- no provider sending.
- no LINE / SMS / Email / App push.
- no survey runtime.
- no billing / settlement runtime.
- no AI / RAG / vector DB.
- no `package.json` changes.
- no tests executed.
- no fixture changes.
- no existing Task563-Task566 document edits.
- no historical filename rename.

## Future Task Candidates

Future candidates only, not authorized by Task567:

- Customer-facing service report API contract proposal / no runtime.
- Customer-facing projection DTO static contract refinement / no runtime.
- Customer access resolver implementation sequencing / no runtime.
- Generic unavailable envelope implementation sequencing / no runtime.
- Customer-facing publication skeleton authorization packet / no runtime.
- Customer-facing runtime minimum vertical slice proposal / no code.

## Final Readiness Gate Statement

Task567 records the customer-facing publication runtime readiness gate.

CUSTOMER-FACING PUBLICATION RUNTIME READINESS GATE COMPLETE — RUNTIME STILL NOT AUTHORIZED

Current status remains:

STATIC BASELINE COMPLETE / RUNTIME NO-GO

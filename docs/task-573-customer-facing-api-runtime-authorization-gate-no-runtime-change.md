# Task 573 - Customer-Facing API Runtime Authorization Gate

## Gate Conclusion

CUSTOMER-FACING API RUNTIME AUTHORIZATION GATE DEFINED — RUNTIME STILL NOT AUTHORIZED

Task573 defines the explicit gate required before any future customer-facing service report API runtime can begin.

This document defines future authorization requirements only.

It does not authorize API runtime.

It does not authorize route, controller, resolver, DTO, repository, service, database, migration, provider sending, customer identity runtime, publication runtime, survey runtime, billing runtime, AI runtime, RAG runtime, vector database work, or package changes.

General phrases such as "continue", "next step", "go ahead", "可以", or "繼續" do not authorize customer-facing API runtime.

Runtime requires a future task that explicitly opens exact files, exact commands, exact tests, stop conditions, and rollback / fail-closed expectations.

## Current Baseline Summary

Current status remains:

API CONTRACT STATIC BASELINE COMPLETE / API RUNTIME NO-GO

Completed static baseline:

- Task568: API contract proposal complete.
- Task569: API contract static test planning complete.
- Task570: API contract fixture markers added.
- Task571: API contract static test passed, 8 passed / 0 failed.
- Task572: API contract static baseline closure complete.

Task573 does not rerun tests.

Task573 does not begin runtime.

## Required Explicit Authorization Before Runtime

Future runtime work requires PM / user to explicitly decide each item.

Default is No unless a future task explicitly opens it.

Required future authorization items:

- exact `src/` files allowed.
- exact route / controller files allowed.
- exact resolver files allowed.
- exact DTO / projection files allowed.
- exact repository / DB access files allowed.
- exact tests allowed.
- exact fixtures allowed.
- exact commands allowed.
- whether `package.json` may be changed.
- whether DB access is allowed.
- whether migration is allowed.
- whether audit log runtime may be added.
- whether permission / entitlement runtime may be added.
- whether provider sending remains forbidden.
- whether AI / RAG remains forbidden.
- stop conditions.
- rollback / fail-closed expectations.

No runtime implementation should begin without this exact authorization packet.

## Minimum Safe Future Runtime Slice Proposal

If customer-facing API runtime is ever authorized, the first slice should be read-only, safe-deny-first, and no-send.

Future minimum slice proposal only:

- customer-facing read-only endpoint only.
- no write operation.
- no formal FSR creation.
- no formal FSR approval.
- no publication approval.
- no completion persistence.
- no `finalAppointmentId` modification.
- no provider sending.
- no AI / RAG.
- no billing / settlement.
- generic safe-deny first.
- projection allow-list first.
- fail closed if identity, organization, linkage, or publication state cannot be verified.

This is a proposal only.

Task573 does not authorize or implement the slice.

## Mandatory Future Request Flow

Future runtime must follow:

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

Mandatory future constraints:

- Controller must not bypass resolver.
- Resolver must not bypass organization scope.
- Publication state must not bypass identity / linkage.
- Projection must not bypass customer-visible policy.
- Denied / unavailable responses must not leak whether a Case, report, customer, or organization exists.
- Failure to verify required access must fail closed.

## Runtime Files Closed By Default

| Area | Default | Future authorization needed |
| --- | --- | --- |
| route / controller | No | exact file path |
| resolver | No | exact file path |
| DTO / projection | No | exact file path |
| repository / DB query | No | exact file path + DB permission |
| migration / schema | No | explicit DB / DDL approval |
| tests | No | exact test file + command |
| fixtures | No | exact fixture file |
| provider sending | No | explicit provider authorization |
| AI / RAG | No | explicit AI authorization |
| `package.json` | No | explicit package authorization |

Closed by default means no implicit file touch is allowed.

## Data Access and Customer-visible Policy

Future runtime must not output:

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

Future customer-facing runtime must use an allow-list projection and customer-visible data policy.

## Formal FSR Invariant Protection

Future customer-facing API runtime must preserve:

- One Case ultimately has one formal Field Service Report.
- A customer-facing service report is a filtered publication view, not a second formal Field Service Report.
- Customer-facing API runtime must not create a formal Field Service Report.
- Customer-facing API runtime must not approve a formal Field Service Report.
- Customer-facing API runtime must not publish a formal Field Service Report.
- Customer-facing API runtime must not modify completion source-data.
- Customer-facing API runtime must not modify `finalAppointmentId`.
- Completion submission is not Case completed.
- Publication allowed is not formal FSR approval.

## Identity and Channel Safety

Future customer-facing API runtime must preserve:

- LINE is not global identity.
- `organization_id + line_channel_id + line_user_id` alone is insufficient.
- Phone alone is insufficient.
- Address alone is insufficient.
- Raw LINE id alone is insufficient.
- Runtime must require verified identity.
- Runtime must require organization scope.
- Runtime must require linked Case.
- Runtime must require publication allowed.
- Runtime must require customer-visible policy filtering.
- Cross-organization access must generic unavailable / safe-deny.
- Wrong customer access must generic unavailable / safe-deny.
- Unverified identity access must generic unavailable / safe-deny.
- Unlinked Case access must generic unavailable / safe-deny.

## Non-goals

Task573 does not do any of the following:

- no runtime implementation.
- no API route / controller.
- no resolver implementation.
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
- no existing Task568-Task572 document edits.

## Future Task Candidates

Future candidates only, not authorized by Task573:

- Customer access resolver implementation sequencing / no runtime.
- Customer-facing safe-deny envelope implementation sequencing / no runtime.
- Customer-facing projection DTO implementation sequencing / no runtime.
- Customer-facing read-only API skeleton authorization packet / no runtime.
- Customer-facing minimum vertical slice exact-file authorization / no runtime.
- PM continuation handoff after runtime authorization gate / no runtime.

## Final Gate Statement

Task573 defines the authorization gate for future customer-facing service report API runtime.

CUSTOMER-FACING API RUNTIME AUTHORIZATION GATE DEFINED — RUNTIME STILL NOT AUTHORIZED

Current status remains:

API CONTRACT STATIC BASELINE COMPLETE / API RUNTIME NO-GO

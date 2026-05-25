# Task 370 - Customer-facing Access Implementation Sequencing Plan / No Runtime Change

## Scope Summary

Task370 is a documentation-only implementation sequencing plan for future customer-facing access runtime work.

This task does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, helper files, interface/code files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, projection service runtime, verification runtime, token runtime, rate-limit runtime, audit runtime, notification delivery, provider integrations, customer portal runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task370 extends the Task360-369 customer-facing access design branch. It describes how future runtime should be sequenced, but it does not start runtime implementation.

## Current Readiness Baseline

| Area | Current status |
| --- | --- |
| Timeline API contract | Docs-ready only |
| Customer-facing service report API contract | Docs-ready only |
| Projection permission filter | Docs-ready only |
| Customer channel identity verification | Docs-ready only |
| `customerAccessContext` | Docs-ready only |
| Safe-deny helper | Docs-ready only |
| Audit/security event boundary | Docs-ready only |
| Link lifecycle / token policy | Docs-ready only |
| Abuse / rate-limit policy | Docs-ready only |
| Runtime implementation | Not started |
| DB / migration approval | Not granted |
| Disposable local/test runtime for smoke | Not confirmed |

The current branch is design-ready, not runtime-ready.

## Recommended Implementation Phases

| Phase | Goal | Preconditions | Allowed implementation type | Must not do | Required guardrails | Exit criteria | Dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Phase 0 - Policy / copy / data classification confirmation | Confirm customer-visible wording, data classification, and product copy before any runtime response. | Task352-369 docs accepted. | Docs/product review only. | No API/runtime/localization file implementation. | Customer-visible data policy, non-enumeration, no internal data. | Approved wording and data allow-list direction. | Product/security review. |
| Phase 1 - Code-only interface / helper skeleton planning | Plan exact file locations and interfaces without implementation. | Phase 0 or PM approval. | Docs / implementation plan. | No runtime behavior, no route. | Fail-closed shape, no raw identifiers. | Clear implementation work plan. | Existing codebase structure review. |
| Phase 2 - Safe-deny helper implementation | Implement generic non-enumerating response helper. | Approved helper design and localization fallback plan. | Code-only helper with unit/static checks, no customer API exposure. | No provider sending, no raw denial output. | Generic fallback, no root cause exposure. | Helper returns safe key families only. | Task365, localization plan. |
| Phase 3 - `customerAccessContext` interface implementation | Implement shared access context shape. | Approved interface location and naming. | Code interface / JSDoc / schema as appropriate. | No verification runtime, no DB. | No raw LINE ID, raw token, full personal data. | Interface exists and static checks pass. | Task364. |
| Phase 4 - Projection service interface implementation | Implement projection interface boundaries before data access. | Access context interface exists. | Interface/skeleton or pure projection with fixtures only if safe. | No DB access, no real customer data, no raw internal response. | Field allow-list, must-not-output fields. | Projection boundary is explicit and testable. | Task362, Task360, Task361. |
| Phase 5 - Verification runtime design and data model decision | Decide identity model and verification runtime path. | Access context and projection boundaries known. | Docs and data model proposal; runtime only after approval. | No migration without explicit approval. | Organization/channel scope, no global `line_user_id`. | Data model decision documented. | Task363. |
| Phase 6 - Link/token data model and lifecycle runtime decision | Decide token storage, hashing, lifecycle, revocation, and replay model. | Verification data model direction. | Docs/data model proposal; runtime only after approval. | No token table/hash runtime without approval. | Raw token never logged/stored plaintext. | Token model and hashing strategy approved. | Task367, Task368. |
| Phase 7 - Timeline API implementation | Implement customer-visible timeline API after dependencies. | Safe-deny helper, access context, projection, verification/link decisions. | Narrow API route/controller/service with tests. | No raw appointment rows, no provider sending. | Filtered projection only, fail-closed safe-deny. | Timeline endpoint passes safe tests. | Phase 2-6. |
| Phase 8 - Customer-facing service report API implementation | Implement customer-facing report API after dependencies. | Timeline patterns stable; report projection allow-list approved. | Narrow API route/controller/service with tests. | No raw FSR payload, no billing/settlement internals. | Filtered projection, signature/fee policy. | Report endpoint passes safe tests. | Phase 2-7. |
| Phase 9 - Audit/security writer and abuse/rate-limit runtime | Implement minimized internal event writer and monitoring. | Runtime access flows exist; event model approved. | Narrow writer/rate-limit runtime with redaction. | No raw token, raw provider payload, full personal data. | Minimal event fields, privacy retention. | Events/rate limits work without leaks. | Task366, Task368. |
| Phase 10 - Smoke/integration tests | Add access-control and safe-deny tests. | Disposable local/test runtime confirmed. | API/DB/browser smoke only against safe local/test runtime. | No shared/prod/Zeabur smoke without explicit approval. | No sensitive output, no destructive cleanup. | Tests prove no-leak behavior. | Runtime from prior phases. |

## Risk Ordering Rationale

Safe-deny, `customerAccessContext`, and projection boundaries should come before public API implementation because they reduce the risk that controllers directly expose raw internal data or root denial reasons.

Customer-visible data policy, localization, and product copy review should come before customer-facing responses because safe-deny wording and customer-visible status wording can otherwise become inconsistent or enumerable.

Verification and channel identity scope should come before timeline/report access because customer-facing APIs must not treat raw LINE ID, phone, email, link, or customer-safe reference as global identity.

Token hashing and lifecycle design should come before link runtime because raw token handling is high risk and hard to retrofit after logs, providers, or errors have seen link values.

Audit/security minimization should come before monitoring because logging too much can create a second data leak surface.

Disposable local/test runtime confirmation must come before API/DB smoke because shared runtime, production, and Zeabur environments must not be used for exploratory customer-facing access tests.

## Explicit Blocked Items

The following remain blocked:

- DB schema / migration unless the user explicitly authorizes it.
- Token table.
- Verification table.
- Audit event table.
- API route / controller / service implementation.
- Customer portal / frontend customer UI.
- LINE / SMS / Email / App notification sending.
- Provider integration.
- AI publishing customer-visible content.
- API/DB smoke against shared / production / Zeabur DB.
- Runtime that writes customer-facing access data without reviewed access control.
- Any smoke or fixture that could expose sensitive data or mutate shared runtime.

## Guardrail Checklist For Future Runtime Tasks

Every future customer-facing access runtime task must confirm:

- organization scope is enforced,
- customer channel identity is scoped by organization/channel,
- `line_user_id` is not global identity,
- safe-deny is non-enumerating,
- raw token does not enter logs, AI context, or customer response,
- internal Field Service Report raw payload is not returned,
- internal notes are not returned,
- audit logs are not returned,
- AI raw payload is not returned,
- billing internals are not returned,
- settlement internals are not returned,
- inventory internals are not returned,
- one Case equals one formal Field Service Report,
- one Case can have multiple appointments / visits,
- AI remains advisory/drafting only,
- no DB or migration occurs unless explicitly authorized,
- no shared runtime smoke runs unless disposable local/test runtime is confirmed,
- no sensitive output appears in command output, logs, docs, or PM handoff.

## Suggested Future Task Sequence

These are future tasks only and must not be implemented as part of Task370.

1. Customer-visible product copy approval packet.
2. `customerAccessContext` code interface implementation.
3. Safe-deny helper implementation.
4. Customer-visible localization file implementation.
5. Projection service interface implementation.
6. Customer channel identity data model proposal.
7. Link/token data model proposal.
8. Timeline API implementation plan.
9. Customer-facing service report API implementation plan.
10. Access-control smoke test plan after disposable runtime confirmation.

## Non-goals

Task370 does not:

- add runtime,
- add API contracts beyond sequencing notes,
- add an API route,
- add a controller,
- add a service,
- add a repository,
- add a helper,
- add interface code,
- add localization files,
- add migration, schema, or indexes,
- add smoke tests,
- modify validators,
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

## Risk and Limitations

This document is not runtime approval. It is a sequencing plan only.

The future implementation risk is highest if the project starts with public API routes before safe-deny, access context, projection, verification, token, and audit boundaries are in place.

The safest path is to implement small internal boundaries first, then expose narrow customer-facing APIs only after no-leak behavior is testable in disposable local/test runtime.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No localization file, helper code, interface code, token table, audit table, or rate-limit runtime is added by Task370.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke test change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, raw link values, verification codes, or production data details.

Future customer-facing access implementation must continue to avoid exposing token values, resource existence, ownership, organization scope, channel identity state, internal denial reason, provider data, AI payload, billing internals, settlement internals, inventory internals, signature storage internals, or staff-management data.

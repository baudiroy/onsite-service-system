# Task 378 - Customer-facing Access Pre-runtime Readiness Gate Review / No Runtime Change

## Scope Summary

Task378 is a documentation-only pre-runtime readiness gate review for the customer-facing access design branch.

This task does not modify `src/`, `admin/src/`, `scripts/smoke`, test files, localization files, helper files, interface/code files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, projection service runtime, verification runtime, token runtime, rate-limit runtime, audit runtime, notification delivery, provider integrations, customer portal runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, browser smoke, API smoke, DB smoke, or destructive cleanup is part of this task.

Task378 summarizes Task370-377 and decides whether the documentation baseline is sufficient to plan future low-risk code-only skeleton tasks. It does not authorize runtime implementation.

## Current Baseline

| Area | Current status |
| --- | --- |
| Customer-facing runtime | Not started |
| Code implementation | Not started |
| Test code / smoke tests | Not started |
| API routes / controllers | Not implemented |
| Resolver / projection / safe-deny runtime | Not implemented |
| Localization files | Not implemented |
| DB / DDL / migration approval | Not granted |
| Migration020 / survey runtime | Paused |
| Provider sending | Paused |
| Disposable local/test runtime for API/DB smoke | Not confirmed |

The current branch is docs-ready only.

## Task370-377 Readiness Summary

| Task | Completed documentation baseline | Runtime implication |
| --- | --- | --- |
| Task370 | Implementation sequencing plan. | Defines future phase order only; no runtime approval. |
| Task371 | Customer-facing visible data classification decision packet. | Provides allowed / conditional / human-confirmed / forbidden field policy. |
| Task372 | Response envelope and safe-deny message contract. | Provides future response shape and message key boundary. |
| Task373 | Projection DTO field map. | Maps allowed fields into conceptual DTOs only. |
| Task374 | Projection service interface contract. | Defines future projection service responsibilities without code. |
| Task375 | Customer access context resolver contract. | Defines future resolver boundary without code. |
| Task376 | Controller boundary contract. | Defines future controller orchestration boundary without code. |
| Task377 | Safe-deny and projection test scenario matrix. | Defines future test scenarios without test code. |

Together, these documents define a coherent customer-facing access design baseline:

- resolver creates `customerAccessContext`,
- projection service converts internal records into customer-safe DTOs,
- safe-deny helper collapses denial/unavailable states,
- response envelope keeps success and unavailable shapes consistent,
- controller remains orchestration-only,
- future tests must focus on no-leak and forbidden-field assertions.

## Pre-runtime Readiness Decision

Decision: the documentation baseline is sufficient to plan future low-risk code-only skeleton tasks.

This means only:

- the conceptual boundaries are clear enough to plan file locations and skeleton shapes,
- future work may start with no-DB, no-provider, no-route, no-real-data code-only skeleton planning if explicitly assigned,
- safe-deny / envelope / DTO / context types can be planned before runtime exposure.

This does not mean:

- customer-facing runtime is approved,
- API routes are approved,
- DB schema is approved,
- token storage is approved,
- customer channel identity verification runtime is approved,
- provider sending is approved,
- customer portal is approved,
- API/DB/browser smoke is approved,
- shared / production / Zeabur runtime access is approved.

## Allowed Future Code-only Candidates

The following are future candidates only and are not implemented by Task378.

| Candidate | Allowed future scope | Must not do |
| --- | --- | --- |
| Safe-deny response helper skeleton | Pure helper skeleton or type-level design with generic categories. | No DB, no route, no provider, no raw denial reason exposure. |
| Response envelope utility skeleton | Pure envelope builder shape using safe message families. | No localization files, no API runtime, no customer data. |
| Projection DTO type/interface skeleton | DTO/interface definitions matching Task373. | No raw records, no repository calls, no runtime exposure. |
| `customerAccessContext` type/interface skeleton | Type/interface shape matching Task375. | No verification runtime, no token validation, no DB. |
| Projection service pure function skeleton | Pure function boundary with fake/synthetic input only. | No real repositories, no production data, no API route. |

All candidates must remain:

- no DB,
- no migration,
- no schema/index,
- no route/API runtime,
- no provider sending,
- no customer-facing exposure,
- no real customer data,
- no raw token,
- no raw LINE/provider payload,
- no smoke tests without disposable local/test runtime confirmation.

## Still Blocked Items

The following remain blocked:

- DB / DDL / migration,
- Migration020 dry-run / apply,
- token storage runtime,
- link validation runtime,
- customer channel identity verification runtime,
- customer-facing API routes,
- customer-facing controllers runtime,
- projection service connected to real repositories,
- resolver connected to real links or real channel identity records,
- audit/security event runtime,
- rate-limit / abuse runtime,
- localization file implementation unless specifically assigned,
- LINE / SMS / Email / App provider sending,
- survey sending,
- customer portal runtime,
- API / DB / browser smoke tests,
- shared / production / Zeabur runtime access,
- any use of real tokens, raw LINE ids, full phone numbers, full addresses, raw provider payloads, or production customer data.

## Hard Guardrails For Next PM Tasks

Future tasks must remain one task at a time.

If PM chooses code next, the task must explicitly say code-only skeleton and must not connect to DB, repositories, routes, providers, AI providers, real tokens, or real customer data.

If any task needs DB, API, or smoke testing, the user must first provide explicit disposable local/test runtime confirmation. General "continue" or "go ahead" is not DB/DDL/smoke approval.

Customer-facing responses must continue to follow:

- generic safe-deny,
- filtered projection only,
- no existence leakage,
- no controller-local access decisions,
- no raw internal records,
- AI advisory/drafting only.

## Risk Review

| Risk | Current mitigation | Remaining blocker |
| --- | --- | --- |
| Controller bypasses projection | Task376 defines controller orchestration boundary. | Code review/tests needed before runtime. |
| Resolver leaks raw reason to safe-deny | Task375 requires generic categories only. | Helper implementation must enforce it. |
| DTO mirrors internal records | Task373 field map forbids internal table shape exposure. | DTO code must remain allow-list based. |
| Message key implies resource existence | Task372 forbids existence-leaking key names. | Localization/key review needed before implementation. |
| Audit/security reason leaks to customer response | Task366/372/376 keep audit internal. | Audit runtime not implemented. |
| AI wording exposes internal denial reason | Task371-377 keep AI draft-only. | AI runtime not implemented and must stay gated. |
| Token/channel identity model needs DB | Task367/375 identify policy but no schema approval. | DB/migration remains blocked. |
| Smoke tests accidentally touch shared runtime | Task370/377 require disposable local/test runtime. | No disposable runtime confirmation yet. |

## Decision Output

### Accepted Docs Baseline

Task370-377 form an accepted documentation baseline for customer-facing access pre-runtime planning.

### Runtime Status

No customer-facing runtime is implemented.

No customer-facing API route/controller/service/helper/interface code is implemented by this branch segment.

### DB / Migration Status

No DB work is approved.

No migration, schema, or index change is approved.

Migration020 remains paused. No dry-run or apply is part of this branch.

### Recommended Next Single-task Category

Recommended next single-task category: low-risk code-only skeleton planning.

Alternative safe category: additional docs closure.

Do not jump directly to DB, customer-facing API runtime, token runtime, provider sending, or API/DB/browser smoke.

## Non-goals

Task378 does not:

- add runtime,
- add code,
- add test code,
- add smoke tests,
- run API tests,
- run DB tests,
- run browser tests,
- add controller code,
- add route/API code,
- add helper code,
- add service code,
- add repository code,
- add interface code,
- add localization files,
- add migrations,
- add schema,
- add indexes,
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

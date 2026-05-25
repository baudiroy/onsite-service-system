# Task 379 - Customer-facing Code-only Skeleton Cutline Plan / No Runtime Change

## Scope Summary

Task379 is a documentation-only cutline plan for future customer-facing access code-only skeleton work.

This task does not modify `src/`, `admin/src/`, `scripts/smoke`, test files, localization files, helper files, interface/code files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, projection service runtime, verification runtime, token runtime, rate-limit runtime, audit runtime, notification delivery, provider integrations, customer portal runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, browser smoke, API smoke, DB smoke, or destructive cleanup is part of this task.

Task379 defines the cutline for a future first code-only skeleton task. It does not authorize or implement code.

## Current Baseline

| Area | Current status |
| --- | --- |
| Customer-facing runtime | Not started |
| Code implementation | Not started |
| Test code / smoke tests | Not started |
| Safe-deny / envelope / DTO / context / projection code | Not implemented |
| API routes / controllers | Not implemented |
| DB / DDL / migration approval | Not granted |
| Migration020 / survey runtime | Paused |
| Provider sending | Paused |
| Disposable local/test runtime for API/DB smoke | Not confirmed |

The current branch is docs-ready only.

## Purpose Of Code-only Skeleton Cutline

This document defines what a future first code-only skeleton task may and may not include.

It does not authorize code in Task379.

It does not authorize:

- DB work,
- schema work,
- migration work,
- route/API runtime,
- controller runtime,
- provider sending,
- customer-facing exposure,
- real data access,
- AI provider calls,
- API/DB/browser smoke tests.

The goal is to make future code tasks small, pure, low-risk, and impossible to accidentally expand into runtime behavior.

## Allowed Future Code-only Skeleton Categories

These are future candidates only and are not implemented by Task379.

| Candidate | Allowed purpose | Forbidden expansion | Required dependency boundary | Testability |
| --- | --- | --- | --- | --- |
| Safe-deny response helper skeleton | Centralize safe category to generic response mapping. | No raw denial reason, no localization runtime, no route/API. | Pure function, no DB, no provider, no env secrets. | Unit-level checks with fake categories. |
| Response envelope utility skeleton | Build success/unavailable envelope shapes from approved inputs. | No customer data lookup, no API controller, no provider call. | Pure function using Task372 contract. | Unit-level checks with synthetic DTOs. |
| Customer-facing DTO type/interface skeleton | Define DTO shapes matching Task373. | No repository dependency, no runtime projection. | Type/schema-only or minimal pure definitions. | Static checks / synthetic examples. |
| `customerAccessContext` type/interface skeleton | Define context shape matching Task375. | No verification runtime, no token validation, no DB. | Type/schema-only or pure object contract. | Static checks / fake context fixtures. |
| Projection service pure-function skeleton | Define pure projection boundary with fake internal summaries. | No repository access, no real domain rows, no route/API. | Pure functions using synthetic input and DTO types. | Unit-level checks with fake/synthetic data only. |

## Explicitly Forbidden Future First-code Scope

The first code-only skeleton task must not include:

- DB connection,
- repository access,
- migration,
- schema,
- index,
- token storage,
- token hashing runtime,
- link validation runtime,
- customer channel identity verification runtime,
- customer-facing route,
- customer-facing controller runtime,
- API exposure,
- provider sending,
- LINE / SMS / Email / App / survey sending,
- real customer data,
- real token,
- raw LINE id,
- full phone,
- full address,
- raw provider payload,
- AI provider call,
- audit/security event persistence,
- rate-limit / abuse runtime,
- file/photo/signature/document storage runtime,
- billing / settlement runtime,
- inventory / WMS runtime,
- smoke tests,
- browser tests,
- API/DB tests.

## Candidate File Boundary Proposal

Future code-only skeletons may propose files only after a single explicit PM task authorizes that code.

Acceptable future file characteristics:

- pure utility or type/interface files,
- no repository imports,
- no database client imports,
- no route registration,
- no controller wiring,
- no provider SDK imports,
- no AI client imports,
- no environment secret reads,
- no direct access to production/shared runtime,
- channel-agnostic naming.

Unacceptable future file characteristics:

- files that register routes,
- files that query repositories,
- files that validate real tokens,
- files that send notifications,
- files that read provider credentials,
- files that call AI,
- files that write audit/security events,
- files that depend on migration/schema changes,
- files that hard-code LINE as the only channel.

Naming should remain channel-agnostic. LINE can be a current channel example, but first skeletons should not encode LINE as the only access path.

## Pure Unit Test Boundary Proposal

Future code-only skeleton tests may use fake/synthetic data only.

Allowed future unit-level checks:

- safe-deny category maps to generic key family,
- response envelope omits forbidden fields,
- DTO skeleton does not include raw ids,
- projection pure function excludes internal notes,
- access context shape does not expose raw token or provider identity.

Forbidden future first-step tests:

- DB tests,
- API tests,
- browser tests,
- smoke tests,
- shared/prod/Zeabur runtime tests,
- tests using real tokens,
- tests using raw LINE ids,
- tests using full phone/address values,
- tests using raw provider payload,
- tests using production/customer data.

## Dependency Direction

Future skeleton dependency direction should be:

```text
safe-deny categories / envelope / DTO / access context
-> pure projection skeleton
-> future resolver skeleton
-> future controller planning
```

It must not be:

```text
controller / repository / DB / provider / AI
-> pure skeleton
```

Skeletons should be low-coupling, pure, and side-effect-free.

They must not depend on:

- repository,
- database client,
- provider SDK,
- AI client,
- runtime environment secrets,
- migration state,
- customer portal runtime,
- notification runtime.

Future controller code should depend on resolver/projection/envelope results. Pure skeletons should not reach outward into runtime state.

## Security and Enumeration Guardrails

Even code-only skeletons must preserve:

- generic safe-deny,
- no existence leakage,
- forbidden fields default deny,
- non-enumerable `requestReference` concept,
- no internal ids in customer-facing output,
- no raw failure reason in customer copy,
- no raw token or token hash in output,
- no raw LINE/provider identity in output,
- no full phone/address/email in output,
- no AI raw payload in output.

Message keys, statuses, field presence, request references, and response shape must not imply resource existence, ownership, token state, channel binding, or internal workflow state.

## Decision Matrix

| Candidate | Can be code-only | Requires DB | Requires route/API | Requires provider | Requires real data | Recommended now / later |
| --- | --- | --- | --- | --- | --- | --- |
| Safe-deny response helper skeleton | Yes | No | No | No | No | Recommended now if code is authorized. |
| Response envelope utility skeleton | Yes | No | No | No | No | Recommended now if code is authorized. |
| DTO type/interface skeleton | Yes | No | No | No | No | Recommended now if code is authorized. |
| `customerAccessContext` type/interface skeleton | Yes | No | No | No | No | Recommended now if code is authorized. |
| Projection pure-function skeleton with synthetic input | Yes | No | No | No | No | Recommended after DTO/context skeleton. |
| Resolver real token validation | No | Likely | No | No | Yes / sensitive | Later, needs explicit data model approval. |
| Customer-facing controller/route | No for first code step | Maybe later | Yes | No | Maybe | Later, after skeletons and access model. |
| Customer channel identity verification runtime | No | Likely | Maybe | Maybe | Sensitive | Later, needs explicit approval. |
| Audit/security persistence | No | Likely | No | No | Sensitive | Later, needs data model approval. |
| Rate-limit / abuse runtime | No | Maybe | Maybe | No | Sensitive | Later, needs policy and runtime approval. |
| Provider notification sending | No | Maybe | Maybe | Yes | Sensitive | Later, provider approval required. |
| API/DB/browser smoke | No | Yes | Yes | Maybe | Synthetic only | Later, after disposable local/test runtime confirmation. |

## Recommended Next Single-task Category

If Task379 is accepted, the next safe category may be:

- first low-risk pure code skeleton planning, or
- one additional docs closure task.

If PM chooses code next, the safest first code-only candidate is either:

- safe-deny response helper skeleton, or
- response envelope utility skeleton.

Neither should connect to DB, repositories, routes, providers, AI, real tokens, or real customer data.

Do not recommend DB, API runtime, provider sending, token runtime, verification runtime, or smoke execution as the immediate next task.

## Non-goals

Task379 does not:

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

## Risk and Limitations

This document is a cutline plan, not code approval.

The highest future risk is calling something "code-only skeleton" while quietly adding repository access, route registration, provider dependencies, env secrets, or real data. Future code tasks must list exact allowed files and forbidden imports before implementation.

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

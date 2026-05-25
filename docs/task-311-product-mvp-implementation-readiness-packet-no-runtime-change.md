# Task 311 - Product MVP Implementation Readiness Packet / No Runtime Change

## Scope And Non-goals

This document follows Task310 and creates a docs-only Product MVP implementation readiness packet.

Task311 helps future product, PM, and engineering choose which runtime slice could be considered first, and what gates must be satisfied before any implementation begins.

Task311 does not select a sprint, does not approve implementation, and does not authorize backend, Admin, API, DB, migration, provider, AI, report/export, audit, or test changes.

This task is not:

- backend runtime,
- Admin runtime,
- API contract,
- migration,
- schema,
- index,
- DB / DDL execution,
- AI / RAG runtime,
- billing / settlement / quote / payment / invoice runtime,
- survey / complaint / callback / quality runtime,
- report/export/download/scheduled report runtime,
- customer self-service runtime,
- customer channel identity runtime,
- reverse binding runtime,
- notification runtime,
- Engineer Mobile runtime,
- file upload runtime,
- signature runtime,
- offline sync runtime,
- audit / evidence runtime,
- permission / entitlement / usage / seat / subscription runtime,
- smoke / test implementation,
- package change.

Task311 does not add tables, migrations, schema, indexes, backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, smoke scripts, fixtures, package changes, provider sending, AI runtime, audit runtime, or inventory documentation changes.

## Why This Packet Follows Task310

Task310 established a cross-branch master gate and confirmed that recent docs-only branches are paused with no runtime approval.

The next useful low-risk step is not implementation. It is readiness planning: listing candidate MVP capabilities and the gates each would require before runtime can be considered.

Task311 keeps that planning explicit and non-executable.

## MVP Readiness Purpose

This packet supports future product and engineering discussion by answering:

- which MVP capabilities are plausible candidates,
- which roles benefit,
- which existing docs-only branches they depend on,
- whether they likely require backend runtime, Admin UI, API contracts, schema/migration, provider sending, Data Access, audit, usage tracking, or AI/RAG,
- which risks should be considered before choosing one.

This packet does not approve any runtime.

## Candidate MVP Capability List

Candidate MVP capabilities:

1. Case / Appointment core workflow hardening.
2. Field Service Report completion hardening.
3. finalAppointmentId backend-owned inference hardening.
4. One-open-appointment invariant hardening.
5. Customer-visible service result summary.
6. Customer fee consent future runtime.
7. Engineer Mobile minimal completion future runtime.
8. Customer channel identity / reverse binding future runtime.
9. Survey / satisfaction future runtime.
10. Report/export permission future runtime.
11. Audit log / evidence future runtime.
12. AI-assisted completion summary future runtime.

## Readiness Matrix / Future-only

This matrix is future-only planning. `Runtime approved now` is `No` for every row.

| Candidate capability | Product value | User role impacted | Depends on docs branches | Requires backend runtime? | Requires Admin UI? | Requires API contract? | Requires schema/migration? | Requires provider sending? | Requires Data Access Control? | Requires audit readiness? | Requires usage tracking? | Requires AI/RAG? | Risk level | Runtime approved now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Case / Appointment core workflow hardening | Protects scheduling and service workflow correctness. | Customer service, dispatcher, engineer, supervisor | Task104-109 history, Data Access, Audit | Future-only yes | Future-only maybe | Future-only maybe | Future-only maybe | No | Yes | Yes | No | No | Medium | No |
| Field Service Report completion hardening | Protects one Case = one formal report and completion stability. | Engineer, admin, supervisor, customer service | Task105-109 history, Engineer Mobile, Audit | Future-only yes | Future-only maybe | Future-only maybe | Future-only maybe | No | Yes | Yes | No | No | Medium | No |
| finalAppointmentId backend-owned inference hardening | Keeps final appointment stable and system-owned. | Engineer, admin, supervisor | Task105-109 history, Audit | Future-only yes | Future-only maybe | Future-only maybe | Future-only maybe | No | Yes | Yes | No | No | Low / medium | No |
| One-open-appointment invariant hardening | Reduces duplicate open visits and concurrency risk. | Dispatcher, engineer, supervisor | Task104 history, Operations, Audit | Future-only yes | Future-only maybe | Future-only yes | Future-only maybe | No | Yes | Yes | No | No | Medium / high | No |
| Customer-visible service result summary | Gives customers clear completion information without internal leakage. | Customer, customer service, engineer | Data Access, Customer Channel, Engineer Mobile, Audit | Future-only yes | Future-only maybe | Future-only yes | Future-only maybe | Maybe future | Yes | Yes | Maybe | Maybe for copy assist | Medium | No |
| Customer fee consent future runtime | Reduces billing disputes and preserves consent evidence. | Customer, engineer, finance, supervisor | Billing/Settlement, Engineer Mobile, Customer Channel, Audit | Future-only yes | Future-only yes | Future-only yes | Future-only yes | Maybe future | Yes | Yes | Maybe | Maybe advisory only | High | No |
| Engineer Mobile minimal completion future runtime | Reduces field reporting friction and improves completion data. | Engineer, dispatcher, supervisor | Engineer Mobile, Field Service Report, Audit, AI/RAG | Future-only yes | Future-only maybe | Future-only yes | Future-only maybe | No | Yes | Yes | Maybe | Maybe future | High | No |
| Customer channel identity / reverse binding future runtime | Enables future customer self-service and channel continuity. | Customer, customer service | Customer Channel, Data Access, Audit, SaaS | Future-only yes | Future-only yes | Future-only yes | Future-only yes | Maybe future | Yes | Yes | Maybe | No | High | No |
| Survey / satisfaction future runtime | Supports service quality feedback and complaint follow-up. | Customer, supervisor, customer service | Survey docs, Operations/Quality, Customer Channel, Audit | Future-only yes | Future-only yes | Future-only yes | Future-only yes | Maybe future | Yes | Yes | Maybe | Maybe advisory only | High | No |
| Report/export permission future runtime | Protects sensitive operational and customer data. | Supervisor, finance, admin | Data Access, Audit, SaaS | Future-only yes | Future-only yes | Future-only yes | Future-only maybe | No | Yes | Yes | Yes | Maybe future | High | No |
| Audit log / evidence future runtime | Creates traceability and accountability foundation. | Admin, supervisor, finance, support | Audit, Data Access, SaaS | Future-only yes | Future-only yes | Future-only yes | Future-only yes | No | Yes | Yes | Maybe | Maybe future | High | No |
| AI-assisted completion summary future runtime | Reduces engineer writing burden while preserving human control. | Engineer, supervisor, admin | AI/RAG, Engineer Mobile, Audit, Data Access | Future-only yes | Future-only maybe | Future-only yes | Future-only maybe | No | Yes | Yes | Yes | Future-only yes | High | No |

## MVP Sequencing Principles

Future MVP selection should follow these principles:

- Prioritize field service invariants first.
- Do not implement features that break one Case = one formal Field Service Report.
- Do not implement features that create one formal report per visit.
- Do not implement features that weaken one-open-appointment invariant.
- Do not implement features that make finalAppointmentId manually chosen by default.
- Do not implement features that increase engineer form burden.
- Do not implement customer-facing lookup before safe deny / non-enumeration is designed.
- Do not implement report/export/AI/customer lookup that bypasses Data Access Control.
- Do not implement customer channel runtime before channel scope, verification, consent, and non-enumeration are approved.
- Do not implement AI official writes or AI auto-decisions.
- Do not implement provider sending without credential, payload, audit, usage, and safe-deny gates.
- Do not implement billing/settlement approval without explicit business approval and evidence boundaries.

## Runtime Approval Gates

Any future runtime task must include explicit approval for:

1. PM approval.
2. Files/layers allowed list.
3. API contract approval.
4. Schema/migration approval, if needed.
5. DB/DDL approval, if needed.
6. Provider sending approval, if any.
7. Data Access / permission approval.
8. Audit / evidence approval.
9. Usage tracking approval, if usage metering is involved.
10. Smoke/test approval.
11. Rollback / safety plan.
12. Sensitive data redaction plan.
13. Customer-visible / internal-only data review.
14. Non-enumeration / safe deny review where customer-facing.
15. No-AI-auto-decision confirmation where AI is involved.

General statements such as "continue", "go ahead", "do next task", or "make progress" are not enough for runtime, DB, provider, AI, or migration approval.

## Hard Non-goals

Task311 does not:

- implement backend,
- implement Admin UI,
- add API,
- add migration,
- add schema,
- add index,
- connect to DB,
- run DDL,
- run `psql`,
- run `db:migrate`,
- perform Migration 020 dry-run,
- perform Migration 020 apply,
- add tests,
- add smoke scripts,
- add fixtures,
- change package configuration,
- add provider sending,
- add AI/RAG,
- add audit runtime,
- add report/export/download runtime,
- add customer channel runtime,
- add Engineer Mobile runtime,
- add billing / settlement / quote / payment / invoice runtime.

## Recommended Near-term Discussion Order / Future-only

If PM/product wants to choose a first runtime slice later, the safest discussion order is:

1. Field service invariants and completion stability.
2. One-open-appointment hardening.
3. Engineer Mobile minimal completion with no increased field burden.
4. Customer-visible service summary with strict Data Access policy.
5. Customer fee consent evidence, only after evidence and permission gates.
6. Audit/evidence foundation, if needed by the selected runtime.
7. Customer channel identity / reverse binding after safe deny and consent gates.
8. Survey / satisfaction after customer channel and audit gates.
9. Report/export permissions after Data Access and audit gates.
10. AI-assisted completion after Data Access, audit, and human review gates.

This order is advisory only and does not approve implementation.

## Conclusion

Task311 is a docs-only MVP implementation readiness packet.

It does not approve any runtime implementation.

Future PM/product/engineering work may use this packet to select a candidate, but the selected candidate still requires explicit approval for files, layers, API, schema/migration, DB/DDL, provider, Data Access, audit, usage, tests, and safety boundaries before implementation begins.

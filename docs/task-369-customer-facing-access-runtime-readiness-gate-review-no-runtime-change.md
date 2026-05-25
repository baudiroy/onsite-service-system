# Task 369 - Customer-facing Access Runtime Readiness Gate Review / No Runtime Change

## Scope Summary

Task369 is a documentation-only readiness gate review for the Task360-368 customer-facing access design branch.

This task does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, helper files, interface/code files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, projection service runtime, verification runtime, token runtime, rate-limit runtime, audit runtime, notification delivery, provider integrations, customer portal runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task369 closes the customer-facing access documentation design branch only. It does not approve runtime implementation.

## Branch Coverage Summary

| Task | Covered boundary | Intentionally not implemented | Future dependency |
| --- | --- | --- | --- |
| Task360 | Customer-visible appointment timeline API contract proposal, response projection, safe-deny, access-control, and AI boundary. | API route, controller, service, repository, projection runtime, localization, smoke. | Timeline API implementation plan, projection service, identity verification, safe-deny helper, tests. |
| Task361 | Customer-facing service report API contract proposal, signature exception, fee display, issue entrypoint, safe-deny, Appointment / FSR boundary. | Report API runtime, report projection service, signature/file access, invoice/fee runtime, complaint workflow. | Report projection implementation, fee/signature policy, issue workflow, tests. |
| Task362 | Projection service permission filter design, inputs, fail-closed pipeline, allowed outputs, must-filter fields, AI boundary. | Projection service runtime, interface code, API wiring, access-control tests. | Projection service interface and implementation plan. |
| Task363 | Customer channel identity verification design, scoped identity principles, verification flow, abuse cases, projection interaction. | Customer identity table, verification runtime, DB schema, API routes, provider integration. | Customer channel identity data model, verification API, link lifecycle, tests. |
| Task364 | `customerAccessContext` interface proposal, status semantics, safe-deny mapping, interaction boundaries, pseudo examples. | TypeScript/JSDoc interface code, runtime helper, verification/projection implementation. | Access context code interface and runtime validation plan. |
| Task365 | Safe-deny response helper design, message key mapping, scenario matrix, collapse rules, AI boundary. | Helper code, localization files, API response integration, runtime tests. | Safe-deny helper implementation, localization files, response contract tests. |
| Task366 | Customer-facing access audit/security event boundary, event categories, trigger matrix, minimum allowed fields, must-not-log fields. | Audit/security event runtime, audit table, writer interface, monitoring. | Event data model, redacted writer, monitoring policy, retention policy. |
| Task367 | Customer-facing link lifecycle / token storage policy, link types, token storage, lifecycle states, validation flow, replay cases. | Token table, token hashing, link generation/validation runtime, notification delivery. | Link/token data model, hashing strategy, notification token redaction, tests. |
| Task368 | Link abuse / rate-limit policy review, abuse scenarios, rate-limit dimensions, safe-deny lockout boundary, monitoring/privacy. | Rate-limit runtime, monitoring runtime, token validation, alerting, smoke tests. | Rate-limit data model, probing detection, monitoring/alerting, privacy retention. |

## Readiness Gate Checklist

| Area | Current status | Notes |
| --- | --- | --- |
| Timeline API contract | Ready as docs only | Proposal exists; no API route/controller/service. |
| Service report API contract | Ready as docs only | Proposal exists; no API route/controller/service. |
| Projection permission filter | Ready as docs only | Fail-closed pipeline documented; no projection runtime. |
| Customer channel identity verification | Ready as docs only | Scope and flow documented; no verification runtime or data model. |
| `customerAccessContext` | Ready as docs only | Conceptual shape documented; no interface/code file. |
| Safe-deny helper | Ready as docs only | Mapping/collapse rules documented; no helper runtime or localization. |
| Audit/security event boundary | Ready as docs only | Categories and must-not-log rules documented; no writer/table/runtime. |
| Link lifecycle / token storage policy | Ready as docs only | Token storage principles documented; no token table or validation. |
| Abuse / rate-limit policy | Ready as docs only | Abuse/rate-limit boundaries documented; no monitoring runtime. |
| Actual API runtime | Not implemented | Future route/controller/service plan required. |
| Actual projection service | Not implemented | Future service/interface implementation required. |
| Actual verification runtime | Not implemented | Future customer channel identity data model and service required. |
| Actual safe-deny helper | Not implemented | Future helper and localization integration required. |
| Actual token storage / validation | Not implemented | Future migration/schema and hashing strategy likely required with explicit approval. |
| Actual audit/security writer | Not implemented | Future event writer and retention policy required. |
| Actual rate-limit / monitoring | Not implemented | Future runtime and privacy review required. |
| Smoke / integration tests | Blocked until disposable local/test runtime confirmation | No API/DB/browser smoke should be added before runtime exists and safe local/test execution is approved. |

## Required Gates Before Runtime Implementation

Before any customer-facing access runtime branch starts, the project should complete these gates:

- API route / controller / service implementation plan.
- `customerAccessContext` code interface proposal or implementation task.
- Projection service interface and permission filter implementation plan.
- Customer channel identity data model and verification runtime approval.
- Link/token data model and hashing strategy approval.
- Safe-deny helper implementation plan.
- Customer-visible localization file implementation plan.
- Audit/security event data model and writer design.
- Abuse/rate-limit runtime design.
- Access-control smoke/integration test plan with disposable local/test runtime.
- Product copy review and customer-visible data policy approval.
- Explicit DB/migration approval if schema becomes necessary.

Runtime implementation should not begin merely because these docs exist.

## Hard Non-goals

Task369 and this branch closure do not mean:

- customer-facing API exists,
- customer portal can open,
- customer-facing service report can be published,
- LINE / SMS / Email / App notifications can be sent,
- token table or token validation exists,
- access-control runtime exists,
- localization keys are implemented,
- audit/security event writer exists,
- rate-limit / monitoring exists,
- AI can publish customer-facing content,
- internal Field Service Report raw data can be exposed,
- raw appointment / dispatch visit data can be exposed,
- organization isolation can be bypassed,
- customer channel identity verification can be bypassed,
- DB, migration, fixture, smoke, provider, or shared runtime execution is approved.

## Consolidated Guardrail Confirmation

The branch preserves the following guardrails:

- One Case equals one formal Field Service Report.
- One Case can have multiple appointments / dispatch visits.
- Timeline and customer-facing report are filtered projections, not sources of truth.
- Customer-facing surfaces must not display internal notes, audit log, AI raw payload, billing internals, settlement internals, inventory internals, warehouse data, stock movement data, supervisor notes, engineer internal comments, provider payloads, or staff-management data.
- Raw token values must not enter logs, AI context, customer responses, provider debug output, docs, or audit details.
- Safe-deny responses must be non-enumerating.
- LINE is not hard-coded as the only customer channel.
- `line_user_id` is not a global identity.
- Customer channel identity is scoped by organization and channel.
- AI remains advisory and draft-only.
- AI must not decide access, publish customer-facing content, or alter denial behavior.
- No database, DDL, migration, shared runtime, provider call, fixture creation, or destructive cleanup is part of this branch.
- No sensitive output is included.
- Inventory docs remain frozen.

## Recommended Next Branch Options

These are options only and must not be implemented as part of Task369.

### Option A - Customer-facing Access Implementation Planning Branch

Plan runtime implementation sequencing across API routes, controllers, access context, projection service, safe-deny helper, localization, verification, link lifecycle, audit/security events, and tests.

### Option B - Customer Channel Identity Data Model Proposal Branch

Design the future scoped customer channel identity data model before runtime implementation.

### Option C - Safe-deny Helper / Localization Implementation Planning Branch

Plan actual message key files, helper interface, fallback behavior, and response mapping.

### Option D - Appointment Lifecycle Runtime Hardening Branch

Return to appointment lifecycle runtime hardening if PM prioritizes service-level consistency, concurrency, or low-risk runtime guards.

### Option E - PM Continuation Handoff

Prepare a continuation handoff if the PM context becomes too long.

## Risk and Limitations

The customer-facing access branch is ready only as a documentation design package.

The main risks if runtime begins before the required gates are:

- customer-facing API leaks raw internal data,
- safe-deny responses reveal resource existence,
- raw tokens enter logs or AI context,
- access context is implemented inconsistently,
- LINE-specific identity assumptions become hard-coded,
- projection service is bypassed by controllers,
- audit/security events store sensitive values,
- rate-limit behavior becomes externally enumerable,
- tests accidentally run against shared runtime.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No localization file, helper code, interface code, audit table, token table, or rate-limit runtime is added by Task369.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke test change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, raw link values, verification codes, or production data details.

Future customer-facing access implementation must continue to avoid exposing token values, resource existence, ownership, organization scope, channel identity state, internal denial reason, provider data, AI payload, billing internals, settlement internals, inventory internals, signature storage internals, or staff-management data.

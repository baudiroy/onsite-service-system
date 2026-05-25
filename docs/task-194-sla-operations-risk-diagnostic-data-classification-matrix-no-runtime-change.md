# Task 194 - SLA / Operations Risk Diagnostic Data Classification Matrix / No Runtime Change

## Purpose and Non-Goals

Task194 defines a documentation-only diagnostic data classification matrix for future SLA / operations risk workflows.

This document classifies diagnostic data categories and proposes where each category may or may not appear. It is proposal-only and does not implement logging, redaction, automated tests, smoke tests, API behavior, Admin behavior, schemas, migrations, entitlement runtime, SaaS billing, usage metering, notification delivery, survey runtime, or AI automation.

Task194 builds on:

- `docs/PROJECT_GUARDRAILS.md`
- the user-provided short guardrails version synced with PM
- `docs/task-180-sla-operations-risk-action-audit-and-evidence-policy-no-runtime-change.md`
- `docs/task-188-sla-operations-risk-safe-error-and-permission-failure-copy-draft-no-runtime-change.md`
- `docs/task-190-sla-operations-risk-api-error-allow-list-review-no-runtime-change.md`
- `docs/task-191-sla-operations-risk-403-vs-404-non-leakage-decision-packet-no-runtime-change.md`
- `docs/task-192-sla-operations-risk-resource-enumeration-test-plan-no-runtime-change.md`
- `docs/task-193-sla-operations-risk-internal-diagnostic-redaction-policy-no-runtime-change.md`

Task194 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify API behavior,
- modify smoke, browser smoke, or automated tests,
- modify logging or redaction utilities,
- modify `package.json`,
- add a migration file,
- change schema or indexes,
- apply or dry-run Migration 020,
- connect to DB,
- use psql,
- run `npm run db:migrate`,
- execute DDL,
- add SLA runtime,
- add operations risk runtime,
- add entitlement runtime,
- add usage metering runtime,
- add SaaS billing / subscription / payment implementation,
- add dashboard implementation,
- add notification sending,
- send LINE / APP / SMS / email,
- enable survey runtime,
- enable delivery resolver runtime,
- enable outbox worker,
- add AI automatic decisions,
- change Case / Appointment / Report behavior,
- change `finalAppointmentId` logic,
- modify inventory docs,
- perform destructive cleanup,
- output sensitive values.

## Source-of-Truth Guardrails

Task194 preserves:

- one Case = one formal Field Service Report,
- one Case may have many appointments / dispatch visits,
- same Case must not have multiple open appointments at once,
- Field Service Report remains the Case-level final summary,
- `finalAppointmentId` remains backend / system determined and stable after completion,
- LINE is a channel, not the hard-coded core model,
- `line_user_id` is not global identity,
- all major future data must be organization / tenant scoped,
- permission and entitlement are separate concepts,
- customer-visible data and internal-only data must be separated,
- AI is advisory only,
- future design notes do not authorize runtime implementation.

## Current Architecture Assumptions

Task194 assumes:

- no SLA / operations risk runtime exists,
- no SLA / operations risk API exists,
- no SLA / operations risk Admin dashboard exists,
- no operations risk diagnostic classification exists in runtime,
- no entitlement runtime exists,
- no SaaS subscription / billing / usage runtime exists,
- no notification provider delivery is approved,
- survey runtime remains paused,
- AI remains advisory only.

This classification matrix is future-facing only.

## Diagnostic Data Classification Principles

Future diagnostics should classify data before logging, displaying, exporting, attaching to audit-support notes, or including in AI advisory context.

Principles:

1. Default to omit.
2. Use safe summaries when possible.
3. Use redacted / masked / hashed values only when a future policy approves.
4. Keep customer-visible and internal-only data separated.
5. Treat tenant / organization details as scoped data.
6. Treat provider and channel diagnostics as highly sensitive.
7. Treat AI prompts, raw outputs, and hidden context as sensitive.
8. Do not use logs as hidden payload storage.
9. Do not use screenshots or QA artifacts as unredacted evidence.
10. Do not infer implementation approval from this matrix.

## Proposal-Only Classification Levels

| Level | Meaning | Default handling |
| --- | --- | --- |
| Public-safe | safe for broad internal UI copy | may appear if useful |
| Scoped internal | visible only to authorized organization / role | allow-listed only |
| Restricted | sensitive; requires specific permission | redact / reference only |
| Secret | credentials, tokens, connection strings | never expose |
| Diagnostic-protected | stack traces, SQL/provider diagnostics | protected tooling only if approved |
| Prohibited | should not appear in examples, handoffs, UI, API, or normal logs | omit |

## Diagnostic Data Category Inventory

Categories considered by Task194:

- risk item identifiers,
- Case / appointment / report references,
- organization / tenant / branch / team references,
- user / actor references,
- permission / entitlement decision context,
- SLA clock and threshold context,
- workflow state and action context,
- audit and evidence references,
- AI advisory metadata,
- channel / provider readiness metadata,
- LINE / channel identity references,
- customer contact data,
- provider credentials / tokens / secrets,
- raw payloads / full payloads,
- stack traces / SQL errors / DB constraint names,
- internal diagnostics,
- QA artifacts / screenshots / exports / handoff snippets.

## Diagnostic Data Classification Matrix

| Data category | Classification | Logs | API metadata | Admin UI | Audit-support notes | QA artifacts / screenshots | Exports / handoff | AI advisory explanation | Provider/channel diagnostics |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| risk category | Public-safe | safe | safe | safe | safe | safe | safe | safe | safe |
| risk item id | Scoped internal | opaque only | opaque only | if authorized | if authorized | placeholder | redacted | avoid unless needed | avoid |
| Case reference | Scoped internal | redacted/opaque | allow-listed | if case-visible | if authorized | placeholder | redacted summary | safe summary only | avoid |
| appointment reference | Scoped internal | redacted/opaque | allow-listed | if visit-visible | if authorized | placeholder | redacted summary | safe summary only | avoid |
| report reference | Scoped internal | redacted/opaque | allow-listed | if report-visible | if authorized | placeholder | redacted summary | safe summary only | avoid |
| organization scope | Scoped internal | redacted scope | safe scope marker | if authorized | safe scope marker | placeholder | redacted | avoid | avoid |
| tenant identifier | Restricted | redacted | avoid | tenant admin only if approved | redacted | placeholder | avoid | avoid | avoid |
| branch / team reference | Scoped internal | redacted | allow-listed if approved | if scoped | if authorized | placeholder | redacted | avoid | avoid |
| user / actor reference | Restricted | role summary | avoid raw id | role summary | if audit-visible | placeholder | redacted | avoid | avoid |
| permission decision | Scoped internal | code only | safe code | safe message | if authorized | placeholder | safe summary | avoid | avoid |
| entitlement decision | Restricted | code only | generic | generic unless tenant admin scope | if authorized | placeholder | safe summary | avoid | avoid |
| usage / plan limit | Restricted | bucket only | generic | generic unless tenant admin scope | if authorized | placeholder | safe summary | avoid | avoid |
| SLA clock state | Public-safe / scoped | safe state | safe state | safe state | safe state | safe state | safe summary | safe summary | avoid |
| threshold value | Scoped internal | code/version | if approved | if role-visible | if authorized | placeholder | safe summary | safe summary | avoid |
| workflow state | Public-safe / scoped | safe state | safe state | safe state | safe state | safe state | safe summary | safe summary | avoid |
| action reason code | Scoped internal | code only | code only | if authorized | if authorized | placeholder | safe summary | safe summary | avoid |
| audit note content | Restricted | avoid | avoid | if audit-visible | if authorized | placeholder/redacted | avoid | avoid | avoid |
| evidence reference | Restricted | reference only | reference only if allowed | if evidence-visible | if authorized | placeholder | redacted summary | avoid | avoid |
| AI advisory metadata | Restricted | code only | availability flag | if permitted | if authorized | placeholder | avoid | safe advisory summary | avoid |
| AI prompt / raw output | Prohibited | omit | omit | omit | omit unless future protected AI audit approved | omit | omit | omit | omit |
| channel availability summary | Scoped internal | safe state | safe state | if authorized | if authorized | placeholder | safe summary | safe summary | safe state |
| raw LINE user id | Prohibited | omit | omit | omit | omit | omit | omit | omit | omit |
| channel secret / access token | Secret | omit | omit | omit | omit | omit | omit | omit | omit |
| customer contact value | Restricted / prohibited by default | omit | omit | only approved contact workflow | omit | omit | omit | omit | omit |
| provider raw payload | Prohibited | omit | omit | omit | omit | omit | omit | omit | protected tooling only if approved |
| provider credential | Secret | omit | omit | omit | omit | omit | omit | omit | omit |
| stack trace | Diagnostic-protected | protected only if approved | omit | omit | omit | omit | omit | omit | omit |
| SQL error / DB constraint name | Diagnostic-protected | protected only if approved | omit | omit | omit | omit | omit | omit | omit |
| full object payload | Prohibited | omit | omit | omit | omit | omit | omit | omit | omit |

This matrix is not an implementation allow-list. Each future surface still needs its own approval and tests.

## Logs / Runtime Diagnostic Boundary

Future logs may contain:

- safe error code,
- opaque correlation id,
- safe state code,
- redacted organization scope,
- role category,
- retry hint.

Future logs must not contain raw payloads, secrets, customer contact values, raw channel identifiers, provider payloads, stack traces, SQL details, DB constraint names, or real tenant identifiers in normal logs.

## API Metadata Boundary

Future API metadata may contain:

- safe error code,
- safe message key,
- retry hint,
- opaque correlation id,
- allow-listed field label.

Future API metadata must not contain raw submitted values, raw channel ids, hidden resource ids, raw diagnostics, provider values, or entitlement internals.

## Admin UI Diagnostic Boundary

Future Admin UI may show:

- safe copy,
- safe risk category,
- safe state labels,
- safe refresh/retry guidance,
- permission-safe unavailable copy.

Admin UI must not show raw diagnostics, hidden counts, provider raw errors, raw channel identities, real customer contact values, stack traces, SQL errors, or plan internals to normal operators.

## Audit-Support Note Boundary

Future audit-support notes may include:

- safe action type,
- reason code,
- role summary,
- timestamp,
- redacted evidence reference.

They must not include raw payloads, customer contact values, raw channel ids, provider diagnostics, AI raw output, hidden evidence content, or hidden audit note content.

## QA Artifact / Screenshot Boundary

QA artifacts and screenshots should use placeholder or redacted data only.

If an artifact cannot be redacted safely, it should not be shared.

## Export / CSV / Handoff Boundary

Exports, CSVs, and handoffs should default to safe summaries:

- counts,
- safe categories,
- safe status labels,
- safe date ranges,
- redacted role summaries,
- redacted scope markers.

They should omit customer contact values, raw channel identifiers, provider details, raw payloads, hidden evidence, hidden audit notes, and real tenant identifiers unless a future protected export policy approves otherwise.

## AI Advisory Explanation Boundary

AI advisory explanations may include safe summaries and suggested review steps.

AI advisory explanations must not include raw prompts, raw model outputs, hidden context, customer contact values, raw channel ids, provider diagnostics, official decisions, or hidden evidence.

## Provider / Channel / LINE Diagnostic Boundary

Provider and channel diagnostics must be protected.

Core risk workflows may show:

- channel available / unavailable,
- delivery not approved,
- delivery not configured,
- notification disabled.

They must not show raw LINE user id, channel secret, access token, provider account id, provider request/response, recipient contact value, or whether a hidden customer has a binding.

## Customer-Visible vs Internal-Only Boundary

Customer-visible surfaces must be stricter than internal surfaces.

Customers must not see:

- internal notes,
- risk scores,
- audit logs,
- billing internal data,
- AI raw payload,
- provider diagnostics,
- escalation internals,
- hidden workflow state.

Internal-only still requires role, organization, tenant, and sensitivity checks.

## Organization / Tenant Isolation Boundary

Organization and tenant diagnostic data should be redacted by default.

Future implementation should avoid:

- exposing another tenant exists,
- exposing another organization's resource exists,
- exposing tenant plan internals to normal operators,
- exposing real tenant identifiers in broad handoffs,
- exposing hidden organization ids in API metadata.

## Entitlement / Plan / Usage Diagnostic Boundary

Entitlement diagnostics are sensitive.

Future normal-operator surfaces may show only generic feature unavailable messages.

Future tenant admin / billing admin surfaces may show more details only after separate approval.

Task194 does not implement entitlement runtime, usage metering, billing, subscription, trial, upgrade, downgrade, payment, or plan logic.

## Placeholder-Safe Example Policy

Use placeholders:

- `<risk-id>`
- `<case-id>`
- `<appointment-id>`
- `<report-id>`
- `<organization-scope>`
- `<tenant-scope>`
- `<correlation-id>`
- `<safe-error-code>`

Do not use real customer, tenant, organization, channel, provider, token, payload, or diagnostic values.

## Redaction / Masking / Hashing / Omission Guidance

Proposal-only guidance:

| Technique | Use when | Caution |
| --- | --- | --- |
| omit | data is not needed or too sensitive | safest default |
| redact | user needs to know field exists but not value | avoid leaking length/pattern when sensitive |
| mask | value display is necessary and approved | avoid real examples in docs |
| hash | matching is needed without raw value | requires salt/storage policy |
| reference id | safe internal linking is needed | must be scoped and opaque |
| aggregate | trend/count is needed | avoid small-count leakage |

No technique is implemented by Task194.

## Alignment with Task193

Task194 operationalizes Task193 by turning redaction policy into data categories and surface boundaries.

## Alignment with Task188 / Task190 / Task191 / Task192

Task194 supports:

- Task188 safe copy,
- Task190 error allow-list,
- Task191 403 / 404 non-leakage,
- Task192 resource enumeration test planning.

## Alignment with Task173-Task187

Task194 preserves prior decisions:

- review-first operations risk design,
- no runtime implementation,
- no migration,
- organization scope,
- RBAC separation,
- audit/evidence separation,
- AI advisory only,
- channel abstraction.

## Implementation Blockers and Required Approvals

Before implementation, approve:

- final data classification levels,
- per-surface allow-lists,
- log redaction policy,
- API metadata policy,
- Admin diagnostic policy,
- audit/evidence visibility rules,
- QA artifact process,
- export policy,
- AI advisory audit policy,
- provider/channel diagnostic policy,
- tenant/organization diagnostic policy,
- entitlement diagnostic policy,
- test plan and security review.

This document does not approve implementation.

## Future Task Candidates

Possible follow-up tasks:

1. SLA / Operations Risk QA Artifact Redaction Checklist / No Runtime Change.
2. SLA / Operations Risk API Error Response Shape Draft / No Runtime Change.
3. SLA / Operations Risk Entitlement Failure UX Draft / No Runtime Change.
4. SLA / Operations Risk Error Handling Readiness Gate / No Runtime Change.
5. SLA / Operations Risk Security Review Checklist / No Runtime Change.

## Verification Checklist

Before using Task194 as input to future implementation, verify:

- `docs/PROJECT_GUARDRAILS.md` still applies,
- Task194 is still proposal-only,
- classification levels are approved,
- all surfaces have explicit boundaries,
- prohibited content remains prohibited,
- placeholder examples remain placeholders,
- tenant and organization isolation are preserved,
- entitlement diagnostics remain separated from permission diagnostics,
- AI advisory output remains redacted,
- provider/channel diagnostics remain protected.

## Task194 Completion Note

Task194 is complete as a documentation-only diagnostic data classification matrix.

No backend source, Admin source, API implementation, route/controller/service/repository, smoke test, automated test, logging utility, redaction utility, OpenAPI/generated client, executable config, migration, schema, index, DB, DDL, entitlement runtime, usage metering, SaaS billing/subscription/payment, provider sending, survey runtime, AI automatic decision, or inventory documentation was changed.

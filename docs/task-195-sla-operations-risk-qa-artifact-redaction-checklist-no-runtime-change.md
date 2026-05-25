# Task 195 - SLA / Operations Risk QA Artifact Redaction Checklist / No Runtime Change

## Purpose and Non-Goals

Task195 defines a documentation-only QA artifact redaction checklist for future SLA / operations risk workflows.

This document covers screenshots, screen recordings, browser traces, copied API responses, console output, server logs, failure reports, exported CSVs, handoff snippets, test fixtures, AI advisory examples, and provider/channel diagnostics. It is proposal-only and does not create or modify actual QA artifacts, smoke tests, automated tests, QA scripts, logging utilities, redaction utilities, API behavior, Admin behavior, migrations, entitlement runtime, SaaS billing, usage metering, notification delivery, survey runtime, or AI automation.

Task195 builds on:

- `docs/PROJECT_GUARDRAILS.md`
- the user-provided short guardrails version synced with PM
- `docs/task-188-sla-operations-risk-safe-error-and-permission-failure-copy-draft-no-runtime-change.md`
- `docs/task-190-sla-operations-risk-api-error-allow-list-review-no-runtime-change.md`
- `docs/task-191-sla-operations-risk-403-vs-404-non-leakage-decision-packet-no-runtime-change.md`
- `docs/task-192-sla-operations-risk-resource-enumeration-test-plan-no-runtime-change.md`
- `docs/task-193-sla-operations-risk-internal-diagnostic-redaction-policy-no-runtime-change.md`
- `docs/task-194-sla-operations-risk-diagnostic-data-classification-matrix-no-runtime-change.md`

Task195 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify API behavior,
- modify smoke, browser smoke, automated tests, or QA scripts,
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

Task195 preserves:

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

QA artifacts must not become a side channel for leaking customer, tenant, organization, channel, provider, AI, diagnostic, or entitlement data.

## Current Architecture Assumptions

Task195 assumes:

- no SLA / operations risk runtime exists,
- no SLA / operations risk API exists,
- no SLA / operations risk Admin dashboard exists,
- no operations risk QA artifact process exists in runtime,
- no entitlement runtime exists,
- no SaaS subscription / billing / usage runtime exists,
- no notification provider delivery is approved,
- survey runtime remains paused,
- AI remains advisory only.

This checklist is future-facing only.

## QA Artifact Redaction Principles

Future QA artifacts should follow these principles:

1. Prefer placeholder data over redacting real data.
2. If real-like data is unavoidable in local/test, review before sharing.
3. Never use production data in examples or handoffs.
4. Do not capture secrets, tokens, provider payloads, raw channel identifiers, or customer contact values.
5. Do not expose hidden organization / tenant resource existence.
6. Do not expose raw diagnostic payloads, stack traces, SQL errors, or DB constraint names.
7. Treat screenshots, recordings, traces, logs, exports, and copied snippets as shareable artifacts only after review.
8. Keep AI advisory examples free of prompts, raw outputs, and hidden context.
9. Keep provider/channel diagnostics channel-agnostic unless a future protected provider workflow is approved.
10. When in doubt, omit the artifact or replace it with a safe summary.

## Covered Artifact Types

Task195 covers future handling for:

- screenshots,
- screen recordings,
- browser traces,
- copied API responses,
- copied API requests,
- console output,
- server logs,
- failure reports,
- exported CSVs,
- handoff snippets,
- test fixtures,
- AI advisory examples,
- provider/channel diagnostics,
- QA notes,
- issue attachments,
- implementation review packets.

## Mandatory Pre-Share Checklist

Before sharing any QA artifact, confirm:

- no real customer data,
- no customer mobile / phone / tel value,
- no raw LINE user id,
- no channel secret or access token,
- no provider credential,
- no token or password value,
- no `DATABASE_URL`,
- no raw provider payload,
- no raw customer payload,
- no full Case / customer / appointment / report payload,
- no stack trace,
- no SQL error,
- no DB constraint name,
- no provider raw error,
- no internal diagnostic payload,
- no real tenant identifier,
- no real organization identifier,
- no hidden evidence content,
- no hidden audit note content,
- no AI prompt or raw AI output,
- no entitlement / usage / plan internals unless future authorized admin scope is approved.

If any item cannot be confidently checked, do not share the artifact.

## Prohibited Artifact Content

Future QA artifacts must not include:

- customer mobile / phone / tel values,
- raw LINE user id,
- scoped channel identity values,
- LINE channel secret,
- LINE access token,
- provider credentials,
- token values,
- password values,
- `DATABASE_URL`,
- URLs with embedded secrets,
- raw payloads,
- full payloads,
- provider raw values,
- stack traces,
- SQL errors,
- DB constraint names,
- internal diagnostic payloads,
- real tenant identifiers,
- real organization identifiers,
- real case / appointment / report identifiers,
- hidden audit / evidence details,
- raw AI prompts or outputs.

## Placeholder-Safe Replacement Examples

Use placeholder replacements:

| Sensitive content type | Placeholder replacement |
| --- | --- |
| customer name | `<customer-name>` |
| customer phone value | `<customer-contact>` |
| raw LINE user id | `<line-user-id-redacted>` |
| LINE channel id | `<line-channel-id>` |
| provider account id | `<provider-account-redacted>` |
| token / secret | `<secret-redacted>` |
| database connection value | `<database-url-redacted>` |
| tenant id | `<tenant-scope>` |
| organization id | `<organization-scope>` |
| case id | `<case-id>` |
| appointment id | `<appointment-id>` |
| report id | `<report-id>` |
| evidence reference | `<evidence-reference>` |
| audit actor | `<actor-role>` |
| API payload | `<payload-redacted>` |
| stack trace | `<stack-trace-redacted>` |
| SQL error | `<sql-error-redacted>` |
| AI prompt/output | `<ai-content-redacted>` |

Placeholders must remain visibly fake.

## Screenshot and Screen Recording Checklist

Before sharing screenshots or recordings:

- crop to the smallest relevant area,
- blur or remove customer contact values,
- remove raw channel identifiers,
- remove browser address bars if they contain sensitive ids,
- remove devtools panes showing payloads,
- remove console logs,
- remove hidden tenant / organization identifiers,
- remove provider diagnostics,
- confirm empty states do not reveal hidden counts,
- confirm AI examples are safe summaries only.

If a screenshot cannot be safely redacted, describe the issue in text instead.

## Browser Trace / Console Output Checklist

Browser traces and console output may capture more than intended.

Before sharing:

- remove request and response bodies,
- remove headers,
- remove query strings containing identifiers,
- remove console errors with stack traces,
- remove source maps if they reveal internal paths,
- remove storage/session-like values,
- remove raw payloads,
- remove provider/channel values.

Prefer a safe summary:

```text
Browser trace reviewed. Request failed with safe error code <safe-error-code>; no raw payload shared.
```

## API Response / Request Snippet Checklist

Copied API snippets should be avoided unless they are sanitized.

Allowed:

- safe error code,
- safe message key,
- retry hint,
- opaque correlation id,
- allow-listed field label,
- placeholder ids.

Forbidden:

- raw request body,
- raw response body,
- raw query string,
- raw headers,
- customer data,
- channel identifiers,
- provider values,
- tokens,
- stack traces,
- SQL errors,
- full objects.

## Server Log / Failure Report Checklist

Before sharing server logs or failure reports:

- remove raw request/response bodies,
- remove stack traces unless a protected engineering workflow approves,
- remove SQL errors and DB constraint names,
- remove provider raw errors,
- remove credentials and tokens,
- remove customer contact values,
- remove raw channel ids,
- replace real tenant / organization ids with placeholders,
- summarize instead of pasting full logs.

Safe pattern:

```text
Failure summary: <safe-error-code>, affected workflow: <workflow-name>, retry hint: <retry-hint>.
```

## Export / CSV / Handoff Checklist

Exports, CSVs, and handoffs should use safe summaries.

Before sharing:

- remove customer contact values,
- remove raw channel ids,
- remove provider details,
- remove hidden evidence and audit details,
- remove real tenant / organization ids unless explicitly authorized,
- aggregate counts where possible,
- avoid small-count leakage if it could identify a customer or tenant,
- include only safe categories, states, and date ranges.

## Test Fixture Checklist

Future fixtures should:

- use fake placeholder customers,
- use fake placeholder organizations,
- use fake placeholder tenants,
- use fake placeholder channel identities,
- avoid production-like phone values,
- avoid raw provider payloads,
- avoid secrets,
- avoid real API keys,
- avoid real LINE values,
- avoid embedding full payloads.

Fixtures should be designed for repeatability and non-leakage.

## AI Advisory Example Checklist

AI advisory examples should:

- label AI as advisory,
- use placeholder context,
- avoid raw prompts,
- avoid raw outputs,
- avoid hidden evidence,
- avoid customer contact values,
- avoid raw channel identifiers,
- avoid provider diagnostics,
- avoid authoritative wording.

AI examples must not say AI resolved, suppressed, escalated, notified, approved, billed, completed, or closed anything.

## Provider / Channel / LINE Diagnostic Checklist

Provider/channel artifacts must be heavily restricted.

Before sharing:

- remove raw LINE user id,
- remove channel secret,
- remove access token,
- remove provider account id,
- remove provider request/response,
- remove recipient contact value,
- remove provider raw error,
- avoid confirming hidden customer channel binding,
- use channel-agnostic language.

Safe example:

```text
Delivery readiness: not configured for this workflow.
```

## Tenant / Organization / Entitlement Context Checklist

Before sharing tenant / organization / entitlement context:

- replace real tenant ids with `<tenant-scope>`,
- replace real organization ids with `<organization-scope>`,
- do not reveal another tenant exists,
- do not reveal plan internals to normal operators,
- do not show exact usage counts unless future authorized billing/admin scope is approved,
- do not expose entitlement evaluation internals,
- separate permission denial from entitlement denial.

## Customer-Visible vs Internal-Only Boundary

Customer-visible artifacts must be stricter than internal artifacts.

Never expose to customers:

- internal notes,
- risk scores,
- audit logs,
- billing internal data,
- AI raw payload,
- provider diagnostics,
- escalation internals,
- hidden workflow state,
- entitlement internals.

Internal-only artifacts still require role, organization, tenant, and sensitivity controls.

## No-Send / No-Provider QA Artifact Boundary

Future QA artifact collection must not imply provider sending.

Unless a future task explicitly approves provider runtime:

- no LINE push,
- no APP push,
- no SMS,
- no email,
- no notification provider integration,
- no delivery resolver runtime,
- no survey sending.

Artifacts should say "no-send" or "provider not used" when relevant.

## Alignment with Task193 and Task194

Task195 turns Task193 redaction policy and Task194 classification matrix into a practical pre-share checklist.

## Alignment with Task188 / Task190 / Task191 / Task192

Task195 supports:

- Task188 safe copy,
- Task190 error allow-list,
- Task191 non-leakage decision rules,
- Task192 resource enumeration test planning.

## Alignment with Task173-Task187

Task195 preserves:

- review-first operations risk design,
- no runtime implementation,
- no migration,
- organization scope,
- RBAC separation,
- audit/evidence separation,
- AI advisory only,
- channel abstraction.

## Implementation Blockers and Required Approvals

Before QA artifact redaction process is implemented, approve:

- artifact types,
- owner of redaction review,
- automated redaction feasibility,
- manual review requirements,
- screenshot policy,
- browser trace policy,
- export/handoff policy,
- provider diagnostic policy,
- AI advisory artifact policy,
- tenant / organization artifact policy,
- test fixture policy,
- storage and retention policy,
- security review.

This document does not approve implementation.

## Future Task Candidates

Possible follow-up tasks:

1. SLA / Operations Risk API Error Response Shape Draft / No Runtime Change.
2. SLA / Operations Risk Entitlement Failure UX Draft / No Runtime Change.
3. SLA / Operations Risk QA Artifact Storage / Retention Policy Draft / No Runtime Change.
4. SLA / Operations Risk Error Handling Readiness Gate / No Runtime Change.
5. SLA / Operations Risk Security Review Checklist / No Runtime Change.

## Verification Checklist

Before using Task195 as input to future implementation, verify:

- `docs/PROJECT_GUARDRAILS.md` still applies,
- Task195 is still proposal-only,
- artifacts are not generated by this task,
- placeholders remain placeholders,
- prohibited content remains prohibited,
- no-send / no-provider boundary remains intact,
- AI remains advisory only,
- tenant and organization isolation are preserved,
- entitlement diagnostics remain separated from permission diagnostics.

## Task195 Completion Note

Task195 is complete as a documentation-only QA artifact redaction checklist.

No backend source, Admin source, API implementation, route/controller/service/repository, smoke test, automated test, QA script, logging utility, redaction utility, OpenAPI/generated client, executable config, migration, schema, index, DB, DDL, entitlement runtime, usage metering, SaaS billing/subscription/payment, provider sending, survey runtime, AI automatic decision, or inventory documentation was changed.

# Task 193 - SLA / Operations Risk Internal Diagnostic Redaction Policy / No Runtime Change

## Purpose and Non-Goals

Task193 defines a documentation-only internal diagnostic redaction policy for future SLA / operations risk workflows.

This document covers logs, API error metadata, Admin UI diagnostics, audit-support notes, QA artifacts, screenshots, exports, handoffs, AI advisory explanations, provider/channel diagnostics, tenant/organization diagnostics, and entitlement diagnostics. It is proposal-only and does not implement logging utilities, redaction utilities, automated tests, smoke tests, backend behavior, Admin behavior, API behavior, migrations, entitlement runtime, SaaS billing, usage metering, notification delivery, survey runtime, or AI automation.

Task193 builds on:

- `docs/PROJECT_GUARDRAILS.md`
- the user-provided short guardrails version synced with PM
- `docs/task-180-sla-operations-risk-action-audit-and-evidence-policy-no-runtime-change.md`
- `docs/task-188-sla-operations-risk-safe-error-and-permission-failure-copy-draft-no-runtime-change.md`
- `docs/task-190-sla-operations-risk-api-error-allow-list-review-no-runtime-change.md`
- `docs/task-191-sla-operations-risk-403-vs-404-non-leakage-decision-packet-no-runtime-change.md`
- `docs/task-192-sla-operations-risk-resource-enumeration-test-plan-no-runtime-change.md`

Task193 does not:

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

Task193 preserves:

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

Task193 assumes:

- no SLA / operations risk runtime exists,
- no SLA / operations risk API exists,
- no SLA / operations risk Admin dashboard exists,
- no operations risk diagnostic redaction utility exists,
- no entitlement runtime exists,
- no SaaS subscription / billing / usage runtime exists,
- no notification provider delivery is approved,
- survey runtime remains paused,
- AI remains advisory only.

This policy is future-facing only.

## Internal Diagnostic Redaction Principles

Future diagnostics should help authorized operators debug safely without turning logs, screenshots, exports, or handoffs into sensitive data stores.

Principles:

1. Collect the minimum diagnostic detail needed.
2. Prefer stable internal references over raw values.
3. Keep organization / tenant scope explicit but safe.
4. Redact customer contact values.
5. Redact raw channel identifiers.
6. Redact provider credentials and raw provider payloads.
7. Redact secrets, tokens, passwords, URLs with secrets, and database connection values.
8. Redact stack traces, SQL errors, and DB constraint names from user-facing artifacts.
9. Separate customer-visible messages from internal-only diagnostics.
10. Treat AI prompts, raw outputs, and hidden context as sensitive unless a future protected AI audit policy approves otherwise.

## Prohibited Diagnostic Content

Future diagnostic artifacts must not include:

- customer mobile / phone / tel values,
- raw LINE user id,
- LINE channel secret,
- LINE access token,
- provider credentials,
- token values,
- password values,
- `DATABASE_URL`,
- URLs with embedded secrets,
- raw provider payload,
- raw customer payload,
- full Case / customer / appointment / report payload,
- stack traces,
- SQL errors,
- DB constraint names,
- provider raw errors,
- internal diagnostic payloads,
- real tenant identifiers,
- real organization identifiers,
- AI prompts or raw AI outputs unless separately approved,
- hidden evidence details,
- hidden audit note content.

## Safe Diagnostic Content Categories

Future diagnostics may use:

- opaque correlation id,
- safe error code,
- safe message key,
- redacted organization scope marker,
- redacted user role category,
- risk category,
- safe state label,
- retry hint,
- placeholder ids in documentation,
- boolean capability flags when safe,
- elapsed time bucket instead of exact provider details,
- redacted entitlement state category.

Example safe shape:

```text
correlationId=<opaque-reference>
errorCode=RISK_STALE_STATE
scope=organization-scoped
retryHint=refresh
```

This is a placeholder example, not an implemented log format.

## Log Redaction Policy

Future logs should:

- log safe error codes instead of raw errors,
- log opaque correlation ids,
- log redacted organization scope,
- avoid raw request and response bodies,
- avoid raw query strings if they may contain sensitive values,
- avoid raw channel identifiers,
- avoid provider raw responses,
- avoid stack traces in normal application logs,
- route deep diagnostics to protected tooling only if approved.

Logs must not become a workaround for storing payloads or secrets.

## API Error Metadata Redaction Policy

Future API error metadata may expose:

- safe error code,
- safe message key,
- retry hint,
- opaque correlation id,
- allow-listed field label.

Future API error metadata must not expose:

- raw submitted values,
- raw ids outside an approved allow-list,
- customer contact values,
- raw channel ids,
- stack traces,
- SQL errors,
- provider raw errors,
- entitlement internals unless future tenant admin context is approved.

## Admin UI Diagnostic Display Policy

Future Admin UI diagnostics should:

- show safe operational copy,
- show safe retry/refresh guidance,
- hide sensitive diagnostic details by default,
- avoid hidden counts,
- avoid raw ids,
- avoid provider diagnostics,
- avoid tenant / plan internals for normal operators,
- separate risk status from official Case / Appointment / Report status.

Admin UI should not expose raw diagnostics in tooltips, modals, browser console logs, copied text, or downloadable summaries.

## Audit-Support Note Redaction Policy

Audit-support notes may be needed for supervisor or auditor review, but they should still be redacted.

Future audit-support notes may include:

- safe action type,
- safe reason code,
- actor role summary,
- timestamp,
- organization scope,
- redacted evidence reference.

Future audit-support notes must not include:

- customer contact values,
- raw channel identifiers,
- provider payloads,
- credentials,
- full payloads,
- raw AI prompts or outputs,
- hidden evidence content.

## QA Artifact and Screenshot Redaction Policy

Future QA screenshots and artifacts should use placeholder data or redacted data.

Forbidden in QA artifacts:

- real customer data,
- real tenant identifiers,
- real organization identifiers,
- raw LINE identifiers,
- provider values,
- secrets,
- full payloads,
- stack traces,
- SQL errors,
- internal diagnostics.

Screenshots should be reviewed before handoff. If redaction cannot be guaranteed, the artifact should not be shared.

## Export / CSV / Handoff Redaction Policy

Future exports and handoffs should be safe summary first.

Allowed by default:

- counts,
- safe category labels,
- safe state labels,
- date ranges if non-sensitive,
- redacted owner role,
- redacted organization scope,
- safe action summaries.

Not allowed by default:

- customer contact values,
- raw channel ids,
- raw payloads,
- provider details,
- hidden evidence,
- hidden audit notes,
- credential-like values,
- real tenant identifiers in broad handoffs.

## AI Advisory Explanation Redaction Policy

AI advisory explanations should not expose hidden context.

AI explanations may include:

- safe summary,
- uncertainty,
- missing-field reminder,
- suggested review step,
- reason code.

AI explanations must not include:

- raw prompt,
- raw model output,
- customer contact values,
- raw channel ids,
- full payloads,
- hidden evidence,
- hidden audit notes,
- inferred sensitive facts,
- authoritative decisions.

AI remains advisory only.

## Provider / Channel / LINE Diagnostic Redaction Policy

Future provider/channel diagnostics must be especially narrow.

Allowed safe wording:

- "Channel information is not available."
- "Delivery is not configured."
- "Notification delivery is disabled for this workflow."
- "No deliverable channel is currently available."

Forbidden:

- raw LINE user id,
- channel secret,
- access token,
- provider account id,
- raw provider error,
- recipient contact value,
- provider request/response payload,
- whether a hidden customer has a channel binding.

Core risk workflows must remain channel-agnostic.

## Tenant / Organization / Entitlement Diagnostic Boundaries

Future diagnostics should preserve SaaS-ready isolation.

Do not expose:

- real tenant names or ids in broad artifacts,
- hidden organization ids,
- plan internals to normal operators,
- usage counts to unauthorized users,
- entitlement evaluation internals,
- other tenant feature availability.

Safe placeholders:

- `tenant_visible_placeholder`
- `organization_visible_placeholder`
- `entitlement_disabled_placeholder`
- `usage_limit_placeholder`

These placeholders are for documentation and test planning only.

## Placeholder-Safe Example Policy

Documentation and test plans should use placeholder-only examples.

Use:

- `<case-id>`
- `<risk-id>`
- `<organization-scope>`
- `<tenant-scope>`
- `<correlation-id>`
- `<safe-error-code>`

Avoid:

- real names,
- real phone values,
- real LINE identifiers,
- real tenant identifiers,
- real organization identifiers,
- real provider values,
- copied raw logs.

## Customer-Visible vs Internal-Only Separation

Customer-visible messages should be simpler and more restricted than internal messages.

Internal-only does not mean unrestricted. Internal messages still need role, organization, and sensitivity controls.

Future customer-visible messages must not expose:

- internal risk scores,
- audit logs,
- internal notes,
- billing internal data,
- AI raw payload,
- provider diagnostics,
- hidden escalation state.

## Non-Leakage Alignment with Task191

Task193 supports Task191:

- generic not available copy must not include hidden diagnostics,
- 403 permission copy must not include sensitive reasons,
- 404-style safe-deny must not log raw hidden resource details in user-facing paths,
- entitlement failures must not reveal unauthorized plan internals,
- organization mismatch must not reveal another tenant.

## Resource Enumeration Test Alignment with Task192

Future resource enumeration tests should assert that:

- logs remain redacted,
- screenshots remain redacted,
- exported artifacts remain redacted,
- API metadata remains allow-listed,
- Admin diagnostics remain safe,
- internal-only diagnostics do not appear in user-facing output.

## Audit / Evidence Alignment with Task180

Task193 preserves Task180 separation:

- risk action audit is not raw payload storage,
- evidence references are not evidence payload dumps,
- audit visibility is permission-scoped,
- evidence visibility is permission-scoped,
- sensitive evidence requires separate access control.

## Error Copy / Allow-List Alignment with Task188 / Task190

Task193 aligns with:

- Task188 safe copy,
- Task190 error exposure classes,
- Task189 error code catalog,
- Task191 403 vs 404 decision direction.

Safe copy and safe error codes are only useful if diagnostics behind them are also redacted.

## SaaS Entitlement Guardrail Alignment

Task193 aligns with SaaS entitlement guardrails:

- entitlement diagnostics are not billing runtime,
- usage diagnostics are not usage metering runtime,
- plan diagnostics are not subscription implementation,
- normal operators should not see unauthorized plan or usage internals,
- tenant isolation applies to diagnostics.

## Alignment with Task173-Task192

Task193 aligns with prior planning:

- Task173 through Task179: operational risk remains review-first.
- Task180: audit/evidence separation is preserved.
- Task181 and Task187: permission and organization scope remain central.
- Task183: safe UI copy is preserved.
- Task184: API contracts remain conceptual.
- Task185: runtime readiness gate remains blocking.
- Task186: first-release scope remains proposal-only.
- Task188 through Task192: safe error, allow-list, non-leakage, and test planning are reinforced.

## Implementation Blockers and Required Approvals

Before redaction behavior is implemented, the following must be approved:

- diagnostic data classification,
- logging redaction requirements,
- API metadata allow-list,
- Admin diagnostic display policy,
- QA artifact policy,
- export and handoff policy,
- AI advisory audit policy,
- provider/channel diagnostic policy,
- tenant / organization diagnostic policy,
- entitlement diagnostic policy,
- security review,
- test plan.

This document does not approve implementation.

## Future Task Candidates

Possible follow-up tasks:

1. SLA / Operations Risk Diagnostic Data Classification Matrix / No Runtime Change.
2. SLA / Operations Risk API Error Response Shape Draft / No Runtime Change.
3. SLA / Operations Risk QA Artifact Redaction Checklist / No Runtime Change.
4. SLA / Operations Risk Entitlement Failure UX Draft / No Runtime Change.
5. SLA / Operations Risk Error Handling Readiness Gate / No Runtime Change.

## Verification Checklist

Before using Task193 as input to future implementation, verify:

- `docs/PROJECT_GUARDRAILS.md` still applies,
- Task193 is still treated as proposal-only,
- diagnostics do not include prohibited content,
- placeholders remain placeholders,
- customer-visible and internal-only data are separated,
- AI advisory explanations remain redacted,
- provider/channel diagnostics remain safe,
- tenant/organization diagnostics remain isolated,
- no logging/redaction utility implementation is implied.

## Task193 Completion Note

Task193 is complete as a documentation-only internal diagnostic redaction policy.

No backend source, Admin source, API implementation, route/controller/service/repository, smoke test, automated test, logging utility, redaction utility, OpenAPI/generated client, executable config, migration, schema, index, DB, DDL, entitlement runtime, usage metering, SaaS billing/subscription/payment, provider sending, survey runtime, AI automatic decision, or inventory documentation was changed.

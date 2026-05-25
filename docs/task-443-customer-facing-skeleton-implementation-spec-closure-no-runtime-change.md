# Task443 - Customer-Facing Skeleton Implementation Spec Closure / No Runtime Change

Task443 closes the Task437-Task442 customer-facing skeleton implementation spec
mini-branch.

This task is documentation-only. It does not authorize runtime work, does not
start a local-only runtime spike, and does not add code, tests, fixtures, DB
changes, API changes, provider sending, or AI/RAG work.

## Purpose

The purpose is to summarize the future implementation specifications for the
customer-facing local-only skeleton chain and make the current authorization
state explicit.

Current status remains `NO-GO`.

No runtime task may start unless the user explicitly authorizes the next single
minimum task through the Task435 decision packet or an equivalent itemized
authorization.

## Non-Authorization Statement

Task443 is not runtime approval.

Task443 does not authorize:

- backend `src/` changes,
- route/controller implementation,
- resolver implementation,
- customerAccessContext implementation,
- projection DTO / projection service implementation,
- response envelope / generic safe-deny implementation,
- chain integration implementation,
- repository implementation,
- DB access,
- API behavior,
- tests,
- fixtures,
- smoke/browser/API tests,
- localization file / message catalog changes,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider / RAG / vector DB,
- shared/prod/Zeabur runtime access.

Task443 only closes the skeleton implementation spec mini-branch.

## Relationship to Task437-Task442

| Task | Skeleton spec | Runtime approval? |
| --- | --- | --- |
| Task437 | Route/controller skeleton implementation spec | No |
| Task438 | Resolver skeleton implementation spec | No |
| Task439 | customerAccessContext skeleton implementation spec | No |
| Task440 | Projection DTO / projection service skeleton implementation spec | No |
| Task441 | Response envelope / generic safe-deny skeleton implementation spec | No |
| Task442 | Skeleton chain integration spec | No |

Together these documents define how a future chain could be implemented after
explicit authorization. They do not grant authorization.

## Mandatory Future Customer-Facing Flow

Any future authorized task must preserve:

```text
request
-> route/controller
-> resolver
-> customerAccessContext
-> projection DTO / projection service
-> response envelope or generic safe-deny
```

Rules:

- Controller must not bypass resolver.
- Resolver must not bypass customerAccessContext.
- Projection must not bypass customerAccessContext.
- Envelope must not bypass projection.
- Safe-deny must not leak resource existence.
- Response equivalence must be prioritized.
- Projection must be allow-list first.
- Unknown fields must default to deny.
- Forbidden fields must default to deny.
- Token/link must not be treated as customer identity.
- `line_user_id` must not be treated as global identity.
- No layer may output raw internal data.
- No layer may mutate Case, Appointment, Field Service Report, complaint,
  billing, settlement, identity, token, link, or audit state.
- No layer may query DB unless a future persistence/repository task is
  separately authorized.
- No layer may trigger provider sending.
- No layer may call AI provider / RAG / vector DB.

## Task437-Task442 Skeleton Spec Summary

The mini-branch now contains future implementation specs for:

- request entry via route/controller,
- resolver handoff,
- customerAccessContext boundary,
- customer-visible projection,
- response envelope / generic safe-deny,
- chain-level integration.

The specs are aligned around:

- no bypass,
- deny-by-default,
- allow-list-first,
- no-existence-leakage,
- response equivalence,
- organization isolation,
- scoped customer channel identity,
- no DB/provider/AI/RAG,
- no mutation.

## Current Status: NO-GO

Current status remains `NO-GO`.

There is still no runtime authorization because:

- the user has not selected a runtime option from Task435,
- no next single runtime task has been approved,
- no allowed runtime file paths have been approved,
- no allowed runtime commands have been approved,
- backend `src/` changes are not authorized,
- tests / fixtures / smoke / browser tests are not authorized,
- DB / DDL / migration / Migration020 remain prohibited,
- provider sending remains prohibited,
- AI provider / RAG / vector DB remain prohibited,
- production data and shared runtime access remain prohibited.

## Why Runtime Remains Not Authorized

The skeleton specs are instructions for a possible future branch, not permission
to begin it.

Runtime remains not authorized unless the user explicitly chooses the next
single task and confirms scope item by item.

Vague statements such as "continue", "next task", "go ahead", "可以做",
"照 PM 規劃做", "繼續開發", or "開始 runtime" still do not authorize runtime.

## Layer-by-Layer Future Responsibility Summary

### Route / Controller

Future responsibility:

- receive customer-facing request,
- call resolver,
- return response envelope or generic safe-deny placeholder.

### Resolver

Future responsibility:

- receive normalized request context,
- call customerAccessContext,
- return envelope-compatible placeholder result.

### customerAccessContext

Future responsibility:

- represent access decision shape,
- default deny,
- preserve scoped customer channel identity boundaries.

### Projection DTO / Projection Service

Future responsibility:

- receive customerAccessContext-approved placeholder input,
- produce customer-facing DTO placeholder,
- enforce allow-list-first projection.

### Response Envelope / Generic Safe-Deny

Future responsibility:

- wrap projected customer-visible output,
- collapse denied/unknown cases to generic safe-deny,
- preserve response equivalence.

### Chain Integration

Future responsibility:

- connect placeholders in the accepted order,
- preserve every layer boundary,
- avoid DB/provider/AI/RAG/mutation behavior.

## Layer-by-Layer Forbidden Responsibility Summary

Forbidden responsibilities across the future skeleton chain:

- route/controller must not perform access checks directly,
- resolver must not replace customerAccessContext,
- customerAccessContext must not build projection DTOs,
- projection must not override deny decisions,
- envelope must not build DTO fields or reinterpret access decisions,
- safe-deny must not create tickets, complaints, follow-ups, audit runtime rows,
  or provider notifications,
- no layer may query DB or call repositories without separate approval,
- no layer may expose internal-only data,
- no layer may mutate domain records or identity/link/audit state.

## Cross-Layer Invariants

Cross-layer invariants:

- no bypass,
- no raw internal data,
- no mutation,
- no DB / repository,
- no provider sending,
- no AI / RAG / vector DB,
- no production data,
- organization isolation,
- customer channel identity scoping,
- token/link non-identity,
- `line_user_id` scoped identity,
- customer-visible data policy,
- allow-list-first projection,
- unknown field default deny,
- forbidden field default deny,
- generic safe-deny,
- response equivalence,
- no-existence-leakage.

## What Remains Unimplemented

Everything remains unimplemented at runtime, including:

- routes,
- controllers,
- resolver,
- customerAccessContext,
- projection DTO / projection service,
- response envelope / safe-deny helper,
- chain integration,
- repositories,
- DB lookup,
- token/link verification,
- customer channel identity lookup,
- audit/security event writes,
- tests / fixtures / smoke,
- provider sending,
- AI/RAG/vector DB.

## Required Evidence Before Any Runtime Implementation

Before any runtime implementation, PM/Codex must have:

- explicit user-selected option from Task435,
- exact next single task,
- exact allowed file paths,
- exact allowed commands,
- local-only confirmation,
- disposable local/test environment confirmation if execution is needed,
- shared/prod/Zeabur exclusion,
- no-production-data confirmation,
- backend `src/` authorization for named files only,
- DB / DDL / migration exclusion,
- provider sending exclusion,
- AI/RAG/vector DB exclusion,
- tests / fixtures / smoke authorization if needed,
- stop conditions,
- completion report checklist.

Without this evidence, runtime remains `NO-GO`.

## Next PM Decision Options

Possible next PM steps:

1. Ask the user using the Task435 decision prompt.
2. Continue docs-only planning for tests / fixtures spec.
3. Continue docs-only planning for runtime risk register.
4. Pause the customer-facing runtime spike branch.

Even if the user later authorizes runtime, only the next single minimum task may
start. That does not activate the whole runtime branch.

## Security / Privacy / Organization Isolation Boundaries

Future runtime authorization must preserve:

- organization scope on every lookup,
- customer channel identity scoped by organization and channel,
- no global `line_user_id` identity assumption,
- no cross-tenant lookup,
- no cross-channel lookup,
- generic safe-deny for missing, unauthorized, expired, or mismatched access,
- no raw internal data output,
- no sensitive data in logs or responses,
- no actual token, secret, `DATABASE_URL`, raw channel id, complete phone,
  complete address, raw provider payload, or production data in prompts,
  outputs, tests, logs, or completion reports.

Customer-facing projection work must not expose internal-only fields, audit log
details, billing internal data, settlement internal data, AI raw payload, or
provider payloads.

## SaaS / Entitlement / Usage Boundary Notes

Future runtime authorization must preserve:

- permission and entitlement as separate concepts,
- organization-level entitlement as a possible upstream gate,
- user/customer permission as a possible upstream gate,
- usage tracking as future observability, not access permission,
- plan/subscription status as a future gate, not a reason to weaken data
  minimization or safe-deny behavior.

Enterprise, AI add-on, usage billing, seat billing, and SSO considerations must
not weaken organization isolation, sensitive data redaction, or customer-visible
data policy.

## Explicit Non-goals

Task443 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify API / route / controller / resolver / repository,
- add or modify customerAccessContext / projection / response envelope /
  safe-deny runtime,
- add or modify tests / fixtures / smoke / browser tests,
- add scan script / CI,
- modify `package.json`,
- modify localization files / message catalogs,
- add or modify DB schema / migration / index,
- execute DB / DDL / psql / `npm run db:migrate` / Migration020 dry-run/apply,
- trigger provider sending / LINE / SMS / Email / App / survey,
- call AI provider / RAG / vector DB,
- access shared / prod / Zeabur runtime,
- process or output token / secret / actual `DATABASE_URL` / raw channel id /
  complete phone / complete address / production data,
- modify Inventory docs,
- approve runtime.

## Verification Plan

For Task443, run:

```bash
git diff --check
npm run check
npm run admin:check
```

Also run a sensitive scan on this document to confirm it contains no actual
credential, token, secret, `DATABASE_URL`, complete phone, complete address, raw
channel id, raw provider payload, or production data.

Do not run DB, API, browser, smoke, or migration commands for Task443.

## Completion Report Checklist

Codex completion report must include:

- modified files,
- whether the task was docs-only,
- implementation summary,
- not implemented items,
- verification results,
- whether `docs/PROJECT_GUARDRAILS.md` was violated,
- whether any table / API / permission / audit log / smoke test changed,
- whether sensitive data / token / secret / personal data / LINE logic was
  touched,
- whether customer channel identity / organization isolation / SaaS-ready /
  entitlement / seat billing / usage billing / AI add-on / Enterprise SSO was
  affected,
- future tasks listed only, without expanding implementation scope.

# Task434 - Customer-Facing Runtime Spike Authorization Readiness Closure / No Runtime Change

Task434 closes the Task429-Task433 authorization readiness mini-branch for a
possible future customer-facing local-only runtime spike.

This task is documentation-only. It does not authorize runtime work, does not
start a local-only runtime spike, and does not add code, tests, fixtures, DB
changes, API changes, provider sending, or AI/RAG work.

## Purpose

The purpose is to summarize the pre-authorization framework created by
Task429-Task433 and to make the current authorization state explicit.

Current status: `NO-GO`.

No runtime task may start until the user answers the Task429-style
authorization questions clearly and item by item.

## Non-Authorization Statement

Task434 is not runtime approval.

Task434 does not authorize:

- backend `src/` changes,
- route/controller implementation,
- resolver implementation,
- customerAccessContext implementation,
- projection DTO / projection service implementation,
- response envelope / generic safe-deny implementation,
- repository implementation,
- API implementation,
- tests,
- fixtures,
- smoke/browser/API tests,
- scan script / CI,
- DB access,
- DDL,
- migration,
- Migration020 dry-run/apply,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider / RAG / vector DB,
- shared/prod/Zeabur runtime access.

Task434 only records that the authorization readiness framework exists.

## Relationship to Task429-Task433

Task429 through Task433 prepared the PM/Codex authorization framework for a
future local-only runtime spike. They did not approve runtime.

| Task | Readiness artifact | Runtime approval? |
| --- | --- | --- |
| Task429 | Authorization question template | No |
| Task430 | Runtime spike task breakdown | No |
| Task431 | Future file touch plan | No |
| Task432 | Preflight readiness gate | No |
| Task433 | Authorization evidence record template | No |

Task434 closes this mini-branch by stating that readiness artifacts are
available, but the current gate remains `NO-GO`.

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
- No layer may output raw internal data.
- No layer may mutate Case, Appointment, Field Service Report, complaint,
  billing, settlement, identity, token, link, or audit state.
- No provider sending is allowed.
- No AI provider / RAG / vector DB is allowed.

## Task429-Task433 Readiness Summary

The authorization framework now contains:

- a question set for explicit user authorization,
- a future task breakdown,
- a future file touch plan,
- a preflight readiness gate,
- an evidence record template,
- outcome mapping for `NO-GO`, `CONDITIONAL-GO`, and `GO`.

This is sufficient for PM and Codex to ask for authorization later. It is not
sufficient to begin runtime work now.

## Current Status: NO-GO

Current status is `NO-GO` because:

- the user has not explicitly authorized a local-only runtime spike,
- no disposable local/test runtime has been confirmed,
- shared / prod / Zeabur exclusion has not been freshly confirmed for a runtime
  task,
- no-production-data policy has not been freshly confirmed for a runtime task,
- no next single runtime task has been named by the user,
- no allowed runtime file paths have been approved,
- no runtime commands have been approved,
- tests / fixtures / API/browser/smoke checks have not been separately
  authorized,
- DB / DDL / migration / Migration020 remain prohibited,
- provider sending remains prohibited,
- AI provider / RAG / vector DB remain prohibited.

NO-GO means Codex must not implement runtime work. Codex may continue docs-only
planning or ask PM/user for explicit authorization.

## Conditions for CONDITIONAL-GO

The branch can become `CONDITIONAL-GO` only if the user explicitly authorizes
one narrow next local-only task.

Required conditions:

- Task429-style authorization questions are answered clearly,
- local-only scope is confirmed,
- disposable local/test environment is confirmed if relevant,
- shared / prod / Zeabur are explicitly excluded,
- production data is explicitly prohibited,
- one next task is named,
- allowed paths are named,
- allowed commands are named,
- prohibited paths and commands are named,
- DB / migration / provider / AI / RAG remain prohibited,
- tests or fixtures are either not needed or separately authorized,
- organization isolation and customer channel identity boundaries are clear.

CONDITIONAL-GO authorizes only the named next single task. It does not authorize
later tasks by implication.

## Meaning and Limits of GO

`GO` may be used only when every applicable authorization field is explicit and
the next single task is narrow.

GO means Codex may execute only that next task within the exact authorized
files and commands.

GO does not mean:

- the whole runtime branch is active,
- DB / DDL / migration is approved,
- Migration020 dry-run/apply is approved,
- provider sending is approved,
- LINE/SMS/Email/App/survey sending is approved,
- AI provider / RAG / vector DB is approved,
- smoke/browser/API tests are approved,
- shared/prod/Zeabur access is approved,
- production data is approved.

## Still-Prohibited Items

The following remain prohibited unless separately and explicitly approved:

- DB / DDL / migration / Migration020 dry-run/apply,
- shared / prod / Zeabur runtime access,
- production data,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider / RAG / vector DB,
- secrets / tokens / actual `DATABASE_URL`,
- raw channel ids,
- complete phone numbers,
- complete addresses,
- raw provider payloads,
- Inventory docs changes,
- mutation of Case / Appointment / Field Service Report / complaint / billing /
  settlement / identity / token / link / audit state from the customer-facing
  chain.

## Required Evidence Before Any Runtime Task

Before any future runtime task, the evidence record must include:

- authorization source / user statement summary,
- authorization timestamp / conversation reference,
- final PM decision: `NO-GO`, `CONDITIONAL-GO`, or `GO`,
- allowed next single task,
- allowed file paths,
- forbidden file paths,
- allowed commands,
- forbidden commands,
- local-only confirmation,
- disposable local/test environment confirmation,
- shared / prod / Zeabur exclusion,
- no-production-data confirmation,
- backend `src/` authorization status,
- route/controller skeleton authorization status,
- resolver skeleton authorization status,
- customerAccessContext skeleton authorization status,
- projection DTO / projection service authorization status,
- response envelope / generic safe-deny authorization status,
- synthetic fixtures / tests authorization status,
- API / browser / smoke tests authorization status,
- DB / DDL / migration / Migration020 status,
- provider sending status,
- AI provider / RAG / vector DB status,
- sensitive data prohibition status,
- organization isolation notes,
- customer channel identity notes,
- SaaS entitlement / usage notes,
- still-prohibited items,
- stop conditions,
- completion report requirements.

If any required evidence is missing, the outcome remains `NO-GO`.

## Future Next Step Options

Possible next steps:

1. PM asks the user Task429-style authorization questions.
2. User declines runtime and continues docs-only planning.
3. User authorizes only a single local-only skeleton task.
4. User separately authorizes tests / fixtures / API smoke / DB work only if
   explicitly stated.

These options are not approvals. They are future paths.

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
  complete address, raw provider payload, or production data in task prompts,
  outputs, tests, logs, or completion reports.

Customer-facing projection work must not expose internal-only fields, audit log
details, billing internal data, settlement internal data, AI raw payload, or
provider payloads.

## SaaS / Entitlement / Usage Boundary Notes

Future runtime authorization must preserve:

- permission and entitlement as separate concepts,
- organization-level entitlement checks where applicable,
- user permission checks where applicable,
- usage tracking as future observability, not access permission,
- plan and subscription status as future gates, not a reason to weaken data
  minimization or safe-deny behavior.

Enterprise, AI add-on, usage billing, seat billing, and SSO considerations must
not weaken organization isolation, sensitive data redaction, or customer-visible
data policy.

## Explicit Non-goals

Task434 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify API / route / controller / resolver / repository,
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

For Task434, run:

```bash
git diff --check
npm run check
npm run admin:check
```

Also run a sensitive scan on this document to confirm it contains no actual
credential, token, secret, `DATABASE_URL`, complete phone, complete address, raw
channel id, raw provider payload, or production data.

Do not run DB, API, browser, smoke, or migration commands for Task434.

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

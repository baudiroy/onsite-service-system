# Task436 - Customer-Facing Runtime Spike Decision Gate Closure / No Runtime Change

Task436 closes the Task429-Task435 decision gate preparation branch for a
possible future customer-facing local-only runtime spike.

This task is documentation-only. It does not authorize runtime work, does not
start a local-only runtime spike, and does not add code, tests, fixtures, DB
changes, API changes, provider sending, or AI/RAG work.

## Purpose

The purpose is to record that the authorization question set, task breakdown,
file touch plan, readiness gate, evidence template, readiness closure, and user
decision packet are complete.

Current status remains `NO-GO`.

The next real fork must be either:

- PM asks the user the Task435 decision prompt, or
- the user explicitly chooses to continue a docs-only branch.

## Non-Authorization Statement

Task436 is not runtime approval.

Task436 does not authorize:

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

Task436 only closes the decision gate preparation branch.

## Relationship to Task429-Task435

Task429-Task435 created the pre-runtime authorization framework. They did not
approve runtime.

| Task | Artifact | Runtime approval? |
| --- | --- | --- |
| Task429 | Authorization question template | No |
| Task430 | Runtime spike task breakdown | No |
| Task431 | Future file touch plan | No |
| Task432 | Preflight readiness gate | No |
| Task433 | Authorization evidence record template | No |
| Task434 | Authorization readiness closure | No |
| Task435 | User decision packet | No |

Task436 closes this preparation sequence and confirms that no authorization has
been granted.

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

## Task429-Task435 Decision Gate Summary

The following is now available for PM/Codex:

- Task429: a template for asking authorization questions.
- Task430: a breakdown of possible runtime spike tasks.
- Task431: a future file touch plan.
- Task432: a preflight readiness gate.
- Task433: an evidence record template.
- Task434: a readiness closure that keeps current status at `NO-GO`.
- Task435: a user decision packet with Option A / B / C / D / E.

Together, these artifacts complete the authorization-before-runtime planning
package. They do not start runtime.

## Current Status: NO-GO

Current status remains `NO-GO`.

There is no runtime authorization because:

- the user has not selected Option B or Option C,
- the user has not confirmed a local-only runtime spike,
- no disposable local/test environment has been confirmed,
- no allowed runtime files or commands have been named,
- backend `src/` changes are not authorized,
- tests / fixtures / smoke / browser tests are not authorized,
- DB / DDL / migration / Migration020 remain prohibited,
- provider sending remains prohibited,
- AI provider / RAG / vector DB remain prohibited,
- production data and shared runtime access remain prohibited.

## Why the Gate Remains Closed

The gate remains closed because vague continuation language is insufficient.

The following do not authorize runtime:

- "continue",
- "next task",
- "go ahead",
- "可以做",
- "照 PM 規劃做",
- "繼續開發",
- "開始 runtime",
- any statement that does not answer the scope and exclusion questions
  explicitly.

If the user has not selected a specific option and confirmed scope item by item,
the gate remains `NO-GO`.

## Required User Decision Before Any Runtime Task

Before runtime can begin, PM must ask the user using the Task435 decision
prompt or an equivalent prompt.

The user must clearly choose one:

- Option A,
- Option B,
- Option C,
- Option D,
- Option E.

If Option B or C is selected, the user must also confirm:

- local-only only,
- disposable local/test environment exists,
- shared / prod / Zeabur excluded,
- no production data,
- exact next single task,
- exact allowed file paths,
- exact allowed commands,
- no DB / migration,
- no provider sending,
- no AI / RAG / vector DB,
- no tests / fixtures / smoke unless separately authorized.

## Meaning of Option A / B / C / D / E from Task435

| Option | Meaning | Status impact |
| --- | --- | --- |
| A | Continue docs-only planning. | Runtime remains NO-GO. |
| B | Authorize one local-only route/controller skeleton task. | May become CONDITIONAL-GO or GO only for that task. |
| C | Authorize one local-only resolver skeleton task. | May become CONDITIONAL-GO or GO only for that task. |
| D | Pause runtime spike and choose another docs-only branch. | Runtime remains NO-GO. |
| E | Explicitly decline runtime. | Runtime remains NO-GO. |

Even if Option B or C is selected, authorization applies only to the next named
single task. It does not activate the full runtime branch.

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

## Separate Approval Requirements

The following always need separate explicit approval:

- DB access,
- DDL,
- migration,
- Migration020 dry-run/apply,
- shared/prod/Zeabur access,
- tests / fixtures,
- API smoke,
- browser smoke,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider,
- RAG,
- vector DB,
- production data.

No future GO may imply approval for these items.

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
- organization-level entitlement checks where applicable,
- user permission checks where applicable,
- usage tracking as future observability, not access permission,
- plan and subscription status as future gates, not a reason to weaken data
  minimization or safe-deny behavior.

Enterprise, AI add-on, usage billing, seat billing, and SSO considerations must
not weaken organization isolation, sensitive data redaction, or customer-visible
data policy.

## Explicit Non-goals

Task436 does not:

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

For Task436, run:

```bash
git diff --check
npm run check
npm run admin:check
```

Also run a sensitive scan on this document to confirm it contains no actual
credential, token, secret, `DATABASE_URL`, complete phone, complete address, raw
channel id, raw provider payload, or production data.

Do not run DB, API, browser, smoke, or migration commands for Task436.

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
